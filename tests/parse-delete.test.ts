import assert from "assert";
import { parseSql } from "../src/parser";
import { ParameterDef } from "../src/types";
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

        const sql = `
        delete from mytable1 where id = ?
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'id',
                columnType: 'int'
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('delete from mytable1 where value = 0 or value is null', async () => {

        const sql = `
        delete from mytable1 where value = 0 or value is null
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = []

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.filters, expected);
    })

    /**
     *  const parser = new MySQLParser({
            version: '8.0.17',
            mode: SqlMode.AnsiQuotes
        })
        //tableRef ({serverVersion >= 80017}? tableAlias)?
     */
    it.skip('delete from mytable1 t1 where t1.value = ?', async () => {

        const sql = `
        delete from mytable1 t1 where t1.id = 10
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'id',
                columnType: 'int'
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.filters, expected);
    })

});