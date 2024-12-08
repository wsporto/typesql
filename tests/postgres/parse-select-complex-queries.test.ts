import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('parse-select-complex-queries', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('parse SELECT t1.name, t2.mycolumn2, t3.mycolumn3, count', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr); mytable3 (id)
		const sql = `
        SELECT t1.value, t2.name, t3.id, count(*) AS quantity
        FROM mytable1 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        LEFT JOIN mytable3 t3 ON t3.id = t2.id
        GROUP BY t1.value, t2.name, t3.id
        HAVING count(*) > 1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'id',
					type: 'int4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'quantity',
					notNull: true,
					type: 'int8',
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('HAVING value > ?', async () => {
		const sql = `
        SELECT
            name,
            SUM(double_value) as value
        FROM mytable3
        GROUP BY
            name
        HAVING
            SUM(double_value) > $1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'value',
					type: 'float4',
					notNull: false, //SUM(double_value) > $1; then notNull should be true
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'float4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('HAVING value > ? and ? <', async () => {
		const sql = `
        SELECT
            name,
            SUM(double_value) as value,
            SUM(double_value * 0.01) as id
        FROM mytable3
        WHERE id > $1 -- this id is from mytable3 column
        GROUP BY
            name
        HAVING
            SUM(double_value) > $2
            and SUM(double_value * 0.01) < $3 -- this id is from the SELECT alias
            AND SUM(double_value) = $4

        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'value',
					type: 'float4',
					notNull: false,
					table: ''
				},
				{
					columnName: 'id',
					type: 'float8',
					notNull: false,
					table: '' //TODO - could be mytable3?
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'float4',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'float8',
					notNull: true
				},
				{
					name: 'param4',
					columnType: 'float4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with UNION', async () => {
		const sql = `
        SELECT id FROM mytable1
        UNION
        SELECT id FROM mytable2
        UNION
        SELECT id FROM mytable3
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with UNION (int4_column + int8_column)', async () => {
		const sql = `
            SELECT int4_column as col FROM all_types
			UNION
			SELECT int8_column as col FROM all_types
            `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'col',
					type: 'int8',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('subselect in column', async () => {
		const sql = `
        SELECT (SELECT name FROM mytable2 where id = t1.id) as fullname
        FROM mytable1 t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'fullname',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('subselect in column (with parameter)', async () => {
		const sql = `
        SELECT (SELECT name as namealias FROM mytable2 where id = $1) as fullname
        FROM mytable1 t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'fullname',
					type: 'text',
					notNull: false,
					table: '' //TODO - subselect table name should be ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH names AS ( SELECT name FROM mytable2 )', async () => {
		const sql = `
        WITH names AS (
            SELECT name FROM mytable2
        )
        SELECT name from names
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH names AS (query1), allvalues AS (query2)', async () => {
		const sql = `
        WITH
            names AS (SELECT id, name FROM mytable2),
            allvalues AS (SELECT id, value FROM mytable1)
        SELECT n.id, name, value
        FROM names n
        INNER JOIN allvalues v ON n.id = v.id
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'table'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH names AS (query1) SELECT names.*', async () => {
		const sql = `
        WITH
            names AS (SELECT id, name FROM mytable2)
        SELECT names.*
        FROM names
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH result AS (query1 UNION query2)', async () => {
		const sql = `
        WITH result AS (
            SELECT id as id FROM mytable1
            UNION
            SELECT id as id FROM mytable2
        )
        SELECT *
        FROM result
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH (query with inner join and parameters)', async () => {
		const sql = `
        WITH t1 AS
        (
            SELECT mytable1.*, mytable2.name
            FROM mytable1
            INNER JOIN mytable2 ON mytable1.id = mytable2.id
            WHERE mytable1.value > $1 and mytable2.name = $2
        )
        SELECT t1.*
        FROM t1
        ORDER BY t1.value DESC
		LIMIT 100
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: true,
					table: 'table'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'text',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});