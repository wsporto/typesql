import assert from 'node:assert';
import type { ParameterDef, SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-json-functions', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it(`SELECT json_build_object('key', 'value')`, async () => {
		const sql = `SELECT json_build_object('key', 'value'), jsonb_build_object('key', 'value')`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'json_build_object',
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					columnName: 'jsonb_build_object',
					type: 'jsonb',
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

	it(`select json_build_array(1,2,'foo',4,5)`, async () => {
		const sql = `select json_build_array(1,2,'foo',4,5)`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'json_build_array',
					type: 'json',
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
})