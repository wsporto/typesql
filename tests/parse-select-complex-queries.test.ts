import { SchemaDef } from "../src/types";
import assert from "assert";
import { parseSql } from "../src/describe-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('Test parse complex queries', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('parse SELECT t1.name, t2.mycolumn2, t3.mycolumn3, count', async () => {
        //mytable1 (id, value); mytable2 (id, name, descr); mytable3 (id)
        const sql = `
        SELECT t1.value, t2.name, t3.id, count(*) AS quantity 
        FROM mytable1 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id 
        LEFT JOIN mytable3 t3 ON t3.id = t2.id
        GROUP BY t1.value, t2.name, t3.id
        HAVING count(*) > 1
        `
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
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: false
                },
                {
                    name: 'quantity',
                    notNull: true,
                    dbtype: 'bigint'
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('HAVING value > ?', async () => {
        const sql = `
        SELECT
            name, 
            SUM(double_value) as value
        FROM mytable3
        GROUP BY 
            name
        HAVING 
            value > ?
        `
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
                },
                {
                    name: 'value',
                    dbtype: 'double',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'double',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('HAVING value > ? and ? < ', async () => {
        const sql = `
        SELECT
            name, 
            SUM(double_value) as value,
            SUM(double_value * 0.01) as id
        FROM mytable3
        WHERE id > ? -- this id is from mytable3 column
        GROUP BY 
            name
        HAVING 
            value > ? 
            and id < ? -- this id is from the SELECT alias
            AND SUM(double_value) = ?

        `
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
                },
                {
                    name: 'value',
                    dbtype: 'double',
                    notNull: false
                },
                {
                    name: 'id',
                    dbtype: 'double',
                    notNull: false
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
                    columnType: 'double',
                    notNull: true
                },
                {
                    name: 'param3',
                    columnType: 'double',
                    notNull: true
                },
                {
                    name: 'param4',
                    columnType: 'double',
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    //https://www.mysqltutorial.org/mysql-subquery/

    it('parse a select with UNION', async () => {
        const sql = `
        SELECT id FROM mytable1
        UNION
        SELECT id FROM mytable2
        UNION
        SELECT id FROM mytable3
        `
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

    it('parse a select with UNION (int_column + text_column)', async () => {
        const sql = `
            SELECT int_column as col FROM all_types
            UNION
            SELECT text_column as col FROM all_types
            `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'col',
                    dbtype: 'text',
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

    //.only
    it('parse a select with UNION', async () => {
        const sql = `
        SELECT id, value FROM mytable1
        UNION
        SELECT id, name as value FROM mytable2
        `
        const actual = await parseSql(client, sql);
        //value is int; name is varchar; result: varchar;
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

    //.only
    it('parse a select with UNION with multiples fields', async () => {
        const sql = `
        SELECT id, value FROM mytable1
        UNION
        SELECT id, descr as value FROM mytable2
        UNION
        SELECT id, id as value FROM mytable3
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true,
                },
                {
                    name: 'value',
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

    it('subselect in column', async () => {
        const sql = `
        SELECT (SELECT name FROM mytable2 where id = t1.id) as fullname
        FROM mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'fullname',
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

    it('subselect in column (with parameter)', async () => {
        const sql = `
        SELECT (SELECT name as namealias FROM mytable2 where id = ?) as fullname
        FROM mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'fullname',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: [{
                name: 'param1',
                columnType: 'int',
                notNull: true
            }]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH names AS ( SELECT name FROM mytable2 )', async () => {
        const sql = `
        WITH names AS ( 
            SELECT name FROM mytable2
        )
        SELECT name from names
        `
        // const sql = `SELECT name from mytable2`
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

    it('WITH names AS (query1), allvalues AS (query2)', async () => {
        const sql = `
        WITH 
            names AS (SELECT id, name FROM mytable2),
            allvalues AS (SELECT id, value FROM mytable1)
        SELECT n.id, name, value
        FROM names n
        INNER JOIN allvalues v ON n.id = v.id
        `
        // const sql = `SELECT name from mytable2`
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

    it('WITH names AS (query1) SELECT names.*', async () => {
        const sql = `
        WITH 
            names AS (SELECT id, name FROM mytable2)
        SELECT names.*
        FROM names
        `
        // const sql = `SELECT name from mytable2`
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
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH result AS (query1 UNION query2)', async () => {
        const sql = `
        WITH result AS (
            SELECT id as id FROM mytable1
            UNION
            SELECT id as id FROM mytable2
        )
        SELECT *
        FROM result
        `
        // const sql = `SELECT name from mytable2`
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

    it('WITH (query with inner join and parameters)', async () => {
        const sql = `
        WITH t1 AS
        (
            SELECT mytable1.*, mytable2.name
            FROM mytable1
            INNER JOIN mytable2 ON mytable1.id = mytable2.id
            WHERE mytable1.value > ? and mytable2.name  = ?
        )
        SELECT t1.*
        FROM t1
        ORDER BY t1.value DESC
        LIMIT 10
        `
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
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
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
                    notNull: true
                }
            ]

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH RECURSIVE seq (n)', async () => {
        const sql = `
        WITH RECURSIVE seq (n) AS
        (
            SELECT 1
            UNION ALL
            SELECT n + 1 FROM seq WHERE n < 5
        )
        SELECT * FROM seq
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'n',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH RECURSIVE conc (a)', async () => {
        const sql = `
        WITH RECURSIVE conc (a) AS
        (
            SELECT CAST('a' AS CHAR(5))
            UNION ALL
            SELECT concat(a, 'a') FROM conc WHERE LENGTH(a) < 5
        )
        SELECT * FROM conc
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'a',
                    dbtype: 'varchar',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH RECURSIVE cte AS (SELECT 1 AS n ...)', async () => {
        const sql = `
        WITH RECURSIVE cte AS
        (
            SELECT 1 AS n
            UNION ALL
            SELECT n + 1 FROM cte WHERE n < 3
        )
        SELECT * FROM cte
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'n',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    it('WITH RECURSIVE conc (a)', async () => {
        const sql = `
        WITH RECURSIVE cte AS
        (
        SELECT 1 AS n, CAST('abc' AS CHAR(20)) AS str
        UNION ALL
        SELECT n + 1, CONCAT(str, str) FROM cte WHERE n < 3
        )
        SELECT * FROM cte
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'n',
                    dbtype: 'bigint',
                    notNull: true
                },
                {
                    name: 'str',
                    dbtype: 'varchar',
                    notNull: true
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })

    //Example from: https://dev.mysql.com/doc/refman/8.0/en/with.html
    it('WITH RECURSIVE dates (date) AS', async () => {
        const sql = `
        WITH RECURSIVE dates (date) AS
            (
            SELECT MIN(date_column) FROM all_types
            UNION ALL
            SELECT date + INTERVAL 1 DAY FROM dates
            WHERE date + INTERVAL 1 DAY <= (SELECT MAX(date_column) FROM all_types)
            )
        SELECT * FROM dates
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'date',
                    dbtype: 'datetime',
                    notNull: false
                }
            ],
            parameters: []

        }
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }
        assert.deepStrictEqual(actual.right, expected);
    })
});