import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse select with functions', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
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
                    name: 'sum(value)',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'total',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'total',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'count(id)',
                    dbtype: 'bigint',
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
                    name: 'count(*)',
                    dbtype: 'bigint',
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
                    name: 'sum(2*value)',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'avg(value)',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'avg(value + (value + 2))',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'avgResult',
                    dbtype: 'decimal',
                    notNull: false
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
                    name: 'sum(t2.id + (t1.value + 2))',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with MIN function', async () => {
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
                    name: 'MIN(value)',
                    dbtype: 'int',
                    notNull: false
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
                    name: 'MIN(name)',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with STR_TO_DATE function', async () => {
        const sql = `
        SELECT STR_TO_DATE('21/5/2013','%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: `STR_TO_DATE('21/5/2013','%d/%m/%Y')`,
                    dbtype: 'date',
                    notNull: false //invalid date
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
            multipleRowsResult: true,
            columns: [
                {
                    name: `STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y')`,
                    dbtype: 'date',
                    notNull: false
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
            multipleRowsResult: true,
            columns: [
                {
                    name: 'days_stayed',
                    dbtype: 'bigint',
                    notNull: true
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
            multipleRowsResult: true,
            columns: [
                {
                    name: 'days_stayed',
                    dbtype: 'bigint',
                    notNull: false //STR_TO_DATE will return null if pass an invalid date
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

    it(`SELECT IFNULL(NULL, 'yes') as result`, async () => {
        const sql = `
        SELECT IFNULL(NULL, 'yes') as result1, IFNULL(10, 'yes') as result2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true, //TODO - ONLY FUNCTION, SHOULD BE FALSE
            columns: [
                {
                    name: 'result1',
                    dbtype: 'varchar',
                    notNull: true
                },
                {
                    name: 'result2',
                    dbtype: 'varchar',
                    notNull: true
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
                    name: 'result',
                    dbtype: 'int',
                    notNull: true
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
                    name: 'GROUP_CONCAT(name)',
                    dbtype: 'varchar',
                    notNull: false
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
                    name: 'GROUP_CONCAT(id)',
                    dbtype: 'varchar',
                    notNull: true
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
                    name: 'result',
                    dbtype: 'varchar',
                    notNull: false
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
            multipleRowsResult: true,
            columns: [
                {
                    name: 'result',
                    dbtype: 'bigint',
                    notNull: true
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
            multipleRowsResult: true,
            columns: [
                {
                    name: 'result',
                    dbtype: 'varchar',
                    notNull: true
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
            multipleRowsResult: true,
            columns: [
                {
                    name: 'result',
                    dbtype: 'varchar',
                    notNull: false
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
            multipleRowsResult: true,
            columns: [
                {
                    name: 'result',
                    dbtype: 'varchar',
                    notNull: false
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
                    name: 'result',
                    dbtype: 'int',
                    notNull: true
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
                    name: `NULLIF(?, 'a')`,
                    dbtype: 'varchar',
                    notNull: true
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
});