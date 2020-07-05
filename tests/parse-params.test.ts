import { ParameterDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/parser";

import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse parameters', () => {

    let client: DbClient = new DbClient();
    before(async () =>   {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () =>   {
        await client.closeConnection();
    })

    it('SELECT ? from mytable1', async () => {
        const sql = `
        SELECT ? from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT ? > 1 from mytable1', async () => {
        const sql = `
        SELECT ? > 1 from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'bigint'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT ? > 'a' from mytable1`, async () => {
        const sql = `
        SELECT ? > 'a' from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT (select ? from mytable2) from mytable1', async () => {
        const sql = `
        SELECT (select ? from mytable2) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT (select id from mytable2 where name = ?) from mytable1', async () => {
        const sql = `
        SELECT (select id from mytable2 where name = ?) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where id > ?', async () => {
        const sql = `
        SELECT * from mytable1 where id > ?
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'id',
                columnType: 'int'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where ? > id', async () => {
        const sql = `
        SELECT * from mytable1 where ? > id
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'id',
                columnType: 'int'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * from mytable1 where concat_ws('/', ?) < id`, async () => {
        const sql = `
        SELECT * from mytable1 where concat_ws('/', ?) < id 
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * from mytable1 where id > concat_ws('/', ?)`, async () => {
        const sql = `
        SELECT * from mytable1 where id > concat_ws('/', ?)
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where ? > (select id from mytable2)', async () => {
        const sql = `
        SELECT * from mytable1 where ? > (select id from mytable2)
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where (select id from mytable2) < ?', async () => {
        const sql = `
        SELECT * from mytable1 where (select id from mytable2) < ?
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * from mytable2 where ? is null or id = ?`, async () => {
        const sql = `
        SELECT * from mytable2 where ? is null or id = ?
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'null'
            },
            {
                name: 'id',
                columnType: 'int'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 t WHERE ? in (select id from mytable1 m2 )`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (select id from mytable1 m2 )
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 t WHERE ? in (select name from mytable2 m2 )`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (select name from mytable2 m2 )
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 t WHERE ? in (UNION)`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (
            select id from mytable1
            union
            select name from mytable2
        )
        `
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar'
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 WHERE id in (?)`, async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id in (?)`
        const actual = await parseSql(client, sql);
        const expected : ParameterDef[] = [
            {
                name: 'id',
                columnType: 'int',
                list: true
            }
        ]
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })
});