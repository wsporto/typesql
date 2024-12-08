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
});