import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';

describe('sqlite-parse-select-multiples-tables', () => {
	it('parse a basic with inner join', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT * 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				},
				{
					columnName: 'id', //TODO - rename fields
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FROM mytable1 as t1 INNER JOIN mytable2 as t2', async () => {
		const sql = `
        SELECT * 
        FROM mytable1 as t1 
        INNER JOIN mytable2 as t2 on t2.id = t1.id
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				},
				{
					columnName: 'id', //TODO - rename fields
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select t1.* from inner join', async () => {
		const sql = `
        SELECT t1.* 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
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

	it('select t2.* from inner join', async () => {
		const sql = `
        SELECT t2.* 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select t2.*, t1.* from inner join', async () => {
		const sql = `
        SELECT t2.*, t1.*
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'id', //TODO - rename field
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
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

	it('parse select with param', async () => {
		const sql = `
        SELECT t1.id
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t2.id = ?
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true, //changed at v0.5.13
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
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

	it('parse select with param 2', () => {
		const sql = `
        SELECT t1.id, t2.name, t1.value, t2.descr as description, ? as param1
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t1.id = ? and t2.name = ? and t1.value > ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true, //changed at v0.5.13
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: true, //where t1.name = ?; cannot be null
					table: 't2'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: true, //where t1.value = ?; cannot be null
					table: 't1'
				},
				{
					columnName: 'description',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'param1',
					type: 'any',
					notNull: false, //diff from mysql
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: false //diff from mysql
				},
				{
					name: 'param2',
					columnType: 'INTEGER',
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

	it('parse select with param (tablelist)', () => {
		const sql = `
        SELECT t3.id, t2.name, t1.value, ? as param1
        FROM mytable1 t1, mytable2 t2, mytable3 t3
        WHERE t3.id > ? and t1.value = ? and t2.name = ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't3'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: true, //where t2.name = ?; cannot be null
					table: 't2'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: true, //where t1.value = ?; cannot be null
					table: 't1'
				},
				{
					columnName: 'param1',
					notNull: false, //diff from mysql
					type: 'any',
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'any',
					notNull: false //diff from mysql
				},
				{
					name: 'param2',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param4',
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

	it('parse a select with tablelist', () => {
		const sql = `
        SELECT t1.id, t2.name
        FROM mytable1 t1, mytable2 t2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with tablelist (not ambiguous)', () => {
		// Column 'name' exists only on mytable2
		const sql = `
        SELECT name FROM mytable1, mytable2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
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

	// it('parse a select with tablelist (ambiguous)', () => {

	// 	// Column 'id' exists on mytable1 and mytable2
	// 	const sql = `
	//     SELECT id FROM mytable1, mytable2
	//     `
	// 	const actual = parseSql(sql, sqliteDbSchema);
	// 	const expected: TypeSqlError = {
	// 		name: 'Invalid sql',
	// 		description: `Column \'id\' in field list is ambiguous`
	// 	}

	// 	if (isRight(actual)) {
	// 		assert.fail(`Should return an error`);
	// 	}

	// 	assert.deepStrictEqual(actual.left, expected);
	// })

	it('parse a select with tablelist (unreferenced alias)', () => {
		// Column 'name' exists only on mytable2
		const sql = `
        SELECT name as fullname FROM mytable1 t1, mytable2 t2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'fullname',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with tablelist and subquery', () => {
		// Column 'name' exists only on mytable2
		const sql = `
        SELECT name FROM (select t1.*, t2.name from mytable1 t1, mytable2 t2) t
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'TEXT',
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

	it('parse a query with extras parenteses', () => {
		const sql = `
        select name from ((( mytable1, (select * from mytable2) t )))
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'TEXT',
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

	it('parse a query with duplicated names', () => {
		const sql = `
        select t1.id, t2.id, t1.value as name, t2.name, t1.id, name as descr
        from mytable1 t1
        inner join mytable2 t2 on t1.id = t2.id
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		//Add the sufix _2, _3 to the duplicated names
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'id', //TODO - rename field
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				},
				{
					columnName: 'name', //TODO - rename field
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'id', //TODO - rename field
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from inner join using', () => {
		const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 using(id)
        WHERE name is not null and value > 0
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from inner join using (id) and table alias', () => {
		const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 using(id)
        WHERE t2.name is not null and t1.value > 0
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from inner join using (id, name)', async () => {
		const sql = `
        SELECT *
        FROM mytable2 t1
        INNER JOIN mytable2 t2 using (id, name)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false, //TODO - using(id, name) makes the name notNull
					table: 't1'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't1'
				},
				{
					columnName: 'descr', //TODO - must rename
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('multipleRowsResult must be true with inner join WHERE t1.id = 1', () => {
		const sql = `
        SELECT t1.id, t1.name
        FROM mytable2 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        WHERE t1.id = 1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'name',
					type: 'TEXT',
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

	it('SELECT mytable1.id, mytable2.id is not null as hasOwner', () => {
		const sql = `
        SELECT
            mytable1.id,
            mytable2.id is not null as hasOwner
        FROM mytable1
        LEFT JOIN mytable2 ON mytable1.id = mytable2.id
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'hasOwner',
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

	it('multipleRowsResult=false to LIMIT 1', () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        LIMIT 1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't1'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				},
				{
					columnName: 'id', //TODO - rename fields
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FTS5 - WHERE mytable2_fts match :match', () => {
		const sql = `
        SELECT t2.*
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
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

	it('FTS5 - SELECT t2.*, rank', () => {
		const sql = `
        SELECT t2.*, rank
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match ?
		ORDER BY rank
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'rank',
					type: 'REAL',
					notNull: true,
					table: 'fts2'
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

	it('FTS5 - ORDER BY rank', () => {
		const sql = `
        SELECT *
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match 'one'
		ORDER BY rank
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: false, //TODO - should be true: on fts2.id = t2.id
					table: 'fts2'
				},
				{
					columnName: 'name',
					type: 'any',
					notNull: false,
					table: 'fts2'
				},
				{
					columnName: 'descr',
					type: 'any',
					notNull: false,
					table: 'fts2'
				},
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FTS5 - highlight', () => {
		const sql = `
        SELECT 
			t2.id, 
			highlight(mytable2_fts, 1, '<b>', '</b>') as name,
			highlight(mytable2_fts, 2, '<b>', '</b>') as descr
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match 'one'
		ORDER BY rank
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FTS5 - hightlight with parameters', () => {
		const sql = `
        SELECT 
			t2.id, 
			highlight(mytable2_fts, ?, ?, ?) as name,
			highlight(mytable2_fts, ?, ?, ?) as descr
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match 'one'
		ORDER BY rank
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
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
				},
				{
					name: 'param5',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param6',
					columnType: 'TEXT',
					notNull: true
				},

			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FTS5 - snippet', () => {
		const sql = `
        SELECT 
			t2.id, 
			snippet(mytable2_fts, 1, '<b>', '</b>', '...', 10) as name,
			snippet(mytable2_fts, 2, '<b>', '</b>', '...', 10) as descr
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match 'one'
		ORDER BY rank
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FTS5 - snippet with parameters', () => {
		const sql = `
        SELECT 
			t2.id, 
			snippet(mytable2_fts, ?, ?, ?, ?, ?) as name,
			snippet(mytable2_fts, ?, ?, ?, ?, ?) as descr
        FROM mytable2 t2
        INNER JOIN mytable2_fts fts2 on fts2.id = t2.id
        WHERE mytable2_fts match 'one'
		ORDER BY rank
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'descr',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2_fts'
				},
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
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
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param5',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param6',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param7',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param8',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param9',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param10',
					columnType: 'INTEGER',
					notNull: true
				},

			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`FTS5 - SELECT * FROM mytable2_fts('one')`, () => {
		const sql = `
        SELECT * FROM mytable2_fts('one')
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'any',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'name',
					type: 'any',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'descr',
					type: 'any',
					notNull: false,
					table: 'mytable2_fts'
				},
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FTS5 - SELECT * FROM mytable2_fts(?)', () => {
		const sql = `
        SELECT * FROM mytable2_fts(?)
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'any',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'name',
					type: 'any',
					notNull: false,
					table: 'mytable2_fts'
				},
				{
					columnName: 'descr',
					type: 'any',
					notNull: false,
					table: 'mytable2_fts'
				},
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
});
