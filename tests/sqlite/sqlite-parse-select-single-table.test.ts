import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('Test simple select statements', () => {

    it('parse a basic select', async () => {
        const sql = `SELECT id FROM mytable1`;

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

    it('SELECT id as name FROM mytable1', async () => {
        const sql = 'SELECT id as name FROM mytable1';
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'INTEGER',
                    notNull: true,
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

    it('parse select * from mytable', async () => {
        const sql = 'SELECT * FROM mytable1';

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
                    table: 'mytable1'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
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

    it('SELECT mytable1.* FROM mytable1', async () => {
        const sql = 'SELECT mytable1.* FROM mytable1';

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
                    table: 'mytable1'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
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

    it('parse a select with in operator', async () => {

        const sql = `
        SELECT * FROM mytable1 WHERE id in (1, 2, 3)
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
                    table: 'mytable1'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
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

    it('parse select with CASE WHEN', async () => {

        const sql = `
        SELECT 
            CASE 
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
            END as id
        FROM mytable1
        `;
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'TEXT',
                    notNull: false, //not null can't be inferred
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

    it('SELECT id FROM mytable1 where value between :start and :end', async () => {
        const sql = 'SELECT id FROM mytable1 where value between :start and :end';
        const expectedSql = 'SELECT id FROM mytable1 where value between ? and ?'

        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'mytable1'
                }
            ],
            parameters: [
                {
                    name: 'start',
                    columnType: 'INTEGER',
                    notNull: true
                },
                {
                    name: 'end',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT id FROM mytable1 where value between :start and :end', () => { //todo - new
        const sql = 'SELECT id FROM mytable1 where id = 0 and value between :start and :end';
        const expectedSql = 'SELECT id FROM mytable1 where id = 0 and value between ? and ?'

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
                    table: 'mytable1'
                }
            ],
            parameters: [
                {
                    name: 'start',
                    columnType: 'INTEGER',
                    notNull: true
                },
                {
                    name: 'end',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with multiples params', async () => {
        const sql = `
        SELECT ? as name, id, descr as description
        FROM mytable2 
        WHERE (name = ? or descr = ?) and id > ?
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'any',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true,
                    table: 'mytable2'
                },
                {
                    columnName: 'description',
                    type: 'TEXT',
                    notNull: false,
                    table: 'mytable2'
                }

            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'any',
                    notNull: true //changed at v0.0.2
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'param4',
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
