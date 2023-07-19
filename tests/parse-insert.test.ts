import assert from "assert";
import { parseSql } from "../src/describe-query";
import { ParameterDef, SchemaDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { isLeft, isRight } from "fp-ts/lib/Either";

describe('parse insert statements', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('insert into mytable1 (value) values (?)', async () => {

        const sql = `insert into mytable1 (value) values (?)`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: false,
            queryType: 'Insert',
            sql: 'insert into mytable1 (value) values (?)',
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('insert into mydb.mytable1 (value) values (?)', async () => {

        const sql = `
        insert into mydb.mytable1 (value) values (?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (name, double_value) values (?, ?)', async () => {

        const sql = `
        insert into mytable3 (name, double_value) values (?, ?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'double',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert into mytable3 (double_value, name) values (?, ?)', async () => {

        const sql = `
        insert into mytable3 (double_value, name) values (?, ?)
            `;
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'double',
                notNull: false
            },
            {
                name: 'param2',
                columnType: 'varchar',
                notNull: true
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
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

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
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
            },
            {
                name: 'name',
                columnType: 'varchar',
                notNull: false
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('insert with inexistent columns names', async () => {

        const sql = `
        insert into mytable1 (name) values (?)
            `;
        const actual = await parseSql(client, sql);

        if (isRight(actual)) {
            assert.fail(`Should return an error`);
        }
        const expectedError = `Unknown column 'name' in 'field list'`;
        assert.deepStrictEqual(actual.left.description, expectedError);
    })

    it('insert into all_types (int_column) values (?+?)', async () => {

        const sql = `insert into all_types (int_column) values (?+?)`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'insert into all_types (int_column) values (?+?)',
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'int',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('ON DUPLICATE KEY UPDATE name = ?', async () => {

        const sql = `
        INSERT INTO mytable2 (id, name) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        name = ?`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('ON DUPLICATE KEY UPDATE name = concat(?, ?)', async () => {

        const sql = `
        INSERT INTO mytable2 (id, name) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        name = concat(?, ?)`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'varchar',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`ON DUPLICATE KEY UPDATE name = concat(?, 'a', ?)`, async () => {

        const sql = `
        INSERT INTO mytable2 (id, name) 
        VALUES (?, concat(?, '-a'))
        ON DUPLICATE KEY UPDATE
        name = concat(?, 'a', ?)`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'varchar',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it(`ON DUPLICATE KEY UPDATE name = name = IF(? != '', ?, name)`, async () => {

        const sql = `
        INSERT INTO mytable2 (id, name) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        name = IF(? != '', ?, name)`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'varchar',
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
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'int',
                    notNull: true
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false
                }
            ]
        }

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('insert into all_types (varchar_column, int_column) values (concat(?, ?), ?+?)', async () => {

        const sql = `insert into all_types (varchar_column, int_column) values (concat(?, ?), ?+?)`;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql: 'insert into all_types (varchar_column, int_column) values (concat(?, ?), ?+?)',
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'insertId',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param2',
                    columnType: 'varchar',
                    notNull: false
                },
                {
                    name: 'param3',
                    columnType: 'int',
                    notNull: false
                },
                {
                    name: 'param4',
                    columnType: 'int',
                    notNull: false
                }
            ]
        }


        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

});