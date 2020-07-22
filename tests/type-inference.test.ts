
import { ParameterDef, DBSchema } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/parser";

import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { inferType } from "../src/type-inference";

describe('Test parse parameters', () => {

    let client: DbClient = new DbClient();
    before(async () =>   {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () =>   {
        await client.closeConnection();
    })

    it.only(`SELECT id FROM mytable2 WHERE ? = CASE WHEN id = 1 THEN id ELSE ? END`, async () => {
        const sql = `
        SELECT id FROM mytable2 WHERE ? = CASE WHEN id = 1 THEN id ELSE ? END`
        const actual = await inferType(client, {} as DBSchema, sql);
        const expectedParameters : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'int',
                notNull: true
            }
        ]

        console.log("actual=", actual);
        
        // if(isLeft(actual)) {
        //     assert.fail(`Shouldn't return an error`);
        // }
        // assert.deepEqual(actual.right.parameters, expectedParameters);
    })

    it(`select id from mytable2 where (name, id) = (select ?, ? from mytable2 where id = ?)`, async () => {
        const sql = `
        SELECT id FROM mytable2 WHERE ? = CASE WHEN id = 1 THEN (select id from mytable1 where id = 1) ELSE ? END`
        const actual = await parseSql(client, sql);
        const expectedParameters : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'int',
                notNull: true
            }
        ]
        
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expectedParameters);
    })
})