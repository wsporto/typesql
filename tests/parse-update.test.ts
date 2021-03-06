import assert from "assert";
import { parseSql } from "../src/describe-query";
import { SchemaDef, ColumnDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('parse update statements', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    const columns : ColumnDef[] = [
        {
            name: 'affectedRows',
            dbtype: 'int',
            notNull: true
        },
        {
            name: 'insertId',
            dbtype: 'int',
            notNull: true
        }
    ]

    it('update mytable1 set value = ? where id = ?', async () => {

        const sql = `
        update mytable1 set value = ? where id = ?
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'value',
                    columnType: 'int',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                }
            ]
        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('update mytable1 set value = :value where id > :min and id < :max', async () => {

        const sql = `
        update mytable1 set value = :value where id > :min and id < :max
            `;
        const expectedSql = `
        update mytable1 set value = ? where id > ? and id < ?
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'value',
                    columnType: 'int',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'min',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'max',
                    columnType: 'int',
                    notNull: true
                }
            ]
        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('update mytable1 set value = :value where id > :value or id < :value', async () => {

        const sql = `
        update mytable1 set value = :value where id > :value or id < :value
            `;
        const expectedSql = `
        update mytable1 set value = ? where id > ? or id < ?
            `;

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'value',
                    columnType: 'int',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'value',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'value',
                    columnType: 'int',
                    notNull: true
                }
            ]
        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
})