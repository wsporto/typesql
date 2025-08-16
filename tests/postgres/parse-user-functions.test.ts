import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres-user-functions', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('SELECT * FROM schema2.get_user(:id)', async () => {
		const sql = 'SELECT * FROM schema2.get_user(:id)';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'SELECT * FROM schema2.get_user($1)',
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'get_user'
				},
				{
					name: 'username',
					type: 'text',
					notNull: true,
					table: 'get_user'
				},
				{
					name: 'password',
					type: 'text',
					notNull: false,
					table: 'get_user'
				},
				{
					name: 'schema1_field1',
					type: 'text',
					notNull: true,
					table: 'get_user'
				}
			],
			parameters: [
				{
					name: 'id',
					notNull: false, //todo: should be notNull: true
					type: 'int4'
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it('SELECT u.* FROM schema2.get_user($1) u', async () => {
		const sql = 'SELECT u.* FROM schema2.get_user(:id) u';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'SELECT u.* FROM schema2.get_user($1) u',
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'username',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'password',
					type: 'text',
					notNull: false,
					table: 'u'
				},
				{
					name: 'schema1_field1',
					type: 'text',
					notNull: true,
					table: 'u'
				}
			],
			parameters: [
				{
					name: 'id',
					notNull: false, //todo: should be notNull: true
					type: 'int4'
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it(`SELECT * FROM get_users_with_posts()`, async () => {
		const sql = `SELECT * FROM get_users_with_posts()`;
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: false, //LOOSE nullability information
					table: 'get_users_with_posts_plpgsql'
				},
				{
					name: 'posts',
					type: 'json',
					notNull: false,
					table: 'get_users_with_posts_plpgsql'
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const sql = 'SELECT * FROM get_mytable1_by_id(:id)';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql: 'SELECT * FROM get_mytable1_by_id($1)',
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
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: false, //loose nullability information
					table: 'get_mytable_plpgsql'
				},
				{
					name: 'value',
					type: 'int4',
					notNull: false,
					table: 'get_mytable_plpgsql'
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
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