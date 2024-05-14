import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-select-complex-queries', () => {

    it('parse SELECT t1.name, t2.mycolumn2, t3.mycolumn3, count', () => {
        //mytable1 (id, value); mytable2 (id, name, descr); mytable3 (id)
        const sql = `
        SELECT t1.value, t2.name, t3.id, count(*) AS quantity
        FROM mytable1 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        LEFT JOIN mytable3 t3 ON t3.id = t2.id
        GROUP BY t1.value, t2.name, t3.id
        HAVING count(*) > 1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: false,
                    table: 't3'
                },
                {
                    columnName: 'quantity',
                    notNull: true,
                    type: 'INTEGER',
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

    it('HAVING value > ?', () => {
        const sql = `
        SELECT
            name,
            SUM(double_value) as value
        FROM mytable3
        GROUP BY
            name
        HAVING
            value > ?
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: true,
                    table: 'mytable3'
                },
                {
                    columnName: 'value',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable3'
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'REAL',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

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

    it('subselect in column', () => {
        const sql = `
        SELECT (SELECT name FROM mytable2 where id = t1.id) as fullname
        FROM mytable1 t1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'fullname',
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

    it('subselect in column (with parameter)', () => {
        const sql = `
        SELECT (SELECT name as namealias FROM mytable2 where id = ?) as fullname
        FROM mytable1 t1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'fullname',
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
                    table: 'names'
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
                    table: 'n'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 'n'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false,
                    table: 'v'
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
                    table: 'names'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 'names'
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
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'result'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH (query with inner join and parameters)', () => {
        const sql = `
        WITH t1 AS
        (
            SELECT mytable1.*, mytable2.name
            FROM mytable1
            INNER JOIN mytable2 ON mytable1.id = mytable2.id
            WHERE mytable1.value > ? and mytable2.name  = ?
        )
        SELECT t1.*
        FROM t1
        ORDER BY t1.value DESC
        LIMIT 10
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
                    table: 't1'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: true,
                    table: 't1'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: true,
                    table: 't1'
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select id, :value from (select id from mytable1 t where t.value = :value) t', () => {
        const sql = `select id, :value as value from (
            select id from mytable1 t where t.value = :value
        ) t`;
        const expectedSql = `select id, ? as value from (
            select id from mytable1 t where t.value = ?
        ) t`;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true,
                    table: 't'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false, //diff from mysql; TODO - could infer as notNull=true
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: false //diff from mysql
                },
                {
                    name: 'value',
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
});