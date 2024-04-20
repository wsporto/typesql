import assert from "assert";
import { isLeft } from "fp-ts/lib/Either";
import { explainSql } from "../src/sqlite-query-analyzer/query-executor";
import Database from "better-sqlite3";

describe('query-executor tests', () => {

    it('explain query with datetime parameter', async () => {
        const sql = `
        SELECT * FROM all_types where datetime_column = ?
        `
        const db = new Database('./mydb.db');
        const actual = await explainSql(db, sql);

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, true);
    })

});