import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Parse window functions', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('SELECT ROW_NUMBER() OVER() as num', async () => {
        const sql = `
        SELECT 
            ROW_NUMBER() OVER() as num
        FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'num',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT (ROW_NUMBER() OVER()) as num', async () => {
        const sql = `
        SELECT 
            *,
            (ROW_NUMBER() OVER()) as num
        FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: false
                },
                {
                    name: 'num',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('FIRST_VALUE(id), LAST_VALUE(name), RANK() and DENSE_RANK()', async () => {
        const sql = `
        SELECT 
            FIRST_VALUE(id) OVER() as firstId,
            LAST_VALUE(name) OVER() as lastName,
            RANK() OVER() as rankValue,
            DENSE_RANK() OVER() as denseRankValue
        FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'firstId',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'lastName',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'rankValue',
                    dbtype: 'bigint',
                    notNull: true
                },
                {
                    name: 'denseRankValue',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SUM(value) OVER() AS total', async () => {
        const sql = `
        SELECT
            SUM(value) OVER() AS total
        FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
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
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT AVG(value) OVER() as avgResult FROM mytable1', async () => {
        const sql = `
        SELECT AVG(value) OVER() as avgResult FROM mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
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

    it('LEAD() and LAG()', async () => {
        const sql = `
        SELECT 
            LEAD(id) OVER() as leadValue,
            LAG(name) OVER() as lagValue
        FROM mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'leadValue',
                    dbtype: 'int',
                    notNull: false
                },
                {
                    name: 'lagValue',
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
    })
});