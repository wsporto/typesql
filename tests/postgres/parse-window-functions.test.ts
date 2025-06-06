import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

//https://www.postgresql.org/docs/current/functions-window.html
describe('postgres-parse-window-functions', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('SELECT ROW_NUMBER() OVER() as num', async () => {
		const sql = `
        SELECT
            ROW_NUMBER() OVER() as num
        FROM mytable1
        `;
		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'num',
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

	it('SELECT *, (ROW_NUMBER() OVER()) as num', async () => {
		const sql = `
			SELECT
				*,
				(ROW_NUMBER() OVER()) as num
			FROM mytable1
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
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
				{
					columnName: 'num',
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

	it('FIRST_VALUE(id), LAST_VALUE(name), RANK(), DENSE_RANK(), PERCENT_RANK() AND CUME_DIST()', async () => {
		const sql = `
			SELECT
				FIRST_VALUE(id) OVER() as firstId,
				LAST_VALUE(name) OVER() as lastName,
				RANK() OVER() as rankValue,
				DENSE_RANK() OVER() as denseRankValue,
				PERCENT_RANK() OVER() as percentRankValue,
				CUME_DIST() OVER() as cumeDistValue
			FROM mytable2
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'firstid',
					type: 'int4',
					notNull: true,
					table: '' //diff from sqlite
				},
				{
					columnName: 'lastname',
					type: 'text',
					notNull: false,
					table: '' //diff from sqlite
				},
				{
					columnName: 'rankvalue',
					type: 'int8',
					notNull: true,
					table: ''
				},
				{
					columnName: 'denserankvalue',
					type: 'int8',
					notNull: true,
					table: ''
				},
				{
					columnName: 'percentrankvalue',
					type: 'float8',
					notNull: true,
					table: ''
				},
				{
					columnName: 'cumedistvalue',
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

	it('SUM(value) OVER() AS total', async () => {
		const sql = `
			SELECT
				SUM(value) OVER() AS total
			FROM mytable1
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'total',
					type: 'int8',
					notNull: false,
					table: '' //diff from sqlite
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT AVG(value) OVER() as avgResult FROM mytable1', async () => {
		const sql = `
			SELECT AVG(value) OVER() as avgResult FROM mytable1
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'avgresult',
					type: 'numeric',
					notNull: false,
					table: '' //diff from sqlite
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('LEAD() and LAG()', async () => {
		const sql = `
			SELECT
				LEAD(id) OVER() as leadValue,
				LAG(name) OVER() as lagValue
			FROM mytable2
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'leadvalue',
					type: 'int4',
					notNull: false,
					table: '' //diff from sqlite
				},
				{
					columnName: 'lagvalue',
					type: 'text',
					notNull: false,
					table: '' //diff from sqlite
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('NTILE()', async () => {
		const sql = `
			SELECT
				NTILE(2) OVER() as value1,
				NTILE(id) OVER() as value2,
				NTILE(value) OVER() as value3,
				NTILE($1) OVER() as value4,
				NTILE(COALESCE($2::int4, id)) OVER() as value5
			FROM mytable1
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value1',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value2',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value3',
					type: 'int4',
					notNull: false,
					table: ''
				},
				{
					columnName: 'value4',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value5',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'int4',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'int4',
					name: 'param2',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('NTILE()', async () => {
		const sql = `
			SELECT
				NTILE(2) OVER() as value1,
				NTILE(id) OVER() as value2,
				NTILE(value) OVER() as value3,
				NTILE($1) OVER() as value4,
				NTILE(COALESCE($2::int4, id)) OVER() as value5
			FROM mytable1
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value1',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value2',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value3',
					type: 'int4',
					notNull: false,
					table: ''
				},
				{
					columnName: 'value4',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value5',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'int4',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'int4',
					name: 'param2',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('NTH_VALUE()', async () => {
		const sql = `
			SELECT
				NTH_VALUE(value, $1) OVER() as nthValue
			FROM mytable1
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'nthvalue',
					type: 'int4',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'int4',
					name: 'param1',
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