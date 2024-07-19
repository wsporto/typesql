import assert from 'node:assert';
import { parseSql } from '../src/describe-query';
import type { MySqlDialect, SchemaDef } from '../src/types';
import { isLeft, isRight } from 'fp-ts/lib/Either';
import { createMysqlClientForTest } from '../src/queryExectutor';

describe('Test simple select statements', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
	});

	it('try to parse a empty query', async () => {
		const sql = '';

		const actual = await parseSql(client, sql);
		const expected = 'Invalid sql';

		if (isLeft(actual)) {
			assert.deepStrictEqual(actual.left.name, expected);
		} else {
			assert.fail('should return an InvalidSqlError');
		}
	});

	it('SELECT id FROM mytable1', async () => {
		const sql = 'SELECT id FROM mytable1';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
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
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'int',
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

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT mytable1.* FROM mytable1', async () => {
		const sql = 'SELECT mytable1.* FROM mytable1';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT t.* FROM mytable1 t', async () => {
		const sql = 'SELECT t.* FROM mytable1 t';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT mytable1.id, mytable1.value FROM mytable1', async () => {
		const sql = 'SELECT mytable1.id, mytable1.value FROM mytable1';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT id, name, descr as description FROM mytable2', async () => {
		const sql = 'SELECT id, name, descr as description FROM mytable2';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				},
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				},
				{
					columnName: 'description',
					type: 'varchar',
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

	it('SELECT distinct id, value FROM mytable1', async () => {
		const sql = 'SELECT distinct id, value FROM mytable1';
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('parse select distinct *', async () => {
		const sql = 'SELECT distinct * FROM mytable1';
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT id FROM mydb.MYTABLE1', async () => {
		const sql = 'SELECT id FROM mydb.mytable1';
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
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

	it('SELECT * FROM mytable1 WHERE id = ?', async () => {
		const sql = 'SELECT * FROM mytable1 WHERE id = ?';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v0.3.0
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 WHERE id = ? and value = 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id = ? and value = 10';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v.0.3.0
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT value FROM mytable1 WHERE id = ? or value > ?', async () => {
		const sql = 'SELECT value FROM mytable1 WHERE id = ? or value > ?';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'int',
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

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: '?', //TODO - PARAM1
					type: 'any',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: true //todo - changed v0.0.2
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 where value between :start and :end', async () => {
		const sql = 'SELECT id FROM mytable1 where value between :start and :end';
		const expectedSql = 'SELECT id FROM mytable1 where value between ? and ?';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'start',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'end',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id FROM mytable1 where id = 0 and value between :start and :end', async () => {
		const sql = 'SELECT id FROM mytable1 where id = 0 and value between :start and :end';
		const expectedSql = 'SELECT id FROM mytable1 where id = 0 and value between ? and ?';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'start',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'end',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	//TODO - no reference to table.
	it('SELECT ? as name FROM mytable1', async () => {
		const sql = 'SELECT ? as name FROM mytable1';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'any',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: true //changed on v0.0.2
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with multiples params', async () => {
		const sql = `
        SELECT ? as name, id, descr as description
        FROM mytable2
        WHERE (name = ? or descr = ?) and id > ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'any',
					notNull: true,
					table: ''
				},
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				},
				{
					columnName: 'description',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param2',
					columnType: 'varchar',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'varchar',
					notNull: true
				},
				{
					name: 'param4',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with table alias', async () => {
		const sql = `
        SELECT t.name FROM mytable2 t
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'varchar',
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

	it('SELECT t.* FROM mytable1 t WHERE t.id = ?', async () => {
		const sql = `
        SELECT t.* FROM mytable1 t WHERE t.id = ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v0.3.0
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 WHERE id in (1, 2, 3)', async () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id in (1, 2, 3)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT * FROM mytable1 WHERE id not in (1, 2, 3)', async () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id not in (1, 2, 3)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT t.* FROM mytable1 t WHERE t.id in (1, 2, 3)', async () => {
		const sql = `
        SELECT t.* FROM mytable1 t WHERE t.id in (1, 2, 3)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)', async () => {
		const sql = `
        SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int[]',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id not in (1, 2, 3, ?)', async () => {
		const sql = `
        SELECT * FROM mytable1 t WHERE id not in (1, 2, 3, ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int[]',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 t WHERE ? in (1, 2, 3)', async () => {
		const sql = `
        SELECT id FROM mytable1 t WHERE ? in (1, 2, 3)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT * FROM mytable1 t WHERE ? in ('a', 'b', 'c')`, async () => {
		const sql = `
        SELECT id FROM mytable1 t WHERE ? in ('a', 'b', 'c')
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it.skip(`SELECT id FROM mytable1 t WHERE ? in (1, 2, 'a', 'b')`, async () => {
		const sql = `
        SELECT id FROM mytable1 t WHERE ? in (1, 2, 'a', 'b')
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT * FROM mytable1 WHERE id = (select id from mytable2 where id = ?)', async () => {
		const sql = `
        SELECT * FROM mytable1 WHERE id = (select id from mytable2 where id = ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //changed at v0.3.0
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select t1.id > 1 AS bigger from mytable1 t1', async () => {
		const sql = `
        select t1.id > 1 AS bigger from mytable1 t1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'bigger',
					type: 'tinyint', //changed at v0.0.2
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

	it(`select t2.name > 'a' AS bigger from mytable2 t2`, async () => {
		const sql = `
        select t2.name > 'a' AS bigger from mytable2 t2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'bigger',
					type: 'tinyint', //changed at v0.0.2
					notNull: false, //TODO - not null true
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

	it('select id from mytable2 where name like ?', async () => {
		const sql = `
        select id from mytable2 where name like ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select id from mytable2 where ? like name', async () => {
		const sql = `
        select id from mytable2 where ? like name
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	//TODO - CREATE TEST WITH ELSE; not null can be inferred
	it('parse select with CASE WHEN', async () => {
		const sql = `
        SELECT
            CASE
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
            END as id
        FROM mytable1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'varchar',
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

	it('parse select with CASE WHEN ... ELSE', async () => {
		const sql = `
        SELECT
            CASE
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
                ELSE 'other'
            END as id
        FROM mytable1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'varchar',
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

	it('parse select with CASE WHEN using IN operator', async () => {
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
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT SUM(ID) as sumById FROM mytable1 t1 GROUP BY id', async () => {
		const sql = `
        SELECT SUM(ID) as sumById
        FROM mytable1 t1
        GROUP BY id
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'sumById',
					type: 'decimal',
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

	it('parse select using ANY operator', async () => {
		const sql = `
        select id from mytable1 where value > any(select id from mytable2 where name like ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse select using ANY operator with parameter', async () => {
		const sql = `
        select id from mytable1 where ? > any(select id from mytable2 where name like ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'varchar',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	//the mysql drive tell value is nullable even if there is a 'where value is not null' clause
	it('select value from mytable1 where value is not null', async () => {
		const sql = `
        select value from mytable1 where value is not null or (id > 0 and value is not null)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
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

	it('select id from mytable1 where 1 = 1', async () => {
		const sql = `
        select id from mytable1 where 1 = 1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
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

	it(`select enum_column from all_types where enum_column = 'medium' or 'short' = enum_column`, async () => {
		const sql = `
        select enum_column from all_types where enum_column = 'medium' or 'short' = enum_column
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'enum_column',
					type: `enum('x-small','small','medium','large','x-large')`,
					notNull: true,
					table: 'all_types'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: `, actual.left.description);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select :ano - year_column as result from all_types where int_column = 1', async () => {
		const sql = `
        select ? - year_column as result from all_types where int_column = 1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'result',
					type: 'double',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'double',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select value from mytable1 order by ?', async () => {
		const sql = `
        select value from mytable1 order by ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
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

	it('select value as myValue from mytable1 order by ?', async () => {
		const sql = `
        select value as myValue from mytable1 order by ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'myValue',
					type: 'int',
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

	it('select value from mytable1 order by value', async () => {
		const sql = `
        select value from mytable1 order by value
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
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

	it('order by with case when expression', async () => {
		const sql = `
        select value, case when value = 1 then 1 else 2 end as ordering from mytable1 order by ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
					notNull: false,
					table: 'mytable1'
				},
				{
					columnName: 'ordering',
					type: 'int',
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

	it('order by with subselect', async () => {
		const sql = `
        select value from (
        select id, value, case when value = 1 then 1 else 2 end as ordering from mytable1
        ) t order by ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
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

	it('select with order by function', async () => {
		const sql = `
        select name from mytable2 order by concat(name, ?)
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				}
			],
			//shouldn't include order by columns because there is no parameters on the order by clause
			//orderByColumns: ['id', 'value'],
			parameters: [
				{
					name: 'param1',
					columnType: 'varchar',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('remove the ordering column from select', async () => {
		const sql = `
        select value from (
        select id, value, case when value = 1 then 1 else 2 end from mytable1
        ) t order by ?
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int',
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

	it('SELECT id FROM mytable1 LIMIT ?, ?', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT ?, ?';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'bigint',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'bigint',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT id FROM mytable1 LIMIT 'a', ?`, async () => {
		const sql = `SELECT id FROM mytable1 LIMIT 'a', ?`;

		const actual = await parseSql(client, sql);

		if (isRight(actual)) {
			assert.fail('Should return an error');
		}
		const expectedMessage = 'Invalid sql';
		assert.deepStrictEqual(actual.left.name, expectedMessage);
	});

	it('try to parse a SQL with type coercion error', async () => {
		const sql = `SELECT MONTH('ASDF')`;

		const actual = await parseSql(client, sql);
		const expected = 'Type mismatch: varchar and date';

		if (isLeft(actual)) {
			assert.deepStrictEqual(actual.left.description, expected);
		} else {
			assert.fail('should return an InvalidSqlError');
		}
	});

	it('SELECT bit_column FROM all_types WHERE bit_column = 1 or bit_column = ?', async () => {
		const sql = 'SELECT bit_column FROM all_types WHERE bit_column = 1 or bit_column = ?';

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'bit_column',
					type: 'bit',
					notNull: true,
					table: 'all_types'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'bit',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('try to parse with reserved word desc', () => {
		//SELECT id, name, desc as description FROM MYTABLE
	});
});
