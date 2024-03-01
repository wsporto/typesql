import assert from "assert";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../src/describe-query";
import { DynamicSqlInfo, DynamicSqlInfoResult } from "../src/mysql-query-analyzer/types";

describe.skip('dynamic-query', () => {

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
                    dependOnFields: ['id'],
                    dependOnParams: []
                },
                {
                    fragment: 'm1.value',
                    dependOnFields: ['value'],
                    dependOnParams: []
                },
                {
                    fragment: 'm2.name',
                    dependOnFields: ['name'],
                    dependOnParams: []
                },
                {
                    fragment: 'm2.descr as description',
                    dependOnFields: ['description'],
                    dependOnParams: []
                }
            ],
            from: [
                {
                    fragment: 'mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: ['name', 'description'],
                    dependOnParams: ['name', 'description']
                }
            ],
            where: [
                {
                    fragment: 'AND m2.name = ?',
                    dependOnFields: [],
                    dependOnParams: ['name']
                },
                {
                    fragment: 'AND m2.descr = ?',
                    dependOnFields: [],
                    dependOnParams: ['description']
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
                    dependOnFields: ['id'],
                    dependOnParams: []
                },
                {
                    fragment: 'm1.value',
                    dependOnFields: ['value'],
                    dependOnParams: []
                },
                {
                    fragment: 'm2.name',
                    dependOnFields: ['name'],
                    dependOnParams: []
                },
                {
                    fragment: 'm2.descr as description',
                    dependOnFields: ['description'],
                    dependOnParams: []
                }
            ],
            from: [
                {
                    fragment: 'mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: [],
                    dependOnParams: []
                }
            ],
            where: [
                {
                    fragment: 'AND m2.id = 1',
                    dependOnFields: [],
                    dependOnParams: []
                },
                {
                    fragment: 'AND m2.name = ?',
                    dependOnFields: [],
                    dependOnParams: ['name']
                },
                {
                    fragment: 'AND m2.descr = ?',
                    dependOnFields: [],
                    dependOnParams: ['description']
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
        SELECT m1.id, m2.name, m2.descr as description
        FROM mytable1 m1
        INNER JOIN mytable2 m2 on m1.id = m2.id
        WHERE m2.id in (:ids)
        `
        const sqlFragments: DynamicSqlInfoResult = {
            select: [
                {
                    fragment: 'm1.id',
                    dependOnFields: ['id'],
                    dependOnParams: []
                },
                {
                    fragment: 'm2.name',
                    dependOnFields: ['name'],
                    dependOnParams: []
                },
                {
                    fragment: 'm2.descr as description',
                    dependOnFields: ['description'],
                    dependOnParams: []
                }
            ],
            from: [
                {
                    fragment: 'mytable1 m1',
                    dependOnFields: [],
                    dependOnParams: []
                },
                {
                    fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
                    dependOnFields: ['name', 'description'],
                    dependOnParams: ['ids']
                }
            ],
            where: [
                {
                    fragment: 'AND m2.id in (?)',
                    dependOnFields: [],
                    dependOnParams: ['ids']
                }
            ]
        }

        const actual = await parseSql(client, sql);
        if (isLeft(actual)) {
            assert.fail(`Shouldn't return an error: ` + actual.left.description);
        }

        assert.deepStrictEqual(actual.right.dynamicSqlQuery, sqlFragments);
    })
});