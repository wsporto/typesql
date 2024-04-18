import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import { ColumnInfo } from "../../src/mysql-query-analyzer/types";

describe('sqlite-parse-update', () => {

    const columns: ColumnInfo[] = [
        {
            columnName: 'changes',
            type: 'INTEGER',
            notNull: true
        }
    ]

    it('update mytable1 set value = ? where id = ?', async () => {

        const sql = `
        update mytable1 set value = ? where id = ?
            `;
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('UPDATE mytable2 SET name = :name, descr= :descr WHERE id = :id', () => {

        const sql = `
        UPDATE mytable2 SET name = ?, descr= ? WHERE id = ?
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'name',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'descr',
                    columnType: 'TEXT',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('update mytable1 set value = :value where id > :min and id < :max', () => {

        const sql = `
        update mytable1 set value = :value where id > :min and id < :max
            `;
        const expectedSql = `
        update mytable1 set value = ? where id > ? and id < ?
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'min',
                    columnType: 'INTEGER',
                    notNull: true
                },
                {
                    name: 'max',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('update mytable1 set value = :value where id > :value or id < :value', () => {

        const sql = `
        update mytable1 set value = :value where id > :value or id < :value
            `;
        const expectedSql = `
        update mytable1 set value = ? where id > ? or id < ?
            `;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: true
                },
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('UPDATE mytable1 SET id = IFNULL(:id, id)', () => {

        const sql = `
        UPDATE mytable1 SET id = IFNULL(:id, id)
            `;
        const expectedSql = `
        UPDATE mytable1 SET id = IFNULL(?, id)
            `;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns,
            data: [
                {
                    name: 'id',
                    columnType: 'INTEGER',
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