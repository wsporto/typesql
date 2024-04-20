import assert from "assert";
import { parseSql } from "../src/describe-query";
import { SchemaDef, MySqlDialect } from "../src/types";
import { createMysqlClientForTest } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('infer-not-null', () => {

    let client!: MySqlDialect;
    before(async () => {
        client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 'mytable1'
                },
                {
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value+10',
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
                    columnName: "value+?",
                    type: 'double',
                    notNull: true, //changed at v0.0.2
                    table: ''
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
                    columnName: 'value',
                    type: 'int',
                    notNull: true,
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
                    columnName: 'value',
                    type: 'int',
                    notNull: true,
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
                    columnName: 'value',
                    type: 'int',
                    notNull: true,
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
                    columnName: 't1.value + value',
                    type: 'bigint',
                    notNull: true,
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
                    columnName: 'alias',
                    type: 'int',
                    notNull: true,
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
                    columnName: 'value',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value',
                    type: 'int',
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
                    columnName: 'value + value',
                    type: 'bigint',
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
                    columnName: 'value + value',
                    type: 'bigint',
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
                    columnName: 'value + id',
                    type: 'bigint',
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
                    columnName: 'value+id',
                    type: 'bigint',
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
                    columnName: 'id+id',
                    type: 'bigint',
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
                    columnName: 'name',
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
                    columnName: 'name',
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
                    columnName: 'name',
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
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: 'value',
                    type: 'varchar',
                    notNull: true,
                    table: ''
                },
                {
                    columnName: '(select descr from mytable2 where id = 1)',
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
                    columnName: 'name',
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
                    type: 'int',
                    columnName: '(select id from mytable1 where id = 10)',
                    notNull: false,
                    table: ''
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: true,
                    table: 'mytable2'
                },
                {
                    columnName: 'name2',
                    type: 'varchar',
                    notNull: true,
                    table: 'mytable2'
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
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 'mytable2'
                },
                {
                    columnName: '(select id from mytable1 where id = 10)',
                    type: 'int',
                    notNull: false,
                    table: ''
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
                    columnName: 'id + (select id from mytable2 where id = 10 and id is not null)',
                    type: 'bigint',
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
                    columnName: 'name',
                    type: 'varchar',
                    notNull: true,
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
                    columnName: 'name',
                    type: 'int',
                    notNull: true,
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
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
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
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't1'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: true,
                    table: 't1'
                },
                {
                    columnName: 'descr',
                    type: 'varchar',
                    notNull: true,
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
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't1' //TODO - Fix
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'descr',
                    type: 'varchar',
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
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'descr',
                    type: 'varchar',
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

});