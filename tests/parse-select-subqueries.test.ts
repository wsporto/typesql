import type { MySqlDialect, SchemaDef } from '../src/types';
import assert from 'node:assert';
import { parseSql } from '../src/describe-query';
import { createMysqlClientForTest } from '../src/queryExectutor';
import { isLeft } from 'fp-ts/lib/Either';

describe('Test parse select with subqueries', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest(
			'mysql://root:password@localhost/mydb'
		);
	});

	//.only
	it('parse a select with nested select', async () => {
		const sql = `
        select id from (
            select id from mytable1
        ) t
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with nested select2', async () => {
		const sql = `
        select id, name from (
            select t1.id, t2.name from mytable1 t1
            inner join mytable2 t2 on t1.id = t2.id
        ) t
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 't'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with nested select and alias', async () => {
		const sql = `
        select id from (
            select value as id from mytable1
        ) t1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with nested select and alias 2', async () => {
		const sql = `
        select id as code from (
            select value as id from mytable1
        ) t1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'code',
					type: 'int',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from (subquery)', async () => {
		const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'id',
					type: 'varchar',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from (subquery) where', async () => {
		const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        WHERE t2.id = ? and t2.name = ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'varchar',
					notNull: true, //if pass null on parameters the result query will be empty
					table: 't2'
				},
				{
					columnName: 'id',
					type: 'varchar',
					notNull: true, //if pass null on parameters the result query will be empty
					table: 't2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'varchar',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with 3-levels nested select', async () => {
		const sql = `
        select id from (
            select id from (
                select id from mytable1
            ) t1
        ) t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with 3-levels nested select and case expression', async () => {
		const sql = `
        select id from (
            select id from (
                select id+id as id from mytable1
            ) t1
        ) t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'bigint',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested with *)', async () => {
		const sql = `
        SELECT * from (select * from (select id, name from mytable2) t1) t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with 3-levels nested select (with alias)', async () => {
		const sql = `
        select id from (
            select matricula as id from (
                select name as matricula from mytable2
            ) t1
        ) t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'varchar',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with 3-levels nested select and union', async () => {
		const sql = `
        select id from (
            select id from (
                select id from (
                    select id from mytable1
                    union
                    select name as id from mytable2
                ) t1
            ) t2
        ) t3
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'varchar',
					notNull: false,
					table: 't3'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
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
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't3'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select name from mytable1, (select count(*) as name from mytable2) t2', async () => {
		const sql = `
        select name from mytable1, (select count(*) as name from mytable2) t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'bigint',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select name from mytable2 where exists ( select id from mytable1 where value = ?)', async () => {
		const sql = `
        select name from mytable2 where exists ( select id from mytable1 where value = ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select name from mytable2 where not exists ( select id from mytable1 where id = :a and value = :b)', async () => {
		const sql =
			'select name from mytable2 where not exists ( select id from mytable1 where id = :a and value = :b)';
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: 'select name from mytable2 where not exists ( select id from mytable1 where id = ? and value = ?)',
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'a',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'b',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * from (SELECT * FROM mytable1) as t1 WHERE t1.id > ?', async () => {
		const sql = `
        SELECT id from (SELECT * FROM mytable1) as t1 WHERE t1.id > ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id, exists(SELECT 1 FROM mytable2 t2 where t2.id = t1.id) as has from mytable1 t1', async () => {
		const sql = `
        SELECT id, exists(SELECT 1 FROM mytable2 t2 where t2.id = t1.id) as has from mytable1 t1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'has',
					type: 'int',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
