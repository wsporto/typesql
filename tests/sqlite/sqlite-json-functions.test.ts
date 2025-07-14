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
	if (dbSchemaResult.isErr()) {
		assert.fail(`Shouldn't return an error` + dbSchemaResult.error.description);
	}
	const dbSchema = dbSchemaResult.value;


	it(`SELECT * FROM json_each('{"hello": "world"}')`, () => {
		const sql = `SELECT * FROM json_each('{"hello": "world"}')`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'key',
					type: 'any',
					notNull: true,
					table: 'json_each'
				},
				{
					name: 'value',
					type: 'any', //{"hello": 10} number; {"hello": 1.0} real; "{hello": [1, 2, 3]
					notNull: false, //ex. {"hello": null}
					table: 'json_each'
				},
				{
					name: 'type',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_each'
				},
				{
					name: 'atom',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_each'
				},
				{
					name: 'id',
					type: 'TEXT',
					notNull: true,
					table: 'json_each'
				},
				{
					name: 'parent',
					type: 'INTEGER',
					notNull: false,
					table: 'json_each'
				},
				{
					name: 'fullkey',
					type: 'TEXT',
					notNull: true,
					table: 'json_each'
				},
				{
					name: 'path',
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

	it(`SELECT * FROM json_tree('{"hello": "world"}')`, () => {
		const sql = `SELECT * FROM json_tree('{"hello": "world"}')`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'key',
					type: 'any',
					notNull: false,
					table: 'json_tree'
				},
				{
					name: 'value',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_tree'
				},
				{
					name: 'type',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_tree'
				},
				{
					name: 'atom',
					type: 'TEXT',
					notNull: false, //ex. {"hello": null}
					table: 'json_tree'
				},
				{
					name: 'id',
					type: 'TEXT',
					notNull: true,
					table: 'json_tree'
				},
				{
					name: 'parent',
					type: 'INTEGER',
					notNull: false,
					table: 'json_tree'
				},
				{
					name: 'fullkey',
					type: 'TEXT',
					notNull: true,
					table: 'json_tree'
				},
				{
					name: 'path',
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

	it('SELECT jt.id, jt.json_value, j.value FROM json_table jt, json_each(json_value) j', () => {
		const sql = `SELECT jt.id, jt.json_value, j.value FROM json_table jt, json_each(json_value) j`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'jt'
				},
				{
					name: 'json_value',
					type: 'TEXT',
					notNull: true,
					table: 'jt'
				},
				{
					name: 'value',
					type: 'any',
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

	it('SELECT json(?) as result', () => {
		const sql = `SELECT json(?) as result, jsonb(?) as result2`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: 'TEXT',
					notNull: false, //SELECT json(null)
					table: ''
				},
				{
					name: 'result2',
					type: 'BLOB',
					notNull: false, //SELECT json(null)
					table: ''
				}
			],
			parameters: [
				{
					columnType: "TEXT",
					name: "param1",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param2",
					notNull: false
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT json(?) as result', () => {
		const sql = `SELECT 
			json(json_value) as result1, 
			json(optional_json_value) as result2,
			jsonb(json_value) as result3,
			jsonb(optional_json_value) as result4
		FROM json_table`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result1',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					name: 'result2',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					name: 'result3',
					type: 'BLOB',
					notNull: true,
					table: ''
				},
				{
					name: 'result4',
					type: 'BLOB',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT json_array(...), jsonb_array(...)`, () => {
		const sql = `SELECT 
			json_array(1,2,'3',4) as result1, 
			json_array(null) as result2,
			jsonb_array(1,2,'3',4) as result3,
			jsonb_array(null) as result4`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result1',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					name: 'result2',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					name: 'result3',
					type: 'BLOB',
					notNull: true,
					table: ''
				},
				{
					name: 'result4',
					type: 'BLOB',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT json_array(json_array(1,2)) as result, jsonb_array(jsonb_array(1,2)) as result2', () => {
		const sql = `SELECT json_array(json_array(1,2)) as result, jsonb_array(jsonb_array(1,2)) as result2`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					name: 'result2',
					type: 'BLOB',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT json_array(?) as result, jsonb_array(?) as result2', () => {
		const sql = 'SELECT json_array(?) as result, jsonb_array(?) as result2';

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					name: 'result2',
					type: 'BLOB',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: "any",
					name: "param1",
					notNull: false
				},
				{
					columnType: "any",
					name: "param2",
					notNull: false
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT json_array_length('[1, 2, 3]') as result, json_array_length(?) as result2`, () => {
		const sql = `SELECT json_array_length('[1, 2, 3]') as result, json_array_length(?) as result2, json_array_length(?, ?) as result3`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: 'INTEGER',
					notNull: false,
					table: ''
				},
				{
					name: 'result2',
					type: 'INTEGER',
					notNull: false,
					table: ''
				},
				{
					name: 'result3',
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: "TEXT",
					name: "param1",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param2",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param3",
					notNull: false
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT json_error_position(?) as result, json_error_position(json_value) as result2 FROM json_table', () => {
		const sql = 'SELECT json_error_position(?) as result, json_error_position(json_value) as result2 FROM json_table';

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: 'INTEGER',
					notNull: false,
					table: ''
				},
				{
					name: 'result2',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: "TEXT",
					name: "param1",
					notNull: false //json_error_position(null)
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT json_extract(...), jsonb_extract(...)`, () => {
		const sql = `SELECT 
			json_extract(?) as result, 
			json_extract(?, ?, '$', ?) as result2,
			jsonb_extract(?) as result3, 
			jsonb_extract(?, ?, '$', ?) as result4`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: 'any',
					notNull: false, //json_extract('{"a":null}', '$.a') → NULL
					table: ''
				},
				{
					name: 'result2',
					type: 'any',
					notNull: false,
					table: ''
				},
				{
					name: 'result3',
					type: 'BLOB',
					notNull: false,
					table: ''
				},
				{
					name: 'result4',
					type: 'BLOB',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: "TEXT",
					name: "param1",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param2",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param3",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param4",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param5",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param6",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param7",
					notNull: false
				},
				{
					columnType: "TEXT",
					name: "param8",
					notNull: false
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT MIN(json_extract(json_value, '$.value')) AS min_value FROM json_table`, () => {
		const sql = `SELECT MIN(json_extract(json_value, '$.value')) AS min_value FROM json_table`;

		const actual = parseSql(sql, dbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'min_value',
					type: 'any',
					notNull: false,
					table: ''
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
