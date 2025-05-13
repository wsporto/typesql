import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-delete', () => {
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

	it('CASE INSENSITIVE - DELETE FROM MYTABLE1 WHERE ID = ?', async () => {
		const sql = 'DELETE FROM MYTABLE1 WHERE ID = $1';
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

	it('delete from mytable1 where id in (?)', async () => {
		const sql = 'delete from mytable1 where id in ($1)';
		const expectedSql = `delete from mytable1 where id in (\${generatePlaceholders('$1', params.id)})`;
		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Delete',
			sql: expectedSql,
			columns: [],
			parameters: [
				{
					name: 'id',
					columnType: 'int4[]',
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
		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Delete',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
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

	it('DELETE FROM mytable1 WHERE id = :id RETURNING id, id+id, value', async () => {
		const sql = 'DELETE FROM mytable1 WHERE id = $1 RETURNING id, id+id, value';
		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Delete',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: '?column?',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
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
});