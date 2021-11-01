import assert from "assert";
import { ColumnDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../src/describe-query";

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

        const expected: ColumnDef[] = [
            {
                name: 'decimal_column',
                dbtype: 'decimal',
                notNull: false
            },
            {
                name: 'tinyint_column',
                dbtype: 'tinyint',
                notNull: false
            },
            {
                name: 'smallint_column',
                dbtype: 'smallint',
                notNull: false
            },
            {
                name: 'int_column',
                dbtype: 'int',
                notNull: false
            },
            {
                name: 'float_column',
                dbtype: 'float',
                notNull: false
            },
            {
                name: 'double_column',
                dbtype: 'double',
                notNull: false
            },
            {
                name: 'timestamp_column',
                dbtype: 'timestamp',
                notNull: false
            },
            {
                name: 'bigint_column',
                dbtype: 'bigint',
                notNull: false
            },
            {
                name: 'mediumint_column',
                dbtype: 'mediumint',
                notNull: false
            },
            {
                name: 'date_column',
                dbtype: 'date',
                notNull: false
            },
            {
                name: 'time_column',
                dbtype: 'time',
                notNull: false
            },
            {
                name: 'datetime_column',
                dbtype: 'datetime',
                notNull: false
            },
            {
                name: 'year_column',
                dbtype: 'year',
                notNull: false
            },
            {
                name: 'varchar_column',
                dbtype: 'varchar',
                notNull: false
            },
            {
                name: 'bit_column',
                dbtype: 'bit',
                notNull: false
            },
            {
                name: 'json_column',
                dbtype: 'json',
                notNull: false
            },
            {
                name: 'enum_column',
                dbtype: 'enum',
                notNull: false
            },
            {
                name: 'set_column',
                dbtype: 'set',
                notNull: false
            },
            {
                dbtype: 'tinyblob',
                name: 'tinyblob_column',
                notNull: false
            },
            {
                dbtype: 'mediumblob',
                name: 'mediumblob_column',
                notNull: false
            },
            {
                dbtype: 'longblob',
                name: 'longblob_column',
                notNull: false
            },
            {
                dbtype: 'blob',
                name: 'blob_column',
                notNull: false
            },
            {
                name: 'tinytext_column',
                dbtype: 'tinytext',
                notNull: false
            },
            {
                name: 'mediumtext_column',
                dbtype: 'mediumtext',
                notNull: false
            },
            {
                name: 'longtext_column',
                dbtype: 'longtext',
                notNull: false
            },
            {
                name: 'text_column',
                dbtype: 'text',
                notNull: false
            },
            {
                name: 'varbinary_column',
                dbtype: 'varbinary',
                notNull: false
            },
            {
                name: 'binary_column',
                dbtype: 'binary',
                notNull: false
            },
            {
                name: 'char_column',
                dbtype: 'char',
                notNull: false
            },
            {
                name: 'geometry_column',
                dbtype: 'geometry',
                notNull: false
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
                name: col.name,
                type: col.dbtype
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