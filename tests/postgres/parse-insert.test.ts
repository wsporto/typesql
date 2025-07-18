import assert from 'node:assert';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresParameterDef, PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';

describe('postgres-parse-insert', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('insert into mytable1 (value) values (?)', async () => {
		const sql = 'insert into mytable1 (value) values ($1)';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable1 (value) values ($1)',
			columns: [],
			parameters: [
				{
					name: 'param1',
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

	it('CASE INSENSITIVE - INSERT INTO MYTABLE1 (VALUE) VALUES(?)', async () => {
		const sql = 'INSERT INTO MYTABLE1 (VALUE) VALUES($1)';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql,
			columns: [],
			parameters: [
				{
					name: 'param1',
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

	it('insert into mytable3 (name, double_value) values (?, ?)', async () => {
		const sql = 'insert into mytable3 (name, double_value) values ($1, $2)';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (name, double_value) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'text',
					notNull: true
				},
				{
					name: 'param2',
					type: 'float4',
					notNull: false
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert into mytable3 (double_value, name) values (?, ?)', async () => {
		const sql = 'insert into mytable3 (double_value, name) values ($1, $2)';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (double_value, name) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'float4',
					notNull: false
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

	it('insert into mytable3 (name, double_value) values (:fullname, :value)', async () => {
		const sql = 'insert into mytable3 (name, double_value) values ($1, $2)';
		const actual = await describeQuery(postres, sql, ['fullname', 'value']);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (name, double_value) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'fullname',
					type: 'text',
					notNull: true
				},
				{
					name: 'value',
					type: 'float4',
					notNull: false
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert same parameter into two fields', async () => {
		const sql = 'insert into mytable2 (name, descr) values ($1, $1)';
		const actual = await describeQuery(postres, sql, ['name', 'name']);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable2 (name, descr) values ($1, $1)',
			columns: [],
			parameters: [
				{
					name: 'name',
					type: 'text',
					notNull: false
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert into mytable1 (value) values (coalesce($1, 100))', async () => {
		const sql = `
        insert into mytable1 (value) values (coalesce($1, 100))
            `;
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: PostgresParameterDef[] = [
			{
				name: 'value',
				type: 'int4',
				notNull: false
			}
		];

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.parameters, expected);
	});

	it('insert into mytable3 (double_value, name) values (coalesce($1, $2::float4), $3)', async () => {
		//name is not null
		const sql = `
        insert into mytable3 (double_value, name) values (coalesce($1, $2::float4), $3)
            `;
		const actual = await describeQuery(postres, sql, ['value1', 'value2', 'name1']);
		const expected: PostgresParameterDef[] = [
			{
				name: 'value1',
				type: 'float4',
				notNull: false
			},
			{
				name: 'value2',
				type: 'float4',
				notNull: false
			},
			{
				name: 'name1',
				type: 'text',
				notNull: true
			}
		];
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.parameters, expected);
	});

	it('insert into mytable1 (value) values (coalesce($1, $2, 10))', async () => {
		const sql = `
        insert into mytable1 (value) values (coalesce($1, $2, 10))
            `;
		const actual = await describeQuery(postres, sql, ['id', 'id2']);
		const expected: PostgresParameterDef[] = [
			{
				name: 'id',
				type: 'int4',
				notNull: false
			},
			{
				name: 'id2',
				type: 'int4',
				notNull: false
			}
		];
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.parameters, expected);
	});

	it(`insert into mytable3 (double_value, name) values (coalesce($1, $2::float4), coalesce($3, $4, 'name2'))`, async () => {
		//name is not null
		const sql = `
        insert into mytable3 (double_value, name) values (coalesce($1, $2::float4), coalesce($3, $4, 'name2'))
            `;
		const actual = await describeQuery(postres, sql, ['value1', 'value2', 'descr1', 'descr2']);
		const expected: PostgresParameterDef[] = [
			{
				name: 'value1',
				type: 'float4',
				notNull: false
			},
			{
				name: 'value2',
				type: 'float4',
				notNull: false
			},
			{
				name: 'descr1',
				type: 'text',
				notNull: false
			},
			{
				name: 'descr2',
				type: 'text',
				notNull: false
			}
		];
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.parameters, expected);
	});

	it('insert into all_types (int_column) values (?+?)', async () => {
		const sql = 'insert into mytable1 (value) values ($1::int4+$2)';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
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

	it('insert into all_types (int_column) values (?+coalesce(?, 10))', async () => {
		const sql = 'insert into mytable1 (value) values ($1::int4+coalesce($2, 10))';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
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

	it('INSERT INTO mytable1 (value) RETURNING *', async () => {
		const sql = 'INSERT INTO mytable1 (value) VALUES ($1) RETURNING *';
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Insert',
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

	it('INSERT INTO mytable1 (value) RETURNING id, id+id, value', async () => {
		const sql = 'INSERT INTO mytable1 (value) VALUES ($1) RETURNING id, id+id, value';
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Insert',
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

	it('ON DUPLICATE KEY UPDATE name = ?', async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			VALUES ($1, $2)
			ON CONFLICT(id) DO
			UPDATE SET name = $3`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					type: 'text',
					notNull: false
				},
				{
					name: 'param3',
					type: 'text',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('ON DUPLICATE KEY UPDATE name = excluded.name', async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			VALUES ($1, $2)
			ON CONFLICT(id) DO
			UPDATE SET name = excluded.name`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true //primary key
				},
				{
					name: 'param2',
					type: 'text',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('ON DUPLICATE KEY UPDATE name = concat(?, ?)', async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			VALUES ($1, $2)
			ON CONFLICT(id) DO UPDATE 
			SET name = concat($3::text, $4::text)`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true //primary key
				},
				{
					name: 'param2',
					type: 'text',
					notNull: false
				},
				{
					name: 'param3',
					type: 'text',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'param4',
					type: 'text',
					notNull: true //different from mysql and sqlite
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`ON DUPLICATE KEY UPDATE name = concat(?, 'a', ?)`, async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			VALUES ($1, concat($2::text, '-a'))
			ON CONFLICT (id) DO UPDATE 
				SET name = concat($3::text, 'a', $4::text)`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true //primary key
				},
				{
					name: 'param2',
					type: 'text',
					notNull: true
				},
				{
					name: 'param3',
					type: 'text',
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

	it(`ON DUPLICATE KEY UPDATE name = name = IF(? != '', ?, name)`, async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			VALUES ($1, $2)
			ON CONFLICT(id) DO UPDATE 
			SET name = CASE
				WHEN $3 != '' THEN $4
				ELSE mytable5.name -- mytable5.name: different from mysql and sqlite
			END`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true //primary key
				},
				{
					name: 'param2',
					type: 'text',
					notNull: false
				},
				{
					name: 'param3',
					type: 'text',
					notNull: true //diff from mysql
				},
				{
					name: 'param4',
					type: 'text',
					notNull: true ////diff from mysql and sqlite
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('INSERT INTO mytable2 (id, name) SELECT ?, ?', async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			SELECT $1, $2`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					type: 'text',
					notNull: false
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('INSERT INTO mytable2 (id, name) SELECT id, descr FROM mytable2 WHERE name = ? AND id > ?', async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			SELECT id, descr
			FROM mytable2 WHERE name = $1 AND id > $2`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					type: 'text',
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

	it('INSERT INTO mytable2 (id, name) SELECT id, descr FROM mytable2 WHERE id in (?)', async () => {
		const sql = `
			INSERT INTO mytable5 (id, name)
			SELECT id, descr
			FROM mytable2 WHERE id in ($1)`;
		const expectedSql = `
			INSERT INTO mytable5 (id, name)
			SELECT id, descr
			FROM mytable2 WHERE id in (\${generatePlaceholders('$1', params.param1)})`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql: expectedSql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
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

	it('INSERT INTO mytable2 (id, name) SELECT id, descr FROM mytable2 WHERE id in (?)', async () => {
		const sql = `
			INSERT INTO all_types (integer_column_default)
			VALUES ($1)`;
		const actual = await describeQuery(postres, sql, ['value']);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
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
});