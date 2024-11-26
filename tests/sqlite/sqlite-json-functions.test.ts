import assert from 'node:assert';
import type { SQLiteDialect, SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import Database from 'better-sqlite3';
import { loadDbSchema } from '../../src/sqlite-query-analyzer/query-executor';

describe('sqlite-Test simple select statements', () => {
	const client: SQLiteDialect = {
		type: 'better-sqlite3',
		client: new Database('./mydb.db')
	};
	const dbSchemaResult = loadDbSchema(client.client);
	if (isLeft(dbSchemaResult)) {
		assert.fail(`Shouldn't return an error` + dbSchemaResult.left.description);
	}
	const dbSchema = dbSchemaResult.right;


	it(`SELECT * FROM json_each('{"hello": "world"}')`, async () => {
		const sql = `SELECT * FROM json_each('{"hello": "world"}')`;

		const actual = await parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'key',
					type: 'any',
					notNull: true,
					table: 'json_each'
				},
				{
					columnName: 'value',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_each'
				},
				{
					columnName: 'type',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_each'
				},
				{
					columnName: 'atom',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_each'
				},
				{
					columnName: 'id',
					type: 'TEXT',
					notNull: true,
					table: 'json_each'
				},
				{
					columnName: 'parent',
					type: 'INTEGER',
					notNull: false,
					table: 'json_each'
				},
				{
					columnName: 'fullkey',
					type: 'TEXT',
					notNull: true,
					table: 'json_each'
				},
				{
					columnName: 'path',
					type: 'TEXT',
					notNull: true,
					table: 'json_each'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT * FROM json_tree('{"hello": "world"}')`, async () => {
		const sql = `SELECT * FROM json_tree('{"hello": "world"}')`;

		const actual = await parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'key',
					type: 'any',
					notNull: false,
					table: 'json_tree'
				},
				{
					columnName: 'value',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_tree'
				},
				{
					columnName: 'type',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_tree'
				},
				{
					columnName: 'atom',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_tree'
				},
				{
					columnName: 'id',
					type: 'TEXT',
					notNull: true,
					table: 'json_tree'
				},
				{
					columnName: 'parent',
					type: 'INTEGER',
					notNull: false,
					table: 'json_tree'
				},
				{
					columnName: 'fullkey',
					type: 'TEXT',
					notNull: true,
					table: 'json_tree'
				},
				{
					columnName: 'path',
					type: 'TEXT',
					notNull: true,
					table: 'json_tree'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT jt.id, jt.json_value, j.value FROM json_table jt, json_each(json_value) j', async () => {
		const sql = `SELECT jt.id, jt.json_value, j.value FROM json_table jt, json_each(json_value) j`;

		const actual = await parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'jt'
				},
				{
					columnName: 'json_value',
					type: 'TEXT',
					notNull: true,
					table: 'jt'
				},
				{
					columnName: 'value',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'j'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
