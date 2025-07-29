import assert from 'node:assert';
import type { SQLiteDialect, SchemaDef, TypeSqlError } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';
import Database from 'better-sqlite3';
import { validateAndGenerateCode } from '../../src/sqlite-query-analyzer/code-generator';
import { loadDbSchema } from '../../src/sqlite-query-analyzer/query-executor';

describe('sqlite-Test simple select statements', () => {
	it('try to parse a empty query', async () => {
		const client: SQLiteDialect = {
			type: 'better-sqlite3',
			client: new Database('./mydb.db')
		};
		const sql = '';

		const actual = validateAndGenerateCode(client, sql, 'queryName', sqliteDbSchema);
		const expected = 'Invalid sql';

		if (isLeft(actual)) {
			assert.deepStrictEqual(actual.left.name, expected);
		} else {
			assert.fail('should return an InvalidSqlError');
		}
	});

	it('try to parse a empty query', async () => {
		const client: SQLiteDialect = {
			type: 'better-sqlite3',
			client: new Database('./mydb.db')
		};
		const sql = 'SELECT id2 from mytable1';

		const actual = validateAndGenerateCode(client, sql, 'queryName', sqliteDbSchema);
		const expected: TypeSqlError = {
			name: 'Invalid sql',
			description: 'no such column: id2'
		};
		if (isLeft(actual)) {
			assert.deepStrictEqual(actual.left, expected);
		} else {
			assert.fail('should return an InvalidSqlError');
		}
	});

	it('SELECT id FROM mytable1', async () => {
		const sql = 'SELECT id FROM mytable1';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id as name FROM mytable1', async () => {
		const sql = 'SELECT id as name FROM mytable1';
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1', async () => {
		const sql = 'SELECT * FROM mytable1';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT mytable1.* FROM mytable1', () => {
		const sql = 'SELECT mytable1.* FROM mytable1';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT t.* FROM mytable1 t', () => {
		const sql = 'SELECT t.* FROM mytable1 t';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT mytable1.id, mytable1.value FROM mytable1', () => {
		const sql = 'SELECT mytable1.id, mytable1.value FROM mytable1';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id, name, descr as description FROM mytable2', () => {
		const sql = 'SELECT id, name, descr as description FROM mytable2';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable2'
				},
				{
					name: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2'
				},
				{
					name: 'description',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT distinct id, value FROM mytable1', () => {
		const sql = 'SELECT distinct id, value FROM mytable1';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse select distinct *', () => {
		const sql = 'SELECT distinct * FROM mytable1';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM main.mytable1', () => {
		const sql = 'SELECT id FROM main.mytable1';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 WHERE id = ?', () => {
		const sql = 'SELECT * FROM mytable1 WHERE id = ?';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
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

	it('parse a select with a single parameter (not using *)', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id = ? and value = 10';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v.0.3.0
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
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

	it('SELECT value FROM mytable1 WHERE id = ? or value > ?', () => {
		const sql = 'SELECT value FROM mytable1 WHERE id = ? or value > ?';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param2',
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

	it('SELECT ? FROM mytable1', async () => {
		const sql = 'SELECT ? FROM mytable1';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: '?', //TODO - PARAM1
					type: 'any',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 where value between :start and :end', () => {
		const sql = 'SELECT id FROM mytable1 where value between :start and :end';
		const expectedSql = 'SELECT id FROM mytable1 where value between ? and ?';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'start',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'end',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 where id = 0 and value between :start and :end', () => {
		//todo - new
		const sql = 'SELECT id FROM mytable1 where id = 0 and value between :start and :end';
		const expectedSql = 'SELECT id FROM mytable1 where id = 0 and value between ? and ?';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'start',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'end',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT ? as name FROM mytable1', () => {
		const sql = 'SELECT ? as name FROM mytable1';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'any',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with multiples params', () => {
		const sql = `
        SELECT ? as name, id, descr as description
        FROM mytable2 
        WHERE (name = ? or descr = ?) and id > ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'any',
					notNull: true,
					table: ''
				},
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable2'
				},
				{
					name: 'description',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param4',
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

	it('SELECT t.* FROM mytable1 t WHERE t.id = ?', () => {
		const sql = `
        SELECT t.* FROM mytable1 t WHERE t.id = ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v0.3.0
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
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

	it('SELECT * FROM mytable1 WHERE id in (1, 2, 3)', () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id in (1, 2, 3)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 WHERE id not in (1, 2, 3)', () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id not in (1, 2, 3)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT t.* FROM mytable1 t WHERE t.id in (1, 2, 3)', () => {
		const sql = `
        SELECT t.* FROM mytable1 t WHERE t.id in (1, 2, 3)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)', () => {
		const sql = 'SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)';

		const expectedSql = `SELECT * FROM mytable1 t WHERE id in (1, 2, 3, \${params.param1.map(() => '?')})`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER[]',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id not in (1, 2, 3, ?)', () => {
		const sql = 'SELECT * FROM mytable1 t WHERE id not in (1, 2, 3, ?)';

		const expectedSql = `SELECT * FROM mytable1 t WHERE id not in (1, 2, 3, \${params.param1.map(() => '?')})`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER[]',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 t WHERE :value is null OR id IN (:ids)', () => {
		const sql = 'SELECT * FROM mytable1 t WHERE :value is null OR id IN (:ids)';

		const expectedSql = `SELECT * FROM mytable1 t WHERE ? is null OR id IN (\${params.ids.map(() => '?')})`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'value',
					columnType: 'any',
					notNull: false
				},
				{
					name: 'ids',
					columnType: 'INTEGER[]',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 t WHERE (:value is null OR id IN (:ids)) OR (:value2 is null OR value in (:values))', () => {
		const sql = 'SELECT * FROM mytable1 t WHERE (:value is null OR id IN (:ids)) OR (:value2 is null OR value IN (:values))';

		const expectedSql = `SELECT * FROM mytable1 t WHERE (? is null OR id IN (\${params.ids.map(() => '?')})) OR (? is null OR value IN (\${params.values.map(() => '?')}))`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'value',
					columnType: 'any',
					notNull: false
				},
				{
					name: 'ids',
					columnType: 'INTEGER[]',
					notNull: true
				},
				{
					name: 'value2',
					columnType: 'any',
					notNull: false
				},
				{
					name: 'values',
					columnType: 'INTEGER[]',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 t WHERE id in (select id from mytable2 where id > :id)', () => {
		const sql = 'SELECT id FROM mytable1 t WHERE id in (select id from mytable2 where id > :id)';

		const expectedSql = 'SELECT id FROM mytable1 t WHERE id in (select id from mytable2 where id > ?)';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
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

	it('SELECT id FROM mytable1 t WHERE id not in (select id from mytable2 where id > :id)', () => {
		const sql = 'SELECT id FROM mytable1 t WHERE id not in (select id from mytable2 where id > :id)';

		const expectedSql = 'SELECT id FROM mytable1 t WHERE id not in (select id from mytable2 where id > ?)';
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
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

	it('SELECT * FROM mytable1 t WHERE ? in (1, 2, 3)', () => {
		const sql = `
        SELECT id FROM mytable1 t WHERE ? in (1, 2, 3)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				}
			],
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

	it(`SELECT * FROM mytable1 t WHERE ? in ('a', 'b', 'c')`, () => {
		const sql = `
        SELECT id FROM mytable1 t WHERE ? in ('a', 'b', 'c')
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 WHERE id = (select id from mytable2 where id = ?)', () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id = (select id from mytable2 where id = ?)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v0.3.0
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
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

	it('select t1.id > 1 AS bigger from mytable1 t1', () => {
		const sql = `
        select t1.id > 1 AS bigger from mytable1 t1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'bigger',
					type: 'INTEGER', //changed at v0.0.2
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

	it(`select t2.name > 'a' AS bigger from mytable2 t2`, () => {
		const sql = `
        select t2.name > 'a' AS bigger from mytable2 t2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'bigger',
					type: 'INTEGER',
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

	it('select id from mytable2 where name like ?', () => {
		const sql = `
        select id from mytable2 where name like ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select id from mytable2 where ? like name', () => {
		const sql = `
        select id from mytable2 where ? like name
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT mytable1.* FROM mytable1', async () => {
		const sql = 'SELECT mytable1.* FROM mytable1';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with in operator', async () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id in (1, 2, 3)
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select id from mytable2 where name GLOB ?', () => {
		const sql = `
        select id from mytable2 where name GLOB ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse select with CASE WHEN', async () => {
		const sql = `
        SELECT 
            CASE 
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
            END as id
        FROM mytable1
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'TEXT',
					notNull: false, //not null can't be inferred
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

	it('parse select with CASE WHEN ... ELSE', () => {
		const sql = `
        SELECT
            CASE
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
                ELSE 'other'
            END as id
        FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'TEXT',
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

	it('parse select with CASE WHEN using IN operator', () => {
		const sql = `
        select id from mytable2 where ? in (
            SELECT
                CASE
                    WHEN id = 1 THEN 'one'
                    WHEN id = 2 THEN 'two'
                END
            FROM mytable1
        )
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT SUM(ID) as sumById FROM mytable1 t1 GROUP BY id', () => {
		const sql = `
        SELECT SUM(ID) as sumById
        FROM mytable1 t1
        GROUP BY id
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'sumById',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id as id2, SUM(ID) as sumById FROM mytable1 t1 GROUP BY id2', () => {
		const sql = `
        SELECT id as id2, SUM(ID) as sumById
        FROM mytable1 t1
        GROUP BY id2;
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id2',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					name: 'sumById',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT SUM(real_column) as sumById FROM all_types t1 GROUP BY int_column', () => {
		const sql = `
        SELECT SUM(real_column) as sumById
        FROM all_types t1
        GROUP BY int_column
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'sumById',
					type: 'REAL',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select value from mytable1 where value is not null', () => {
		const sql = `
        select value from mytable1 where value is not null or (id > 0 and value is not null) 
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select id from mytable1 where 1 = 1', () => {
		const sql = `
        select id from mytable1 where 1 = 1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`select enum_column from all_types where enum_column = 'medium' or 'short' = enum_column`, () => {
		const sql = `
        select enum_column from all_types where enum_column = 'medium' or 'short' = enum_column
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'enum_column',
					type: `ENUM('x-small','small','medium','large','x-large')`,
					notNull: true,
					table: 'all_types'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ` + actual.left.description);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select value from mytable1 order by ?', () => {
		const sql = `
        select value from mytable1 order by ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			orderByColumns: ['id', 'mytable1.id', 'value', 'mytable1.value'],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select value as myValue from mytable1 order by ?', () => {
		const sql = `
        select value as myValue from mytable1 order by ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'myValue',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			orderByColumns: ['id', 'mytable1.id', 'value', 'mytable1.value', 'myValue'],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select value from mytable1 order by value', () => {
		const sql = `
        select value from mytable1 order by value
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			//shouldn't include order by columns because there is no parameters on the order by clause
			//orderByColumns: ['id', 'value'],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('order by with case when expression', () => {
		const sql = `
        select value, case when value = 1 then 1 else 2 end as ordering from mytable1 order by ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				},
				{
					name: 'ordering',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			orderByColumns: ['id', 'mytable1.id', 'value', 'mytable1.value', 'ordering'],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('order by with case when expression2', () => {
		const sql = `
            select 
            id, 
            case when name = 'a' then 1 else 0 end as sort
        from mytable2 t2
        order by sort asc
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					name: 'sort',
					type: 'INTEGER',
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

	it('order by with subselect', () => {
		const sql = `
        select value from (
        select id, value, case when value = 1 then 1 else 2 end as ordering from mytable1
        ) t order by ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			orderByColumns: ['id', 't.id', 'value', 't.value', 'ordering'],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select with order by function', () => {
		const sql = `
        select name from mytable2 order by concat(name, ?)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2'
				}
			],
			//shouldn't include order by columns because there is no parameters on the order by clause
			//orderByColumns: ['id', 'value'],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('remove the ordering column from select', () => {
		const sql = `
        select value from (
        select id, value, case when value = 1 then 1 else 2 end from mytable1
        ) t order by ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't'
				}
			],
			orderByColumns: ['id', 't.id', 'value', 't.value', 'case when value = 1 then 1 else 2 end'],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 LIMIT ?, ?', () => {
		const sql = 'SELECT id FROM mytable1 LIMIT ?, ?';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param2',
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

	//fix: was getting type from year function instead of column
	it('SELECT year FROM mytable1', async () => {
		const sql = 'SELECT year FROM mytable4';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'year',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable4'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('attach - select * from users.users', async () => {
		const sql = 'SELECT * FROM users.users';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'users'
				},
				{
					name: 'username',
					type: 'TEXT',
					notNull: true,
					table: 'users'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('attach - select * from users', async () => {
		const sql = 'SELECT * FROM users';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'users'
				},
				{
					name: 'name',
					type: 'TEXT',
					notNull: true,
					table: 'users'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT vector_extract(blob_column) as vector, vector(:vector), vector_distance_cos(blob_column, :vector) FROM all_types', async () => {
		const sql = `
        SELECT vector_extract(blob_column) as vector, 
        vector(:vector) as embedded, 
        vector_distance_cos(blob_column, :vector) as vector_distance_cos
        FROM all_types`;

		const expectedSql = `
        SELECT vector_extract(blob_column) as vector, 
        vector(?) as embedded, 
        vector_distance_cos(blob_column, ?) as vector_distance_cos
        FROM all_types`;

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'vector',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					name: 'embedded',
					type: 'BLOB',
					notNull: true,
					table: ''
				},
				{
					name: 'vector_distance_cos',
					type: 'REAL',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'vector',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'vector',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT 1 + 1 as col_alias WHERE col_alias > 0', async () => {
		const sql = 'SELECT 1 + 1 as col_alias WHERE col_alias > 0';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'col_alias',
					type: 'INTEGER',
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

	it('SELECT "id", "mytable1"."value" from "mytable1" where "mytable1"."id" = 0', async () => {
		const sql = 'SELECT "id", "mytable1"."value" from "mytable1" where "mytable1"."id" = 0;';

		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('multipleRowsResult for table with composite key', async () => {
		const db = new Database('./mydb.db');
		const dbSchemaResult = loadDbSchema(db);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error`);
		}

		const sql = 'select * from playlist_track where PlaylistId = 1';

		const actual = await parseSql(sql, dbSchemaResult.value);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'PlaylistId',
					type: 'INTEGER',
					notNull: true,
					table: 'playlist_track'
				},
				{
					name: 'TrackId',
					type: 'INTEGER',
					notNull: true,
					table: 'playlist_track'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('multipleRowsResult for table with composite key (all keys)', async () => {
		const db = new Database('./mydb.db');
		const dbSchemaResult = loadDbSchema(db);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error`);
		}

		const sql = 'select * from playlist_track where PlaylistId = 1 and TrackId = 1';

		const actual = await parseSql(sql, dbSchemaResult.value);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'PlaylistId',
					type: 'INTEGER',
					notNull: true,
					table: 'playlist_track'
				},
				{
					name: 'TrackId',
					type: 'INTEGER',
					notNull: true,
					table: 'playlist_track'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('multipleRowsResult for table with composite key (all keys, with OR)', async () => {
		const db = new Database('./mydb.db');
		const dbSchemaResult = loadDbSchema(db);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error`);
		}

		const sql = 'select * from playlist_track where PlaylistId = 1 OR TrackId = 1';

		const actual = await parseSql(sql, dbSchemaResult.value);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'PlaylistId',
					type: 'INTEGER',
					notNull: true,
					table: 'playlist_track'
				},
				{
					name: 'TrackId',
					type: 'INTEGER',
					notNull: true,
					table: 'playlist_track'
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
