import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-select-functions', () => {

    it('select sum(value) as total from mytable1', () => {
        const sql = `
        select sum(value) as total from mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
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
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select sum(t1.value) as total from mytable1 t1', () => {
        const sql = `
        select sum(t1.value) as total from mytable1 t1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'total',
                    type: 'INTEGER',
                    notNull: false,
                    table: 't1'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select count(id) from mytable1', () => {
        const sql = `
        select count(id) from mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'count(id)',
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

    it('select count(*) from mytable1', () => {
        const sql = `
        select count(*) from mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'count(*)',
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

    it('select sum(2*value) from  mytable1', () => {
        const sql = `
        select sum(2*value) from  mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'sum(2*value)',
                    type: 'INTEGER',
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

    it('select avg(value) from mytable1', () => {
        const sql = `
        select avg(value) from mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'avg(value)',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable1' //TODO: empty?
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select avg(value + (value + 2)) from mytable1', () => {
        const sql = `
        select avg(value + (value + 2)) from mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'avg(value+(value+2))', //TODO: spaces
                    type: 'REAL',
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

    it('SELECT AVG(value) as avgResult FROM mytable1', () => {
        const sql = `
        SELECT AVG(value) as avgResult FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'avgResult',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable1' //TODO - empty?
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with SUM and with expression from multiple tables', () => {
        const sql = `
        select sum(t2.id + (t1.value + 2)) from mytable1 t1 inner join mytable2 t2 on t1.id = t2.id
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'sum(t2.id+(t1.value+2))', //TODO - spaces
                    type: 'INTEGER',
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

    it('parse a select with MIN function', () => {
        const sql = `
        SELECT MIN(value) FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'MIN(value)',
                    type: 'INTEGER',
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

    //TODO - add for mysql
    it('SELECT MIN(value)/100 as min FROM mytable1', () => {
        const sql = `
        SELECT MIN(value)/100 as min FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'min',
                    type: 'INTEGER',
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

    //TODO - add for mysql
    it('SELECT 100/ifnull(max(value), 10) as value FROM mytable1', () => {
        const sql = `
        SELECT 100/ifnull(max(value), 10) as value FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'value',
                    type: 'INTEGER',
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

    //TODO - add for mysql
    it('SELECT id, 100/ifnull(max(value), 10) as value FROM mytable1', () => {
        const sql = `
        SELECT id, 100/ifnull(max(value), 10) as value FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
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

    it('SELECT MIN(name) FROM mytable2', () => {
        const sql = `
        SELECT MIN(name) FROM mytable2
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'MIN(name)',
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

    it('SELECT round(double_value) FROM mytable3', () => {
        const sql = `
        SELECT 
            round(double_value) AS round1, 
            round(double_value, ?) AS round2, 
            round(double_value, 0) AS round3,
            round(double_value, 1) AS round4 
        FROM mytable3
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'round1',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable3'
                },
                {
                    columnName: 'round2',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable3'
                },
                {
                    columnName: 'round3',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable3'
                },
                {
                    columnName: 'round4',
                    type: 'REAL',
                    notNull: false,
                    table: 'mytable3'
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

    it('SELECT group_concat(name) FROM mytable2', () => {
        const sql = `
        SELECT 
            group_concat(name) AS group1,
            group_concat(name, ?) AS group2
        FROM mytable2
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'group1',
                    type: 'TEXT',
                    notNull: false,
                    table: ''
                },
                {
                    columnName: 'group2',
                    type: 'TEXT',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT COALESCE (VALUE, ID) FROM mytable1', () => {
        const sql = `
        SELECT COALESCE(VALUE, ID) FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'COALESCE(VALUE,ID)',
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

    it(`SELECT strftime('%d/%m/%Y', '2013-05-21')`, () => {
        const sql = `
        SELECT strftime('%d/%m/%Y', '2013-05-21'), date('2013-05-21'), time('2013-05-21')
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: `strftime('%d/%m/%Y','2013-05-21')`,
                    type: 'TEXT',
                    notNull: false, //invalid date
                    table: ''
                },
                {
                    columnName: `date('2013-05-21')`,
                    type: 'DATE',
                    notNull: false, //invalid date
                    table: ''
                },
                {
                    columnName: `time('2013-05-21')`,
                    type: 'DATE',
                    notNull: false, //invalid date
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

    it(`SELECT strftime('%d/%m/%Y', :param1)`, () => {
        const sql = `SELECT strftime('%d/%m/%Y', :param1), date(:param2), time(:param3)`;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: `SELECT strftime('%d/%m/%Y', ?), date(?), time(?)`,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: `strftime('%d/%m/%Y',?)`,
                    type: 'TEXT',
                    notNull: false, //invalid date
                    table: ''
                },
                {
                    columnName: `date(?)`,
                    type: 'DATE',
                    notNull: false, //invalid date
                    table: ''
                },
                {
                    columnName: `time(?)`,
                    type: 'DATE',
                    notNull: false, //invalid date
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'DATE',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'DATE',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'DATE',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    /**
     * The type affinity for DATE is NUMERIC.
     * To insert into a DATE column you must use julianday(?)
     */
    it(`SELECT date(date_column + '+1 day') as result FROM all_types`, () => {
        const sql = `SELECT date(date_column + '+1 day') as result FROM all_types`;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: `result`,
                    type: 'DATE',
                    notNull: false, //invalid date
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

    it(`SELECT IF(1>2,2,3) as result`, () => {
        const sql = `
        SELECT IIF(1>2,2,3) as result
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'INTEGER',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT IF(1>2,'a','b') as result`, () => {
        const sql = `
        SELECT IIF(1>2,'a','b') as result
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'TEXT',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT IF(1>2, NULL,'b') as result`, () => {
        const sql = `
        SELECT IIF(1>2, NULL,'b') as result
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'TEXT',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT IF(1>2,'a',NULL) as result`, () => {
        const sql = `
        SELECT IIF(1>2,'a',NULL) as result
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'TEXT',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT IF(1>2, id, ?) as result FROM mytable1`, async () => {
        const sql = `
        SELECT IIF(1>2, id, ?) as result FROM mytable1
        `
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'result',
                    type: 'INTEGER',
                    notNull: false, //diff from mysql
                    table: 'mytable1' //correct?
                }
            ],
            parameters: [
                {
                    columnType: 'INTEGER',
                    name: 'param1',
                    notNull: false //diff from mysql
                }
            ]

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT LENGTH(concat(name, ?)) FROM mytable2`, () => {
        const sql = `SELECT LENGTH(concat(name, ?)) as result FROM mytable2`;
        const actual = parseSql(sql, sqliteDbSchema);

        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'result',
                    type: 'INTEGER',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: [
                {
                    columnType: 'TEXT',
                    name: 'param1',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});