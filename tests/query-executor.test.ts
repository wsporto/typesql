import assert from "assert";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('query-executor tests', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('explain query with datetime parameter', async () => {
        const sql = `
        SELECT * FROM all_types where datetime_column = ?
        `
        const actual = await client.explainSql(sql);

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, true);
    })

});