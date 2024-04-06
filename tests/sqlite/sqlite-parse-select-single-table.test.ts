import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('Test simple select statements', () => {

    it('parse a basic select', async () => {
        const sql = `SELECT id FROM MYTABLE1`;

        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'MYTABLE1'
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});