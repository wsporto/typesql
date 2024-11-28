import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
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

	it.skip('insert into mytable1 (value) values (?)', async () => {
		const sql = 'insert into mytable1 (value) values ($1)';
		const actual = await describeQuery(postres, sql, [])();
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

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});