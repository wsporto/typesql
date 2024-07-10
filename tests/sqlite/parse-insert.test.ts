import assert from "assert";
import { ParameterDef, SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-parse-insert', () => {

    it('insert into mytable1 (value) values (?)', () => {

        const sql = `insert into mytable1 (value) values (?)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            multipleRowsResult: false,
            queryType: 'Insert',
            sql: 'insert into mytable1 (value) values (?)',
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('insert into mytable1 (id, value) values (:id, :value)', () => {

        const sql = `insert into mytable1 (id, value) values (:id, :value)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            multipleRowsResult: false,
            queryType: 'Insert',
            sql: 'insert into mytable1 (id, value) values (?, ?)',
            columns: [],
            parameters: [
                {
                    name: 'id',
                    columnType: 'INTEGER',
                    notNull: false //autoincrement
                },
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    //Not valid syntax
    it('insert into mydb.mytable1 (value) values (?)', () => {

        const sql = `
        insert into mydb.mytable1 (value) values (?)
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'INTEGER',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (name, double_value) values (?, ?)', () => {

        const sql = `
        insert into mytable3 (name, double_value) values (?, ?)
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'TEXT',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'REAL',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (double_value, name) values (?, ?)', () => {

        const sql = `
        insert into mytable3 (double_value, name) values (?, ?)
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'REAL',
                notNull: false
            },
            {
                name: 'param2',
                columnType: 'TEXT',
                notNull: true
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (name, double_value) values (:fullname, :value)', () => {

        const sql = `
        insert into mytable3 (name, double_value) values (:fullname, :value)
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: ParameterDef[] = [
            {
                name: 'fullname',
                columnType: 'TEXT',
                notNull: true
            },
            {
                name: 'value',
                columnType: 'REAL',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert same parameter into two fields', () => {

        const sql = `
        insert into mytable2 (name, descr) values (:name, :name)
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'TEXT',
                notNull: false
            },
            {
                name: 'name',
                columnType: 'TEXT',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    //not supported
    // it('insert into mytable1 (id) values (IFNULL(:id, id))', () => {

    //     const sql = `
    //     insert into mytable1 (id) values (IFNULL(:id, id))
    //         `;
    //     const actual = parseSql(sql, sqliteDbSchema);
    //     const expected: ParameterDef[] = [
    //         {
    //             name: 'id',
    //             columnType: 'int',
    //             notNull: false
    //         }
    //     ]

    //     if (isLeft(actual)) {
    //         assert.fail(`Shouldn't return an error: ` + actual.left.description);
    //     }
    //     assert.deepStrictEqual(actual.right.parameters, expected);
    // })

    it('insert into mytable1 (id) values (IFNULL(:id, :id2))', () => {

        const sql = `
        insert into mytable1 (id) values (IFNULL(:id, :id2))
            `;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: ParameterDef[] = [
            {
                name: 'id',
                columnType: 'INTEGER',
                notNull: false
            },
            {
                name: 'id2',
                columnType: 'INTEGER',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    // it('insert with inexistent columns names', async () => {

    //     const sql = `
    //     insert into mytable1 (name) values (?)
    //         `;
    //     const actual = await parseSql(client, sql);

    //     if (isRight(actual)) {
    //         assert.fail(`Should return an error`);
    //     }
    //     const expectedError = `Unknown column 'name' in 'field list'`;
    //     assert.deepStrictEqual(actual.left.description, expectedError);
    // })

    it('insert into all_types (int_column) values (?+?)', async () => {

        const sql = `insert into all_types (int_column) values (?+?)`;
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'insert into all_types (int_column) values (?+?)',
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('insert into all_types (real_column) values (?+?)', async () => {

        const sql = `insert into all_types (real_column) values (?+?)`;
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'insert into all_types (real_column) values (?+?)',
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'REAL',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'REAL',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('ON DUPLICATE KEY UPDATE name = ?', () => {//

        const sql = `
        INSERT INTO mytable2 (id, name)
        VALUES (?, ?)
        ON CONFLICT(id) DO
        UPDATE SET name = ?`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false //autoincrement
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it.only('ON DUPLICATE KEY UPDATE name = excluded.name', () => {

        const sql = `
        INSERT INTO mytable2 (id, name)
        VALUES (?, ?)
        ON CONFLICT(id) DO
        UPDATE SET name = excluded.name`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false //autoincrement
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]
        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ${actual.left.description}`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('ON DUPLICATE KEY UPDATE name = concat(?, ?)', () => {

        const sql = `
        INSERT INTO mytable2 (id, name)
        VALUES (?, ?)
        ON CONFLICT(id) DO
        UPDATE name = concat(?, ?)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false //autoincrement
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`ON DUPLICATE KEY UPDATE name = concat(?, 'a', ?)`, () => {

        const sql = `
        INSERT INTO mytable2 (id, name)
        VALUES (?, concat(?, '-a'))
        ON CONFLICT (id) DO
        UPDATE name = concat(?, 'a', ?)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false //autoincrement
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`ON DUPLICATE KEY UPDATE name = name = IF(? != '', ?, name)`, () => {

        const sql = `
        INSERT INTO mytable2 (id, name)
        VALUES (?, ?)
        ON CONFLICT(id) DO
        UPDATE name = IIF(? != '', ?, name)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false //autoincrement
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'TEXT',
                    notNull: true //diff from mysql
                },
                {
                    name: 'param4',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`INSERT INTO mytable2 (id, name) SELECT ?, ?`, async () => {

        const sql = `
        INSERT INTO mytable2 (id, name)
        SELECT ?, ?`;
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'INTEGER',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`INSERT INTO mytable2 (id, name) SELECT id, descr FROM mytable2 WHERE name = ? AND id > ?`, () => {

        const sql = `
        INSERT INTO mytable2 (id, name)
        SELECT id, descr
        FROM mytable2 WHERE name = ? AND id > ?`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'INTEGER',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('insert into all_types (varchar_column, int_column) values (concat(?, ?), ?+?)', () => {

        const sql = `insert into all_types (varchar_column, int_column) values (concat(?, ?), ?+?)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'insert into all_types (varchar_column, int_column) values (concat(?, ?), ?+?)',
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'INTEGER',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`INSERT INTO mytable3 (double_value, name) VALUES (?, ?), (?, ?), (?, ?)`, () => {

        const sql = `
        INSERT INTO mytable3 (double_value, name)
        VALUES (?, ?), (?, ?), (?, ?)`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'REAL',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'REAL',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'param5',
                    columnType: 'REAL',
                    notNull: false
                },
                {
                    name: 'param6',
                    columnType: 'TEXT',
                    notNull: true
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`INSERT INTO mytable3 (double_value, name) VALUES (?, ?), (10.5, ?), (?, 'name')`, () => {

        const sql = `
        INSERT INTO mytable3 (double_value, name)
        VALUES (:value1, :name1), (10.5, :name2), (:value2, 'name')`;
        const expectedSql = `
        INSERT INTO mytable3 (double_value, name)
        VALUES (?, ?), (10.5, ?), (?, 'name')`;

        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: expectedSql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [],
            parameters: [
                {
                    name: 'value1',
                    columnType: 'REAL',
                    notNull: false
                },
                {
                    name: 'name1',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'name2',
                    columnType: 'TEXT',
                    notNull: true
                },
                {
                    name: 'value2',
                    columnType: 'REAL',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`INSERT INTO mytable1 (value) RETURNING *`, async () => {

        const sql = `INSERT INTO mytable1 (value) VALUES (:value) RETURNING *`;
        const actual = await parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            sql: 'INSERT INTO mytable1 (value) VALUES (?) RETURNING *',
            queryType: 'Insert',
            multipleRowsResult: false,
            returning: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'INTEGER',
                    notNull: true
                },
                {
                    columnName: 'value',
                    type: 'INTEGER',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'value',
                    columnType: 'INTEGER',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('insert into all_types (blob_column) values (vector(?))', () => {

        const sql = `insert into all_types (blob_column) values (vector(?))`;
        const actual = parseSql(sql, sqliteDbSchema);
        const expected: SchemaDef = {
            multipleRowsResult: false,
            queryType: 'Insert',
            sql,
            columns: [],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'TEXT',
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