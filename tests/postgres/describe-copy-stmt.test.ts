import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-describe-copy-stmt', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('COPY mytable1 (value) FROM STDIN WITH CSV', async () => {
		const sql = 'COPY mytable1 (value) FROM STDIN WITH CSV';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Copy',
			sql,
			columns: [],
			parameters: [
				{
					name: 'value',
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
});
