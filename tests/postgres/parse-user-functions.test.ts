import assert from 'node:assert';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';

describe('postgres-user-functions', () => {
	const client = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	after(async () => {
		await client.end();
	});

	it(`SELECT * FROM get_users_with_posts()`, async () => {
		const sql = `SELECT * FROM get_users_with_posts()`;
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_users_with_posts'
				},
				{
					name: 'posts',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
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
					table: 'get_users_with_posts'
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
		const actual = await describeQuery(client, sql, []);
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
								notNull: true,
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

	it('SELECT * FROM get_clients_with_addresses()', async () => {
		const sql = 'SELECT * FROM get_clients_with_addresses()';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_clients_with_addresses'
				},
				{
					name: 'primaryaddress',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'id',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'address',
								type: { name: 'json_field', type: 'text', notNull: true }
							}
						]
					},
					notNull: true,
					table: 'get_clients_with_addresses'
				},
				{
					name: 'secondaryaddress',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'id',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'address',
								type: { name: 'json_field', type: 'text', notNull: true }
							}
						]
					},
					notNull: false,
					table: 'get_clients_with_addresses'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT * FROM get_users_with_posts_plpgsql()', async () => {
		const sql = 'SELECT * FROM get_users_with_posts_plpgsql()';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: false, //LOOSE nullability information
					table: ''
				},
				{
					name: 'posts',
					type: 'json',
					notNull: false,
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

	it('SELECT * FROM get_mytable1()', async () => {
		const sql = 'SELECT * FROM get_mytable1()';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_mytable1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'get_mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT * FROM get_mytable1() WHERE id = 1', async () => {
		const sql = 'SELECT * FROM get_mytable1() WHERE id = 1';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_mytable1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'get_mytable1'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT * FROM get_mytable1_by_id(:id)', async () => {
		const sql = 'SELECT * FROM get_mytable1_by_id($1)';
		const actual = await describeQuery(client, sql, ['id']);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_mytable1_by_id'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'get_mytable1_by_id'
				}
			],
			parameters: [
				{
					name: 'id',
					notNull: true,
					type: 'int4'
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT * FROM get_mytable_plpgsql()', async () => {
		const sql = 'SELECT * FROM get_mytable_plpgsql()';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: false, //loose nullability information
					table: ''
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
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

	it('SELECT * FROM get_mytable_plpgsql()', async () => {
		const sql = 'SELECT m.id FROM get_mytable_plpgsql() m';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: false, //loose nullability information
					table: 'm'
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT mytable1.*, get_users_with_posts.posts FROM mytable1 INNER JOIN get_users_with_posts()', async () => {
		const sql = `
		SELECT 
			mytable1.*, 
		get_users_with_posts.posts 
		FROM mytable1
		INNER JOIN get_users_with_posts() ON get_users_with_posts.id = mytable1.id`;
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'mytable1'
				},
				{
					name: 'posts',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
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
					table: 'get_users_with_posts'
				}
			],
			parameters: []
		}
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT * FROM get_mytable1_with_nested_function()', async () => {
		const sql = 'SELECT * FROM get_mytable1_with_nested_function() get_users_with_posts';
		const actual = await describeQuery(client, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_users_with_posts'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'get_users_with_posts'
				},
				{
					name: 'posts',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
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
					table: 'get_users_with_posts'
				}
			],
			parameters: []
		}
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})
})