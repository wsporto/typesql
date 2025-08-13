import assert from 'node:assert';
import type { TypeSqlError } from '../../src/types';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres-parse-select-multiples-tables', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('parse a basic with inner join', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT * 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
				},
				{
					name: 'id', //TODO - rename fields
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true, //could be false (one to one relation)
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				}
			],
			parameters: [
				{
					name: 'param1',
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

	it('parse select with param 2', async () => {
		const sql = `
        SELECT t1.id, t2.name, t1.value, t2.descr as description, $1 as param1
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t1.id = $2 and t2.name = $3 and t1.value > $4
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'name', //where t1.name = ?; cannot be null
					type: 'text',
					notNull: true,
					table: 't2'
				},
				{
					name: 'value', //where t1.value = ?; cannot be null
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'description',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'param1',
					type: 'text',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'text', //different from mysql and sqlite
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param2',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param3',
					type: 'text',
					notNull: true
				},
				{
					name: 'param4',
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

	it('parse select with param (tablelist)', async () => {
		const sql = `
        SELECT t3.id, t2.name, t1.value, $1 as param1
        FROM mytable1 t1, mytable2 t2, mytable3 t3
        WHERE t3.id > $2 and t1.value = $3 and t2.name = $4
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't3'
				},
				{
					name: 'name',
					type: 'text',
					notNull: true, //where t2.name = ?; cannot be null
					table: 't2'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: true, //where t1.value = ?; cannot be null
					table: 't1'
				},
				{
					name: 'param1',
					notNull: true,
					type: 'text',
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'text',
					notNull: true //changed at v0.0.2
				},
				{
					name: 'param2',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param3',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param4',
					type: 'text',
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: TypeSqlError = {
			name: 'PostgresError',
			description: `column reference "id" is ambiguous`
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'fullname',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
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

	it('parse a select with implicit lateral cross join', async () => {
		const sql = 'SELECT name FROM mytable1, LATERAL ( SELECT name from mytable2 WHERE mytable2.id = mytable1.id) t';
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
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

	//not valid postgres query
	it.skip('parse a query with extras parenteses', async () => {
		const sql = `
        select name from ((( mytable1, (select * from mytable2) t )))
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'id', //TODO - rename field
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'int4',
					notNull: false,
					table: 't1'
				},
				{
					name: 'name', //TODO - rename field
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'id', //TODO - rename field
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'name',
					type: 'text',
					notNull: true,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false, //TODO - using(id, name) makes the name notNull
					table: 't1'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't1'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					name: 'name',
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

	it('SELECT m1.id, m2.id, m3.id FROM mytable1 m1 LEFT JOIN mytable2', async () => {
		const sql = `
        SELECT
            m1.id,
            m2.id
        FROM mytable1 m1
        LEFT JOIN mytable2 m2 ON m1.id = m2.id
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'm1'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: false, //LEFT JOIN
					table: 'm2'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT m1.id, m2.id, m3.id FROM mytable1 m1 INNER JOIN mytable2 LEFT JOIN mytable3', async () => {
		const sql = `
        SELECT
            m1.id,
            m2.id,
			m3.id
        FROM mytable1 m1
		INNER JOIN mytable2 m2 ON m1.id = m2.id
		LEFT JOIN mytable3 m3 ON m3.id = m2.id
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'm1'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'm2'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: false, //LEFT JOIN
					table: 'm3'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT m1.id, m2.id, m3.id FROM mytable1 m1 JOIN mytable2 LEFT JOIN mytable3', async () => {
		const sql = `
        SELECT
            m1.id,
            m2.id,
			m3.id
        FROM mytable1 m1
		JOIN mytable2 m2 ON m1.id = m2.id
		LEFT JOIN mytable3 m3 ON m3.id = m2.id
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'm1'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'm2'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: false, //LEFT JOIN
					table: 'm3'
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT mytable1.id, mytable2.id is not null as hasOwner', async () => {
		const sql = `
        SELECT
            mytable1.id,
            mytable2.id is not null as hasOwner
        FROM mytable1
        LEFT JOIN mytable2 ON mytable1.id = mytable2.id
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'hasowner',
					type: 'bool',
					notNull: true,
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

	it('multipleRowsResult=false to LIMIT 1', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        LIMIT 1
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
				},
				{
					name: 'id', //TODO - rename fields
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
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
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 JOIN LATERAL(SELECT * FROM mytable2) t2', async () => {
		const sql = `
        SELECT *
		FROM mytable1
		JOIN LATERAL (
			SELECT *
			FROM mytable2
			WHERE mytable2.id = mytable1.id
		) AS t2 ON true
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 LEFT JOIN LATERAL(SELECT * FROM mytable2) t2', async () => {
		const sql = `
        SELECT *
		FROM mytable1
		LEFT JOIN LATERAL (
			SELECT *
			FROM mytable2
			WHERE mytable2.id = mytable1.id
		) AS t2 ON true
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
				},
				{
					name: 'id',
					type: 'int4',
					notNull: false,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 LEFT JOIN LATERAL(SELECT * FROM mytable2) t2', async () => {
		const sql = `
        SELECT *
		FROM mytable1
		JOIN LATERAL (
			SELECT *
			FROM mytable2
			WHERE mytable2.id = mytable1.id
		) AS t2 ON true
		JOIN LATERAL (
			SELECT *
			FROM mytable3
			WHERE mytable3.id = t2.id
		) AS t3 ON t2.id = t3.id
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
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
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't2'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'text',
					notNull: false,
					table: 't2'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't3'
				},
				{
					name: 'double_value',
					type: 'float4',
					notNull: false,
					table: 't3'
				},
				{
					name: 'name',
					type: 'text',
					notNull: true,
					table: 't3'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 LEFT JOIN LATERAL(SELECT * FROM mytable2) t2', async () => {
		const sql = `
        SELECT t1.id, t1.value, t2.name
		FROM (
			SELECT * FROM mytable1
		) t1
		JOIN LATERAL (
			SELECT *
			FROM mytable2
			WHERE mytable2.id = t1.id
		) AS t2 ON true
		WHERE t2.name like $1
		ORDER by t2.name
        `;
		const actual = await describeQuery(client, sql, ['name'], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 't1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 't1'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 't2'
				}
			],
			parameters: [
				{
					name: 'name',
					type: 'text',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('SELECT * FROM mytable1 LEFT JOIN LATERAL(SELECT * FROM mytable2) t2', async () => {
		const sql = `
        SELECT u.id, check_users.*
		FROM users u
		CROSS JOIN LATERAL check_users(u)
        `;
		const actual = await describeQuery(client, sql, [], schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_ok',
					type: 'bool',
					notNull: true,
					table: 'check_users'
				},
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});
