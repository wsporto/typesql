import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-insert', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('insert into mytable1 (value) values (?)', async () => {
		const sql = 'insert into mytable1 (value) values ($1)';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable1 (value) values ($1)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: false
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert into mytable3 (name, double_value) values (?, ?)', async () => {
		const sql = 'insert into mytable3 (name, double_value) values ($1, $2)';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (name, double_value) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'float4',
					notNull: false
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});