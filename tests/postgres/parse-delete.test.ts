import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres-parse-delete', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('delete from mytable1 where id = ?', async () => {
		const sql = 'delete from mytable1 where id = $1';
		const actual = await describeQuery(client, sql, ['id'], schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql,
			columns: [],
			parameters: [
				{
					name: 'id',
					type: 'int4',
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
		const actual = await describeQuery(client, sql, ['value'], schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql,
			columns: [],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: true
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE INSENSITIVE - DELETE FROM MYTABLE1 WHERE ID = ?', async () => {
		const sql = 'DELETE FROM MYTABLE1 WHERE ID = $1';
		const actual = await describeQuery(client, sql, ['id'], schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql,
			columns: [],
			parameters: [
				{
					name: 'id',
					type: 'int4',
					notNull: true
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('delete from mytable1 where id in (?)', async () => {
		const sql = 'delete from mytable1 where id in ($1)';
		const expectedSql = `delete from mytable1 where id in (\${generatePlaceholders('$1', params.id)})`;
		const actual = await describeQuery(client, sql, ['id'], schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql: expectedSql,
			columns: [],
			parameters: [
				{
					name: 'id',
					type: 'int4[]',
					notNull: true
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('DELETE FROM mytable1 WHERE id = :id RETURNING *', async () => {
		const sql = 'DELETE FROM mytable1 WHERE id = $1 RETURNING *';
		const actual = await describeQuery(client, sql, ['id'], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Delete',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'id',
					type: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('DELETE FROM mytable1 WHERE id = :id RETURNING id, id+id, value', async () => {
		const sql = 'DELETE FROM mytable1 WHERE id = $1 RETURNING id, id+id, value';
		const actual = await describeQuery(client, sql, ['id'], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Delete',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: '?column?',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'id',
					type: 'int4',
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