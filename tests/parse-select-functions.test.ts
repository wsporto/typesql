import { MySqlDialect, SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { createMysqlClientForTest } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse select with functions', () => {

    let client!: MySqlDialect;
    before(async () => {
        client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
    })

    //TODO = column sum?
    it('select sum(value) from mytable1', async () => {
        const sql = `
        select sum(value) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'sum(value)',
                    type: 'decimal',
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

    it('select sum(value) as total from mytable1', async () => {
        const sql = `
        select sum(value) as total from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'total',
                    type: 'decimal',
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

    it('select sum(t1.value) as total from mytable1 t1', async () => {
        const sql = `
        select sum(t1.value) as total from mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'total',
                    type: 'decimal',
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

    it('select count(id) from mytable1', async () => {
        const sql = `
        select count(id) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'count(id)',
                    type: 'bigint',
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

    it('select count(*) from mytable1', async () => {
        const sql = `
        select count(*) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'count(*)',
                    type: 'bigint',
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

    //TODO - VALUE/2 result decimal
    it('select sum(2*value) from  mytable1', async () => {
        const sql = `
        select sum(2*value) from  mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'sum(2*value)',
                    type: 'decimal',
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

    it('select avg(value) from mytable1', async () => {
        const sql = `
        select avg(value) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'avg(value)',
                    type: 'decimal',
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

    it('select avg(value + (value + 2)) from mytable1', async () => {
        const sql = `
        select avg(value + (value + 2)) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'avg(value + (value + 2))',
                    type: 'decimal',
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

    it('SELECT AVG(value) as avgResult FROM mytable1', async () => {
        const sql = `
        SELECT AVG(value) as avgResult FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'avgResult',
                    type: 'decimal',
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

    it('parse a select with SUM and with expression from multiple tables', async () => {
        const sql = `
        select sum(t2.id + (t1.value + 2)) from mytable1 t1 inner join mytable2 t2 on t1.id = t2.id
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'sum(t2.id + (t1.value + 2))',
                    type: 'decimal',
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

    it('SELECT MIN(value) FROM mytable1', async () => {
        const sql = `
        SELECT MIN(value) FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'MIN(value)',
                    type: 'int',
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

    //TODO EXPRESSION
    it('SELECT MIN(name) FROM mytable2', async () => {
        const sql = `
        SELECT MIN(name) FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'MIN(name)',
                    type: 'varchar',
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

    it(`SELECT STR_TO_DATE('21/5/2013','%d/%m/%Y')`, async () => {
        const sql = `
        SELECT STR_TO_DATE('21/5/2013','%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: `STR_TO_DATE('21/5/2013','%d/%m/%Y')`,
                    type: 'date',
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

    it('parse select without from clause', async () => {
        const sql = `
        select 10, CONCAT_WS('a', 'b'), 'a' as name
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: '10',
                    type: 'int',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: `CONCAT_WS('a', 'b')`, //If the separator is NULL, the result is NULL.
                    type: 'varchar',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'name',
                    type: 'varchar',
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

    it('parse a select with STR_TO_DATE and CONCAT_WS function', async () => {
        const sql = `
        SELECT STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: `STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y')`,
                    type: 'date',
                    notNull: false,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar',
                    notNull: true //changed at v0.0.2
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: true //changed at v0.0.2

                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: true //changed at v0.0.2
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT datediff(:date1, :date2) as days_stayed', async () => {
        const sql = `SELECT datediff(:date1, :date2) as days_stayed`
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'SELECT datediff(?, ?) as days_stayed',
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'days_stayed',
                    type: 'bigint',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'date1',
                    columnType: 'date',
                    notNull: true
                },
                {
                    name: 'date2',
                    columnType: 'date',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with datediff function', async () => {
        const sql = `
        SELECT datediff(STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y'), STR_TO_DATE('01/01/2020','%d/%m/%Y')) as days_stayed
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'days_stayed',
                    type: 'bigint',
                    notNull: false, //STR_TO_DATE will return null if pass an invalid date
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT PERIOD_ADD(:p1, :p2) as add, PERIOD_DIFF(:p1, :p2) as diff', async () => {
        const sql = `SELECT PERIOD_ADD(:p1, :p2) as add_result, PERIOD_DIFF(:p1, :p2) as diff_result`
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'SELECT PERIOD_ADD(?, ?) as add_result, PERIOD_DIFF(?, ?) as diff_result',
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'add_result',
                    type: 'bigint',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'diff_result',
                    type: 'bigint',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'p1',
                    columnType: 'bigint',
                    notNull: true
                },
                {
                    name: 'p2',
                    columnType: 'bigint',
                    notNull: true
                },
                {
                    name: 'p1',
                    columnType: 'bigint',
                    notNull: true
                },
                {
                    name: 'p2',
                    columnType: 'bigint',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`SELECT IFNULL(NULL, 'yes') as result1, IFNULL('10', 'yes') as result2`, async () => {
        const sql = `
        SELECT IFNULL(NULL, 'yes') as result1, IFNULL('10', 'yes') as result2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result1',
                    type: 'varchar',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'result2',
                    type: 'varchar',
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

    it(`SELECT IFNULL(value, id) as result from mytable1`, async () => {
        const sql = `
        SELECT IFNULL(value, id) as result from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'result',
                    type: 'int',
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

    it(`SELECT GROUP_CONCAT(name) FROM mytable2`, async () => {
        const sql = `
        SELECT GROUP_CONCAT(name) FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'GROUP_CONCAT(name)',
                    type: 'varchar',
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

    it(`SELECT GROUP_CONCAT(id) FROM mytable2`, async () => {
        const sql = `
        SELECT GROUP_CONCAT(id) FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'GROUP_CONCAT(id)',
                    type: 'varchar',
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

    it(`SELECT GROUP_CONCAT(DISTINCT name ORDER BY id DESC SEPARATOR ';') FROM mytable2`, async () => {
        const sql = `
        SELECT GROUP_CONCAT(DISTINCT name ORDER BY id DESC SEPARATOR ';') as result
        FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'varchar',
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

    it(`SELECT IF(1>2,2,3) as result`, async () => {
        const sql = `
        SELECT IF(1>2,2,3) as result
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'int',
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

    it(`SELECT IF(1>2,'a','b') as result`, async () => {
        const sql = `
        SELECT IF(1>2,'a','b') as result
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'varchar',
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

    it(`SELECT IF(1>2, NULL,'b') as result`, async () => {
        const sql = `
        SELECT IF(1>2, NULL,'b') as result
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'varchar',
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

    it(`SELECT IF(1>2,'a',NULL) as result`, async () => {
        const sql = `
        SELECT IF(1>2,'a',NULL) as result
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'varchar',
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
        SELECT IF(1>2, id, ?) as result FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'result',
                    type: 'int',
                    notNull: true,
                    table: 'mytable1' //correct?
                }
            ],
            parameters: [
                {
                    columnType: 'int',
                    name: 'param1',
                    notNull: true
                }
            ]

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT NULLIF(?, 'a') FROM mytable1`, async () => {
        const sql = `
        SELECT NULLIF(?, 'a') FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: `NULLIF(?, 'a')`,
                    type: 'varchar',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: [
                {
                    columnType: 'varchar',
                    name: 'param1',
                    notNull: true
                }
            ]

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT CAST('a' AS CHAR(5)) as result`, async () => {
        const sql = `
        SELECT CAST('a' AS CHAR(5)) as result
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'result',
                    type: 'char',
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

    it(`SELECT md5('a') as md5`, async () => {
        const sql = `
        SELECT md5('a') as md5
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'md5',
                    type: 'char',
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

    it(`SELECT md5(id + ?) as md5 from mytable1`, async () => {
        const sql = `
        SELECT md5(id + ?) as md5 from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'md5',
                    type: 'char',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'double',
                    notNull: true
                }
            ]

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });

    it(`SELECT hex('a') as r1, unhex(hex('a')) as r2, hex(NULL) as r3, unhex(NULL) as r4, unhex(hex(?)) as r5`, async () => {
        const sql = `
        SELECT hex('a') as r1, unhex(hex('a')) as r2, hex(NULL) as r3, unhex(hex(NULL)) as r4, unhex(hex(?)) as r5
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'r1',
                    type: 'char',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'r2',
                    type: 'char',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'r3',
                    type: 'char',
                    notNull: false,
                    table: ''
                },
                {
                    columnName: 'r4',
                    type: 'char',
                    notNull: false,
                    table: ''
                },
                {
                    columnName: 'r5',
                    type: 'char',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar', //could be varchar | number
                    notNull: true
                }
            ]

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    });
});