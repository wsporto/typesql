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

	it('SELECT * FROM get_clients_with_addresses()', async () => {
		const sql = 'SELECT * FROM get_clients_with_addresses()';
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
					name: 'primaryaddress',
					type: {
						name: 'json',
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
					table: ''
				},
				{
					name: 'secondaryaddress',
					type: {
						name: 'json',
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

	it('SELECT * FROM get_users_with_posts_plpgsql()', async () => {
		const sql = 'SELECT * FROM get_users_with_posts_plpgsql()';
		const actual = await describeQuery(postres, sql, []);
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

	it('SELECT * FROM get_mytable1() WHERE id = 1', async () => {
		const sql = 'SELECT * FROM get_mytable1() WHERE id = 1';
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'id',
					type: 'int4',
					notNull: true,
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
		const sql = 'SELECT * FROM get_mytable_plpgsql()';
		const actual = await describeQuery(postres, sql, []);
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
		const actual = await describeQuery(postres, sql, []);
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
})