import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-select-functions', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('select sum(value) from mytable1', async () => {
		const sql = `
        select sum(value) from mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'sum', //different from mysql and sqlite
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

	it('select sum(value) from mytable1', async () => {
		const sql = `
        select sum(value) as total from mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'total',
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

	it('select sum(t1.value) as total from mytable1 t1', async () => {
		const sql = `
        select sum(t1.value) as total from mytable1 t1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'total',
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

	it('select count(id) from mytable1', async () => {
		const sql = `
        select count(id) from mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'count',
					type: 'int8',
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

	it('select count(*) from mytable1', async () => {
		const sql = `
        select count(*) from mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'count',
					type: 'int8',
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

	it('select sum(2*value) from  mytable1', async () => {
		const sql = `
        select sum(2*value) from  mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'sum',
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

	it('select avg(value) from mytable1', async () => {
		const sql = `
        select avg(value) from mytable1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'avg',
					type: 'numeric',
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

	it('select avg(value + (value + ?)) from mytable1', async () => {
		const sql = `
        select avg(value + (value + $1)) from mytable1
        `;
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'avg',
					type: 'numeric',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'int4',
					name: 'value',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select avg(value + (value + coalesce(?, 10))) from mytable1', async () => {
		const sql = `
        select avg(value + (value + coalesce($1, 10))) from mytable1
        `;
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'avg',
					type: 'numeric',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'int4',
					name: 'value',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with SUM and with expression from multiple tables', async () => {
		const sql = `
        select sum(t2.id + (t1.value + 2)) from mytable1 t1 inner join mytable2 t2 on t1.id = t2.id
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'sum',
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

	it(`SELECT STR_TO_DATE('21/5/2013','%d/%m/%Y')`, async () => {
		const sql = `
       SELECT TO_DATE('21/5/2013', 'DD/MM/YYYY');
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: `to_date`,
					type: 'date',
					notNull: false, //invalid date
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

	it('EXTRACT(MONTH FROM timestamp_column)', async () => {
		const sql = `
         select 
			EXTRACT(MONTH FROM t.timestamp_column) as month1,
			EXTRACT(MONTH FROM t.timestamp_not_null_column) as month2,
			EXTRACT(MONTH FROM t.timestamptz_column) as month3,
			EXTRACT(MONTH FROM t.timestamptz_not_null_column) as month4
        from all_types t 
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'month1',
					type: 'float8',
					notNull: false,
					table: ''
				},
				{
					columnName: 'month2',
					type: 'float8',
					notNull: true,
					table: ''
				},
				{
					columnName: 'month3',
					type: 'float8',
					notNull: false,
					table: ''
				},
				{
					columnName: 'month4',
					type: 'float8',
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

	it('parse select without from clause', async () => {
		const sql = `
        select 10, CONCAT_WS('a', 'b'), 'a' as name
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: '?column?', //different from mysql and sqlite
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: `concat_ws`, //If the separator is NULL, the result is NULL.
					type: 'text',
					notNull: true,
					table: ''
				},
				{
					columnName: 'name',
					type: 'text',
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

	//TODO - infer param types
	it('parse a select with STR_TO_DATE and CONCAT_WS function', async () => {
		const sql = `
        SELECT TO_DATE(CONCAT_WS('/', $1::text, $2::text, $3::text),'DD/MM/YYYY')
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: `to_date`,
					type: 'date',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text',
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param2',
					columnType: 'text',
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param3',
					columnType: 'text',
					notNull: true //changed at v0.0.2
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT generate_series(1, 12) AS month', async () => {
		const sql = `
         SELECT generate_series(1, 12) AS month
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'month',
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
});