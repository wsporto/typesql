import assert from "assert";
import { parseSql } from "../src/parser";
import { SchemaDef, InvalidSqlError } from "../src/types";
import { DbClient } from "../src/queryExectutor";
import { right, isLeft } from "fp-ts/lib/Either";

describe('Test simple select statements', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('try to parse a empty query', async () => {
        const sql = ``;

        const actual = await parseSql(client, sql);
        const expected = 'Invalid sql';
       
        if(isLeft(actual)) {
            assert.deepEqual(actual.left.name, expected);
        }
        else {
            assert.fail('should return an InvalidSqlError');
        }
        
    })

    it('parse a basic select', async () => {
        const sql = `SELECT id FROM MYTABLE1`;

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('SELECT id as name FROM MYTABLE', async () => {
        const sql = 'SELECT id as name FROM MYTABLE1';
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
        
    })

    it('parse select * from mytable', async () => {
        const sql = 'SELECT * FROM MYTABLE1';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select t.* from mytable t', async () => {
        const slq = 'SELECT t.* FROM MYTABLE1 t';

        const actual = await parseSql(client, slq);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []

        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })


    it('parse select with multiples columns', async () => {

        const sql = 'SELECT id, name, descr as description FROM MYTABLE2';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    name: 'description',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select distinct column', async () => {

        const sql = 'SELECT distinct id, value FROM MYTABLE1';
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select distinct *', async () => {

        const sql = 'SELECT distinct * FROM MYTABLE1';
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with a single parameter', async () => {
        const sql = 'SELECT * FROM MYTABLE1 WHERE id = ?';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with a single parameter (not using *)', async () => {
        const sql = 'SELECT id FROM MYTABLE1 WHERE id = ? and value = 10';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with multiples parameters', async () => {
        const sql = 'SELECT value FROM MYTABLE1 WHERE id = ? or value > ?';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int'
                },
                {
                    name: 'value',
                    columnType: 'int'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with param on column', async () => {
        const sql = 'SELECT ? FROM MYTABLE1';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: '?', //TODO - PARAM1
                    dbtype: 'varchar',
                    notNull: true,
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    //TODO - no reference to table.
    it('parse a select with param on column', async () => {
        const sql = 'SELECT ? as name FROM MYTABLE1';

        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'name',
                    columnType: 'varchar'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with multiples params', async () => {
        const slq = `
        SELECT ? as name, id, descr as description
        FROM MYTABLE2 
        WHERE (name = ? or descr = ?) and id > ?
        `
        const actual = await parseSql(client, slq);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true
                },
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'description',
                    dbtype: 'varchar',
                    notNull: false
                }

            ],
            parameters: [
                {
                    name: 'name',
                    columnType: 'varchar'
                },
                {
                    name: 'name',
                    columnType: 'varchar'
                },
                {
                    name: 'descr',
                    columnType: 'varchar'
                },
                {
                    name: 'id',
                    columnType: 'int'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with table alias', async () => {

        const sql = `
        SELECT t.name FROM MYTABLE2 t
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with table alias and parameter', async () => {

        const sql = `
        SELECT t.* FROM MYTABLE1 t WHERE t.id = ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with in operator', async () => {

        const sql = `
        SELECT * FROM MYTABLE1 WHERE id in (1, 2, 3)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with not in operator', async () => {

        const sql = `
        SELECT * FROM MYTABLE1 WHERE id not in (1, 2, 3)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with in operator (and alias)', async () => {

        const sql = `
        SELECT t.* FROM MYTABLE1 t WHERE t.id in (1, 2, 3)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse a select with parameter inside in operator', async () => {

        const sql = `
        SELECT * FROM MYTABLE1 t WHERE id in (1, 2, 3, ?)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int',
                    list: true
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('SELECT * FROM MYTABLE1 t WHERE ? in (1, 2, 3)', async () => {

        const sql = `
        SELECT id FROM MYTABLE1 t WHERE ? in (1, 2, 3)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'bigint'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it(`SELECT * FROM MYTABLE1 t WHERE ? in ('a', 'b', 'c')`, async () => {

        const sql = `
        SELECT id FROM MYTABLE1 t WHERE ? in ('a', 'b', 'c')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it(`SELECT id FROM MYTABLE1 t WHERE ? in (1, 2, 'a', 'b')`, async () => {

        const sql = `
        SELECT id FROM MYTABLE1 t WHERE ? in (1, 2, 'a', 'b')
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: ['bigint', 'varchar']
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('compare parameter with subquery', async () => {

        const sql = `
        SELECT * FROM mytable1 WHERE id = (select id from mytable2 where id = ?)
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'int'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('compare parameter with complex subquery', async () => {

        const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'id',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('compare ', async () => {

        const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        WHERE t2.id = ? and t2.name = ? 
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true //if pass null on parameters the result query will be empty
                },
                {
                    name: 'id',
                    dbtype: 'varchar',
                    notNull: true //if pass null on parameters the result query will be empty
                }
            ],
            parameters: [
                {
                    name: 'id',
                    columnType: 'varchar'
                },
                {
                    name: 'name',
                    columnType: 'varchar'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select with column expression', async () => {
        const sql = `
        select t1.id > 1 AS bigger  from mytable1 t1
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'bigger',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select with column expression', async () => {
        const sql = `
        select t2.name > 'a' AS bigger  from mytable2 t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'bigger',
                    dbtype: 'bigint', //TODO: 1 or 0; why bigint?
                    notNull: false
                }
            ],
            parameters: []
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('select id from mytable2 where name like ?', async () => {
        const sql = `
        select id from mytable2 where name like ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true

                }
            ],
            parameters: [
                {
                    name: 'name',
                    columnType: 'varchar'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('select id from mytable2 where ? like name', async () => {
        const sql = `
        select id from mytable2 where ? like name
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true

                }
            ],
            parameters: [
                {
                    name: 'name',
                    columnType: 'varchar'
                }
            ]
        }
        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select with CASE WHEN', async () => {

        const sql = `
        SELECT 
            CASE 
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
            END as id
        FROM mytable1
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select with CASE WHEN', async () => {

        const sql = `
        SELECT 
            CASE 
                WHEN id = 1 THEN 'one'
                WHEN id = 2 THEN 'two'
                ELSE 'other'
            END as id
        FROM mytable1
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'varchar',
                    notNull: true
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select with CASE WHEN using IN operator', async () => {

        const sql = `
        select id from mytable2 where ? in (
            SELECT 
                CASE 
                    WHEN id = 1 THEN 'one'
                    WHEN id = 2 THEN 'two'
                END
            FROM mytable1
        )
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                }
            ]

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select using ANY operator', async () => {

        const sql = `
        select id from mytable1 where value > any(select id from mytable2 where name like ?)
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'name',
                    columnType: 'varchar'
                }
            ]

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    //the mysql drive tell value is nullable even if there is a 'where value is not null' clause
    it('select value from mytable1 where value is not null', async () => {

        const sql = `
        select value from mytable1 where value is not null or (id > 0 and value is not null) 
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: true
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })

    it('parse select without from clause', async () => {
        const sql = `
        select 10, CONCAT_WS('a', 'b'), 'a' as name
        `;
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            multipleRowsResult: true,
            columns: [
                {
                    name: '10',
                    dbtype: 'bigint',
                    notNull: true
                },
                {
                    name: `concat_ws('a', 'b')`, //If the separator is NULL, the result is NULL.
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true
                }
            ],
            parameters: []

        }

        if(isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }
        assert.deepEqual(actual.right, expected);
    })


    it('try to parse with reserved word desc'), () => {
        //SELECT id, name, desc as description FROM MYTABLE
    }
})