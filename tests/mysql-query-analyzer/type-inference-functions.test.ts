import assert from "assert";
import { parseAndInfer } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { TypeInferenceResult } from "../../src/mysql-query-analyzer/types";

describe('type-inference - functions', () => {

    it(`SELECT id FROM mytable1`, () => {
        const sql = `SELECT NOW(), CURDATE(), CURTIME()`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['datetime', 'date', 'time'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })
})