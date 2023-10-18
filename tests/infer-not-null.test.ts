import assert from "assert";
import { parseSql } from "../src/describe-query";
import { SchemaDef, DBSchema, ColumnDef2 } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('infer-not-null', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('select value from mytable1 where value is not null', async () => {

        const sql = `
        select value from mytable1 where value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select * from mytable1 where value is not null', async () => {

        const sql = `
        select * from mytable1 where value is not null
            `;
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

    it('select value+10 from mytable1 where value is not null', async () => {

        const sql = `
        select value+10 from mytable1 where value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value+10',
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

    it('select value+10+? from mytable1 where value is not null', async () => {

        const sql = `
        select value+? from mytable1 where value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: "value+?",
                    dbtype: 'double',
                    notNull: true //changed at v0.0.2
                }
            ],
            parameters: [
                {
                    name: "param1",
                    columnType: 'double',
                    notNull: true //changed at v0.0.2
                }
            ]

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select t1.value from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select t1.value from mytable1 t1 where t1.value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select t1.value from mytable1 t1 where value is not null', async () => {

        const sql = `
        select t1.value from mytable1 t1 where value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select value from mytable1 t1 where t1.value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select t1.value + value from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select t1.value + value from mytable1 t1 where t1.value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 't1.value + value',
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

    it('select value as alias from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select value as alias from mytable1 t1 where t1.value is not null
            `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'alias',
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

    it('select t1.value from mytable1 t1 where id is not null', async () => {

        const sql = `
        select t1.value from mytable1 t1 where id is not null
            `;
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
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select value from mytable1 where value is not null or (id > 0 or value is not null)', async () => {

        const sql = `
            select value from mytable1 where value is not null or (id > 0 or value is not null) 
            `;
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
                }
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select value from mytable1 where value is not null and (id > 0 or value is not null)', async () => {

        const sql = `
    select value from mytable1 where value is not null and (id > 0 or value is not null) 
    `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null)) ', async () => {

        const sql = `
        select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null)) 
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value from mytable1 where id > 0 and id < 10 and value > 1', async () => {

        const sql = `
        select value from mytable1 where id > 0 and id < 10 and value > 1
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value from mytable1 where value is not null and (value > 1 or value is null)', async () => {

        const sql = `
    select value from mytable1 where value is not null and (value > 1 or value is null)
    `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value from mytable1 where value is not null or (value > 1 and value is null)', async () => {

        const sql = `
        select value from mytable1 where value is not null or (value > 1 and value is null)
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value from mytable1 where value > 1 and value is null', async () => {

        const sql = `
        select value from mytable1 where value > 1 and value is null
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
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

    it('select value + value from mytable1 where value > 1', async () => {

        const sql = `
        select value + value from mytable1 where value > 1
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value + value',
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

    it('select value + value from mytable1 where id > 1', async () => {

        const sql = `
        select value + value from mytable1 where id > 1
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value + value',
                    dbtype: 'bigint',
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

    it('select value + id from mytable1 where value > 1', async () => {

        const sql = `
        select value + id from mytable1 where value > 1
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value + id',
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

    it('select value+id from mytable1 where id > 10', async () => {

        const sql = `
        select value+id from mytable1 where id > 10
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value+id',
                    dbtype: 'bigint',
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

    it('select id+id from mytable1 where value > 10', async () => {

        const sql = `
        select id+id from mytable1 where value > 10
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id+id',
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

    it('select sum(value) from mytable1 where value > 10', async () => {

        const sql = `
        select sum(value) from mytable1 where value > 10
        `;
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

    it('select sum(value) from mytable1 where value is not null', async () => {

        const sql = `
        select sum(value) from mytable1 where value is not null
        `;
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

    it('UNION 1', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select id from mytable1
        UNION
        select value from mytable1 where value is not null
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
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

    it('UNION 2', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select id from mytable1
        UNION
        select value from mytable1
        `;
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

    it('UNION 3', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select name from mytable2
        UNION
        select value from mytable1 where value is not null
        `;
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

    it('UNION 4', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select value from mytable1 where value is not null
        UNION
        select value from mytable1
        `;
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

    it('UNION 5 - using select *', async () => {

        const sql = `
        -- id, value, descr
        select *, (select descr from mytable2 where id = 1) from mytable1 where value is not null
        UNION 
        -- id, name, descr
        select * from mytable2 where name is not null
        `;
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
                    dbtype: 'varchar',
                    notNull: true
                },
                {
                    name: '(select descr from mytable2 where id = 1)',
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

    it('UNION 6', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select value + value from mytable1 where value is not null
        UNION
        select value + id from mytable1`;
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

    it('UNION 7', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select value+value as total from mytable1 where value is not null
        UNION
        select value+id from mytable1 where value is not null
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
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

    it('select with alias', async () => {

        const sql = `
        select (select id from mytable1 where id = 10), name, name as name2 from mytable2 where name = 'abc'
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    dbtype: 'int',
                    name: '(select id from mytable1 where id = 10)',
                    notNull: false
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true
                },
                {
                    name: 'name2',
                    dbtype: 'varchar',
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

    it('select with subquery', async () => {

        const sql = `
        select name, (select id from mytable1 where id = 10) from mytable2 where id is not null
        `;
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
                },
                {
                    name: '(select id from mytable1 where id = 10)',
                    dbtype: 'int',
                    notNull: false
                },
            ],
            parameters: []

        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('select value + subquery', async () => {

        const sql = `
        select id + (select id from mytable2 where id = 10 and id is not null) from mytable1 m1 where id is not null
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id + (select id from mytable2 where id = 10 and id is not null)',
                    dbtype: 'bigint',
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

    it('select name from (select name from mytable2 where name is not null) t1', async () => {

        const sql = `
        select name from (select name from mytable2 where name is not null) t1 
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
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

    it('select name from (select id as name from mytable2) t1', async () => {

        const sql = `
        select name from (select id as name from mytable2) t1 
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
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

    it('select name from (select id as name from mytable2) t1', async () => {

        const sql = `
        select id from (select * from mytable2) t1 
        `;
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

    it('select * from (select * from mytable2 where name is not null and descr is not null) t1', async () => {

        const sql = `
        select * from (select * from mytable2 where name is not null and descr is not null) t1 
        `;
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
                    notNull: true
                },
                {
                    name: 'descr',
                    dbtype: 'varchar',
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

    it('select * from (select * from mytable2 where name is not null or descr is not null) t1', async () => {

        const sql = `
        select * from (select * from mytable2 where name is not null or descr is not null) t1 
        `;
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
                    name: 'descr',
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

    it('select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2', async () => {

        const sql = `
        select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2 
        `;
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
                    notNull: true
                },
                {
                    name: 'descr',
                    dbtype: 'varchar',
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

});