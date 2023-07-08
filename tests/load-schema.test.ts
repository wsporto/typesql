import assert from "assert";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('load-schema', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it.only('filter schema', async () => {

        const actual = await client.loadDbSchema();
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        const schemas = actual.right.map(s => s.schema);
        const uniqueSchemas = [...new Set(schemas)]
        assert.deepStrictEqual(uniqueSchemas, ['mydb']);
    })
})