import assert from 'node:assert';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';

//https://www.postgresql.org/docs/current/functions-window.html
describe('postgres-parse-window-functions', () => {
	const client = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	after(async () => {
		await client.end();
	});

	it('SELECT ROW_NUMBER() OVER() as num', async () => {
		const sql = `
        SELECT
            ROW_NUMBER() OVER() as num
        FROM mytable1
        `;
		const actual = await describeQuery(client, sql, ['id']);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'num',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
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
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
				{
					name: 'num',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'firstid',
					type: 'int4',
					notNull: true,
					table: '' //diff from sqlite
				},
				{
					name: 'lastname',
					type: 'text',
					notNull: false,
					table: '' //diff from sqlite
				},
				{
					name: 'rankvalue',
					type: 'int8',
					notNull: true,
					table: ''
				},
				{
					name: 'denserankvalue',
					type: 'int8',
					notNull: true,
					table: ''
				},
				{
					name: 'percentrankvalue',
					type: 'float8',
					notNull: true,
					table: ''
				},
				{
					name: 'cumedistvalue',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'total',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'avgresult',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'leadvalue',
					type: 'int4',
					notNull: false,
					table: '' //diff from sqlite
				},
				{
					name: 'lagvalue',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value1',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value2',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value3',
					type: 'int4',
					notNull: false,
					table: ''
				},
				{
					name: 'value4',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value5',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int4',
					name: 'param1',
					notNull: true
				},
				{
					type: 'int4',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value1',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value2',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value3',
					type: 'int4',
					notNull: false,
					table: ''
				},
				{
					name: 'value4',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value5',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int4',
					name: 'param1',
					notNull: true
				},
				{
					type: 'int4',
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
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'nthvalue',
					type: 'int4',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int4',
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