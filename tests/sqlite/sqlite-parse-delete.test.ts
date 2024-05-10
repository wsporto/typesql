import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-delete', () => {

    it('delete from mytable1 where id = ?', () => {

        const sql = `delete from mytable1 where id = ?`;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 where id = ?',
            queryType: 'Delete',
            multipleRowsResult: false,
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
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('delete from mytable1 where id = :id', () => {

        const sql = `delete from mytable1 where id = :id`;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 where id = ?',
            queryType: 'Delete',
            multipleRowsResult: false,
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
                    name: 'id',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('delete from mytable1 where value = 0 or value is null', () => {

        const sql = `delete from mytable1 where value = 0 or value is null`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'delete from mytable1 where value = 0 or value is null',
            queryType: 'Delete',
            multipleRowsResult: false,
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
            parameters: []
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});