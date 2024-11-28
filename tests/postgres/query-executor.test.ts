import assert from 'node:assert';

import postgres from 'postgres';
import { postgresDescribe, loadDbSchema } from '../../src/drivers/postgres';
import { schema } from './schema';
import { PostgresDescribe } from '../../src/drivers/types';
import { isLeft } from 'fp-ts/lib/Either';

describe('postgres-query-executor', () => {

	const sql = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('loadDbSchema', async () => {
		const loadDbSchemaTask = loadDbSchema(sql);
		const expected = schema;
		const result = await loadDbSchemaTask();
		assert.deepStrictEqual(result._tag, 'Right');
		assert.deepStrictEqual(result.right.filter(col => !col.table_name.includes('flyway')), expected);
	});

	it('postgresDescribe', async () => {
		const actual = await postgresDescribe(sql, 'SELECT * FROM mytable1 WHERE id = $1')();
		const expected: PostgresDescribe = {
			parameters: [23],
			columns: [
				{
					name: 'id',
					typeId: 23,
					tableId: 16396
				},
				{
					name: 'value',
					typeId: 23,
					tableId: 16396
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});