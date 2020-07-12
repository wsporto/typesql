import assert from "assert";
import { parseSql } from "../src/parser";
import { ColumnDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('type-mapping', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('selec table with all types', async () => {

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
                name: 'tinytext_column',
                dbtype: 'blob', //tinyblob
                notNull: false
            },
            {
                name: 'mediumtext_column',
                dbtype: 'blob', //mediumblob
                notNull: false
            },
            {
                name: 'longtext_column',
                dbtype: 'blob', //TODO - longblob
                notNull: false
            },
            {
                name: 'text_column',
                dbtype: 'blob',
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
                notNull: 
                false
            },
            {
                name: 'geometry_column',
                dbtype: 'geometry',
                notNull: false
            }
            
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.columns, expected);
    });
});