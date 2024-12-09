import assert from 'node:assert';
import { SchemaDef } from '../../src/types';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import postgres from 'postgres';
import { ok } from 'neverthrow';

describe('select-single-table', () => {

	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('SELECT id FROM mytable1', async () => {

		const sql = 'SELECT id FROM mytable1';
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
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, ok(expected));
	});

	it('SELECT * FROM mytable1 WHERE id = ?', async () => {
		const sql = 'SELECT * FROM mytable1 WHERE id = $1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
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
					notNull: false,
					table: 'table'
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

	it('SELECT id FROM mytable1 where value between :start and :end', async () => {
		const sql = 'SELECT id FROM mytable1 where value between $1 and $2';
		const expectedSql = 'SELECT id FROM mytable1 where value between $1 and $2';

		const actual = await describeQuery(postres, sql, ['start', 'end']);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				}
			],
			parameters: [
				{
					name: 'start',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'end',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it.skip('parse a select with multiples params', async () => {
		const sql = `
        SELECT $1 as name, id, descr as description
        FROM mytable2 
        WHERE (name = $2 or descr = $3) and id > $4
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text', //different from sqlite
					notNull: false, //todo - differente from mysql
					table: ''
				},
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'description',
					type: 'text',
					notNull: false,
					table: 'table'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text', //differente from sqlite
					notNull: false //todo - differente from mysql
				},
				{
					name: 'param2',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'param4',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)', async () => {
		const sql = 'SELECT * FROM mytable1 t WHERE id in ($1)';

		const expectedSql = 'SELECT * FROM mytable1 t WHERE id in (${generatePlaceholders(params.param1)})';
		const actual = await describeQuery(postres, sql, []);

		const expected: SchemaDef = {
			sql: expectedSql,
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
					notNull: false,
					table: 'table'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4[]',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id::int4 FROM mytable1', async () => {
		const sql = 'SELECT id::int2 FROM mytable1';

		const actual = await describeQuery(postres, sql, []);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int2',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)', async () => {
		const sql = 'SELECT * FROM mytable1 t WHERE id in (1, 2, 3, $1)';

		const expectedSql = 'SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ${generatePlaceholders(params.param1)})';
		const actual = await describeQuery(postres, sql, []);

		const expected: SchemaDef = {
			sql: expectedSql,
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
					notNull: false,
					table: 'table'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4[]',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT SUM(ID) as sumById FROM mytable1 t1 GROUP BY id', async () => {
		const sql = `
        SELECT SUM(ID) as "sumById"
        FROM mytable1 t1
        GROUP BY id
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'sumById',
					type: 'int8',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse select using ANY operator', async () => {
		const sql = `
        select id from mytable1 where value > any(select id from mytable2 where name like $1)
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
				}
			],
			parameters: [
				{
					name: 'param1',
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

	it('parse select using ANY operator with parameter', async () => {
		const sql = `
        select id from mytable1 where $1 > any(select id from mytable2 where name like $2)
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

	it('select value from mytable1 where value is not null', async () => {
		const sql = `
        select value from mytable1 where value is not null or (id > 0 and value is not null)
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
					notNull: true,
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

	it('select id from mytable1 where 1 = 1', async () => {
		const sql = `
        select id from mytable1 where 1 = 1
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
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});
