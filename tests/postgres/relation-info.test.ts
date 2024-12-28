import assert from 'node:assert';
import { parseSql } from '../../src/postgres-query-analyzer/parser';
import postgres from 'postgres';
import { loadDbSchema } from '../../src/drivers/postgres';
import { PostgresColumnSchema } from '../../src/drivers/types';
import { Relation2 } from '../../src/sqlite-query-analyzer/sqlite-describe-nested-query';

describe('postgres-relation-info', () => {

	let dbSchema: PostgresColumnSchema[] = [];

	const databaseClient = postgres({
		host: 'localhost',
		user: 'postgres',
		password: 'password',
		port: 5432,
		database: 'postgres',
	});

	before(async function () {
		const dbSchemaResult = await await loadDbSchema(databaseClient);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${dbSchemaResult.error}`);
		}
		dbSchema = dbSchemaResult.value;
	});

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
        `;

		const expectedModel: Relation2[] = [
			{
				name: 'users',
				alias: 'u',
				parentRelation: '',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: 'p',
				parentRelation: 'u',
				joinColumn: 'post_id',
				cardinality: 'many',
				parentCardinality: 'one'
			}
		];

		const actual = parseSql(sql, dbSchema, true);
		assert.deepStrictEqual(actual.relations, expectedModel);
	});

	it('SELECT FROM users INNER JOIN posts (without alias)', () => {
		const sql = `
		-- @nested
        SELECT
            *
        FROM users
        INNER JOIN posts on fk_user = users.id
        `;

		const expectedModel: Relation2[] = [
			{
				name: 'users',
				alias: '',
				parentRelation: '',
				joinColumn: 'id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: '',
				parentRelation: 'users',
				joinColumn: 'id',
				cardinality: 'many',
				parentCardinality: 'one'
			}
		];

		const actual = parseSql(sql, dbSchema, true);
		assert.deepStrictEqual(actual.relations, expectedModel);
	});

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
			`;

		const expectedModel: Relation2[] = [
			{
				name: 'posts',
				alias: 'p',
				parentRelation: '',
				joinColumn: 'post_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'users',
				alias: 'u',
				parentRelation: 'p',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'many'
			}
		];

		const actual = parseSql(sql, dbSchema, true);
		assert.deepStrictEqual(actual.relations, expectedModel);
	});

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
			`;

		const expectedModel: Relation2[] = [
			{
				name: 'users',
				alias: 'u',
				parentRelation: '',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: 'p',
				parentRelation: 'u',
				joinColumn: 'post_id',
				cardinality: 'many',
				parentCardinality: 'one'
			},
			{
				name: 'comments',
				alias: 'c',
				parentRelation: 'p',
				joinColumn: 'comment_id',
				cardinality: 'many',
				parentCardinality: 'one'
			}
		];

		const actual = parseSql(sql, dbSchema, true);
		assert.deepStrictEqual(actual.relations, expectedModel);
	});
});
