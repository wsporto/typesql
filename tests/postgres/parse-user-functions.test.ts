import assert from 'node:assert';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';

describe('postgres-user-functions', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it(`SELECT * FROM get_users_with_posts()`, async () => {
		const sql = `SELECT * FROM get_users_with_posts()`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: ''
				},
				{
					name: 'posts',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true } //FILTER(WHERE p.id is not null)
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true } //FILTER(WHERE p.id is not null)
									}
								]
							}
						]
					},
					notNull: true, //[]
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it(`SELECT u.* FROM get_users_with_posts() u`, async () => {
		const sql = `SELECT u.* FROM get_users_with_posts() u`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'posts',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true } //FILTER(WHERE p.id is not null)
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true } //FILTER(WHERE p.id is not null)
									}
								]
							}
						]
					},
					notNull: true, //[]
					table: 'u'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})
})