import assert from "assert";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../src/describe-query";
import { DynamicSqlInfoResult } from "../src/mysql-query-analyzer/types";

describe('dynamic-query', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    // and m1.id = 3
    // and m1.id = 4
    // and (m1.id = 5 and m1.id = 5)

    it('WHERE m2.name = :name AND m2.descr = :description', async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m1.value, m2.name, m2.descr as description
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.name = :name
        AND m2.descr = :description

        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm1.value',
                    fragmentWitoutAlias: 'm1.value',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.descr as description',
                    fragmentWitoutAlias: 'm2.descr',
                    dependOnFields: [3],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [2, 3],
                    dependOnParams: ['name', 'description'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: 'AND m2.name = ?',
                    dependOnFields: [],
                    dependOnParams: ['name'],
                    parameters: ['name']
                },
                {
                    fragment: 'AND m2.descr = ?',
                    dependOnFields: [],
                    dependOnParams: ['description'],
                    parameters: ['description']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it('WHERE m2.id = 1 AND m2.name = :name AND m2.descr = :description', async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m1.value, m2.name, m2.descr as description
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.id = 1
            AND m2.name = :name
            AND m2.descr = :description

        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm1.value',
                    fragmentWitoutAlias: 'm1.value',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.descr as description',
                    fragmentWitoutAlias: 'm2.descr',
                    dependOnFields: [3],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: 'AND m2.id = 1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'AND m2.name = ?',
                    dependOnFields: [],
                    dependOnParams: ['name'],
                    parameters: ['name']
                },
                {
                    fragment: 'AND m2.descr = ?',
                    dependOnFields: [],
                    dependOnParams: ['description'],
                    parameters: ['description']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it('WHERE m2.id in (:ids)', async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m2.name, m2.descr as description
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.id in (:ids)
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.descr as description',
                    fragmentWitoutAlias: 'm2.descr',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [1, 2],
                    dependOnParams: ['ids'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: 'AND m2.id in (?)',
                    dependOnFields: [],
                    dependOnParams: ['ids'],
                    parameters: ['ids']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it('mytable1 m1 INNER JOIN mytable2 ... INNER JOIN mytable3', async () => {
        const sql = `
            -- @dynamicQuery
            SELECT m1.id, m2.name, m3.double_value as value
            FROM mytable1 m1
            INNER JOIN mytable2 m2 on m2.id = m1.id
            INNER JOIN mytable3 m3 on m3.id = m2.id
            WHERE m3.id in (:ids)
            `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm3.double_value as value',
                    fragmentWitoutAlias: 'm3.double_value',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m2.id = m1.id',
                    dependOnFields: [1, 2],
                    dependOnParams: ['ids'],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable3 m3 on m3.id = m2.id',
                    dependOnFields: [2],
                    dependOnParams: ['ids'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: 'AND m3.id in (?)',
                    dependOnFields: [],
                    dependOnParams: ['ids'],
                    parameters: ['ids']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it('WHERE m2.name = :name AND m2.descr = :description', async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m2.name
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.name = concat('A', :name, 'B', :name, :name2)
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [1],
                    dependOnParams: ['name', 'name2'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: `AND m2.name = concat('A', ?, 'B', ?, ?)`,
                    dependOnFields: [],
                    dependOnParams: ['name', 'name', 'name2'],
                    parameters: ['name', 'name', 'name2']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`m2.name like concat('%', :name, '%')`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m2.name
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.name like concat('%', :name, '%')
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [1],
                    dependOnParams: ['name'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: `AND m2.name like concat('%', ?, '%')`,
                    dependOnFields: [],
                    dependOnParams: ['name'],
                    parameters: ['name']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`SELECT concat(m1.value, ': ', m2.name) as valueAndName`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m1.value, m2.name, concat(m1.value, ': ', m2.name) as valueAndName
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm1.value',
                    fragmentWitoutAlias: 'm1.value',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: `concat(m1.value, ': ', m2.name) as valueAndName`,
                    fragmentWitoutAlias: `concat(m1.value, ': ', m2.name)`,
                    dependOnFields: [3],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [2, 3],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            where: []
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`SELECT concat(m1.value, ': ', m2.name) as valueAndName`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT m1.id, m1.value, m2.name
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE lower(m2.name) like lower(concat('%', :name, '%'))
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm1.value',
                    fragmentWitoutAlias: 'm1.value',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [2],
                    dependOnParams: ['name'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: `AND lower(m2.name) like lower(concat('%', ?, '%'))`,
                    dependOnFields: [],
                    dependOnParams: ['name'],
                    parameters: ['name']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`SELECT concat(m1.value, ': ', m2.name) as valueAndName`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT 
            m1.id, 
            m2.name,
            (select name from mytable1 where id = 1) as subQuery
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.name = :name
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: '(select name from mytable1 where id = 1) as subQuery',
                    fragmentWitoutAlias: '(select name from mytable1 where id = 1)',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [1],
                    dependOnParams: ['name'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: `AND m2.name = ?`,
                    dependOnFields: [],
                    dependOnParams: ['name'],
                    parameters: ['name']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`INNER JOIN (SELECT FROM ...)`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT 
            m1.id, 
            m2.name
        FROM mytable1 m1
        INNER JOIN ( -- derivated table
            SELECT id, name from mytable2 m 
            WHERE m.name = :subqueryName
        ) m2
        WHERE m2.name = :name
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: `INNER JOIN ( -- derivated table
            SELECT id, name from mytable2 m 
            WHERE m.name = ?
        ) m2`,
                    dependOnFields: [1],
                    dependOnParams: ['name'],
                    parameters: ['subqueryName']
                }
            ],
            where: [
                {
                    fragment: `AND m2.name = ?`,
                    dependOnFields: [],
                    dependOnParams: ['name'],
                    parameters: ['name']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`SELECT concat(m1.value, ': ', m2.name) as valueAndName`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT 
            m1.id, 
            m2.name
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE (:name is null OR m2.name = :name)
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [1],
                    dependOnParams: ['name'],
                    parameters: []
                }
            ],
            where: [
                {
                    fragment: `AND (? is null OR m2.name = ?)`,
                    dependOnFields: [],
                    dependOnParams: ['name', 'name'],
                    parameters: ['name', 'name']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`SELECT * FROM mytable1 m1`, async () => {
        const sql = `
        -- @dynamicQuery
        SELECT 
           *
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m2.id = m1.id
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm1.value',
                    fragmentWitoutAlias: 'm1.value',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.id',
                    fragmentWitoutAlias: 'm2.id',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.name',
                    fragmentWitoutAlias: 'm2.name',
                    dependOnFields: [3],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'm2.descr',
                    fragmentWitoutAlias: 'm2.descr',
                    dependOnFields: [4],
                    dependOnParams: [],
                    parameters: []
                },
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m2.id = m1.id',
                    dependOnFields: [2, 3, 4],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            where: []
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })

    it(`SELECT m1.id, name, descr as description FROM mytable1 m1`, async () => {
        const sql = `-- @dynamicQuery
SELECT 
	m1.id, name, descr as description
FROM mytable1 m1
INNER JOIN mytable2 m2 on m2.id = m1.id
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    fragmentWitoutAlias: 'm1.id',
                    dependOnFields: [0],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'name',
                    fragmentWitoutAlias: 'name',
                    dependOnFields: [1],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'descr as description',
                    fragmentWitoutAlias: 'descr',
                    dependOnFields: [2],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            from: [
                {
                    fragment: 'FROM mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m2.id = m1.id',
                    dependOnFields: [1, 2],
                    dependOnParams: [],
                    parameters: []
                }
            ],
            where: []
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error`);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })
});