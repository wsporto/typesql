import assert from "assert";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../src/describe-query";
import { ColumnInfo } from "../src/mysql-query-analyzer/types";

describe('type-mapping', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('select table with all types', async () => {

        const sql = 'select * from all_types';
        const actual = await parseSql(client, sql);

        const expected: ColumnInfo[] = [
            {
                columnName: 'decimal_column',
                type: 'decimal',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'tinyint_column',
                type: 'tinyint',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'smallint_column',
                type: 'smallint',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'int_column',
                type: 'int',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'float_column',
                type: 'float',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'double_column',
                type: 'double',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'timestamp_column',
                type: 'timestamp',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'bigint_column',
                type: 'bigint',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'mediumint_column',
                type: 'mediumint',
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
                columnName: 'time_column',
                type: 'time',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'datetime_column',
                type: 'datetime',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'year_column',
                type: 'year',
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
                columnName: 'bit_column',
                type: 'bit',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'json_column',
                type: 'json',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'enum_column',
                type: `enum('x-small','small','medium','large','x-large')`,
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'set_column',
                type: 'set',
                notNull: false,
                table: 'all_types'
            },
            {
                type: 'tinyblob',
                columnName: 'tinyblob_column',
                notNull: false,
                table: 'all_types'
            },
            {
                type: 'mediumblob',
                columnName: 'mediumblob_column',
                notNull: false,
                table: 'all_types'
            },
            {
                type: 'longblob',
                columnName: 'longblob_column',
                notNull: false,
                table: 'all_types'
            },
            {
                type: 'blob',
                columnName: 'blob_column',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'tinytext_column',
                type: 'tinytext',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'mediumtext_column',
                type: 'mediumtext',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'longtext_column',
                type: 'longtext',
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
                columnName: 'varbinary_column',
                type: 'varbinary',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'binary_column',
                type: 'binary',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'char_column',
                type: 'char',
                notNull: false,
                table: 'all_types'
            },
            {
                columnName: 'geometry_column',
                type: 'geometry',
                notNull: false,
                table: 'all_types'
            }

        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.columns, expected);
    });

    it('compare type names from schema with convertion from code', async () => {

        const sql = 'select * from all_types';
        const actual = await parseSql(client, sql);


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        const actualColumns = actual.right.columns.map(col => {
            const nameAndType = {
                name: col.columnName,
                type: col.type
            }
            return nameAndType;
        });

        const schema = await client.loadDbSchema();
        if (isLeft(schema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const expected = schema.right
            .filter(colInfo => actualColumns.find(col => col.name == colInfo.column))
            .map(col => {
                const nameAndType = {
                    name: col.column,
                    type: col.column_type
                }
                return nameAndType;
            });

        assert.deepStrictEqual(actualColumns, expected);

    });
});