import assert from "assert";
import { parseSql } from "../src/parser";
import { SchemaDef } from "../src/types";
import { DbClient } from "../src/queryExectutor";

describe('Test select with multiples tables', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
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
                },
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
                    name: 'descr',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('select t1.* from inner join', async () => {

        const sql = `
        SELECT t1.* 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        assert.deepEqual(actual, expected);
    })

    it('select t2.* from inner join', async () => {

        const sql = `
        SELECT t2.* 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    name: 'descr',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('select t2.*, t1.* from inner join', async () => {

        const sql = `
        SELECT t2.*, t1.*
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
                    name: 'descr',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: false
                },
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse select with param', async () => {

        const sql = `
        SELECT t1.id
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        WHERE t1.id = ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        assert.deepEqual(actual, expected);
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
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true //where t1.name = ?; cannot be null
                },
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: true //where t1.value = ?; cannot be null
                },
                {
                    name: 'description',
                    dbtype: 'varchar',
                    notNull: false
                },
                {
                    name: 'param1',
                    dbtype: 'varchar',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                },
                {
                    name: 'id',
                    columnType: 'int'
                },
                {
                    name: 'name',
                    columnType: 'varchar'
                },
                {
                    name: 'value',
                    columnType: 'int'
                }
            ]

        }
        assert.deepEqual(actual, expected);
    })

    it('parse select with param (tablelist)', async () => {

        const sql = `
        SELECT t3.id, t2.name, t1.value, ? as param1
        FROM mytable1 t1, mytable2 t2, mytable3 t3
        WHERE t3.id > ? and t1.value = ? and t2.name = ?
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: true //where t2.name = ?; cannot be null
                },
                {
                    name: 'value',
                    dbtype: 'int',
                    notNull: true //where t1.value = ?; cannot be null
                },
                {
                    name: 'param1',
                    notNull: true,
                    dbtype: 'varchar'
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    columnType: 'varchar'
                },
                {
                    name: 'id',
                    columnType: 'int'
                },
                {
                    name: 'value',
                    columnType: 'int'
                },
                {
                    name: 'name',
                    columnType: 'varchar'
                }
            ]

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with tablelist', async () => {

        const sql = `
        SELECT t1.id, t2.name 
        FROM mytable1 t1, mytable2 t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
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
        assert.deepEqual(actual, expected);
    })

    it('parse a select with tablelist (not ambiguous)', async () => {

        // Column 'name' exists only on mytable2
        const sql = `
        SELECT name FROM mytable1, mytable2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })


    //TODO - RETURN ERROR
    it.skip('parse a select with tablelist (ambiguous)', () => {

        // Column 'id' exists on mytable1 and mytable2
        const sql = `
        SELECT id FROM mytable1, mytable2
        `
        const actual = parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'id',
                    dbtype: 'int'
                },
                {
                    name: 'id',
                    dbtype: 'int'
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with tablelist (unreferenced alias)', async () => {

        // Column 'name' exists only on mytable2
        const sql = `
        SELECT name as fullname FROM mytable1 t1, mytable2 t2
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'fullname',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a select with tablelist and subquery', async () => {

        // Column 'name' exists only on mytable2
        const sql = `
        SELECT name FROM (select t1.*, t2.name from mytable1 t1, mytable2 t2) t
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []

        }
        assert.deepEqual(actual, expected);
    })

    it('parse a query with extras parenteses', async () => {

        const sql = `
        select name from ((( mytable1, (select * from mytable2) t )))
        `
        const actual = await parseSql(client, sql);
        const expected: SchemaDef = {
            columns: [
                {
                    name: 'name',
                    dbtype: 'varchar',
                    notNull: false
                }
            ],
            parameters: []
        }
        assert.deepEqual(actual, expected);

    })

    it.skip('subquery in joined tables', () => {

    })

});