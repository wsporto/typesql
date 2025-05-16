import assert from 'node:assert';
import { SchemaDef } from '../../src/types';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import postgres from 'postgres';

describe('select-single-table', () => {

	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('SELECT id FROM mytable1', async () => {

		const sql = 'SELECT id FROM mytable1';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id as name FROM mytable1', async () => {
		const sql = 'SELECT id as name FROM mytable1';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1', async () => {
		const sql = 'SELECT * FROM mytable1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT mytable1.* FROM mytable1', async () => {
		const sql = 'SELECT mytable1.* FROM mytable1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT t.* FROM mytable1 t', async () => {
		const sql = 'SELECT t.* FROM mytable1 t';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 't'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT mytable1.id, mytable1.value FROM mytable1', async () => {
		const sql = 'SELECT mytable1.id, mytable1.value FROM mytable1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id, name, descr as description FROM mytable2', async () => {
		const sql = 'SELECT id, name, descr as description FROM mytable2';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable2'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				},
				{
					columnName: 'description',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT distinct id, value FROM mytable1', async () => {
		const sql = 'SELECT distinct id, value FROM mytable1';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse select distinct *', async () => {
		const sql = 'SELECT distinct * FROM mytable1';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id FROM mydb.mytable1', async () => {
		const sql = 'SELECT id FROM public.mytable1';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 WHERE id = ?', async () => {
		const sql = 'SELECT * FROM mytable1 WHERE id = $1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
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
					name: 'param1',
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

	it('CASE INSENSITIVE - SELECT * FROM MYTABLE1 WHERE ID = ?', async () => {
		const sql = 'SELECT ID FROM MYTABLE1 WHERE ID = $1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
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

	it('parse a select with a single parameter (not using *)', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id = $1 and value = 10';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
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

	it('SELECT value FROM mytable1 WHERE id = ? or value > ?', async () => {
		const sql = 'SELECT value FROM mytable1 WHERE id = $1 or value > $2';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param2',
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

	it('SELECT name FROM mytable2 m WHERE (:name::text is null or m.name = :name) AND m.descr = :descr', async () => {
		const sql = 'SELECT name FROM mytable2 m WHERE ($1::text is null or m.name = $1) AND m.descr = $2';

		const actual = await describeQuery(postres, sql, ['name', 'descr']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'm'
				}
			],
			parameters: [
				{
					name: 'name',
					columnType: 'text',
					notNull: false
				},
				{
					name: 'descr',
					columnType: 'text',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id FROM mytable1 where value between :start and :end', async () => {
		const sql = 'SELECT id FROM mytable1 where value between $1 and $2';

		const actual = await describeQuery(postres, sql, ['start', 'end']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'start',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'end',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it.skip('parse a select with multiples params', async () => {
		const sql = `
        SELECT $1 as name, id, descr as description
        FROM mytable2 
        WHERE (name = $2 or descr = $3) and id > $4
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text', //different from sqlite
					notNull: false, //todo - differente from mysql
					table: ''
				},
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'description',
					type: 'text',
					notNull: false,
					table: 'table'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text', //differente from sqlite
					notNull: false //todo - differente from mysql
				},
				{
					name: 'param2',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'param4',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)', async () => {
		const sql = 'SELECT * FROM mytable1 t WHERE id in ($1)';

		const expectedSql = `SELECT * FROM mytable1 t WHERE id in (\${generatePlaceholders('$1', params.param1)})`;
		const actual = await describeQuery(postres, sql, []);

		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4[]',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id::int4 FROM mytable1', async () => {
		const sql = 'SELECT id::int2 FROM mytable1';

		const actual = await describeQuery(postres, sql, []);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int2',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 t WHERE id in (1, 2, 3, ?)', async () => {
		const sql = 'SELECT * FROM mytable1 t WHERE id in (1, 2, 3, $1)';

		const expectedSql = `SELECT * FROM mytable1 t WHERE id in (1, 2, 3, \${generatePlaceholders('$1', params.param1)})`;
		const actual = await describeQuery(postres, sql, []);

		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 't'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4[]',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT SUM(ID) as sumById FROM mytable1 t1 GROUP BY id', async () => {
		const sql = `
        SELECT SUM(ID) as "sumById"
        FROM mytable1 t1
        GROUP BY id
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'sumById',
					type: 'int8',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse select using ANY operator', async () => {
		const sql = `
        select id from mytable1 where value > any(select id from mytable2 where name like $1)
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse select using ANY operator with parameter', async () => {
		const sql = `
        select id from mytable1 where $1 > any(select id from mytable2 where name like $2)
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'text',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse select using ANY operator with parameter', async () => {
		const sql = `
        select id from mytable1 where id > any($1)
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: '_int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select value from mytable1 where value is not null', async () => {
		const sql = `
        select value from mytable1 where value is not null or (id > 0 and value is not null)
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select id from mytable1 where 1 = 1', async () => {
		const sql = `
        select id from mytable1 where 1 = 1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`select enum_column from all_types where enum_column = 'medium' or 'small' = enum_column`, async () => {
		const sql = `
			select enum_column from all_types where enum_column = 'medium' or 'small' = enum_column
			`;
		const actual = await describeQuery(postres, sql, []);
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
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it.skip(`select enum_constraint from all_types where enum_constraint = 'medium' or 'short' = enum_constraint`, async () => {
		const sql = `
			select enum_constraint from all_types where enum_constraint = 'medium' or 'short' = enum_constraint
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'enum_constraint',
					type: `enum('x-small','small','medium','large','x-large')`,
					notNull: true,
					table: 'all_types'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it.skip('select value from mytable1 order by ?', async () => {
		const sql = `
	    select value from mytable1 order by $1
	    `;
		const actual = await describeQuery(postres, sql, []);
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
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id FROM mytable1 LIMIT ?, ?', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT $1 OFFSET $2';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int8',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'int8',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('multipleRowsResult for table with composite key: where key1 = 1', async () => {

		const sql = 'select key1, key2 from composite_key where key1 = 1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'key1',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				},
				{
					columnName: 'key2',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('multipleRowsResult for table with composite key: where key1 = 1 and key2 = 2', async () => {

		const sql = 'select key1, key2 from composite_key where key1 = 1 and key2 = 2';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'key1',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				},
				{
					columnName: 'key2',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('multipleRowsResult for table with composite key: where 1 = key2 and 2 = key1', async () => {

		const sql = 'select key1, key2 from composite_key where 1 = key2 and 2 = key1';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'key1',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				},
				{
					columnName: 'key2',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('multipleRowsResult for table with composite key: where key1 = 1 and key2 > 2', async () => {

		const sql = 'select key1, key2 from composite_key where key1 = 1 and key2 > 2';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'key1',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				},
				{
					columnName: 'key2',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('multipleRowsResult for table with composite key: where key1 = 1 and key2 = 2 or key2 = 3', async () => {

		const sql = 'select key1, key2 from composite_key where key1 = 1 and key2 = 2 or key2 = 3';

		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'key1',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				},
				{
					columnName: 'key2',
					type: 'int4',
					notNull: true,
					table: 'composite_key'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id FROM mytable2 (id, name, descr) = ($1, $2, $3)', async () => {
		const sql = 'SELECT id FROM mytable2 WHERE (id, name, descr) = ($1, $2, $3)';

		const actual = await describeQuery(postres, sql, ['id', 'name', 'descr']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'name',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'descr',
					columnType: 'text',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT id FROM mytable2 WHERE row(id, name, descr) = row($1, $2, $3)', async () => {
		const sql = 'SELECT id FROM mytable2 WHERE row(id, name, descr) = row($1, $2, $3)';

		const actual = await describeQuery(postres, sql, ['id', 'name', 'descr']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable2'
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'name',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'descr',
					columnType: 'text',
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
