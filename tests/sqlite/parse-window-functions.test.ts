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

    it('SUM(value) OVER() AS total', () => {
        const sql = `
        SELECT
            SUM(value) OVER() AS total
        FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'total',
                    type: 'INTEGER',
                    notNull: false,
                    table: 'mytable1'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SUM(real_column) OVER() AS total', () => { //TODO - only sqlite
        const sql = `
        SELECT
            SUM(real_column) OVER() AS total
        FROM all_types
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'total',
                    type: 'REAL',
                    notNull: false,
                    table: 'all_types'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT AVG(value) OVER() as avgResult FROM mytable1', () => {
        const sql = `
        SELECT AVG(value) OVER() as avgResult FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'avgResult',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable1'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('LEAD() and LAG()', () => {
        const sql = `
        SELECT
            LEAD(id) OVER() as leadValue,
            LAG(name) OVER() as lagValue
        FROM mytable2
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'leadValue',
                    type: 'INTEGER',
                    notNull: false,
                    table: 'mytable2'
                },
                {
                    columnName: 'lagValue',
                    type: 'TEXT',
                    notNull: false,
                    table: 'mytable2'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});