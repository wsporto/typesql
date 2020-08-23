import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

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
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'sum(value)',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with SUM function and alias', async () => {
        const sql = `
        select sum(value) as total from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'total',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with SUM function and table alias', async () => {
        const sql = `
        select sum(t1.value) as total from mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'total',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with COUNT(id) function', async () => {
        const sql = `
        select count(id) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'count(id)',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with COUNT(*) function', async () => {
        const sql = `
        select count(*) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'count(*)',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    //TODO - VALUE/2 result decimal
    it('parse a select with SUM function', async () => {
        const sql = `
        select sum(2*value) from  mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'sum(2*value)',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with AVG function', async () => {
        const sql = `
        select avg(value) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'avg(value)',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with AVG with expression', async () => {
        const sql = `
        select avg(value + (value + 2)) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'avg(value + (value + 2))',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with SUM and with expression from multiple tables', async () => {
        const sql = `
        select sum(t2.id + (t1.value + 2)) from mytable1 t1 inner join mytable2 t2 on t1.id = t2.id
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'sum(t2.id + (t1.value + 2))',
                    dbtype: 'decimal',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with MIN function', async () => {
        const sql = `
        SELECT MIN(value) FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'MIN(value)',
                    dbtype: 'int',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    //TODO EXPRESSION
    it('parse a select with MIN function', async () => {
        const sql = `
        SELECT MIN(name) FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: 'MIN(name)',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it.skip('parse a select with STR_TO_DATE function', async () => {
        const sql = `
        SELECT STR_TO_DATE('21/5/2013','%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
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
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it.skip('parse a select with STR_TO_DATE and CONCAT_WS function', async () => {
        const sql = `
        SELECT STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
            columns: [
                {
                    name: `STR_TO_DATE(CONCAT_WS('/', '?', '?', '?'),'%d/%m/%Y')`,
                    dbtype: 'date',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar',
                    notNull: false //TODO - verify if is possible any inference
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false //TODO - verify if is possible any inference

                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: false //TODO - verify if is possible any inference
                }
            ]

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it.skip('parse a select with datediff function', async () => {
        const sql = `
        SELECT datediff(STR_TO_DATE(CONCAT_WS('/', ?, ?, ?),'%d/%m/%Y'), STR_TO_DATE('01/01/2020','%d/%m/%Y')) as days_stayed
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            multipleRowsResult: true,
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
                    columnType: 'varchar',
                    notNull: false //TODO - verify if is possible any inference
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false //TODO - verify if is possible any inference
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: false //TODO - verify if is possible any inference
                }
            ]

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })
});