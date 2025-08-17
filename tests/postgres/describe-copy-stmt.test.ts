import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createTestClient, createSchemaInfo } from './schema';

describe('postgres-describe-copy-stmt', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('COPY mytable1 (value) FROM STDIN WITH CSV', async () => {
		const sql = 'COPY mytable1 (value) FROM STDIN WITH CSV';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Copy',
			sql,
			columns: [],
			parameters: [
				{
					name: 'value',
					type: 'int4',
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
