import assert from 'node:assert';
import type { ParameterDef, SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

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
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable1 (value) values ($1)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
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
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (name, double_value) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'float4',
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
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (double_value, name) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'float4',
					notNull: false
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

	it('insert into mytable3 (name, double_value) values (:fullname, :value)', async () => {
		const sql = 'insert into mytable3 (name, double_value) values ($1, $2)';
		const actual = await describeQuery(postres, sql, ['fullname', 'value']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable3 (name, double_value) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'fullname',
					columnType: 'text',
					notNull: true
				},
				{
					name: 'value',
					columnType: 'float4',
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
		const sql = 'insert into mytable2 (name, descr) values ($1, $2)';
		const actual = await describeQuery(postres, sql, ['name', 'name']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Insert',
			sql: 'insert into mytable2 (name, descr) values ($1, $2)',
			columns: [],
			parameters: [
				{
					name: 'name',
					columnType: 'text',
					notNull: false
				},
				{
					name: 'name',
					columnType: 'text',
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
		const expected: ParameterDef[] = [
			{
				name: 'value',
				columnType: 'int4',
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
		const expected: ParameterDef[] = [
			{
				name: 'value1',
				columnType: 'float4',
				notNull: false
			},
			{
				name: 'value2',
				columnType: 'float4',
				notNull: false
			},
			{
				name: 'name1',
				columnType: 'text',
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
		const expected: ParameterDef[] = [
			{
				name: 'id',
				columnType: 'int4',
				notNull: false
			},
			{
				name: 'id2',
				columnType: 'int4',
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
		const expected: ParameterDef[] = [
			{
				name: 'value1',
				columnType: 'float4',
				notNull: false
			},
			{
				name: 'value2',
				columnType: 'float4',
				notNull: false
			},
			{
				name: 'descr1',
				columnType: 'text',
				notNull: false
			},
			{
				name: 'descr2',
				columnType: 'text',
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
		const expected: SchemaDef = {
			sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
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

	it('insert into all_types (int_column) values (?+coalesce(?, 10))', async () => {
		const sql = 'insert into mytable1 (value) values ($1::int4+coalesce($2, 10))';
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: [],
			parameters: [
				{
					name: 'param1',
					columnType: 'int4',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'int4',
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