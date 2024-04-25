import assert from "assert";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import { RelationInfo2 } from "../../src/sqlite-query-analyzer/sqlite-describe-nested-query";

describe('sqlite-nested-query', () => {

	it('SELECT FROM users u INNER JOIN posts p', async () => {

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

		const actual = await parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users INNER JOIN posts (without alias)', async () => {

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

		const actual = await parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})

	it('SELECT FROM users u INNER JOIN posts p', async () => {

		const sql = `
		-- @nested
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

		const expectedModel: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
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
				fields: [
					{
						name: 'role',
						index: 5
					}
				],
				relations: []
			}
		]

		const actual = await parseSql(sql, sqliteDbSchema);
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}

		assert.deepStrictEqual(actual.right.nestedInfo, expectedModel);
	})
})