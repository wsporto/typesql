import assert from "assert";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import { RelationInfo2 } from "../../src/sqlite-query-analyzer/sqlite-describe-nested-query";
import { loadDbSchema } from "../../src/sqlite-query-analyzer/query-executor";
import Database from "better-sqlite3";

describe('sqlite-nested-query', () => {

	const db = new Database('./mydb.db');

	it('SELECT FROM users u INNER JOIN posts p', () => {

		const sql = `
		-- @nested
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: [
					{
						name: 'posts',
						alias: 'p',
						cardinality: 'many',
					}
				]
			},
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users INNER JOIN posts (without alias)', () => {

		const sql = `
		-- @nested
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: '',
				groupIndex: 0,
				fields: [
					{
						name: 'id',
						index: 0
					},
					{
						name: 'name',
						index: 1
					},
				],
				relations: [
					{
						name: 'posts',
						alias: '',
						cardinality: 'many'
					}
				]
			},
			{
				name: 'posts',
				alias: '',
				groupIndex: 2,
				fields: [
					{
						name: 'id',
						index: 2
					},
					{
						name: 'title',
						index: 3
					},
					{
						name: 'body',
						index: 4
					},
					{
						name: 'fk_user',
						index: 5
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM posts p INNER JOIN users u', () => {

		const sql = `
		-- @nested
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: [
					{
						name: 'users',
						alias: 'u',
						cardinality: 'one'
					}
				]
			},
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users u INNER JOIN posts p INNER JOIN comments c', () => {

		const sql = `
		-- @nested
        SELECT
            u.id as user_id,
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body,
			c.id as comment_id,
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: [
					{
						name: 'posts',
						alias: 'p',
						cardinality: 'many'
					}
				]
			},
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: [
					{
						name: 'comments',
						alias: 'c',
						cardinality: 'many'
					}
				]
			},
			{
				name: 'comments',
				alias: 'c',
				groupIndex: 5,
				fields: [
					{
						name: 'comment_id',
						index: 5
					},
					{
						name: 'comment',
						index: 6
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users u INNER JOIN posts p INNER JOIN roles r', () => {

		const sql = `
		-- @nested
        SELECT
            u.id as user_id,
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body,
			r.id as role_id,
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: [
					{
						name: 'posts',
						alias: 'p',
						cardinality: 'many'
					},
					{
						name: 'roles',
						alias: 'r',
						cardinality: 'many'
					}
				]
			},
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: []
			},
			{
				name: 'roles',
				alias: 'r',
				groupIndex: 5,
				fields: [
					{
						name: 'role_id',
						index: 5
					},
					{
						name: 'role',
						index: 6
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users u INNER JOIN posts p INNER JOIN roles r INNER JOIN comments c', () => {

		const sql = `
		-- @nested
        SELECT
            u.id as user_id,
            u.name as user_name,
            p.id as post_id,
            p.title as post_title,
            p.body  as post_body,
			r.id as role_id,
            r.role,
			c.id as comment_id,
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: [
					{
						name: 'posts',
						alias: 'p',
						cardinality: 'many'
					},
					{
						name: 'roles',
						alias: 'r',
						cardinality: 'many'
					}
				]
			},
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: [
					{
						name: 'comments',
						alias: 'c',
						cardinality: 'many'
					}
				]
			},
			{
				name: 'roles',
				alias: 'r',
				groupIndex: 5,
				fields: [
					{
						name: 'role_id',
						index: 5
					},
					{
						name: 'role',
						index: 6
					}
				],
				relations: []
			},
			{
				name: 'comments',
				alias: 'c',
				groupIndex: 7,
				fields: [
					{
						name: 'comment_id',
						index: 7
					},
					{
						name: 'comment',
						index: 8
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users u INNER JOIN posts p', () => {

		const sql = `
		-- @nested
        SELECT
            *
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        `
		//[id(0), name, id(2), title, body, fk_user]

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'id',
						index: 0
					},
					{
						name: 'name',
						index: 1
					}
				],
				relations: [
					{
						name: 'posts',
						alias: 'p',
						cardinality: 'many',
					}
				]
			},
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'id',
						index: 2
					},
					{
						name: 'title',
						index: 3
					},
					{
						name: 'body',
						index: 4
					},
					{
						name: "fk_user",
						index: 5,
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('many to many - books with authors', () => {

		const sql = `
		-- @nested
        SELECT *
        FROM books b
        INNER JOIN books_authors ba on ba.book_id = b.id
        INNER JOIN authors a on a.id = ba.author_id
        `

		//[id(0),title(1),isbn(2),id(3),book_id(4),author_id(5),author_ordinal(6), id(7),fullName(8),shortName(9)]
		const expectedModel: RelationInfo2[] = [
			{
				name: 'books',
				alias: 'b',
				groupIndex: 0,
				fields: [
					{
						name: 'id',
						index: 0
					},
					{
						name: 'title',
						index: 1
					},
					{
						name: 'isbn',
						index: 2
					}
				],
				relations: [
					{
						name: 'authors',
						alias: 'a',
						cardinality: 'many',
					}
				]
			},
			{
				name: 'authors',
				alias: 'a',
				groupIndex: 7,
				fields: [
					{
						name: 'id',
						index: 3
					},
					{
						name: 'book_id',
						index: 4
					},
					{
						name: 'author_id',
						index: 5
					},
					{
						name: 'author_ordinal',
						index: 6
					},
					{
						name: "id",
						index: 7,
					},
					{
						name: "fullName",
						index: 8,
					},
					{
						name: "shortName",
						index: 9,
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('self relation - clients with primaryAddress and secondaryAddress', () => {

		const sql = `
		-- @nested
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
		const expectedModel: RelationInfo2[] = [
			{
				name: 'c',
				alias: 'c',
				groupIndex: 0,
				fields: [
					{
						name: 'id',
						index: 0
					}
				],
				relations: [
					{
						name: 'a1',
						alias: 'a1',
						cardinality: 'one',
					},
					{
						name: 'a2',
						alias: 'a2',
						cardinality: 'one',
					}
				]
			},
			{
				name: 'a1',
				alias: 'a1',
				groupIndex: 1,
				fields: [
					{
						name: 'id',
						index: 1
					},
					{
						name: 'address',
						index: 2
					}
				],
				relations: []
			},
			{
				name: 'a2',
				alias: 'a2',
				groupIndex: 3,
				fields: [
					{
						name: 'id',
						index: 3
					},
					{
						name: 'address',
						index: 4
					}
				],
				relations: []
			}
		]

		const actual = parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('movies join actors join persons', () => {

		const sql = `
		-- @nested
        SELECT 
			m.id,
			m.title,
			a.id,
			p.id,
			p.name
		FROM movies m
		INNER JOIN actors a on a.movie_id = m.id
		INNER JOIN persons p on p.id = a.person_id
        `

		//[id(0),title(1),id(2),name(3)]
		const expectedModel: RelationInfo2[] = [
			{
				name: 'movies',
				alias: 'm',
				groupIndex: 0,
				fields: [
					{
						name: 'id',
						index: 0
					},
					{
						name: 'title',
						index: 1
					}
				],
				relations: [
					{
						name: 'actors',
						alias: 'a',
						cardinality: 'many',
					}
				]
			},
			{
				name: 'actors',
				alias: 'a',
				groupIndex: 2,
				fields: [
					{
						name: 'id',
						index: 2
					},

				],
				relations: [
					{
						name: 'persons',
						alias: 'p',
						cardinality: 'one',
					}
				]
			},
			{
				name: 'persons',
				alias: 'p',
				groupIndex: 3,
				fields: [
					{
						name: 'id',
						index: 3
					},
					{
						name: 'name',
						index: 4
					},

				],
				relations: []
			}
		]

		const dbSchema = loadDbSchema(db);


		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}

		const actual = parseSql(sql, dbSchema.right);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})
})