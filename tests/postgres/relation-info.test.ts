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
				renameAs: false,
				parentRelation: '',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: 'p',
				renameAs: false,
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
				renameAs: false,
				parentRelation: '',
				joinColumn: 'id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: '',
				renameAs: false,
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
				renameAs: false,
				parentRelation: '',
				joinColumn: 'post_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'users',
				alias: 'u',
				renameAs: false,
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
				renameAs: false,
				parentRelation: '',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: 'p',
				renameAs: false,
				parentRelation: 'u',
				joinColumn: 'post_id',
				cardinality: 'many',
				parentCardinality: 'one'
			},
			{
				name: 'comments',
				alias: 'c',
				renameAs: false,
				parentRelation: 'p',
				joinColumn: 'comment_id',
				cardinality: 'many',
				parentCardinality: 'one'
			}
		];

		const actual = parseSql(sql, dbSchema, true);
		assert.deepStrictEqual(actual.relations, expectedModel);
	});

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
        WHERE c.id = $1
        `;

		const expectedModel: Relation2[] = [
			{
				name: 'clients',
				alias: 'c',
				renameAs: true,
				parentRelation: '',
				joinColumn: 'id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'addresses',
				alias: 'a1',
				renameAs: true,
				parentRelation: 'c',
				joinColumn: 'id',
				cardinality: 'one',
				parentCardinality: 'many'
			},
			{
				name: 'addresses',
				alias: 'a2',
				renameAs: true,
				parentRelation: 'c',
				joinColumn: 'id',
				cardinality: 'one',
				parentCardinality: 'many'
			}
		];

		const actual = parseSql(sql, dbSchema, true);
		assert.deepStrictEqual(actual.relations, expectedModel);
	});
});
