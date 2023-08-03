import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Parse window functions', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('SELECT ROW_NUMBER() OVER() as num', async () => {
        const sql = `
        SELECT 
            ROW_NUMBER() OVER() as num
        FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'num',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('FIRST_VALUE(value) OVER() as num', async () => {
        const sql = `
        SELECT 
            FIRST_VALUE(value) OVER() as num
        FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'num',
                    dbtype: 'int',
                    notNull: false
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});