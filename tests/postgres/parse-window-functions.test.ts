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

	it('FIRST_VALUE(id), LAST_VALUE(name), RANK(), DENSE_RANK() and PERCENT_RANK()', async () => {
		const sql = `
			SELECT
				FIRST_VALUE(id) OVER() as firstId,
				LAST_VALUE(name) OVER() as lastName,
				RANK() OVER() as rankValue,
				DENSE_RANK() OVER() as denseRankValue,
				PERCENT_RANK() OVER() as percentRankValue
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
});