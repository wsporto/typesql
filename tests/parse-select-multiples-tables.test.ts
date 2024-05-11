import assert from "assert";
import { parseSql } from "../src/describe-query";
import { MySqlDialect, SchemaDef, TypeSqlError } from "../src/types";
import { createMysqlClientForTest } from "../src/queryExectutor";
import { isLeft, isRight } from "fp-ts/lib/Either";

describe('Test select with multiples tables', () => {

    let client!: MySqlDialect;
    before(async () => {
        client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
    })

    it('parse a basic with inner join', async () => {

        //mytable1 (id, value); mytable2 (id, name, descr)
        const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'id', //TODO - rename fields
                    type: 'int',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'descr',
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

    it('FROM mytable1 as t1 INNER JOIN mytable2 as t2', async () => {

        const sql = `
        SELECT *
        FROM mytable1 as t1
        INNER JOIN mytable2 as t2 on t2.id = t1.id
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
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'id', //TODO - rename fields
                    type: 'int',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'descr',
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

    it('select t1.* from inner join', async () => {

        const sql = `
        SELECT t1.*
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
                },
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

    it('select t2.* from inner join', async () => {

        const sql = `
        SELECT t2.*
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
                },
                {
                    columnName: 'descr',
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

    it('select t2.*, t1.* from inner join', async () => {

        const sql = `
        SELECT t2.*, t1.*
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
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
                },
                {
                    columnName: 'descr',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'id', //TODO - rename field
                    type: 'int',
                    notNull: true,
                    table: 't1'
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: false,
                    table: 't1'
                },
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse select with param', async () => {

        const sql = `
        SELECT t1.id
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t2.id = ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true, //changed at v0.5.13
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

    it('parse select with param 2', async () => {

        const sql = `
        SELECT t1.id, t2.name, t1.value, t2.descr as description, ? as param1
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t1.id = ? and t2.name = ? and t1.value > ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true, //changed at v0.5.13
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
                    notNull: true, //where t1.name = ?; cannot be null
                    table: 't2'
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: true, //where t1.value = ?; cannot be null
                    table: 't1'
                },
                {
                    columnName: 'description',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'param1',
                    type: 'any',
                    notNull: true,
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'any',
                    notNull: true //changed at v0.0.2
                },
                {
                    name: 'param2',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: true
                },
                {
                    name: 'param4',
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

    it('parse select with param (tablelist)', async () => {

        const sql = `
        SELECT t3.id, t2.name, t1.value, ? as param1
        FROM mytable1 t1, mytable2 t2, mytable3 t3
        WHERE t3.id > ? and t1.value = ? and t2.name = ?
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
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: true, //where t2.name = ?; cannot be null
                    table: 't2'
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: true, //where t1.value = ?; cannot be null
                    table: 't1'
                },
                {
                    columnName: 'param1',
                    notNull: true,
                    type: 'any',
                    table: ''
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'any',
                    notNull: true //changed at v0.0.2
                },
                {
                    name: 'param2',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param4',
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

    it('parse a select with tablelist', async () => {

        const sql = `
        SELECT t1.id, t2.name
        FROM mytable1 t1, mytable2 t2
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

    it('parse a select with tablelist (not ambiguous)', async () => {

        // Column 'name' exists only on mytable2
        const sql = `
        SELECT name FROM mytable1, mytable2
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
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('parse a select with tablelist (ambiguous)', async () => {

        // Column 'id' exists on mytable1 and mytable2
        const sql = `
        SELECT id FROM mytable1, mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: TypeSqlError = {
            name: 'Invalid sql',
            description: `Column \'id\' in field list is ambiguous`
        }

        if (isRight(actual)) {
            assert.fail(`Should return an error`);
        }

        assert.deepStrictEqual(actual.left, expected);
    })

    it('parse a select with tablelist (unreferenced alias)', async () => {

        // Column 'name' exists only on mytable2
        const sql = `
        SELECT name as fullname FROM mytable1 t1, mytable2 t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'fullname',
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

    it('parse a select with tablelist and subquery', async () => {

        // Column 'name' exists only on mytable2
        const sql = `
        SELECT name FROM (select t1.*, t2.name from mytable1 t1, mytable2 t2) t
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

    it('parse a query with extras parenteses', async () => {

        const sql = `
        select name from ((( mytable1, (select * from mytable2) t )))
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

    it('parse a query with duplicated names', async () => {

        const sql = `
        select t1.id, t2.id, t1.value as name, t2.name, t1.id, name as descr
        from mytable1 t1
        inner join mytable2 t2 on t1.id = t2.id
        `
        const actual = await parseSql(client, sql);
        //Add the sufix _2, _3 to the duplicated names
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
                    columnName: 'id', //TODO - rename field
                    type: 'int',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'name',
                    type: 'int',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'name', //TODO - rename field
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'id', //TODO - rename field
                    type: 'int',
                    notNull: true,
                    table: 't1'
                },
                {
                    columnName: 'descr',
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

    it('select * from inner join using', async () => {

        const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 using(id)
        WHERE name is not null and value > 0
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
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: true,
                    table: 't1'
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

    it('select * from inner join using (id) and table alias', async () => {

        const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 using(id)
        WHERE t2.name is not null and t1.value > 0
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
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: true,
                    table: 't1'
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

    it('select * from inner join using (id, name)', async () => {

        const sql = `
        SELECT *
        FROM mytable2 t1
        INNER JOIN mytable2 t2 using (id, name)
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
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false, //TODO - using(id, name) makes the name notNull
                    table: 't1'
                },
                {
                    columnName: 'descr',
                    type: 'varchar',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'descr', //TODO - must rename
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('multipleRowsResult must be true with inner join and t1.id = 1', async () => {

        const sql = `
        SELECT t1.id, t1.name
        FROM mytable2 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        WHERE t1.id = 1
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
                },
                {
                    columnName: 'name',
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

    it('SELECT SUM(ID) as sumById FROM mytable1 t1 GROUP BY id', async () => {

        const sql = `
        SELECT SUM(ID) as sumById
        FROM mytable1 t1
        GROUP BY id
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'sumById',
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

    it('SELECT mytable1.id, mytable2.id is not null as hasOwner', async () => {

        const sql = `
        SELECT
            mytable1.id,
            mytable2.id is not null as hasOwner
        FROM mytable1
        LEFT JOIN mytable2 ON mytable1.id = mytable2.id
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
                    columnName: 'hasOwner',
                    type: 'tinyint',
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
    })

    it('multipleRowsResult=false to LIMIT 1', async () => {

        //mytable1 (id, value); mytable2 (id, name, descr)
        const sql = `
        SELECT *
        FROM mytable1 t1
        INNER JOIN mytable2 t2 on t2.id = t1.id
        LIMIT 1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true,
                    table: 't1'
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: false,
                    table: 't1'
                },
                {
                    columnName: 'id', //TODO - rename fields
                    type: 'int',
                    notNull: true,
                    table: 't2'
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false,
                    table: 't2'
                },
                {
                    columnName: 'descr',
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

});