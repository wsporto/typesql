import assert from "assert";
import { parseSql } from "../src/parser";
import { ParameterDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('parse insert statements', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('insert into mytable1 (value) values (?)', async () => {

        const sql = `
        insert into mytable1 (value) values (?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'value',
                columnType: 'int',
                notNull: false
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('insert into mydb.mytable1 (value) values (?)', async () => {

        const sql = `
        insert into mydb.mytable1 (value) values (?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'value',
                columnType: 'int',
                notNull: false
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('insert into mytable1 (value, descr) values (?, ?)', async () => {

        const sql = `
        insert into mytable3 (name, double_value) values (?, ?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar',
                notNull: true
            },
            {
                name: 'double_value',
                columnType: 'double',
                notNull: false
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (double_value, name) values (?, ?)', async () => {

        const sql = `
        insert into mytable3 (double_value, name) values (?, ?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'double_value',
                columnType: 'double',
                notNull: false
            },
            {
                name: 'name',
                columnType: 'varchar',
                notNull: true
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (name, double_value) values (:fullname, :value)', async () => {

        const sql = `
        insert into mytable3 (name, double_value) values (:fullname, :value)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'fullname',
                columnType: 'varchar',
                notNull: true
            },
            {
                name: 'value',
                columnType: 'double',
                notNull: false
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })

    it('insert same parameter into two fields', async () => {

        const sql = `
        insert into mytable2 (name, descr) values (:name, :name)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar',
                notNull: false
            }
        ]

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right.parameters, expected);
    })
});