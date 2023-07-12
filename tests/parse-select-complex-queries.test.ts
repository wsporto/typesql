import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse complex queries', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('parse SELECT t1.name, t2.mycolumn2, t3.mycolumn3, count', async () => {
        //mytable1 (id, value); mytable2 (id, name, descr); mytable3 (id)
        const sql = `
        SELECT t1.value, t2.name, t3.id, count(*) AS quantity 
        FROM mytable1 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id 
        LEFT JOIN mytable3 t3 ON t3.id = t2.id
        GROUP BY t1.value, t2.name, t3.id
        HAVING count(*) > 1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: false
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: false
                },
                {
                    name: 'quantity',
                    notNull: true,
                    dbtype: 'bigint'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    //https://www.mysqltutorial.org/mysql-subquery/

    it('parse a select with UNION', async () => {
        const sql = `
        SELECT id FROM mytable1
        UNION
        SELECT id FROM mytable2
        UNION
        SELECT id FROM mytable3
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
                }
            ],
            parameters: []
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with UNION', async () => {
        const sql = `
        SELECT id, value FROM mytable1
        UNION
        SELECT id, name as value FROM mytable2
        `
        const actual = await parseSql(client, sql);
        //value is int; name is varchar; result: varchar;
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

    it('parse a select with UNION with multiples fields', async () => {
        const sql = `
        SELECT id, value FROM mytable1
        UNION
        SELECT id, descr as value FROM mytable2
        UNION
        SELECT id, id as value FROM mytable3
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
                    notNull: true,
                },
                {
                    name: 'value',
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

    it('subselect in column', async () => {
        const sql = `
        SELECT (SELECT name FROM mytable2 where id = t1.id) as fullname
        FROM mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'fullname',
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

    it('subselect in column (with parameter)', async () => {
        const sql = `
        SELECT (SELECT name as namealias FROM mytable2 where id = ?) as fullname
        FROM mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'fullname',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: [{
                name: 'param1',
                columnType: 'int',
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
        // const sql = `SELECT name from mytable2`
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
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

    it('WITH names AS (query1), allvalues AS (query2)', async () => {
        const sql = `
        WITH 
            names AS (SELECT id, name FROM mytable2),
            allvalues AS (SELECT id, value FROM mytable1)
        SELECT n.id, name, value
        FROM names n
        INNER JOIN allvalues v ON n.id = v.id
        `
        // const sql = `SELECT name from mytable2`
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
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'value',
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

    it('WITH names AS (query1) SELECT names.*', async () => {
        const sql = `
        WITH 
            names AS (SELECT id, name FROM mytable2)
        SELECT names.*
        FROM names
        `
        // const sql = `SELECT name from mytable2`
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
                    name: 'name',
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
});