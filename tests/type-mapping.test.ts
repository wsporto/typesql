import assert from 'node:assert';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../src/describe-query';
import type { ColumnInfo } from '../src/mysql-query-analyzer/types';
import { createMysqlClientForTest, loadMysqlSchema } from '../src/queryExectutor';
import type { MySqlDialect } from '../src/types';

describe('type-mapping', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
	});

	it('select table with all types', async () => {
		const sql = 'select * from all_types';
		const actual = await parseSql(client, sql);

		const expected: ColumnInfo[] = [
			{
				name: 'decimal_column',
				type: 'decimal',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'tinyint_column',
				type: 'tinyint',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'smallint_column',
				type: 'smallint',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'int_column',
				type: 'int',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'float_column',
				type: 'float',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'double_column',
				type: 'double',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'timestamp_column',
				type: 'timestamp',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'bigint_column',
				type: 'bigint',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'mediumint_column',
				type: 'mediumint',
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
				name: 'time_column',
				type: 'time',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'datetime_column',
				type: 'datetime',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'year_column',
				type: 'year',
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
				name: 'bit_column',
				type: 'bit',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'json_column',
				type: 'json',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'enum_column',
				type: `enum('x-small','small','medium','large','x-large')`,
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'set_column',
				type: 'set',
				notNull: false,
				table: 'all_types'
			},
			{
				type: 'tinyblob',
				name: 'tinyblob_column',
				notNull: false,
				table: 'all_types'
			},
			{
				type: 'mediumblob',
				name: 'mediumblob_column',
				notNull: false,
				table: 'all_types'
			},
			{
				type: 'longblob',
				name: 'longblob_column',
				notNull: false,
				table: 'all_types'
			},
			{
				type: 'blob',
				name: 'blob_column',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'tinytext_column',
				type: 'tinytext',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'mediumtext_column',
				type: 'mediumtext',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'longtext_column',
				type: 'longtext',
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
				name: 'varbinary_column',
				type: 'varbinary',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'binary_column',
				type: 'binary',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'char_column',
				type: 'char',
				notNull: false,
				table: 'all_types'
			},
			{
				name: 'geometry_column',
				type: 'geometry',
				notNull: false,
				table: 'all_types'
			}
		];

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right.columns, expected);
	});

	it('compare type names from schema with convertion from code', async () => {
		const sql = 'select * from all_types';
		const actual = await parseSql(client, sql);

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}

		const actualColumns = actual.right.columns.map((col) => {
			const nameAndType = {
				name: col.name,
				type: col.type
			};
			return nameAndType;
		});

		const schema = await loadMysqlSchema(client.client, client.schema);
		if (schema.isErr()) {
			assert.fail(`Shouldn't return an error`);
		}
		const expected = schema.value
			.filter((colInfo) => actualColumns.find((col) => col.name === colInfo.column))
			.map((col) => {
				const nameAndType = {
					name: col.column,
					type: col.column_type
				};
				return nameAndType;
			});

		assert.deepStrictEqual(actualColumns, expected);
	});
});
