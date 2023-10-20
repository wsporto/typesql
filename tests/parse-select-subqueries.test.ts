import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse select with subqueries', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    //.only
    it('parse a select with nested select', async () => {
        const sql = `
        select id from (
            select id from mytable1
        ) t
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
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


    it('parse a select with nested select2', async () => {
        const sql = `
        select id, name from (
            select t1.id, t2.name from mytable1 t1
            inner join mytable2 t2 on t1.id = t2.id
        ) t
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
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

    it('parse a select with nested select and alias', async () => {
        const sql = `
        select id from (
            select value as id from mytable1
        ) t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
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

    it('parse a select with nested select and alias 2', async () => {
        const sql = `
        select id as code from (
            select value as id from mytable1
        ) t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'code',
                    type: 'int',
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

    it('parse a select with 3-levels nested select', async () => {
        const sql = `
        select id from (
            select id from (
                select id from mytable1 
            ) t1
        ) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't2'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with 3-levels nested select and case expression', async () => {
        const sql = `
        select id from (
            select id from (
                select id+id as id from mytable1 
            ) t1
        ) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'bigint',
                    notNull: true,
                    table: 't2'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })


    it('nested with *)', async () => {
        const sql = `
        SELECT * from (select * from (select id, name from mytable2) t1) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with 3-levels nested select (with alias)', async () => {
        const sql = `
        select id from (
            select matricula as id from (
                select name as matricula from mytable2 
            ) t1
        ) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with 3-levels nested select and union', async () => {
        const sql = `
        select id from (
            select id from (
                select id from (
                    select id from mytable1
                    union
                    select name as id from mytable2
                ) t1
            ) t2
        ) t3
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'varchar',
                    notNull: false,
                    table: 't3'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with 3-levels nested select and union int return', async () => {
        const sql = `
        select id from (
            select id from (
                select id from (
                    select id from mytable1
                    union
                    select id from mytable2
                ) t1
            ) t2
        ) t3
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't3'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select name from mytable1, (select count(*) as name from mytable2) t2', async () => {
        const sql = `
        select name from mytable1, (select count(*) as name from mytable2) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'bigint',
                    notNull: true,
                    table: 't2'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select name from mytable2 where exists ( select id from mytable1 where value = ?)', async () => {
        const sql = `
        select name from mytable2 where exists ( select id from mytable1 where value = ?)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 'mytable2'

                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('SELECT * from (SELECT * FROM mytable1) as t1 WHERE t1.id > ?', async () => {
        const sql = `
        SELECT id from (SELECT * FROM mytable1) as t1 WHERE t1.id > ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't1'

                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
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