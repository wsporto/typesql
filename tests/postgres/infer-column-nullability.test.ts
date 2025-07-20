import assert from 'node:assert';
import postgres from 'postgres';
import { loadDbSchema } from '../../src/drivers/postgres';
import { PostgresColumnSchema } from '../../src/drivers/types';
import { parseSql } from '../../src/postgres-query-analyzer/parser';
import { NotNullInfo, PostgresTraverseResult } from '../../src/postgres-query-analyzer/traverse';

let dbSchema: PostgresColumnSchema[] = [];
describe('Infer column nullability', () => {

	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	before(async function () {
		const dbSchemaResult = await await loadDbSchema(postres);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${dbSchemaResult.error.description}`);
		}
		dbSchema = dbSchemaResult.value;
	});

	it('SELECT id FROM mytable1', async () => {
		const sql = 'SELECT id FROM mytable1';
		const actual = await parseSql(sql, dbSchema, {}, []);
		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];
		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value is not null', () => {
		const sql = 'select value from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value = 10', () => {
		const sql = 'select value from mytable1 where value = 10';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value = $1', () => {
		const sql = 'select value from mytable1 where value = $1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select * from mytable1 where value is not null', () => {
		const sql = 'select * from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value+10 from mytable1 where value is not null', () => {
		const sql = 'select value+10 from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select t1.value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select t1.value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select t1.value from mytable1 t1 where value is not null', () => {
		const sql = 'select t1.value from mytable1 t1 where value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select t1.value + value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select t1.value + value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value as alias from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select value as alias from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'alias',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select t1.value from mytable1 t1 where id is not null', () => {
		const sql = 'select t1.value from mytable1 t1 where id is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: true,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value is not null or (id > 0 or value is not null)', () => {
		const sql = 'select value from mytable1 where value is not null or (id > 0 or value is not null)';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: true,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value is not null and (id > 0 or value is not null)', () => {
		const sql = 'select value from mytable1 where value is not null and (id > 0 or value is not null)';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))', () => {
		const sql = 'select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where id > 0 and id < 10 and value > 1', () => {
		const sql = 'select value from mytable1 where id > 0 and id < 10 and value > 1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value is not null and (value > 1 or value is null)', () => {
		const sql = 'select value from mytable1 where value is not null and (value > 1 or value is null)';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it(' select value from mytable1 where value is not null or (value > 1 and value is null)', () => {
		const sql = ' select value from mytable1 where value is not null or (value > 1 and value is null)';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value from mytable1 where value > 1 and value is null', () => {
		const sql = 'select value from mytable1 where value > 1 and value is null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'value',
				is_nullable: false,
				table_name: 'mytable1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value + value from mytable1 where value > 1', () => {
		const sql = 'select value + value from mytable1 where value > 1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value + value from mytable1 where id > 1', () => {
		const sql = 'select value + value from mytable1 where id > 1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value + id from mytable1 where value > 1', () => {
		const sql = 'select value + id from mytable1 where value > 1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value+id from mytable1 where id > 10', () => {
		const sql = 'select value+id from mytable1 where id > 10';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select id+id from mytable1 where value > 10', () => {
		const sql = 'select id+id from mytable1 where value > 10';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4 + int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select sum(value) from mytable1 where value > 10', () => {
		const sql = 'select sum(value) from mytable1 where value > 10';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'sum',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int8'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select sum(value) from mytable1 where value is not null', () => {
		const sql = 'select sum(value) from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'sum',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int8'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select t2.name from mytable2 t2 inner join mytable3 t3 on t3.id = t2.id where t2.name is not null', () => {
		const sql = 'select t2.name from mytable2 t2 inner join mytable3 t3 on t3.id = t2.id where t2.name is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select t2.name from mytable2 t2 inner join mytable3 t3 on t3.id = t2.id where t3.name is not null', () => {
		const sql = 'select t2.name from mytable2 t2 inner join mytable3 t3 on t3.id = t2.id where t3.name is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: true,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION (id and value)', () => {
		const sql = `
        select id from mytable1
        UNION
        select value from mytable1
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 1', () => {
		const sql = `
		select name from mytable2 where name is not null
	    UNION
	    select id from mytable1
	    UNION
	    select value from mytable1 where value is not null
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'text' //UNION types text and integer cannot be matched
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 2', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select id from mytable1
        UNION
        select value from mytable1
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text' //UNION types text and integer cannot be matched
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 3', () => {
		const sql = `
		select name from mytable2 where name is not null -- is_nullable = false
        UNION
        select name from mytable2 -- is_nullable = true
        UNION
        select value from mytable1 where value is not null -- is_nullable = false
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text' //UNION types text and integer cannot be matched
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 4', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select value from mytable1 where value is not null
        UNION
        select value from mytable1
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text' //UNION types text and integer cannot be matched
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 5', () => {
		const sql = `
		-- id, value, descr
        select *, (select descr from mytable2 where id = 1) from mytable1 where value is not null
        UNION
        -- id, name, descr
        select * from mytable2 where name is not null
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4'
			},
			{
				column_name: 'value',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4'
			},
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 6', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select value + value from mytable1 where value is not null
        UNION
        select value + id from mytable1
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('UNION 7', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select value+value as total from mytable1 where value is not null
        UNION
        select value+id from mytable1 where value is not null
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select with alias', () => {
		const sql = `
		select (select id from mytable1 where id = 10), name, name as name2 from mytable2 where name = 'abc'
		`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 'mytable2',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: 'name2',
				is_nullable: false,
				table_name: 'mytable2',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select with subquery', () => {
		const sql = 'select name, (select id from mytable1 where id = 10) from mytable2 where id is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: true,
				table_name: 'mytable2',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select value + subquery', () => {
		const sql = 'select id + (select id from mytable2 where id = 10 and id is not null) from mytable1 m1 where id is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4' //int4+int4
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select name from (select name from mytable2 where name is not null) t1', () => {
		const sql = 'select name from (select name from mytable2 where name is not null) t1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select name from (select id as name from mytable2) t1', () => {
		const sql = 'select name from (select id as name from mytable2) t1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4' //id as name
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select id from (select * from mytable2) t1', () => {
		const sql = 'select id from (select * from mytable2) t1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select * from (select * from mytable2 where name is not null and descr is not null) t1', () => {
		const sql = 'select * from (select * from mytable2 where name is not null and descr is not null) t1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: 'descr',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select * from (select * from mytable2 where name is not null or descr is not null) t1', () => {
		const sql = 'select * from (select * from mytable2 where name is not null or descr is not null) t1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: true,
				table_name: 't1',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: 'descr',
				is_nullable: true,
				table_name: 't1',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2', () => {
		const sql = 'select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't2',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: 'descr',
				is_nullable: false,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT count(*) FROM mytable1', () => {
		const sql = 'SELECT count(*) FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'count',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int8'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT count(value) FROM mytable1', () => {
		const sql = 'SELECT count(value) FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'count',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int8'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT concat(id, id, id) FROM mytable1', () => {
		const sql = 'SELECT concat(id, id, id) FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'concat',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it(`SELECT concat(id, '-- - ', id) FROM mytable1`, () => {
		const sql = `SELECT concat(id, '-- - ', id) FROM mytable1`;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'concat',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT concat(id, null, id) FROM mytable1', () => {
		const sql = 'SELECT concat(id, null, id) FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'concat',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT concat(id, id, value) FROM mytable1', () => {
		const sql = 'SELECT concat(id, id, value) FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'concat',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT concat(id, id, value) FROM mytable1 where value is not null', () => {
		const sql = 'SELECT concat(id, id, value) FROM mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'concat',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT case when id = 1 then id end FROM mytable1', () => {
		const sql = 'SELECT case when id = 1 then id end FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT case when id = 1 then id else id end FROM mytable1', () => {
		const sql = 'SELECT case when id = 1 then id else id end FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT case when id = 1 then id else value end FROM mytable1', () => {
		const sql = 'SELECT case when id = 1 then id else value end FROM mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT case when id = 1 then id else value end FROM mytable1 WHERE value is not null', () => {
		const sql = 'SELECT case when id = 1 then id else value end FROM mytable1 WHERE value is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: '?column?',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT * FROM mytable1 t1 INNER JOIN mytable2 t2 on t2.id = t1.id', () => {
		const sql = 'SELECT * FROM mytable1 t1 INNER JOIN mytable2 t2 on t2.id = t1.id';
		const actual = parseSql(sql, dbSchema, {}, []);

		//id, value, id, name, description
		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'value',
				is_nullable: true,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't2',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: true,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: 'descr',
				is_nullable: true,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select quantity from mytable1, (select count(*) as quantity from mytable2) t2', () => {
		const sql = 'select quantity from mytable1, (select count(*) as quantity from mytable2) t2';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'quantity',
				is_nullable: false,
				table_name: 't2',
				table_schema: '',
				type: 'int8'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT name from mytable1, (SELECT name from mytable2 where name is not null) t', () => {
		const sql = 'SELECT name from mytable1, (SELECT name from mytable2 where name is not null) t';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT name from (SELECT name from mytable2 where name is not null) t', () => {
		const sql = 'SELECT name from (SELECT name from mytable2 where name is not null) t';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT name from (SELECT name from mytable2) t WHERE name is not null', () => {
		const sql = 'SELECT name from (SELECT name from mytable2) t WHERE name is not null';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'name',
				is_nullable: false,
				table_name: 't',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT COALESCE(id, id, id+id), COALESCE(value, id+value), COALESCE(value, id+value, id+id) from mytable1', () => {
		const sql = 'SELECT COALESCE(id, id, id+id), COALESCE(value, id+value), COALESCE(value, id+value, id+id) from mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'COALESCE',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4'
			},
			{
				column_name: 'COALESCE',
				is_nullable: true,
				table_name: '',
				table_schema: '',
				type: 'int4'
			},
			{
				column_name: 'COALESCE',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT COALESCE(SUM(value), 0) as total from mytable1', () => {
		const sql = 'SELECT COALESCE(SUM(value), 0) as total from mytable1';
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: NotNullInfo[] = [
			{
				column_name: 'total',
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'int8'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('select with left join', () => {
		const sql = `
        select t1.id, t2.id, t1.value, t2.name
        from mytable1 t1
        left join mytable2 t2 on t1.id = t2.id;
        `;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'id',
				is_nullable: true,
				table_name: 't2',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'value',
				is_nullable: true,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: true,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it.skip('select with inner join after left join', () => {
		const sqlInnerJoin = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value
        from mytable1 t1
        left join mytable2 t2 on t1.id = t2.id
        inner join mytable3 t3 on t2.id = t3.id
        `;
		const actualInnerJoin = parseSql(sqlInnerJoin, dbSchema, {}, []);

		const expected = [true, true, true, false, false, false];

		assert.deepStrictEqual(actualInnerJoin.columns, expected);

		// USE JOIN instead of INNER JOIN. The same result is expected
		const sqlJoin = `
		select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value
		from mytable1 t1
		left join mytable2 t2 on t1.id = t2.id
		join mytable3 t3 on t2.id = t3.id
		`;
		const actualJoin = parseSql(sqlJoin, dbSchema, {}, []);

		assert.deepStrictEqual(actualJoin.columns, expected);
	});

	it('select with left join after inner join', () => {
		const sql = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value
        from mytable1 t1
        inner join mytable2 t2 on t1.id = t2.id
        left join mytable3 t3 on t2.id = t3.id
        `;
		const actual = parseSql(sql, dbSchema, {}, []);

		const expected: NotNullInfo[] = [
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'id',
				is_nullable: false,
				table_name: 't2',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'id',
				is_nullable: true,
				table_name: 't3',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'value',
				is_nullable: true,
				table_name: 't1',
				table_schema: 'public',
				type: 'int4'
			},
			{
				column_name: 'name',
				is_nullable: true,
				table_name: 't2',
				table_schema: 'public',
				type: 'text'
			},
			{
				column_name: 'double_value',
				is_nullable: true,
				table_name: 't3',
				table_schema: 'public',
				type: 'float4'
			}
		];

		assert.deepStrictEqual(actual.columns, expected);
	});

	it('SELECT FROM (subquery with IN operator)', async () => {
		const sql = `
	    SELECT id
		FROM (
			SELECT id FROM mytable1 WHERE id = coalesce($1, 10)
			AND id IN ($2)
		) t
		WHERE id = $3
	    `;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true, //could be false
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 't',
					table_schema: 'public',
					type: 'int4'
				}
			],
			parameterList: [false, true, false],
			parametersNullability: [
				{
					isNotNull: false
				},
				{
					isNotNull: true
				},
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT FROM (subquery with IN operator)', async () => {
		const sql = `
	    SELECT id, concat($1::text, 'a')
		FROM (
			SELECT id FROM mytable1 WHERE id = coalesce($2, 10)
		) t
	    `;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true, //could be false
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 't',
					table_schema: 'public',
					type: 'int4'
				},
				{
					column_name: 'concat',
					is_nullable: false,
					table_name: '',
					table_schema: '',
					type: 'text'
				}
			],
			parameterList: [false, false],
			parametersNullability: [
				{
					isNotNull: true
				},
				{
					isNotNull: false
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('WHERE $1 is null OR $1 > id', async () => {
		const sql = `
	    SELECT id from mytable1
		WHERE $1 is null OR $1 > id
	    `;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true,
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 'mytable1',
					table_schema: 'public',
					type: 'int4'
				}
			],
			parameterList: [false, false],
			parametersNullability: [
				{
					isNotNull: false
				},
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('WHERE $1 is null OR $1 > id', async () => {
		const sql = `
	    SELECT id from mytable1
		WHERE ($1 is null OR $1 > id)
		AND ($2::int4 is null OR $2 > value)
	    `;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true,
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 'mytable1',
					table_schema: 'public',
					type: 'int4'
				}
			],
			parameterList: [false, false, false, false],
			parametersNullability: [
				{
					isNotNull: false
				},
				{
					isNotNull: true
				},
				{
					isNotNull: false
				},
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('DELETE FROM mytable1 WHERE id=?', async () => {
		const sql = `
	    DELETE FROM mytable1 WHERE id=$1
	    `;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Delete',
			multipleRowsResult: false,
			columns: [],
			parameterList: [false],
			parametersNullability: [
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('WHERE id < ANY ($1) AND name = SOME ($1) AND name <> $3', async () => {
		const sql = `
		SELECT id
		FROM mytable2
		WHERE id < ANY ($1)
		AND name = SOME ($1)
		AND name <> $3
	    `;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true,
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 'mytable2',
					table_schema: 'public',
					type: 'int4'
				}
			],
			parameterList: [false, false, false],
			parametersNullability: [
				{
					isNotNull: true
				},
				{
					isNotNull: true
				},
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('select id from mytable2 where exists ( select id from mytable1 where value = $1)', async () => {
		const sql = 'select id from mytable2 where exists ( select id from mytable1 where value = $1)';
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true,
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 'mytable2',
					table_schema: 'public',
					type: 'int4'
				}
			],
			parameterList: [false],
			parametersNullability: [
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id FROM mytable1 where value between $1 and $2', async () => {
		const sql = 'SELECT id FROM mytable1 where value between $1 and $2';
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true,
			limit: undefined,
			columns: [
				{
					column_name: 'id',
					is_nullable: false,
					table_name: 'mytable1',
					table_schema: 'public',
					type: 'int4'
				}
			],
			parameterList: [false, false],
			parametersNullability: [
				{
					isNotNull: true
				},
				{
					isNotNull: true
				}]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it(`SELECT NULLIF(?, 'a') FROM mytable1`, async () => {
		const sql = `SELECT NULLIF($1::text, 'a') FROM mytable1`;
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected: PostgresTraverseResult = {
			queryType: 'Select',
			multipleRowsResult: true,
			limit: undefined,
			columns: [
				{
					column_name: 'NULLIF',
					is_nullable: true,
					table_name: '',
					table_schema: '',
					type: 'unknown'
				}
			],
			parameterList: [false],
			parametersNullability: [
				{
					isNotNull: true
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});

	it(`HAVING value > ? and ? <`, async () => {
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
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected = [true, true, true, true]
		assert.deepStrictEqual(actual.parametersNullability.map(param => param.isNotNull), expected);
	});

	it('INSERT INTO mytable5 (id, name) SELECT id, descr FROM mytable2 WHERE name = $1 AND id > $2', async () => {
		const sql = 'INSERT INTO mytable5 (id, name) SELECT id, descr FROM mytable2 WHERE name = $1 AND id > $2';
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected = [true, true]
		assert.deepStrictEqual(actual.parametersNullability.map(param => param.isNotNull), expected);
	});

	it('SELECT name FROM mytable2 WHERE to_tsvector(name) @@ to_tsquery($1)', async () => {
		const sql = 'SELECT name FROM mytable2 WHERE to_tsvector(name) @@ to_tsquery($1)';
		const actual = parseSql(sql, dbSchema, {}, []);
		const expected = [true];
		assert.deepStrictEqual(actual.parametersNullability.map(param => param.isNotNull), expected);
	});
});