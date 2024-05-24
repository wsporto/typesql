import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-window-functions', () => {

    it('SELECT ROW_NUMBER() OVER() as num', () => {
        const sql = `
        SELECT
            ROW_NUMBER() OVER() as num
        FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'num',
                    type: 'INTEGER',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT (ROW_NUMBER() OVER()) as num', () => {
        const sql = `
        SELECT
            *,
            (ROW_NUMBER() OVER()) as num
        FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'mytable1'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false,
                    table: 'mytable1'
                },
                {
                    columnName: 'num',
                    type: 'INTEGER',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('FIRST_VALUE(id), LAST_VALUE(name), RANK() and DENSE_RANK()', () => {
        const sql = `
        SELECT
            FIRST_VALUE(id) OVER() as firstId,
            LAST_VALUE(name) OVER() as lastName,
            RANK() OVER() as rankValue,
            DENSE_RANK() OVER() as denseRankValue
        FROM mytable2
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'firstId',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'mytable2'
                },
                {
                    columnName: 'lastName',
                    type: 'TEXT',
                    notNull: false,
                    table: 'mytable2'
                },
                {
                    columnName: 'rankValue',
                    type: 'INTEGER',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'denseRankValue',
                    type: 'INTEGER',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: []
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

});