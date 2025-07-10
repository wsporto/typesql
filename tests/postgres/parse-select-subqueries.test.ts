import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-select-subqueries', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('parse a select with nested select', async () => {
		const sql = `
        select id from (
            select id from mytable1
        ) t
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with nested select2', async () => {
		const sql = `
        select id, name from (
            select t1.id, t2.name from mytable1 t1
            inner join mytable2 t2 on t1.id = t2.id
        ) t
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with nested select and alias', async () => {
		const sql = `
        select id from (
            select value as id from mytable1
        ) t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with nested select and alias 2', async () => {
		const sql = `
        select id as code from (
            select value as id from mytable1
        ) t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'code',
					type: 'int4',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select * from (subquery)', async () => {
		const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'id',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	//explain returns rows=1
	it('select * from (subquery) where', async () => {
		const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        WHERE t2.id = $1 and t2.name = $2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: true,
					table: 't2'
				},
				{
					name: 'id',
					type: 'text',
					notNull: true,
					table: 't2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text',
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

	it('parse a select with 3-levels nested select', async () => {
		const sql = `
        select id from (
            select id from (
                select id from mytable1
            ) t1
        ) t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with 3-levels nested select and case expression', async () => {
		const sql = `
        select id from (
            select id from (
                select id+id as id from mytable1
            ) t1
        ) t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('nested with *', async () => {
		const sql = `
        SELECT * from (select * from (select id, name from mytable2) t1) t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with 3-levels nested select (with alias)', async () => {
		const sql = `
        select id from (
            select matricula as id from (
                select name as matricula from mytable2
            ) t1
        ) t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with 3-levels nested select and union', async () => {
		const sql = `
        select id from (
            select id from (
                select id from (
                    select name as id from mytable3 -- different from mysql
                    union
                    select name as id from mytable2
                ) t1
            ) t2
        ) t3
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'text',
					notNull: false,
					table: 't3'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with 3-levels nested select and union int return', async () => {
		const sql = `
        select id from (
            select id from (
                select id from (
                    select id from mytable1
                    union
                    select id from mytable2
                ) t1
            ) t2
        ) t3
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't3'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select name from mytable1, (select count(*) as name from mytable2) t2', async () => {
		const sql = `
        select name from mytable1, (select count(*) as name from mytable2) t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'int8',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select name from mytable2 where exists ( select id from mytable1 where value = ?)', async () => {
		const sql = `
        select name from mytable2 where exists ( select id from mytable1 where value = $1)
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'mytable2'
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

	it('select name from mytable2 where not exists ( select id from mytable1 where id = :a and value = :b)', async () => {
		const sql = 'select name from mytable2 where not exists ( select id from mytable1 where id = $1 and value = $2)';
		const actual = await describeQuery(postres, sql, ['a', 'b']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'a',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'b',
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

	it('SELECT * from (SELECT * FROM mytable1) as t1 WHERE t1.id > ?', async () => {
		const sql = `
        SELECT id from (SELECT * FROM mytable1) as t1 WHERE t1.id > $1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
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

	it('SELECT id, exists(SELECT 1 FROM mytable2 t2 where t2.id = t1.id) as has from mytable1 t1', async () => {
		const sql = `
        SELECT id, exists(SELECT 1 FROM mytable2 t2 where t2.id = t1.id) as has from mytable1 t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'has',
					type: 'bool',
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
	})

	it('SELECT id, (select max(id) from mytable2 m2 where m2.id =1) as subQuery FROM mytable1', async () => {
		const sql = `
        SELECT
			id, (select max(id) from mytable2 m2 where m2.id =1) as subQuery
		FROM mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'subquery',
					type: 'int4',
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

	it('SELECT id, exists(SELECT min(id) FROM mytable2 t2 where t2.id = t1.id) as has from mytable1 t1', async () => {
		const sql = `
        SELECT id, exists(SELECT min(id) FROM mytable2 t2 where t2.id = t1.id) as has from mytable1 t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'has',
					type: 'bool',
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
	})
});