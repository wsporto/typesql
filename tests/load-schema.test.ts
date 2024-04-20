import assert from "assert";
import { createMysqlClientForTest, loadMysqlSchema } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { MySqlDialect } from "../src/types";

describe('load-schema', () => {

    let client!: MySqlDialect;
    before(async () => {
        client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
    })

    it('filter schema', async () => {

        const actual = await loadMysqlSchema(client.client, client.schema);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        const schemas = actual.right.map(s => s.schema);
        const uniqueSchemas = [...new Set(schemas)]
        assert.deepStrictEqual(uniqueSchemas, ['mydb']);
    })
})