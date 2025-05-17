import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-type-mapping', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('select table with all types', async () => {
		const sql = 'select * from all_types';
		const actual = await describeQuery(postres, sql, ['id']);
		const expected: SchemaDef = {
			multipleRowsResult: true,
			queryType: 'Select',
			sql,
			columns: [
				{
					columnName: 'bool_column',
					type: 'bool',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'bytea_column',
					type: 'bytea',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'char_column',
					type: 'bpchar',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'name_column',
					type: 'name',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'int8_column',
					type: 'int8',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'int2_column',
					type: 'int2',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'int4_column',
					type: 'int4',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'text_column',
					type: 'text',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'varchar_column',
					type: 'varchar',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'date_column',
					type: 'date',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'bit_column',
					type: 'bit',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'numeric_column',
					type: 'numeric',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'uuid_column',
					type: 'uuid',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'float4_column',
					type: 'float4',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: 'float8_column',
					type: 'float8',
					notNull: false,
					table: 'all_types'
				},
				{
					columnName: "timestamp_column",
					notNull: false,
					table: "all_types",
					type: "timestamp"
				},
				{
					columnName: "timestamp_not_null_column",
					notNull: true,
					table: "all_types",
					type: "timestamp"
				},
				{
					columnName: "timestamptz_column",
					notNull: false,
					table: "all_types",
					type: "timestamptz"
				},
				{
					columnName: "timestamptz_not_null_column",
					notNull: true,
					table: "all_types",
					type: "timestamptz"
				},
				{
					columnName: 'enum_column',
					notNull: false,
					table: 'all_types',
					type: `enum('x-small','small','medium','large','x-large')`
				},
				{
					columnName: 'enum_constraint',
					notNull: false,
					table: 'all_types',
					type: `enum('x-small','small','medium','large','x-large')`
				},
				{
					columnName: 'integer_column_default',
					notNull: false,
					table: 'all_types',
					type: 'int4'
				},
				{
					columnName: 'enum_column_default',
					notNull: false,
					table: 'all_types',
					type: 'enum(\'x-small\',\'small\',\'medium\',\'large\',\'x-large\')'
				},
				{
					columnName: 'enum_constraint_default',
					notNull: false,
					table: 'all_types',
					type: 'enum(\'x-small\',\'small\',\'medium\',\'large\',\'x-large\')'
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