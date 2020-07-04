import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/parser";
import { DbClient } from "../src/queryExectutor";

describe('Test parse select with functions', () => {

    let client: DbClient = new DbClient();
    before(async () =>   {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () =>   {
        await client.closeConnection();
    })
    
    //TODO = column sum?
    it('parse a select with SUM function', async () => {
        const sql = `
        select sum(value) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'sum(value)',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with SUM function and alias', async () => {
        const sql = `
        select sum(value) as total from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'total',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with SUM function and table alias', async () => {
        const sql = `
        select sum(t1.value) as total from mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'total',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with COUNT(id) function', async () => {
        const sql = `
        select count(id) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'count(id)',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []
        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with COUNT(*) function', async () => {
        const sql = `
        select count(*) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'count(*)',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []
        }
        assert.deepEqual(actual, expected);
    })

    //TODO - VALUE/2 result decimal
    it('parse a select with SUM function', async () => {
        const sql = `
        select sum(2*value) from  mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'sum(2*value)',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with AVG function', async () => {
        const sql = `
        select avg(value) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'avg(value)',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with AVG with expression', async () => {
        const sql = `
        select avg(value + (value + 2)) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'avg(value + (value + 2))',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with SUM and with expression from multiple tables', async () => {
        const sql = `
        select sum(t2.id + (t1.value + 2)) from mytable1 t1 inner join mytable2 t2 on t1.id = t2.id
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'sum(t2.id + (t1.value + 2))',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with MIN function', async () => {
        const sql = `
        SELECT MIN(value) FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'min(value)',
                    dbtype: 'int',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    //TODO EXPRESSION
    it('parse a select with MIN function', async () => {
        const sql = `
        SELECT MIN(name) FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'min(name)',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with STR_TO_DATE function', async () => {
        const sql = `
        SELECT STR_TO_DATE('21/5/2013','%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: `str_to_date('21/5/2013','%d/%m/%y')`,
                    dbtype: 'date',
                    notNull: false //invalid date
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with STR_TO_DATE and CONCAT_WS function', async () => {
        const sql = `
        SELECT STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: `str_to_date(concat_ws('/', '?', '?', '?'),'%d/%m/%y')`,
                    dbtype: 'date',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                },
                {
                    name: 'param2',
                    columnType: 'varchar'

                },
                {
                    name: 'param3',
                    columnType: 'varchar'
                }
            ]

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with datediff function', async () => {
        const sql = `
        SELECT datediff(STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y'), STR_TO_DATE('01/01/2020','%d/%m/%Y')) as days_stayed
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'days_stayed',
                    dbtype: 'bigint',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                },
                {
                    name: 'param2',
                    columnType: 'varchar'
                },
                {
                    name: 'param3',
                    columnType: 'varchar'
                }
            ]

        }
        assert.deepEqual(actual, expected);
    })
});