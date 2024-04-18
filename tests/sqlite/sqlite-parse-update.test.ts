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
});