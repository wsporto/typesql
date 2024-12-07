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
					columnName: 'column_bool',
					type: 'bool',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_bytea',
					type: 'bytea',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_char',
					type: 'bpchar',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_name',
					type: 'name',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_int8',
					type: 'int8',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_int2',
					type: 'int2',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_int4',
					type: 'int4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_text',
					type: 'text',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_varchar',
					type: 'varchar',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_date',
					type: 'date',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_bit',
					type: 'bit',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_numeric',
					type: 'numeric',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_uuid',
					type: 'uuid',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_float4',
					type: 'float4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'column_float8',
					type: 'float8',
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
});