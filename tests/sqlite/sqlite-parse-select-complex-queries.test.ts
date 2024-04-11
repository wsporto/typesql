import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-select-complex-queries', () => {

    it('parse a select with UNION', () => {
        const sql = `
        SELECT id FROM mytable1
        UNION
        SELECT id FROM mytable2
        UNION
        SELECT id FROM mytable3
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
                    table: ''
                }
            ],
            parameters: []
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('subselect in column', async () => {
        const sql = `
        SELECT (SELECT name FROM mytable2 where id = t1.id) as fullname
        FROM mytable1 t1
        `
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'FULLNAME',
                    type: 'TEXT',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('subselect in column (with parameter)', async () => {
        const sql = `
        SELECT (SELECT name as namealias FROM mytable2 where id = ?) as fullname
        FROM mytable1 t1
        `
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'FULLNAME',
                    type: 'TEXT',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: [{
                name: 'param1',
                columnType: 'INTEGER',
                notNull: true
            }]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH names AS ( SELECT name FROM mytable2 )', async () => {
        const sql = `
        WITH names AS ( 
            SELECT name FROM mytable2
        )
        SELECT name from names
        `
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 'NAMES'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH names AS (query1), allvalues AS (query2)', async () => {
        const sql = `
        WITH 
            names AS (SELECT id, name FROM mytable2),
            allvalues AS (SELECT id, value FROM mytable1)
        SELECT n.id, name, value
        FROM names n
        INNER JOIN allvalues v ON n.id = v.id
        `
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
                    table: 'N'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 'N'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false,
                    table: 'V'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH names AS (query1) SELECT names.*', async () => {
        const sql = `
        WITH 
            names AS (SELECT id, name FROM mytable2)
        SELECT names.*
        FROM names
        `
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
                    table: 'NAMES'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 'NAMES'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH result AS (query1 UNION query2)', async () => {
        const sql = `
        WITH result AS (
            SELECT id as id FROM mytable1
            UNION
            SELECT id as id FROM mytable2
        )
        SELECT *
        FROM result
        `
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'ID',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'RESULT'
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