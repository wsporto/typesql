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
                    name: 'users',
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id',
                            index: 0
                        },
                        {
                            type: 'field',
                            name: 'user_name',
                            index: 1
                        },
                        {
                            type: 'relation',
                            name: 'posts',
                            cardinality: 'many',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'posts',
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                            index: 2
                        },
                        {
                            type: 'field',
                            name: 'post_title',
                            index: 3
                        },
                        {
                            type: 'field',
                            name: 'post_body',
                            index: 4
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

    it('SELECT FROM users INNER JOIN posts (without alias)', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            *
        FROM users
        INNER JOIN posts on fk_user = users.id
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
                    name: 'users',
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: 'field',
                            name: 'id',
                            index: 0
                        },
                        {
                            type: 'field',
                            name: 'name',
                            index: 1
                        },
                        {
                            type: 'relation',
                            name: 'posts',
                            cardinality: 'many',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'posts',
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: 'field',
                            name: 'id',
                            index: 2
                        },
                        {
                            type: 'field',
                            name: 'title',
                            index: 3
                        },
                        {
                            type: 'field',
                            name: 'body',
                            index: 4
                        },
                        {
                            type: 'field',
                            name: 'fk_user',
                            index: 5
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
                    name: 'posts',
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                            index: 2
                        },
                        {
                            type: 'field',
                            name: 'post_title',
                            index: 3
                        },
                        {
                            type: 'field',
                            name: 'post_body',
                            index: 4
                        },
                        {
                            type: 'relation',
                            name: 'users',
                            cardinality: 'one',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'users',
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id',
                            index: 0
                        },
                        {
                            type: 'field',
                            name: 'user_name',
                            index: 1
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
                    name: 'users',
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id',
                            index: 0
                        },
                        {
                            type: 'field',
                            name: 'user_name',
                            index: 1
                        },
                        {
                            type: 'relation',
                            name: 'posts',
                            cardinality: 'many',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'posts',
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                            index: 2
                        },
                        {
                            type: 'field',
                            name: 'post_title',
                            index: 3
                        },
                        {
                            type: 'field',
                            name: 'post_body',
                            index: 4
                        },
                        {
                            type: 'relation',
                            name: 'comments',
                            cardinality: 'many',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'comments',
                    groupKeyIndex: 5,
                    columns: [
                        {
                            type: 'field',
                            name: 'comment',
                            index: 5

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
                    name: 'users',
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id',
                            index: 0
                        },
                        {
                            type: 'field',
                            name: 'user_name',
                            index: 1
                        },
                        {
                            type: 'relation',
                            name: 'posts',
                            cardinality: 'many',
                            notNull: true
                        },
                        {
                            type: 'relation',
                            name: 'roles',
                            cardinality: 'many',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'posts',
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                            index: 2
                        },
                        {
                            type: 'field',
                            name: 'post_title',
                            index: 3
                        },
                        {
                            type: 'field',
                            name: 'post_body',
                            index: 4
                        }
                    ]
                },
                {
                    name: 'roles',
                    groupKeyIndex: 5,
                    columns: [
                        {
                            type: 'field',
                            name: 'role',
                            index: 5
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
                    name: 'users',
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: 'field',
                            name: 'user_id',
                            index: 0
                        },
                        {
                            type: 'field',
                            name: 'user_name',
                            index: 1
                        },
                        {
                            type: 'relation',
                            name: 'posts',
                            cardinality: 'many',
                            notNull: true
                        },
                        {
                            type: 'relation',
                            name: 'roles',
                            cardinality: 'many',
                            notNull: true
                        }

                    ]

                },
                {
                    name: 'posts',
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: 'field',
                            name: 'post_id',
                            index: 2
                        },
                        {
                            type: 'field',
                            name: 'post_title',
                            index: 3
                        },
                        {
                            type: 'field',
                            name: 'post_body',
                            index: 4
                        },
                        {
                            type: 'relation',
                            name: "comments",
                            cardinality: 'many',
                            notNull: true
                        }
                    ]
                },
                {
                    name: 'roles',
                    groupKeyIndex: 5,
                    columns: [
                        {
                            type: 'field',
                            name: 'role',
                            index: 5
                        }
                    ]
                },
                {
                    name: 'comments',
                    groupKeyIndex: 6,
                    columns: [
                        {
                            type: 'field',
                            name: 'comment',
                            index: 6
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

    it('FROM surveys INNER JOIN participants INNER JOIN users INNER JOIN questions INNER JOIN answers a', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        -- @nested
        SELECT
            s.id as surveyId,
            s.name as surveyName,
            p.id as participantId,
            u.id as userId,
            u.name as userName,
            q.id as questionId,
            q.questions as questions,
            a.id as answerId,
            a.answer
        FROM surveys s
        INNER JOIN participants p on p.fk_survey = s.id -- junction table
        INNER JOIN users u on p.fk_user = u.id
        INNER JOIN questions q ON q.fk_survey = s.id
        INNER JOIN answers a on a.fk_question = q.id AND a.fk_user = u.id
        `
        // Expected types:
        // type Surveys = {
        //     surveyId: number;
        //     surveyName: string;
        //     u: Users[];
        //     q: Questions[];
        // }
        // type Questions = {
        //     questionId: number;
        //     questionS: string;
        //     a: Answer;
        // }
        // type Answer = {
        //     answerId: number;
        //     answer: string;
        // }

        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: "surveys",
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: "field",
                            name: "surveyId",
                            index: 0
                        },
                        {
                            type: "field",
                            name: "surveyName",
                            index: 1
                        },
                        {
                            type: "relation",
                            name: "users",
                            cardinality: "many",
                            notNull: true
                        },
                        {
                            type: "relation",
                            name: "questions",
                            cardinality: "many",
                            notNull: true
                        },
                    ],
                },
                {
                    name: "users",
                    groupKeyIndex: 3,
                    columns: [
                        {
                            type: "field",
                            name: "participantId",
                            index: 2
                        },
                        {
                            type: "field",
                            name: "userId",
                            index: 3
                        },
                        {
                            type: "field",
                            name: "userName",
                            index: 4
                        },
                        {
                            type: "relation",
                            name: "answers",
                            cardinality: "many",
                            notNull: true
                        },
                    ],
                },
                {
                    name: "questions",
                    groupKeyIndex: 5,
                    columns: [
                        {
                            type: "field",
                            name: "questionId",
                            index: 5
                        },
                        {
                            type: "field",
                            name: "questions",
                            index: 6
                        },
                        {
                            type: "relation",
                            name: "answers",
                            cardinality: "many",
                            notNull: true
                        },
                    ],
                },
                {
                    name: "answers",
                    groupKeyIndex: 7,
                    columns: [
                        {
                            type: "field",
                            name: "answerId",
                            index: 7
                        },
                        {
                            type: "field",
                            name: "answer",
                            index: 8
                        },
                    ],
                }
            ],
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);
    })

    it('SELECT FROM users u INNER JOIN posts p', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            *
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        `

        //[id(0), name, id(2), title, body]
        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: "users",
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 0,
                        },
                        {
                            type: "field",
                            name: "name",
                            index: 1,
                        },
                        {
                            type: "relation",
                            name: "posts",
                            cardinality: "many",
                            notNull: true
                        }
                    ],
                },
                {
                    name: "posts",
                    groupKeyIndex: 2,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 2,
                        },
                        {
                            type: "field",
                            name: "title",
                            index: 3,
                        },
                        {
                            type: "field",
                            name: "body",
                            index: 4,
                        },
                        {
                            type: "field",
                            name: "fk_user",
                            index: 5,
                        }
                    ],
                }
            ],
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);

    })

    it('many to many - books with authors', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT *
        FROM books b
        INNER JOIN books_authors ba on ba.book_id = b.id
        INNER JOIN authors a on a.id = ba.author_id
        `

        //[id(0),title(1),isbn(2),id(3),book_id(4),author_id(5),id(6),fullName(7),shortName(8)]
        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: "books",
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 0,
                        },
                        {
                            type: "field",
                            name: "title",
                            index: 1,
                        },
                        {
                            type: "field",
                            name: "isbn",
                            index: 2,
                        },
                        {
                            type: "relation",
                            name: "authors",
                            cardinality: "many",
                            notNull: true
                        }
                    ],
                },
                {
                    name: "authors",
                    groupKeyIndex: 7,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 3,
                        },
                        {
                            type: "field",
                            name: "book_id",
                            index: 4,
                        },
                        {
                            type: "field",
                            name: "author_id",
                            index: 5,
                        },
                        {
                            type: "field",
                            name: "author_ordinal",
                            index: 6,
                        },
                        {
                            type: "field",
                            name: "id",
                            index: 7,
                        },
                        {
                            type: "field",
                            name: "fullName",
                            index: 8,
                        },
                        {
                            type: "field",
                            name: "shortName",
                            index: 9,
                        }
                    ],
                }
            ],
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);

    })

    it('self relation - clients with primaryAddress and secondaryAddress', async () => {
        const dbSchema = await client.loadDbSchema();

        const sql = `
        SELECT 
            c.id,
            a1.*,
            a2.*
        FROM clients as c
        INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
        LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
        WHERE c.id = :clientId
        `

        //[id(0),id(1),address(2),id(3),address(3)]
        const expectedModel: NestedResultInfo = {
            relations: [
                {
                    name: "c",
                    groupKeyIndex: 0,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 0,
                        },
                        {
                            type: "relation",
                            name: "a1",
                            cardinality: "one",
                            notNull: true,
                        },
                        {
                            type: "relation",
                            name: "a2",
                            cardinality: "one",
                            notNull: false
                        }
                    ],
                },
                {
                    name: 'a1',
                    groupKeyIndex: 1,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 1,
                        },
                        {
                            type: "field",
                            name: "address",
                            index: 2,
                        },
                    ]
                },
                {
                    name: 'a2',
                    groupKeyIndex: 3,
                    columns: [
                        {
                            type: "field",
                            name: "id",
                            index: 3,
                        },
                        {
                            type: "field",
                            name: "address",
                            index: 4,
                        },
                    ]
                }
            ],
        }
        if (isLeft(dbSchema)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = describeNestedQuery(sql, dbSchema.right);

        assert.deepStrictEqual(actual, expectedModel);

    })
});