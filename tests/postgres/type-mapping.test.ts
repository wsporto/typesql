import assert from 'node:assert';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';

describe('postgres-type-mapping', () => {
	const client = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	after(async () => {
		await client.end();
	});

	it('select table with all types', async () => {
		const sql = 'select * from all_types';
		const actual = await describeQuery(client, sql, ['id']);
		const expected: PostgresSchemaDef = {
			multipleRowsResult: true,
			queryType: 'Select',
			sql,
			columns: [
				{
					name: 'bool_column',
					type: 'bool',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'bytea_column',
					type: 'bytea',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'char_column',
					type: 'bpchar',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'name_column',
					type: 'name',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'int8_column',
					type: 'int8',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'int2_column',
					type: 'int2',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'int4_column',
					type: 'int4',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'text_column',
					type: 'text',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'varchar_column',
					type: 'varchar',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'date_column',
					type: 'date',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'bit_column',
					type: 'bit',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'numeric_column',
					type: 'numeric',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'uuid_column',
					type: 'uuid',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'float4_column',
					type: 'float4',
					notNull: false,
					table: 'all_types'
				},
				{
					name: 'float8_column',
					type: 'float8',
					notNull: false,
					table: 'all_types'
				},
				{
					name: "timestamp_column",
					notNull: false,
					table: "all_types",
					type: "timestamp"
				},
				{
					name: "timestamp_not_null_column",
					notNull: true,
					table: "all_types",
					type: "timestamp"
				},
				{
					name: "timestamptz_column",
					notNull: false,
					table: "all_types",
					type: "timestamptz"
				},
				{
					name: "timestamptz_not_null_column",
					notNull: true,
					table: "all_types",
					type: "timestamptz"
				},
				{
					name: 'enum_column',
					notNull: false,
					table: 'all_types',
					type: `enum('x-small','small','medium','large','x-large')`
				},
				{
					name: 'enum_constraint',
					notNull: false,
					table: 'all_types',
					type: `enum('x-small','small','medium','large','x-large')`
				},
				{
					name: 'integer_column_default',
					notNull: false,
					table: 'all_types',
					type: 'int4'
				},
				{
					name: 'enum_column_default',
					notNull: false,
					table: 'all_types',
					type: 'enum(\'x-small\',\'small\',\'medium\',\'large\',\'x-large\')'
				},
				{
					name: 'enum_constraint_default',
					notNull: false,
					table: 'all_types',
					type: 'enum(\'x-small\',\'small\',\'medium\',\'large\',\'x-large\')'
				},
				{
					name: 'positive_number_column',
					type: 'int4',
					notNull: false,
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
});