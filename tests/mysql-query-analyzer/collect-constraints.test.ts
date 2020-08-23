
import assert from "assert";
import { parseAndInfer } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { MySqlType } from "../../src/mysql-mapping";

describe('Test collect constraints', () => {

    it.skip(`SELECT ? FROM mytable1`, () => {
        const sql = `SELECT id FROM mytable2 WHERE (?, ?) = (SELECT name, id FROM mytable2 WHERE id = ?)`;
        const actual = parseAndInfer(sql, dbSchema);
        console.log("actual-", actual);

        const expected : MySqlType[] = ['varchar', 'int', 'int'];

        assert.deepEqual(actual, expected);
    })
});