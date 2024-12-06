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

	it('delete from mytable1 where id = ?', async () => {
		const sql = 'delete from mytable1 where id = $1';
		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql,
			columns: [],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('delete from mytable1 where id = ?', async () => {
		const sql = 'delete from mytable1 where value = $1';
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql,
			columns: [],
			parameters: [
				{
					name: 'value',
					columnType: 'int4',
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