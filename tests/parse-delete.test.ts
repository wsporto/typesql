import assert from "assert";
import { parseSql } from "../src/describe-query";
import { ParameterDef, SchemaDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('parse delete statements', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('delete from mytable1 where id = ?', async () => {

        const sql = `delete from mytable1 where id = ?`;

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 where id = ?',
            queryType: 'Delete',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'affectedRows',
                    type: 'int',
                    notNull: true
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

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('delete from mytable1 where id = :id', async () => {

        const sql = `delete from mytable1 where id = :id`;

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 where id = ?',
            queryType: 'Delete',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'affectedRows',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('delete from mytable1 where value = 0 or value is null', async () => {

        const sql = `delete from mytable1 where value = 0 or value is null`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 where value = 0 or value is null',
            queryType: 'Delete',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'affectedRows',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: []
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    /**
     *  const parser = new MySQLParser({
            version: '8.0.17',
            mode: SqlMode.AnsiQuotes
        })
        //tableRef ({serverVersion >= 80017}? tableAlias)?
     */

    //in order to use this in mocha, don't use arrow function. 
    it('delete from mytable1 t1 where t1.id = ?', async function () {

        if (!client.isVersion8()) {
            this.skip();
        }

        const sql = 'delete from mytable1 t1 where t1.id = ?';
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 t1 where t1.id = ?',
            queryType: 'Delete',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'affectedRows',
                    type: 'int',
                    notNull: true
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

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

});