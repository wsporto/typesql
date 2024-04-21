import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql, prepareAndParse } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import Database from "better-sqlite3";

describe('sqlite-Test simple select statements', () => {

    it('try to parse a empty query', async () => {

        const db = new Database('./mydb.db');
        const sql = ``;

        const actual = prepareAndParse(db, sql, sqliteDbSchema);
        const expected = 'Invalid sql';

        if (isLeft(actual)) {
            assert.deepStrictEqual(actual.left.name, expected);
        }
        else {
            assert.fail('should return an InvalidSqlError');
        }
    })

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

    it('parse select t.* from mytable t', () => {
        const sql = 'SELECT t.* FROM mytable1 t';

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
                    table: 't'
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false,
                    table: 't'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select mytable1.id from mytable1', () => {
        const sql = 'SELECT mytable1.id, mytable1.value FROM mytable1';

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
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse select with multiples columns', () => {

        const sql = 'SELECT id, name, descr as description FROM mytable2';

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
                    table: 'mytable2'
                },
                {
                    columnName: 'name',
                    type: 'TEXT',
                    notNull: false,
                    table: 'mytable2'
                },
                {
                    columnName: 'description',
                    type: 'TEXT',
                    notNull: false,
                    table: 'mytable2'
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT id FROM mydb.MYTABLE1', () => {

        const sql = 'SELECT id FROM mydb.mytable1';
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
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with a single parameter', () => {
        const sql = 'SELECT * FROM mytable1 WHERE id = ?';

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false, //changed at v0.3.0
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

    it('parse a select with a single parameter (not using *)', async () => {
        const sql = 'SELECT id FROM mytable1 WHERE id = ? and value = 10';

        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false, //changed at v.0.3.0
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

    it('parse a select with multiples parameters', () => {
        const sql = 'SELECT value FROM mytable1 WHERE id = ? or value > ?';

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
                    table: 'mytable1'
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

    it('parse a select with param on column', async () => {
        const sql = 'SELECT ? FROM mytable1';

        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: '?', //TODO - PARAM1
                    type: 'any',
                    notNull: false, //todo - differente from mysql
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'any',
                    notNull: false //todo - differente from mysql
                }
            ]
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT id FROM mytable1 where value between :start and :end', () => {
        const sql = 'SELECT id FROM mytable1 where value between :start and :end';
        const expectedSql = 'SELECT id FROM mytable1 where value between ? and ?'

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

    it('parse a select with param on column', () => {
        const sql = 'SELECT ? as name FROM mytable1';

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'any',
                    notNull: false, //TODO - differente from mysql
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'any',
                    notNull: false //TODO - differente from mysql
                }
            ]
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with multiples params', () => {
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
                    notNull: false, //todo - differente from mysql
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
                    notNull: false //todo - differente from mysql
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

    it('parse a select with multiples parameters', () => {
        const sql = 'SELECT value FROM mytable1 WHERE id = ? or value > ?';

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
                    table: 'mytable1'
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

    it('select value from mytable1 where value is not null', () => {

        const sql = `
        select value from mytable1 where value is not null or (id > 0 and value is not null) 
        `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'value',
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

    it('select value from mytable1 order by ?', () => {
        const sql = `
        select value from mytable1 order by ?
        `;
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
                    table: 'mytable1'
                }
            ],
            orderByColumns: ['id', 'mytable1.id', 'value', 'mytable1.value'],
            parameters: []
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select value as myValue from mytable1 order by ?', () => {
        const sql = `
        select value as myValue from mytable1 order by ?
        `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'myValue',
                    type: 'INTEGER',
                    notNull: false,
                    table: 'mytable1'
                }
            ],
            orderByColumns: ['id', 'mytable1.id', 'value', 'mytable1.value', 'myValue'],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select with order by without parameter', () => {
        const sql = `
        select value from mytable1 order by value
        `;
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
                    table: 'mytable1'
                }
            ],
            //shouldn't include order by columns because there is no parameters on the order by clause
            //orderByColumns: ['id', 'value'],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});