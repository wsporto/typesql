import assert from "assert";
import { NestedResultInfo, describeNestedQuery } from "../src/describe-nested-query";
import { DbClient } from "../src/queryExectutor";
import { isLeft } from "fp-ts/lib/Either";

describe('nested-query', () => {

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
            p.title as post_title,
            p.body  as post_body
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        `
        // Expected type:
        // type User = {
        //     user_id: string;
        //     user_name: string;
        //     p: Post[];
        // }

        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: 'u',
                    tableName: 'users',
                    tableAlias: 'u',
                    cardinality: 'one',
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id'
                        },
                        {
                            type: 'field',
                            name: 'user_name'
                        },
                        {
                            type: 'relation',
                            name: 'p',
                            cardinality: 'many'
                        }
                    ]
                },
                {
                    name: 'p',
                    tableName: 'posts',
                    tableAlias: 'p',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                        },
                        {
                            type: 'field',
                            name: 'post_title'
                        },
                        {
                            type: 'field',
                            name: 'post_body'
                        }
                    ]
                }
            ]
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);
    })

    it('SELECT FROM posts p INNER JOIN users u', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            u.id as user_id, 
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body
        FROM posts p
        INNER JOIN users u on u.id = p.fk_user
        `

        // Expected type:
        // type Post = {
        //     user_id: string;
        //     user_name: string;
        //     u: User;
        // }

        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: 'p',
                    tableName: 'posts',
                    tableAlias: 'p',
                    cardinality: 'one',
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id'
                        },
                        {
                            type: 'field',
                            name: 'post_title'
                        },
                        {
                            type: 'field',
                            name: 'post_body'
                        },
                        {
                            type: 'relation',
                            name: 'u',
                            cardinality: 'one'
                        }
                    ]
                },
                {
                    name: 'u',
                    tableName: 'users',
                    tableAlias: 'u',
                    cardinality: 'one',
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id',
                        },
                        {
                            type: 'field',
                            name: 'user_name'
                        }
                    ]
                },
            ]
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);
    })

    it('SELECT FROM users u INNER JOIN posts p INNER JOIN comments c', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            u.id as user_id, 
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body,
            c.comment as comment
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        INNER JOIN comments c on c.fk_post = p.id
        `
        // Expected type:
        // type User = {
        //     user_id: string;
        //     user_name: string;
        //     p: Post[];
        // }
        // type Post = {
        //     post_id: string;
        //     post_title: string;
        //     post_body: string;
        //     c: Comment[]; 
        // }

        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: 'u',
                    tableName: 'users',
                    tableAlias: 'u',
                    cardinality: 'one',
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id'
                        },
                        {
                            type: 'field',
                            name: 'user_name'
                        },
                        {
                            type: 'relation',
                            name: 'p',
                            cardinality: 'many'
                        }
                    ]
                },
                {
                    name: 'p',
                    tableName: 'posts',
                    tableAlias: 'p',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                        },
                        {
                            type: 'field',
                            name: 'post_title'
                        },
                        {
                            type: 'field',
                            name: 'post_body'
                        },
                        {
                            type: 'relation',
                            name: 'c',
                            cardinality: 'many'
                        }
                    ]
                },
                {
                    name: 'c',
                    tableName: 'comments',
                    tableAlias: 'c',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'comment',
                        }
                    ]
                }
            ]

        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);
    })

    it('SELECT FROM users u INNER JOIN posts p INNER JOIN roles r', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            u.id as user_id, 
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body,
            r.role 
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        INNER JOIN roles r on r.fk_user = u.id
        `
        //Epected type:
        // type User = {
        //     user_id: string;
        //     user_name: string;
        //     p: Post[];
        //     r: Role[];
        // }
        // type Post = {
        //     post_id: string;
        //     post_title: string;
        //     post_body: string;
        // }

        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: 'u',
                    tableName: 'users',
                    tableAlias: 'u',
                    cardinality: 'one',
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id'
                        },
                        {
                            type: 'field',
                            name: 'user_name'
                        },
                        {
                            type: 'relation',
                            name: 'p',
                            cardinality: 'many'
                        },
                        {
                            type: 'relation',
                            name: 'r',
                            cardinality: 'many'
                        }
                    ]
                },
                {
                    name: 'p',
                    tableName: 'posts',
                    tableAlias: 'p',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                        },
                        {
                            type: 'field',
                            name: 'post_title'
                        },
                        {
                            type: 'field',
                            name: 'post_body'
                        }
                    ]
                },
                {
                    name: 'r',
                    tableName: 'roles',
                    tableAlias: 'r',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'role',
                        }
                    ]
                }
            ]
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);
    })

    it('SELECT FROM users u INNER JOIN posts p INNER JOIN roles r INNER JOIN comments c', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            u.id as user_id, 
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body,
            r.role,
            c.comment 
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        INNER JOIN roles r on r.fk_user = u.id
        INNER JOIN comments c on c.fk_post = p.id
        `
        // Expected types:
        // type User = {
        //     user_id: string;
        //     user_name: string;
        //     p: Post[];
        //     r: Role[];
        // }
        // type Post = {
        //     post_id: string;
        //     post_title: string;
        //     post_body: string;
        //     c: Comment[];
        // }

        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: 'u',
                    tableName: 'users',
                    tableAlias: 'u',
                    cardinality: 'one',
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id'
                        },
                        {
                            type: 'field',
                            name: 'user_name'
                        },
                        {
                            type: 'relation',
                            name: 'p',
                            cardinality: 'many'
                        },
                        {
                            type: 'relation',
                            name: 'r',
                            cardinality: 'many'
                        }

                    ]

                },
                {
                    name: 'p',
                    tableName: 'posts',
                    tableAlias: 'p',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                        },
                        {
                            type: 'field',
                            name: 'post_title'
                        },
                        {
                            type: 'field',
                            name: 'post_body'
                        },
                        {
                            type: 'relation',
                            name: 'c',
                            cardinality: 'many'
                        }
                    ]
                },
                {
                    name: 'c',
                    tableName: 'comments',
                    tableAlias: 'c',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'comment',
                        }
                    ]
                },
                {
                    name: 'r',
                    tableName: 'roles',
                    tableAlias: 'r',
                    cardinality: 'many',
                    columns: [
                        {
                            type: 'field',
                            name: 'role',
                        }
                    ]
                }
            ]
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);
    })


});