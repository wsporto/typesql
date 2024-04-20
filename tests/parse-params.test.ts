import { MySqlDialect, ParameterDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";

import { createMysqlClientForTest } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse parameters', () => {

    let client!: MySqlDialect;
    before(async () => {
        client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
    })

    it('SELECT ? from mytable1', async () => {
        const sql = `
        SELECT ? from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'any',
                notNull: true //changed at v0.0.2
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT ?+id from mytable1', async () => {
        const sql = `
        SELECT ?+id from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'double',
                notNull: true //changed at v0.0.2
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT id+? from mytable1', async () => {
        const sql = `
        SELECT id+? from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'double',
                notNull: true //changed at v0.0.2
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT :value+id from mytable1 where :value is not null', async () => {
        const sql = `
        SELECT :value+id from mytable1 where :value is not null
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'value',
                columnType: 'double',
                notNull: true //changed at v0.0.2
            },
            {
                name: 'value',
                columnType: 'double',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT ? > 1 from mytable1', async () => {
        const sql = `
        SELECT ? > 1 from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT ? > 'a' from mytable1`, async () => {
        const sql = `
        SELECT ? > 'a' from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT (select ? from mytable2) from mytable1', async () => {
        const sql = `
        SELECT (select ? from mytable2) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'any',
                notNull: true //changed at v0.0.2
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT (select id from mytable2 where name = ?) from mytable1', async () => {
        const sql = `
        SELECT (select id from mytable2 where name = ?) from mytable1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where id > ?', async () => {
        const sql = `
        SELECT * from mytable1 where id > ?
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where ? > id', async () => {
        const sql = `
        SELECT * from mytable1 where ? > id
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it.skip(`SELECT * from mytable1 where concat_ws('/', ?) < id`, async () => {
        const sql = `
        SELECT * from mytable1 where concat_ws('/', ?) < id
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: false
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * from mytable1 where concat_ws('/', ?) is null`, async () => {
        const sql = `
        SELECT * from mytable1 where concat_ws('/', ?) is null
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: false
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it.skip(`SELECT * from mytable1 where id > concat_ws('/', ?)`, async () => {
        const sql = `
        SELECT * from mytable1 where id > concat_ws('/', ?)
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true //changed at v0.0.2
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where ? > (select id from mytable2 where id = 1)', async () => {
        const sql = `
        SELECT * from mytable1 where ? > (select id from mytable2 where id = 1)
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error:`, actual.left);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it('SELECT * from mytable1 where (select id from mytable2 where id = 1) < ?', async () => {
        const sql = `
        SELECT * from mytable1 where (select id from mytable2 where id = 1) < ?
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * from mytable2 where ? is null or id = ?`, async () => {
        const sql = `
        SELECT * from mytable2 where ? is null or id = ?
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'any',
                notNull: false
            },
            {
                name: 'param2',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * from mytable2 where id = ? or id > ?`, async () => {
        const sql = `
        SELECT * from mytable2 where id = ? or id > ?
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it.skip(`select name from mytable2 where concat('/', id) > :p or id = :p`, async () => {
        const sql = `
        select name from mytable2 where concat('/', id) > ? or id = ?
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`select concat(?, ?) from mytable2`, async () => {
        const sql = `
        select concat(?, ?) from mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
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


    //TODO: new test: SELECT * FROM mytable1 t WHERE value in (select value from mytable1 m2 where m2.value is null) or value is null;
    it(`SELECT * FROM mytable1 t WHERE ? in (select id from mytable1 m2 )`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (select id from mytable1 m2 )
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 t WHERE ? in (select name from mytable2 m2 )`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (select name from mytable2 m2 )
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    //type mismatch
    it.skip(`SELECT * FROM mytable1 t WHERE ? in (UNION - type mismatch)`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (
            select id from mytable1
            union
            select name from mytable2
        )
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 t WHERE ? in (UNION)`, async () => {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (
            select value from mytable1
            union
            select id+id from mytable2
        )
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'bigint',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 WHERE id in (?)`, async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id in (?)`
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int[]',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT * FROM mytable1 WHERE id = :param or value = :param`, async () => {
        const sql = `
        SELECT * FROM mytable1 WHERE id = :param or value = :param`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param',
                columnType: 'int',
                notNull: true
            },
            {

                name: 'param',
                columnType: 'int',
                notNull: true
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`SELECT CASE WHEN id = 1 THEN ? ELSE id END from mytable1`, async () => {
        const sql = `
        SELECT CASE WHEN id = 1 THEN ? ELSE id END from mytable1`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true //changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`SELECT CASE WHEN id = 1 THEN id ELSE ? END from mytable1`, async () => {
        const sql = `
        SELECT CASE WHEN id = 1 THEN id ELSE ? END from mytable1`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true //changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`parse select with case when expression (multiple parameters)`, async () => {
        const sql = `
        SELECT
            CASE
                WHEN id = 1 THEN id
                WHEN id = 2 THEN ?
                WHEN id = 3 THEN id+id
                ELSE ?
            END
        FROM mytable1`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'bigint',
                notNull: true //changed at v0.0.2
            },
            {
                name: 'param2',
                columnType: 'bigint',
                notNull: true //changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`parse select with case when expression  (id+id)`, async () => {
        const sql = `
        SELECT
            CASE
                WHEN id = ? THEN ?
                ELSE id+id
            END
        FROM mytable1`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'bigint',
                notNull: true //changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`parse select with case when expression (? in  not null)`, async () => {
        const sql = `
        SELECT
            CASE WHEN (? IS NOT NULL)
              THEN ?
              ELSE 'a'
            END
        FROM mytable2`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'any', //changed at v0.0.2
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'varchar',
                notNull: true ////changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`parse select with case when expression 2`, async () => {
        const sql = `
        SELECT
            CASE WHEN id = 1
              THEN ?+id
              ELSE 20
            END
        FROM mytable2`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'double',
                notNull: true //changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`parse select with case when expression 3`, async () => {
        const sql = `
        SELECT
            CASE
                WHEN id = 1 THEN ? + id
                WHEN id = 2 THEN 2
                WHEN id = 3 then ?
                ELSE 1
            END as result
        FROM mytable1`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'double',
                notNull: true //changed at v0.0.2
            },
            {
                name: 'param2',
                columnType: 'double',
                notNull: true //changed at v0.0.2
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })
    it(`select id from mytable2 where (name, id) = (select ?, ? from mytable2 where id = ?)`, async () => {
        const sql = `
        SELECT id FROM mytable2 WHERE (?, ?) = (select name, id from mytable2 where id = ?)`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'varchar',
                notNull: true
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
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`SELECT id FROM mytable2 WHERE ? = CASE WHEN id = 1 THEN id ELSE ? END`, async () => {
        const sql = `
        SELECT id FROM mytable2 WHERE ? = CASE WHEN id = 1 THEN id ELSE ? END`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'int',
                notNull: true
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`Param within WITH clause`, async () => {
        const sql = `
        WITH
            names AS (SELECT id, name FROM mytable2 where id = ?)
        SELECT id
        FROM names`
        const actual = await parseSql(client, sql);
        const expectedParameters: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'int',
                notNull: true
            }
        ]

        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expectedParameters);
    })

    it(`WITH result AS (query1 UNION query2) with parameters`, async () => {
        const sql = `
        SELECT id from mytable1 where mytable1.id = :a1
        UNION
        SELECT id from mytable2 where mytable2.id = :a1
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'a1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'a1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`WITH result AS (query1 UNION query2) with parameters`, async () => {
        const sql = `
        WITH result AS (
            SELECT id from mytable1 where mytable1.id = :a1
            UNION
            SELECT id from mytable2 where mytable2.id = :a1
        )
        SELECT * FROM result
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'a1',
                columnType: 'int',
                notNull: true
            },
            {
                name: 'a1',
                columnType: 'int',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })

    it(`SELECT ?, ?`, async () => {
        const sql = `
        SELECT ?, ?
        `
        const actual = await parseSql(client, sql);
        const expected: ParameterDef[] = [
            {
                name: 'param1',
                columnType: 'any',
                notNull: true
            },
            {
                name: 'param2',
                columnType: 'any',
                notNull: true
            }
        ]
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right.parameters, expected);
    })
});