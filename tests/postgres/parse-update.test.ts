import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-update', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('update mytable1 set value = ? where id = ?', async () => {
		const sql = 'update mytable1 set value = $1 where id = $2';
		const actual = await describeQuery(postres, sql, ['value', 'id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql: 'update mytable1 set value = $1 where id = $2',
			columns: [],
			data: [
				{
					name: 'value',
					columnType: 'int4',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'id',
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

	it('CASE INSENSITIVE - UPDATE MYTABLE1 SET VALUE = ? WHERE ID = ?', async () => {
		const sql = 'UPDATE MYTABLE1 SET VALUE = $1 WHERE ID = $2';
		const actual = await describeQuery(postres, sql, ['value', 'id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql,
			columns: [],
			data: [
				{
					name: 'value',
					columnType: 'int4',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'id',
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

	it('update mytable3 set name = ? where id = ?', async () => {
		const sql = 'update mytable3 set name = $1 where id = $2';
		const actual = await describeQuery(postres, sql, ['name', 'id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql: 'update mytable3 set name = $1 where id = $2',
			columns: [],
			data: [
				{
					name: 'name',
					columnType: 'text',
					notNull: true
				}
			],
			parameters: [
				{
					name: 'id',
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

	it('UPDATE mytable2 SET name = :name, descr= :descr WHERE id = :id', async () => {
		const sql = `
			UPDATE mytable2 SET name = $1, descr= $2 WHERE id = $3
				`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'param1',
					columnType: 'text',
					notNull: false
				},
				{
					name: 'param2',
					columnType: 'text',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'param3', //different from mysql and sqlite
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

	it(`UPDATE mytable2 t2 SET name = 'a'`, async () => {
		const sql = `
			UPDATE mytable2 t2
			SET name = 'a'
				`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
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
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
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

	it(`UPDATE mytable2 SET name = 'a' WHERE mytable2.id = $1`, async () => {
		const sql = `
			UPDATE mytable2
			SET name = 'a'
			WHERE mytable2.id = $1
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
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
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4[]',
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
		const sql = `
			update mytable1 set value = $1 where id > $2 and id < $3
				`;
		const actual = await describeQuery(postres, sql, ['value', 'min', 'max']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'value',
					columnType: 'int4',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'min',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'max',
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

	it('update mytable1 set value = :value where id > :value or id < :value', async () => {
		const sql = `
			update mytable1 set value = $1 where id > $2 or id < $3
				`;

		const actual = await describeQuery(postres, sql, ['value', 'value', 'value']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'value',
					columnType: 'int4',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'value',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'value',
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

	it('UPDATE mytable1 SET id = IFNULL(:id, id)', async () => {
		const sql = `
			UPDATE mytable5 SET id = COALESCE($1, id)
				`;

		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'id',
					columnType: 'int4',
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
		const sql = `
			UPDATE mytable5 SET id = CASE WHEN $1 THEN $2 ELSE year END WHERE id = $3
				`;

		const actual = await describeQuery(postres, sql, ['valueSet', 'value', 'id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'valueSet',
					columnType: 'bool',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'value',
					columnType: 'int4',
					notNull: true //different from mysql and sqlite
				}
			],
			parameters: [
				{
					name: 'id',
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

	it('UPDATE mytable2 SET name = CASE WHEN :nameSet THEN :name ELSE name END WHERE id = :id', async () => {
		const sql = `
			UPDATE mytable2 SET name = CASE WHEN $1 THEN $2 ELSE name END WHERE id = $3
				`;

		const actual = await describeQuery(postres, sql, ['nameSet', 'name', 'id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'nameSet',
					columnType: 'bool',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'name',
					columnType: 'text',
					notNull: true //different from mysql and sqlite
				}
			],
			parameters: [
				{
					name: 'id',
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

	it('UPDATE mytable1 SET value = $1 RETURNING *', async () => {
		const sql = 'UPDATE mytable1 SET value = $1 RETURNING *';
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			returning: true,
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
			data: [
				{
					name: 'value',
					columnType: 'int4',
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
		const sql = 'UPDATE mytable1 SET value = $1 RETURNING id, id+id, value';
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			returning: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: '?column?',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				}
			],
			data: [
				{
					name: 'value',
					columnType: 'int4',
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
		const sql = 'UPDATE all_types SET enum_column = $1, enum_constraint = $2 WHERE enum_constraint = $3';
		const actual = await describeQuery(postres, sql, ['enum1', 'enum2', 'enum3']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'enum1',
					columnType: `enum('x-small','small','medium','large','x-large')`,
					notNull: false
				},
				{
					name: 'enum2',
					columnType: `enum('x-small','small','medium','large','x-large')`,
					notNull: false
				}
			],
			parameters: [
				{
					name: 'enum3',
					columnType: `enum('x-small','small','medium','large','x-large')`,
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