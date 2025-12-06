import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';

describe('sqlite-parse-delete', () => {
	it('delete from mytable1 where id = ?', () => {
		const sql = 'delete from mytable1 where id = ?';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: 'delete from mytable1 where id = ?',
			queryType: 'Delete',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('delete from mytable1 where id = :id', () => {
		const sql = 'delete from mytable1 where id = :id';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: 'delete from mytable1 where id = ?',
			queryType: 'Delete',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'id',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('DELETE FROM mytable1 WHERE id = :id RETURNING *', async () => {
		const sql = 'DELETE FROM mytable1 WHERE id = :id RETURNING *';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: 'DELETE FROM mytable1 WHERE id = ? RETURNING *',
			queryType: 'Delete',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('DELETE FROM mytable1 WHERE id = :id RETURNING id, id+id, value', async () => {
		const sql = 'DELETE FROM mytable1 WHERE id = :id RETURNING id, id+id, value';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: 'DELETE FROM mytable1 WHERE id = ? RETURNING id, id+id, value',
			queryType: 'Delete',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true
				},
				{
					name: 'id+id',
					type: 'INTEGER',
					notNull: true
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('delete from mytable1 where value = 0 or value is null', () => {
		const sql = 'delete from mytable1 where value = 0 or value is null';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: 'delete from mytable1 where value = 0 or value is null',
			queryType: 'Delete',
			multipleRowsResult: false,
			columns: [],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
