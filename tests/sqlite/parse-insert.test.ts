import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-insert', () => {

    it('insert into mytable1 (value) values (?)', () => {

        const sql = `insert into mytable1 (value) values (?)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            multipleRowsResult: false,
            queryType: 'Insert',
            sql: 'insert into mytable1 (value) values (?)',
            columns: [
                {
                    columnName: 'changes',
                    type: 'INTEGER',
                    notNull: true
                },
                {
                    columnName: 'lastInsertRowid',
                    type: 'INTEGER',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});