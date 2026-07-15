import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('parse-select-complex-queries', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('parse SELECT t1.name, t2.mycolumn2, t3.mycolumn3, count', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr); mytable3 (id)
		const sql = `
        SELECT t1.value, t2.name, t3.id, count(*) AS quantity
        FROM mytable1 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        LEFT JOIN mytable3 t3 ON t3.id = t2.id
        GROUP BY t1.value, t2.name, t3.id
        HAVING count(*) > 1
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
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
				},
				{
					name: 'id',
					type: 'int4',
					notNull: false,
					table: 't3'
				},
				{
					name: 'quantity',
					notNull: true,
					type: 'int8',
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

	it('HAVING value > ?', async () => {
		const sql = `
        SELECT
            name,
            SUM(double_value) as value
        FROM mytable3
        GROUP BY
            name
        HAVING
            SUM(double_value) > $1
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: true,
					table: 'mytable3'
				},
				{
					name: 'value',
					type: 'float4',
					notNull: false, //SUM(double_value) > $1; then notNull should be true
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'float4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('HAVING value > ? and ? <', async () => {
		const sql = `
        SELECT
            name,
            SUM(double_value) as value,
            SUM(double_value * 0.01) as id
        FROM mytable3
        WHERE id > $1 -- this id is from mytable3 column
        GROUP BY
            name
        HAVING
            SUM(double_value) > $2
            and SUM(double_value * 0.01) < $3 -- this id is from the SELECT alias
            AND SUM(double_value) = $4

        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: true,
					table: 'mytable3'
				},
				{
					name: 'value',
					type: 'float4',
					notNull: false,
					table: ''
				},
				{
					name: 'id',
					type: 'float8',
					notNull: false,
					table: '' //TODO - could be mytable3?
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					type: 'float4',
					notNull: true
				},
				{
					name: 'param3',
					type: 'float8',
					notNull: true
				},
				{
					name: 'param4',
					type: 'float4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('parse a select with UNION', async () => {
		const sql = `
        SELECT id FROM mytable1
        UNION
        SELECT id FROM mytable2
        UNION
        SELECT id FROM mytable3
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
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

	it('parse a select with UNION (int4_column + int8_column)', async () => {
		const sql = `
            SELECT int4_column as col FROM all_types
			UNION
			SELECT int8_column as col FROM all_types
            `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'col',
					type: 'int8',
					notNull: false,
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

	it('subselect in column', async () => {
		const sql = `
        SELECT (SELECT name FROM mytable2 where id = t1.id) as fullname
        FROM mytable1 t1
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'fullname',
					type: 'text',
					notNull: false,
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

	it('subselect in column (with parameter)', async () => {
		const sql = `
        SELECT (SELECT name as namealias FROM mytable2 where id = $1) as fullname
        FROM mytable1 t1
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'fullname',
					type: 'text',
					notNull: false,
					table: '' //TODO - subselect table name should be ''
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

	it('WITH names AS ( SELECT name FROM mytable2 )', async () => {
		const sql = `
        WITH names AS (
            SELECT name FROM mytable2
        )
        SELECT name from names
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'names'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH names AS (query1), allvalues AS (query2)', async () => {
		const sql = `
        WITH
            names AS (SELECT id, name FROM mytable2),
            allvalues AS (SELECT id, value FROM mytable1)
        SELECT n.id, name, value
        FROM names n
        INNER JOIN allvalues v ON n.id = v.id
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'n'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'n'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'v'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH deleted AS (DELETE ... RETURNING)', async () => {
		const sql = `WITH deleted AS ( DELETE FROM mytable1 WHERE id = :id RETURNING id, value ) SELECT id, value FROM deleted`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH deleted AS ( DELETE FROM mytable1 WHERE id = $1 RETURNING id, value ) SELECT id, value FROM deleted`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'deleted'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'deleted'
				}
			],
			parameters: [
				{
					name: 'id',
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

	it('WITH inserted AS (INSERT ... RETURNING)', async () => {
		const sql = `WITH inserted AS ( INSERT INTO mytable1(value) VALUES (:value) RETURNING id, value ) SELECT id, value FROM inserted`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH inserted AS ( INSERT INTO mytable1(value) VALUES ($1) RETURNING id, value ) SELECT id, value FROM inserted`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'inserted'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'inserted'
				}
			],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH updated AS (UPDATE ... RETURNING)', async () => {
		const sql = `WITH updated AS ( UPDATE mytable1 SET value = :value WHERE id = :id RETURNING id, value ) SELECT id, value FROM updated`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH updated AS ( UPDATE mytable1 SET value = $1 WHERE id = $2 RETURNING id, value ) SELECT id, value FROM updated`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'updated'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'updated'
				}
			],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				},
				{
					name: 'id',
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

	it('WITH deleted AS (DELETE ... USING <prior cte> RETURNING)', async () => {
		const sql = `WITH filtered AS ( SELECT id FROM mytable2 WHERE name = :name ), deleted AS ( DELETE FROM mytable1 m USING filtered f WHERE m.id = f.id RETURNING m.id, m.value ) SELECT id, value FROM deleted`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH filtered AS ( SELECT id FROM mytable2 WHERE name = $1 ), deleted AS ( DELETE FROM mytable1 m USING filtered f WHERE m.id = f.id RETURNING m.id, m.value ) SELECT id, value FROM deleted`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'deleted'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'deleted'
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

	it('WITH deleted AS (DELETE ... USING <prior cte> RETURNING *)', async () => {
		//RETURNING * expands to the target table columns plus the USING relation columns
		const sql = `WITH filtered AS ( SELECT id FROM mytable2 WHERE name = :name ), deleted AS ( DELETE FROM mytable1 m USING filtered f WHERE m.id = f.id RETURNING * ) SELECT * FROM deleted`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH filtered AS ( SELECT id FROM mytable2 WHERE name = $1 ), deleted AS ( DELETE FROM mytable1 m USING filtered f WHERE m.id = f.id RETURNING * ) SELECT * FROM deleted`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'deleted'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'deleted'
				},
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'deleted'
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

	it('WITH del AS (DELETE without RETURNING) - parameter ordering', async () => {
		const sql = `WITH del AS ( DELETE FROM mytable1 WHERE value = :value ) SELECT id FROM mytable1 WHERE id = :id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH del AS ( DELETE FROM mytable1 WHERE value = $1 ) SELECT id FROM mytable1 WHERE id = $2`,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: true
				},
				{
					name: 'id',
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

	it('top-level WITH cte AS (SELECT ...) DELETE FROM ... USING cte', async () => {
		const sql = `WITH ids AS ( SELECT id FROM mytable2 WHERE name = :name ) DELETE FROM mytable1 USING ids WHERE mytable1.id = ids.id RETURNING mytable1.id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH ids AS ( SELECT id FROM mytable2 WHERE name = $1 ) DELETE FROM mytable1 USING ids WHERE mytable1.id = ids.id RETURNING mytable1.id`,
			queryType: 'Delete',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'name',
					type: 'text',
					notNull: true
				}
			],
			returning: true
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('nested WITH inside a data-modifying CTE body', async () => {
		const sql = `WITH d AS ( WITH src AS ( SELECT id FROM mytable2 WHERE name = :name ) DELETE FROM mytable1 m USING src WHERE m.id = src.id RETURNING m.id ) SELECT id FROM d`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH d AS ( WITH src AS ( SELECT id FROM mytable2 WHERE name = $1 ) DELETE FROM mytable1 m USING src WHERE m.id = src.id RETURNING m.id ) SELECT id FROM d`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'd'
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

	it('UPDATE CTE: SET/RETURNING reference FROM-clause columns', async () => {
		const sql = `WITH u AS ( UPDATE mytable1 m SET value = t2.id FROM mytable2 t2 WHERE m.id = t2.id RETURNING m.id, t2.name ) SELECT id, name FROM u`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH u AS ( UPDATE mytable1 m SET value = t2.id FROM mytable2 t2 WHERE m.id = t2.id RETURNING m.id, t2.name ) SELECT id, name FROM u`,
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
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'u'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH ins AS (INSERT ... ON CONFLICT DO NOTHING RETURNING)', async () => {
		const sql = `WITH ins AS ( INSERT INTO mytable1(value) VALUES (:value) ON CONFLICT DO NOTHING RETURNING id ) SELECT id FROM ins`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH ins AS ( INSERT INTO mytable1(value) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id ) SELECT id FROM ins`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'ins'
				}
			],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('top-level WITH cte AS (SELECT ...) UPDATE ... FROM cte RETURNING', async () => {
		const sql = `WITH ids AS ( SELECT id FROM mytable2 WHERE name = :name ) UPDATE mytable1 m SET value = :value FROM ids WHERE m.id = ids.id RETURNING m.id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH ids AS ( SELECT id FROM mytable2 WHERE name = $1 ) UPDATE mytable1 m SET value = $2 FROM ids WHERE m.id = ids.id RETURNING m.id`,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'm'
				}
			],
			parameters: [],
			data: [
				{
					name: 'name',
					type: 'text',
					notNull: true
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			],
			returning: true
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('top-level WITH cte AS (SELECT ...) INSERT INTO ... SELECT FROM cte RETURNING', async () => {
		const sql = `WITH v AS ( SELECT id FROM mytable2 WHERE name = :name ) INSERT INTO mytable1(value) SELECT id FROM v RETURNING id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH v AS ( SELECT id FROM mytable2 WHERE name = $1 ) INSERT INTO mytable1(value) SELECT id FROM v RETURNING id`,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					name: 'name',
					type: 'text',
					notNull: true
				}
			],
			returning: true
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH ins AS (INSERT INTO ... AS alias ... RETURNING alias.col)', async () => {
		const sql = `WITH ins AS ( INSERT INTO mytable1 AS m (value) VALUES (:value) RETURNING m.id, m.value ) SELECT id, value FROM ins`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH ins AS ( INSERT INTO mytable1 AS m (value) VALUES ($1) RETURNING m.id, m.value ) SELECT id, value FROM ins`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'ins'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'ins'
				}
			],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH u AS (UPDATE ... FROM (subquery) ...) - data param textual ordering', async () => {
		//SET (:value) precedes FROM subquery (:filterName) which precedes WHERE (:whereValue)
		const sql = `WITH u AS ( UPDATE mytable1 m SET value = :value FROM ( SELECT id FROM mytable2 WHERE name = :filterName ) t WHERE m.id = t.id AND m.value = :whereValue RETURNING m.id ) SELECT id FROM u`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH u AS ( UPDATE mytable1 m SET value = $1 FROM ( SELECT id FROM mytable2 WHERE name = $2 ) t WHERE m.id = t.id AND m.value = $3 RETURNING m.id ) SELECT id FROM u`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'u'
				}
			],
			parameters: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				},
				{
					name: 'filterName',
					type: 'text',
					notNull: true
				},
				{
					name: 'whereValue',
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

	it('WITH ins AS (INSERT INTO ... DEFAULT VALUES RETURNING)', async () => {
		const sql = `WITH ins AS ( INSERT INTO mytable1 DEFAULT VALUES RETURNING id, value ) SELECT id, value FROM ins`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH ins AS ( INSERT INTO mytable1 DEFAULT VALUES RETURNING id, value ) SELECT id, value FROM ins`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'ins'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'ins'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH ins AS (INSERT INTO ... SELECT ... FROM ... WHERE :p RETURNING)', async () => {
		const sql = `WITH ins AS ( INSERT INTO mytable1(value) SELECT id FROM mytable2 WHERE name = :name RETURNING id ) SELECT id FROM ins`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: `WITH ins AS ( INSERT INTO mytable1(value) SELECT id FROM mytable2 WHERE name = $1 RETURNING id ) SELECT id FROM ins`,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'ins'
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

	it('nested WITH inside a DML CTE body does not leak to the outer scope', async () => {
		//`src` is defined inside `d`'s body; it must not be visible to the outer query.
		//Postgres itself rejects the outer reference, confirming the scoped-copy isolation.
		const sql = `WITH d AS ( WITH src AS ( SELECT id FROM mytable2 ) DELETE FROM mytable1 m USING src WHERE m.id = src.id RETURNING m.id ) SELECT id FROM d, src`;
		const actual = await describeQuery(client, sql, schemaInfo);
		if (actual.isOk()) {
			assert.fail('inner CTE `src` must not be visible outside its DML body');
		}
		assert.strictEqual(actual.error.description, `relation "src" does not exist`);
	});

	it('WITH names AS (query1), allvalues AS (query2)', async () => {
		const sql = `
       	WITH
            names AS (SELECT id, name FROM mytable2),
            allvalues AS (SELECT t1.id, name FROM mytable1 t1 INNER JOIN names n ON t1.id = n.id)
        SELECT * from allvalues;
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'allvalues'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'allvalues'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH names AS (query1) SELECT names.*', async () => {
		const sql = `
        WITH
            names AS (SELECT id, name FROM mytable2)
        SELECT names.*
        FROM names
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'names'
				},
				{
					name: 'name',
					type: 'text',
					notNull: false,
					table: 'names'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH result AS (query1 UNION query2)', async () => {
		const sql = `
        WITH result AS (
            SELECT id as id FROM mytable1
            UNION
            SELECT id as id FROM mytable2
        )
        SELECT *
        FROM result
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'result'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH (query with inner join and parameters)', async () => {
		const sql = `
        WITH t1 AS
        (
            SELECT mytable1.*, mytable2.name
            FROM mytable1
            INNER JOIN mytable2 ON mytable1.id = mytable2.id
            WHERE mytable1.value > $1 and mytable2.name = $2
        )
        SELECT t1.*
        FROM t1
        ORDER BY t1.value DESC
		LIMIT 100
        `;
		const actual = await describeQuery(client, sql, schemaInfo);
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
					table: 't1'
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
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

	it('WITH RECURSIVE seq (n)', async () => {
		const sql = `
			WITH RECURSIVE seq (n) AS
			(
				SELECT 1
				UNION ALL
				SELECT n + 1 FROM seq WHERE n < 5
			)
			SELECT * FROM seq
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'n',
					type: 'int4',
					notNull: true,
					table: 'seq'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH RECURSIVE conc (a)', async () => {
		const sql = `
			WITH RECURSIVE conc (a) AS
			(
				SELECT 'a'
				UNION ALL
				SELECT concat(a, 'a') FROM conc WHERE LENGTH(a) < 5
			)
			SELECT * FROM conc
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'a',
					type: 'text',
					notNull: true,
					table: 'conc'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH RECURSIVE cte AS (SELECT 1 AS n ...)', async () => {
		const sql = `
			WITH RECURSIVE cte AS
			(
				SELECT 1 AS n
				UNION ALL
				SELECT n + 1 FROM cte WHERE n < 3
			)
			SELECT * FROM cte
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'n',
					type: 'int4',
					notNull: true,
					table: 'cte'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH RECURSIVE conc (a)', async () => {
		const sql = `
			WITH RECURSIVE cte AS
			(
			SELECT 1 AS n, 'abc' AS str
			UNION ALL
			SELECT n + 1, CONCAT(str, str) FROM cte WHERE n < 3
			)
			SELECT * FROM cte
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'n',
					type: 'int4',
					notNull: true,
					table: 'cte'
				},
				{
					name: 'str',
					type: 'text',
					notNull: true,
					table: 'cte'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH RECURSIVE dates (date) AS', async () => {
		const sql = `
			WITH RECURSIVE dates(date) AS (
				SELECT MIN(date_column)::timestamp FROM all_types
				UNION ALL
				SELECT date + INTERVAL '1 day' FROM dates
				WHERE date + INTERVAL '1 day' <= (SELECT MAX(date_column) FROM all_types)
			)
			SELECT * FROM dates
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'date',
					type: 'timestamp',
					notNull: false,
					table: 'dates'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('WITH RECURSIVE (with inner join and parameters)', async () => {
		const sql = `
			WITH RECURSIVE parent AS (
				SELECT	id,	value FROM mytable1
				WHERE id = $1
				UNION ALL 
				SELECT	t1.id + 1, t1.value	
				FROM mytable1 t1
				INNER JOIN parent t2 ON t1.id = t2.value
				WHERE t2.value IS NOT null and t2.value < 10
			)
			SELECT id, value FROM parent
			WHERE id <> $2`;

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'parent'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'parent'
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
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

	it('WITH RECURSIVE parent (a, b) (with inner join and parameters)', async () => {
		const sql = `
			WITH RECURSIVE parent (a, b) AS (
				SELECT	id,	value FROM	mytable1
				WHERE id = $1
				UNION ALL 
				SELECT	t1.id + 1, t1.value	
				FROM mytable1 t1
				INNER JOIN parent t2 ON t1.id = t2.a
				WHERE t2.b IS NOT null and t2.b < 10
			)
			SELECT a,b FROM parent
			WHERE a <> $2`;

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'a',
					type: 'int4',
					notNull: true,
					table: 'parent'
				},
				{
					name: 'b',
					type: 'int4',
					notNull: false,
					table: 'parent'
				}
			],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
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

	it('WITH RECURSIVE cte ...SELECT ... INNER JOIN', async () => {
		const sql = `
			WITH RECURSIVE cte as (
				SELECT     t1.id, 0 as level
				FROM       mytable1 t1
				WHERE      id is null
				UNION ALL
				SELECT     t1.id,
							level+1 as level
				FROM       cte c
				INNER JOIN mytable1 t1
						on c.id = t1.id
			)
			SELECT * from cte
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'cte'
				},
				{
					name: 'level',
					type: 'int4',
					notNull: true,
					table: 'cte'
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