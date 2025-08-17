import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres-parse-update', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('update mytable1 set value = ? where id = ?', async () => {
		const sql = 'update mytable1 set value = :value where id = :id';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql: 'update mytable1 set value = $1 where id = $2',
			columns: [],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
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

	it('CASE INSENSITIVE - UPDATE MYTABLE1 SET VALUE = ? WHERE ID = ?', async () => {
		const sql = 'UPDATE MYTABLE1 SET VALUE = :value WHERE ID = :id';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE MYTABLE1 SET VALUE = $1 WHERE ID = $2',
			multipleRowsResult: false,
			queryType: 'Update',
			columns: [],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
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

	it('update mytable3 set name = ? where id = ?', async () => {
		const sql = 'update mytable3 set name = :name where id = :id';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql: 'update mytable3 set name = $1 where id = $2',
			columns: [],
			data: [
				{
					name: 'name',
					type: 'text',
					notNull: true
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

	it('UPDATE mytable2 SET name = :name, descr= :descr WHERE id = :id', async () => {
		const sql = `
			UPDATE mytable2 SET name = $1, descr= $2 WHERE id = $3
				`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'param1',
					type: 'text',
					notNull: false
				},
				{
					name: 'param2',
					type: 'text',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'param3', //different from mysql and sqlite
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

	it(`UPDATE mytable2 t2 SET name = 'a'`, async () => {
		const sql = `
			UPDATE mytable2 t2
			SET name = 'a'
				`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`UPDATE mytable2 t2 SET name = 'a' WHERE t2.id = $1`, async () => {
		const sql = `
			UPDATE mytable2 t2
			SET name = 'a'
			WHERE t2.id = $1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
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

	it(`UPDATE mytable2 SET name = 'a' WHERE mytable2.id = $1`, async () => {
		const sql = `
			UPDATE mytable2
			SET name = 'a'
			WHERE mytable2.id = $1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
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

	it('UPDATE mytable2 t2 SET name = t2.descr FROM mytable3 t3 WHERE t2.id = t3.id AND t2.id IN ($1)', async () => {
		const sql = `
			UPDATE mytable2 t2
			SET name = t2.descr
			FROM mytable3 t3
			WHERE t2.id = t3.id
			AND t2.id IN ($1)
			`;
		const expectedSql = `
			UPDATE mytable2 t2
			SET name = t2.descr
			FROM mytable3 t3
			WHERE t2.id = t3.id
			AND t2.id IN (\${generatePlaceholders('$1', params.param1)})
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4[]',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('update mytable1 set value = :value where id > :min and id < :max', async () => {
		const sql = 'update mytable1 set value = :value where id > :min and id < :max';

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'update mytable1 set value = $1 where id > $2 and id < $3',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'min',
					type: 'int4',
					notNull: true
				},
				{
					name: 'max',
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

	it('update mytable1 set value = :value where id > :value or id < :value', async () => {
		const sql = 'update mytable1 set value = :value where id > :value or id < :value';

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'update mytable1 set value = $1 where id > $1 or id < $1',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('update mytable1 set value = :value where id > :id or id < :id', async () => {
		const sql = 'update mytable1 set value = :value where id > :id or id < :id';

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'update mytable1 set value = $1 where id > $2 or id < $2',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
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

	it('UPDATE mytable1 SET id = IFNULL(:id, id)', async () => {
		const sql = 'UPDATE mytable5 SET id = COALESCE(:id, id)';

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE mytable5 SET id = COALESCE($1, id)',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'id',
					type: 'int4',
					notNull: false
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('UPDATE mytable1 SET id = CASE WHEN :valueSet THEN :value ELSE value END WHERE id = :id', async () => {
		const sql = 'UPDATE mytable5 SET id = CASE WHEN :valueSet THEN :value ELSE year END WHERE id = :id';

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE mytable5 SET id = CASE WHEN $1 THEN $2 ELSE year END WHERE id = $3',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'valueSet',
					type: 'bool',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'value',
					type: 'int4',
					notNull: true //different from mysql and sqlite
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

	it('UPDATE mytable2 SET name = CASE WHEN :nameSet THEN :name ELSE name END WHERE id = :id', async () => {
		const sql = 'UPDATE mytable2 SET name = CASE WHEN :nameSet THEN :name ELSE name END WHERE id = :id';

		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE mytable2 SET name = CASE WHEN $1 THEN $2 ELSE name END WHERE id = $3',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'nameSet',
					type: 'bool',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'name',
					type: 'text',
					notNull: true //different from mysql and sqlite
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

	it('UPDATE mytable1 SET value = $1 RETURNING *', async () => {
		const sql = 'UPDATE mytable1 SET value = :value RETURNING *';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE mytable1 SET value = $1 RETURNING *',
			queryType: 'Update',
			multipleRowsResult: false,
			returning: true,
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
				}
			],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('UPDATE mytable1 SET value = $1 RETURNING id, id+id, value', async () => {
		const sql = 'UPDATE mytable1 SET value = :value RETURNING id, id+id, value';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE mytable1 SET value = $1 RETURNING id, id+id, value',
			queryType: 'Update',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: '?column?',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
			data: [
				{
					name: 'value',
					type: 'int4',
					notNull: false
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('UPDATE all_types SET enum_column = :enum1, enum_column_constraint = :enum2 WHERE int4_column = :id', async () => {
		const sql = 'UPDATE all_types SET enum_column = :enum1, enum_constraint = :enum2 WHERE enum_constraint = :enum3';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE all_types SET enum_column = $1, enum_constraint = $2 WHERE enum_constraint = $3',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'enum1',
					type: `enum('x-small','small','medium','large','x-large')`,
					notNull: false
				},
				{
					name: 'enum2',
					type: `enum('x-small','small','medium','large','x-large')`,
					notNull: false
				}
			],
			parameters: [
				{
					name: 'enum3',
					type: `enum('x-small','small','medium','large','x-large')`,
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('UPDATE schema1.users SET schema1_field1 = $1 WHERE id = $2', async () => {
		const sql = 'UPDATE schema1.users SET schema1_field1 = :schema1_field1 WHERE id = :id';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'UPDATE schema1.users SET schema1_field1 = $1 WHERE id = $2',
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'schema1_field1',
					type: `enum('str1','str2')`,
					notNull: true
				}
			],
			parameters: [
				{
					name: 'id',
					type: `int4`,
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