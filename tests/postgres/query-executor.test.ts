import assert from 'node:assert';

import postgres from 'postgres';
import { postgresDescribe, loadDbSchema } from '../../src/drivers/postgres';
import { schema } from './schema';
import { PostgresDescribe } from '../../src/drivers/types';

describe('postgres-query-executor', () => {

	const sql = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('loadDbSchema', async () => {
		const result = await loadDbSchema(sql);
		const expected = schema;
		if (result.isErr()) {
			assert.fail(`Shouldn't return an error: ${result.error}`);
		}
		assert.deepStrictEqual(result.value.filter(col => !col.table_name.includes('flyway')), expected);
	});

	it('postgresDescribe', async () => {
		const actual = await postgresDescribe(sql, 'SELECT * FROM mytable1 WHERE id = $1');
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
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});