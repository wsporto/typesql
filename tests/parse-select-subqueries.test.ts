import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/parser";
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

    it('parse a select with nested select', async () => {
        const sql = `
        select id from (
            select id from mytable1
        ) t
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
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


    it('parse a select with nested select2', async () => {
        const sql = `
        select id, name from (
            select t1.id, t2.name from mytable1 t1
            inner join mytable2 t2 on t1.id = t2.id
        ) t
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with nested select and alias', async () => {
        const sql = `
        select id from (
            select value as id from mytable1
        ) t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'id',
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

    it('parse a select with nested select and alias 2', async () => {
        const sql = `
        select id as code from (
            select value as id from mytable1
        ) t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'code',
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
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
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

    it('nested with *)', async () => {
        const sql = `
        SELECT * from (select * from (select id, name from mytable2) t1) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
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
            columns: [
                {
                    name: 'id',
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
            columns: [
                {
                    name: 'id',
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

    it('select name from mytable1, (select count(*) as name from mytable2) t2', async () => {
        const sql = `
        select name from mytable1, (select count(*) as name from mytable2) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'name',
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

    it('select name from mytable2 where exists ( select id from mytable1 where value = ?)', async () => {
        const sql = `
        select name from mytable2 where exists ( select id from mytable1 where value = ?)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false

                }
            ],
            parameters: [
                {
                    name: 'value',
                    columnType: 'int'
                }
            ]

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })
});