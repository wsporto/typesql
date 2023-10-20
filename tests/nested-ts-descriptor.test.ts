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

    it.only('SELECT FROM users u INNER JOIN posts p', async () => {
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
            name: 'u',
            tsType: 'u',
            notNull: true,
            fields: [
                {
                    type: 'field',
                    name: 'user_id',
                    tsType: 'number',
                    notNull: true
                },
                {
                    type: 'field',
                    name: 'user_name',
                    tsType: 'string',
                    notNull: true
                },
                {
                    type: 'relation',
                    name: 'p',
                    tsType: 'p',
                    notNull: true,
                }
            ],
            relations: [
                {
                    name: 'p',
                    fields: [
                        {
                            type: 'field',
                            name: 'post_id',
                            tsType: 'number',
                            notNull: true
                        },
                        {
                            type: 'field',
                            name: 'post_title',
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