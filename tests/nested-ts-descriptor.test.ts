import assert from "assert";
import { describeNestedQuery } from "../src/describe-nested-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";
import { extractQueryInfo } from "../src/mysql-query-analyzer/parse";
import { NestedTsDescriptor, createNestedTsDescriptor } from "../src/ts-nested-descriptor";

describe('Test nested-ts-descriptor', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('SELECT FROM users u INNER JOIN posts p', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            u.id as user_id, 
            u.name as user_name,
            p.id as post_id,
            p.title as post_title
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        `

        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const model = describeNestedQuery(sql, dbSchema.right);
        const queryInfo = extractQueryInfo(sql, dbSchema.right);
        assert(queryInfo.kind == 'Select');
        const actual = createNestedTsDescriptor(queryInfo.columns, model);
        const expected: NestedTsDescriptor = {
            relations: [
                {
                    name: 'u',
                    groupKeyIndex: 0,
                    fields: [
                        {
                            type: 'field',
                            name: 'user_id',
                            index: 0,
                            tsType: 'number',
                            notNull: true
                        },
                        {
                            type: 'field',
                            name: 'user_name',
                            index: 1,
                            tsType: 'string',
                            notNull: true
                        },
                        {
                            type: 'relation',
                            name: 'p',
                            list: true,
                            tsType: 'p[]',
                            notNull: true,
                        }
                    ]
                },
                {
                    name: 'p',
                    groupKeyIndex: 2,
                    fields: [
                        {
                            type: 'field',
                            name: 'post_id',
                            index: 2,
                            tsType: 'number',
                            notNull: true
                        },
                        {
                            type: 'field',
                            name: 'post_title',
                            index: 3,
                            tsType: 'string',
                            notNull: true
                        }
                    ]
                }
            ]
        }
        assert.deepStrictEqual(actual, expected);
    });
});