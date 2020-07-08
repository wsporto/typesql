import assert from "assert";
import { parseSql } from "../src/parser";
import { SchemaDef } from "../src/types";
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

    const columns = [
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
                    name: 'id',
                    columnType: 'int',
                    notNull: true
                }
            ],
            parameterNames: []
        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('update mytable1 set value = ? where id = ?', async () => {

        const sql = `
        update mytable1 set value = :value where id > :min and id < :max 
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
            ],
            parameterNames: ['value', 'min', 'max']
        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('update mytable1 set value = ? where id = ?', async () => {

        const sql = `
        update mytable1 set value = :value where id > :value or id < :value 
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                }
            ],
            parameterNames: ['value', 'value', 'value']
        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })
})