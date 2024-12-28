import assert from 'node:assert';
import type { SchemaDef, TypeSqlError } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-select-multiples-tables', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('parse a basic with inner join', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT * 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
				{
					columnName: 'id', //TODO - rename fields
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
					columnName: 'descr',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('FROM mytable1 as t1 INNER JOIN mytable2 as t2', async () => {
		const sql = `
        SELECT *
        FROM mytable1 as t1
        INNER JOIN mytable2 as t2 on t2.id = t1.id
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
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
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
					columnName: 'descr',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select t1.* from inner join', async () => {
		const sql = `
        SELECT t1.*
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select t2.* from inner join', async () => {
		const sql = `
        SELECT t2.*
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
					table: 'mytable2'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				},
				{
					columnName: 'descr',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select t2.*, t1.* from inner join', async () => {
		const sql = `
        SELECT t2.*, t1.*
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
					table: 'mytable2'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				},
				{
					columnName: 'descr',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				},
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
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse select with param', async () => {
		const sql = `
        SELECT t1.id
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t2.id = $1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true, //could be false (one to one relation)
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

	it.skip('parse select with param 2', async () => {
		const sql = `
        SELECT t1.id, t2.name, t1.value, t2.descr as description, $1 as param1
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t1.id = $2 and t2.name = $3 and t1.value > $4
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false, //different from mysql and sqlite
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'name', //where t1.name = ?; cannot be null
					type: 'text',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'value', //where t1.value = ?; cannot be null
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'description',
					type: 'text',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'param1',
					type: 'text',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text', //different from mysql and sqlite
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param2',
					columnType: 'int4',
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
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it.skip('parse select with param (tablelist)', async () => {
		const sql = `
        SELECT t3.id, t2.name, t1.value, $1 as param1
        FROM mytable1 t1, mytable2 t2, mytable3 t3
        WHERE t3.id > $2 and t1.value = $3 and t2.name = $4
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
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: true, //where t2.name = ?; cannot be null
					table: 'table'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: true, //where t1.value = ?; cannot be null
					table: 'table'
				},
				{
					columnName: 'param1',
					notNull: true,
					type: 'text',
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'text',
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param2',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param4',
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

	it('parse a select with tablelist', async () => {
		const sql = `
        SELECT t1.id, t2.name
        FROM mytable1 t1, mytable2 t2
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
				},
				{
					columnName: 'name',
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

	it('parse a select with tablelist (not ambiguous)', async () => {
		// Column 'name' exists only on mytable2
		const sql = `
        SELECT name FROM mytable1, mytable2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
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

	it('parse a select with tablelist (ambiguous)', async () => {
		// Column 'id' exists on mytable1 and mytable2
		const sql = `
        SELECT id FROM mytable1, mytable2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: TypeSqlError = {
			name: 'error',
			description: `column reference \"id\" is ambiguous`
		};

		if (actual.isOk()) {
			assert.fail('Should return an error');
		}
		assert.deepStrictEqual(actual.error, expected);
	});

	it('parse a select with tablelist (unreferenced alias)', async () => {
		// Column 'name' exists only on mytable2
		const sql = `
        SELECT name as fullname FROM mytable1 t1, mytable2 t2
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'fullname',
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

	it('parse a select with tablelist and subquery', async () => {
		// Column 'name' exists only on mytable2
		const sql = `
        SELECT name FROM (select t1.*, t2.name from mytable1 t1, mytable2 t2) t
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'mytable2' //different from sqlite and mysql (table: 't')
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	//not valid postgres query
	it.skip('parse a query with extras parenteses', async () => {
		const sql = `
        select name from ((( mytable1, (select * from mytable2) t )))
        `;
		const actual = await describeQuery(postres, sql, []);
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
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a query with duplicated names', async () => {
		const sql = `
        select t1.id, t2.id, t1.value as name, t2.name, t1.id, name as descr
        from mytable1 t1
        inner join mytable2 t2 on t1.id = t2.id
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
				},
				{
					columnName: 'id', //TODO - rename field
					type: 'int4',
					notNull: true,
					table: 'mytable2'
				},
				{
					columnName: 'name',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
				{
					columnName: 'name', //TODO - rename field
					type: 'text',
					notNull: false,
					table: 'mytable2'
				},
				{
					columnName: 'id', //TODO - rename field
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'descr',
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

	it('select * from inner join using', async () => {
		const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 using(id)
        WHERE name is not null and value > 0
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
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: true,
					table: 'mytable2'
				},
				{
					columnName: 'descr',
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

	it('select * from inner join using (id, name)', async () => {
		const sql = `
        SELECT *
        FROM mytable2 t1
        INNER JOIN mytable2 t2 using (id, name)
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
					table: 'mytable2'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false, //TODO - using(id, name) makes the name notNull
					table: 'mytable2'
				},
				{
					columnName: 'descr',
					type: 'text',
					notNull: false,
					table: 'mytable2'
				},
				{
					columnName: 'descr',
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

	it.skip('multipleRowsResult must be true with inner join WHERE t1.id = 1', async () => {
		const sql = `
        SELECT t1.id, t1.name
        FROM mytable2 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        WHERE t1.id = 1
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
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it.skip('SELECT mytable1.id, mytable2.id is not null as hasOwner', async () => {
		const sql = `
        SELECT
            mytable1.id,
            mytable2.id is not null as hasOwner
        FROM mytable1
        LEFT JOIN mytable2 ON mytable1.id = mytable2.id
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
					table: 'table'
				},
				{
					columnName: 'hasOwner',
					type: 'bool',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('multipleRowsResult=false to LIMIT 1', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        LIMIT 1
        `;
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
				},
				{
					columnName: 'id', //TODO - rename fields
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
					columnName: 'descr',
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

	it('SELECT * FROM mytable1 t1 CROSS JOIN mytable2 t2', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT *
        FROM mytable1 t1
        CROSS JOIN mytable2 t2
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
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
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
					columnName: 'descr',
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
});
