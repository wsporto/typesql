import assert from 'node:assert';
import postgres from 'postgres';
import { loadDbSchema } from '../../src/drivers/postgres';
import { PostgresColumnSchema } from '../../src/drivers/types';
import { parseSql } from '../../src/postgres-query-analyzer/parser';

let dbSchema: PostgresColumnSchema[] = [];
describe.only('Infer column nullability', () => {

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
			assert.fail(`Shouldn't return an error: ${dbSchemaResult.error}`);
		}
		dbSchema = dbSchemaResult.value;
	});

	it('SELECT id FROM mytable1', async () => {
		const sql = 'SELECT id FROM mytable1';
		const actual = await parseSql(sql, dbSchema);
		const expected = [true];
		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where value is not null', () => {
		const sql = 'select value from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select * from mytable1 where value is not null', () => {
		const sql = 'select * from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true, true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value+10 from mytable1 where value is not null', () => {
		const sql = 'select value+10 from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select t1.value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select t1.value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select t1.value from mytable1 t1 where value is not null', () => {
		const sql = 'select t1.value from mytable1 t1 where value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select t1.value + value from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select t1.value + value from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value as alias from mytable1 t1 where t1.value is not null', () => {
		const sql = 'select value as alias from mytable1 t1 where t1.value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select t1.value from mytable1 t1 where id is not null', () => {
		const sql = 'select t1.value from mytable1 t1 where id is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where value is not null or (id > 0 or value is not null)', () => {
		const sql = 'select value from mytable1 where value is not null or (id > 0 or value is not null)';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where value is not null and (id > 0 or value is not null)', () => {
		const sql = 'select value from mytable1 where value is not null and (id > 0 or value is not null)';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))', () => {
		const sql = 'select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where id > 0 and id < 10 and value > 1', () => {
		const sql = 'select value from mytable1 where id > 0 and id < 10 and value > 1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where value is not null and (value > 1 or value is null)', () => {
		const sql = 'select value from mytable1 where value is not null and (value > 1 or value is null)';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it(' select value from mytable1 where value is not null or (value > 1 and value is null)', () => {
		const sql = ' select value from mytable1 where value is not null or (value > 1 and value is null)';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value from mytable1 where value > 1 and value is null', () => {
		const sql = 'select value from mytable1 where value > 1 and value is null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value + value from mytable1 where value > 1', () => {
		const sql = 'select value + value from mytable1 where value > 1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value + value from mytable1 where id > 1', () => {
		const sql = 'select value + value from mytable1 where id > 1';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value + id from mytable1 where value > 1', () => {
		const sql = 'select value + id from mytable1 where value > 1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value+id from mytable1 where id > 10', () => {
		const sql = 'select value+id from mytable1 where id > 10';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select id+id from mytable1 where value > 10', () => {
		const sql = 'select id+id from mytable1 where value > 10';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select sum(value) from mytable1 where value > 10', () => {
		const sql = 'select sum(value) from mytable1 where value > 10';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select sum(value) from mytable1 where value is not null', () => {
		const sql = 'select sum(value) from mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION (id and value)', () => {
		const sql = `
        select id from mytable1
        UNION
        select value from mytable1
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 1', () => {
		const sql = `
		select name from mytable2 where name is not null
	    UNION
	    select id from mytable1
	    UNION
	    select value from mytable1 where value is not null
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 2', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select id from mytable1
        UNION
        select value from mytable1
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 3', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select name from mytable2
        UNION
        select value from mytable1 where value is not null
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 4', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select value from mytable1 where value is not null
        UNION
        select value from mytable1
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 5', () => {
		const sql = `
		-- id, value, descr
        select *, (select descr from mytable2 where id = 1) from mytable1 where value is not null
        UNION
        -- id, name, descr
        select * from mytable2 where name is not null
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [true, true, false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 6', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select value + value from mytable1 where value is not null
        UNION
        select value + id from mytable1
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('UNION 7', () => {
		const sql = `
		select name from mytable2 where name is not null
        UNION
        select value+value as total from mytable1 where value is not null
        UNION
        select value+id from mytable1 where value is not null
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select with alias', () => {
		const sql = `
		select (select id from mytable1 where id = 10), name, name as name2 from mytable2 where name = 'abc'
		`;
		const actual = parseSql(sql, dbSchema);

		const expected = [false, true, true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select with subquery', () => {
		const sql = 'select name, (select id from mytable1 where id = 10) from mytable2 where id is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [false, false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select value + subquery', () => {
		const sql = 'select id + (select id from mytable2 where id = 10 and id is not null) from mytable1 m1 where id is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select name from (select name from mytable2 where name is not null) t1', () => {
		const sql = 'select name from (select name from mytable2 where name is not null) t1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select name from (select id as name from mytable2) t1', () => {
		const sql = 'select name from (select id as name from mytable2) t1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select id from (select * from mytable2) t1', () => {
		const sql = 'select id from (select * from mytable2) t1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select * from (select * from mytable2 where name is not null and descr is not null) t1', () => {
		const sql = 'select * from (select * from mytable2 where name is not null and descr is not null) t1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true, true, true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select * from (select * from mytable2 where name is not null or descr is not null) t1', () => {
		const sql = 'select * from (select * from mytable2 where name is not null or descr is not null) t1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true, false, false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2', () => {
		const sql = 'select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2';
		const actual = parseSql(sql, dbSchema);

		const expected = [true, true, true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT count(*) FROM mytable1', () => {
		const sql = 'SELECT count(*) FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT count(value) FROM mytable1', () => {
		const sql = 'SELECT count(value) FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT concat(id, id, id) FROM mytable1', () => {
		const sql = 'SELECT concat(id, id, id) FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it(`SELECT concat(id, '-- - ', id) FROM mytable1`, () => {
		const sql = `SELECT concat(id, '-- - ', id) FROM mytable1`;
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT concat(id, null, id) FROM mytable1', () => {
		const sql = 'SELECT concat(id, null, id) FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT concat(id, id, value) FROM mytable1', () => {
		const sql = 'SELECT concat(id, id, value) FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT concat(id, id, value) FROM mytable1 where value is not null', () => {
		const sql = 'SELECT concat(id, id, value) FROM mytable1 where value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT case when id = 1 then id end FROM mytable1', () => {
		const sql = 'SELECT case when id = 1 then id end FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT case when id = 1 then id else id end FROM mytable1', () => {
		const sql = 'SELECT case when id = 1 then id else id end FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT case when id = 1 then id else value end FROM mytable1', () => {
		const sql = 'SELECT case when id = 1 then id else value end FROM mytable1';
		const actual = parseSql(sql, dbSchema);

		const expected = [false];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT case when id = 1 then id else value end FROM mytable1 WHERE value is not null', () => {
		const sql = 'SELECT case when id = 1 then id else value end FROM mytable1 WHERE value is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('select quantity from mytable1, (select count(*) as quantity from mytable2) t2', () => {
		const sql = 'select quantity from mytable1, (select count(*) as quantity from mytable2) t2';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT name from mytable1, (SELECT name from mytable2 where name is not null) t', () => {
		const sql = 'SELECT name from mytable1, (SELECT name from mytable2 where name is not null) t';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT name from (SELECT name from mytable2 where name is not null) t', () => {
		const sql = 'SELECT name from (SELECT name from mytable2 where name is not null) t';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});

	it('SELECT name from (SELECT name from mytable2) t WHERE name is not null', () => {
		const sql = 'SELECT name from (SELECT name from mytable2) t WHERE name is not null';
		const actual = parseSql(sql, dbSchema);

		const expected = [true];

		assert.deepStrictEqual(actual.columnsNullability, expected);
	});
});