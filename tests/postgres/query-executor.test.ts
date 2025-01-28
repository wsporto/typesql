import assert from 'node:assert';

import postgres from 'postgres';
import { postgresDescribe, loadDbSchema, createPostgresClient, loadForeignKeys } from '../../src/drivers/postgres';
import { schema } from './schema';
import { PostgresDescribe } from '../../src/drivers/types';
import { TypeSqlError } from '../../src/types';

describe('postgres-query-executor', () => {

	const sql = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('loadDbSchema-connection-error', async () => {
		const client = postgres('postgres://postgres:password123@127.0.0.1:5432/postgres');
		const result = await loadDbSchema(client);
		if (result.isOk()) {
			assert.fail('Should return an error');
		}

		const expected: TypeSqlError = {
			name: 'PostgresError',
			description: `password authentication failed for user "postgres"`
		}
		assert.deepStrictEqual(result.error, expected);
	});

	it('postgresDescribe-connection-error', async () => {
		const client = postgres('postgres://postgres:password123@127.0.0.1:5432/postgres');
		const result = await postgresDescribe(client, 'SELECT 1');
		if (result.isOk()) {
			assert.fail('Should return an error');
		}

		const expected: TypeSqlError = {
			name: 'PostgresError',
			description: `password authentication failed for user "postgres"`
		}
		assert.deepStrictEqual(result.error, expected);
	});

	it('postgresDescribe-Invalid sql', async () => {
		const client = postgres('postgres://postgres:password@127.0.0.1:5432/postgres');
		const result = await postgresDescribe(client, 'SELECT asdf FROM mytable1');
		if (result.isOk()) {
			assert.fail('Should return an error');
		}

		const expected: TypeSqlError = {
			name: 'PostgresError',
			description: `column "asdf" does not exist`
		}
		assert.deepStrictEqual(result.error, expected);
	});

	it('loadForeignKeys-connection-error', async () => {
		const client = postgres('postgres://postgres:password123@127.0.0.1:5432/postgres');
		const result = await loadForeignKeys(client);
		if (result.isOk()) {
			assert.fail('Should return an error');
		}

		const expected: TypeSqlError = {
			name: 'PostgresError',
			description: `password authentication failed for user "postgres"`
		}
		assert.deepStrictEqual(result.error, expected);
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