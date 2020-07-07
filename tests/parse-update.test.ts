import assert from "assert";
import { parseSql } from "../src/parser";
import { ParameterDef } from "../src/types";
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

    it('update mytable1 set value = ? where id = 1', async () => {

        const sql = `
        update mytable1 set value = ? where id = 1
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'value',
                columnType: 'int',
                notNull: false
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('update mytable1 set value = ? where id = ?', async () => {

        const sql = `
        update mytable1 set value = ? where id = ?
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'value',
                columnType: 'int',
                notNull: false
            }
        ]
        const expectedFilters: ParameterDef[] = [
            {
                name: 'id',
                columnType: 'int',
                //notNull: true
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
        assert.deepEqual(actual.right.filters, expectedFilters);
    })
})