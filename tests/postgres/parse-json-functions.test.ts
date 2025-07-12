import assert from 'node:assert';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';

describe('postgres-json-functions', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it(`SELECT json_build_object('key', 'value')`, async () => {
		const sql = `SELECT json_build_object('key', 'value'), jsonb_build_object('key', 'value')`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'json_build_object',
					type: {
						name: 'json',
						properties: [
							{
								key: 'key',
								type: 'text',
								notNull: true
							}
						]
					},
					notNull: false,
					table: ''
				},
				{
					name: 'jsonb_build_object',
					type: 'jsonb',
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

	it(`SELECT json_build_object('key', id) FROM mytable1`, async () => {
		const sql = `SELECT json_build_object('key', id), jsonb_build_object('key', id) FROM mytable1`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'json_build_object',
					type: {
						name: 'json',
						properties: [
							{
								key: 'key',
								type: 'int4',
								notNull: true
							}
						]
					},
					notNull: false,
					table: ''
				},
				{
					name: 'jsonb_build_object',
					type: 'jsonb',
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

	it(`SELECT json_build_object('key', id) FROM mytable1`, async () => {
		const sql = `SELECT json_build_object('key1', name, 'key2', id ) as value FROM mytable2`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: {
						name: 'json',
						properties: [
							{
								key: 'key1',
								type: 'text',
								notNull: false
							},
							{
								key: 'key2',
								type: 'int4',
								notNull: true
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

	it(`SELECT json_build_object('key', id) FROM mytable1`, async () => {
		const sql = `SELECT json_build_object('key1', m2.name, 'key2', m2.descr, 'key3', m1.id, 'key4', m2.id ) as value 
			FROM mytable1 m1
			LEFT JOIN mytable2 m2 ON m1.id = m2.id`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: {
						name: 'json',
						properties: [
							{
								key: 'key1',
								type: 'text',
								notNull: false
							},
							{
								key: 'key2',
								type: 'text',
								notNull: false
							},
							{
								key: 'key3',
								type: 'int4',
								notNull: true
							},
							{
								key: 'key4',
								type: 'int4',
								notNull: false
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

	it(`SELECT json_build_object('key', id) FROM mytable1`, async () => {
		const sql = `SELECT json_build_object('key1', m2.name, 'key2', json_build_object('nested', m1.id), 'key3', m2.id ) as value 
			FROM mytable1 m1
			LEFT JOIN mytable2 m2 ON m1.id = m2.id`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: {
						name: 'json',
						properties: [
							{
								key: 'key1',
								type: 'text',
								notNull: false
							},
							{
								key: 'key2',
								type: {
									name: 'json',
									properties: [
										{
											key: 'nested',
											type: 'int4',
											notNull: true
										}
									]
								},
								notNull: false
							},
							{
								key: 'key3',
								type: 'int4',
								notNull: false
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

	it(`select json_build_array(1,2,'foo',4,5)`, async () => {
		const sql = `select json_build_array(1,2,'foo',4,5)`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'json_build_array',
					type: 'json',
					notNull: false, //in this example is never null
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

	it(`select to_json()`, async () => {
		const sql = `select 
		 	to_json(10::int) as col1, 
		 	to_jsonb(10::int) as col2, 
		 	to_json('a'::text) as col3, 
		 	to_jsonb('a'::text) as col4, 
			to_json(array[1, 2, 3]) as col5,
			to_jsonb(array[1, 2, 3]) as col6,
			to_json(array['a', 'b', 'c']) as col7,
			to_jsonb(array['a', 'b', 'c']) as col8,
			to_json(null::text) as col9,
			to_jsonb(null::text) as col10,
			to_json(array[null]) as col11,
			to_jsonb(array[null]) as col12`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'col1', //to_json(10::int) as col1
					type: 'json',
					notNull: false,
					table: ''
				},
				{
					name: 'col2', //to_jsonb(10::int) as col2
					type: 'jsonb',
					notNull: false,
					table: ''
				},
				{
					name: 'col3', //to_json('a'::text) as col3
					type: 'json',
					notNull: false,
					table: ''
				},
				{
					name: 'col4', //to_jsonb('a'::text) as col4
					type: 'jsonb',
					notNull: false,
					table: ''
				},
				{
					name: 'col5', //to_json(array[1, 2, 3]) as col5
					type: 'json',
					notNull: false,
					table: ''
				},
				{
					name: 'col6', //to_jsonb(array[1, 2, 3]) as col6
					type: 'jsonb',
					notNull: false,
					table: ''
				},
				{
					name: 'col7', //to_json(array['a', 'b', 'c']) as col7
					type: 'json',
					notNull: false,
					table: ''
				},
				{
					name: 'col8', //to_jsonb(array['a', 'b', 'c']) as col8
					type: 'jsonb',
					notNull: false,
					table: ''
				},
				{
					name: 'col9', //to_json(null) as col9
					type: 'json',
					notNull: false,
					table: ''
				},
				{
					name: 'col10', //to_jsonb(null) as col9
					type: 'jsonb',
					notNull: false,
					table: ''
				},
				{
					name: 'col11', //to_json(array[null]) as col11
					type: 'json',
					notNull: false,
					table: ''
				},
				{
					name: 'col12', //to_jsonb(array[null]) as col11
					type: 'jsonb',
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

	it(`select json_agg()`, async () => {
		const sql = `select 
			json_agg(json_build_object('key', 10)) as col1, 
			jsonb_agg(json_build_object('key', 10)) as col2, 
			json_agg(null::text) as col3,
			jsonb_agg(null::text) as col4
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'col1',
					type: {
						name: 'json[]',
						properties: [
							{
								key: 'key',
								type: 'int4',
								notNull: true
							}
						]
					},
					notNull: false,
					table: '',
				},
				{
					name: 'col2',
					type: 'jsonb',
					notNull: false,
					table: ''
				},
				{
					name: 'col3',
					type: {
						name: 'json[]',
						properties: []
					},
					notNull: false,
					table: ''
				},
				{
					name: 'col4',
					type: 'jsonb',
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

	it(`SELECT json_agg(json_build_object('key', 'value'))`, async () => {
		const sql = `SELECT json_agg(json_build_object('key', 'value')) as result`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json[]',
						properties: [
							{
								key: 'key',
								type: 'text',
								notNull: true
							}
						],
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

	it(`SELECT json_agg(...) FROM VALUES (1, 'a'),(2, 'b')) AS t(id, name) `, async () => {
		const sql = `
		SELECT json_agg(
			json_build_object('key', name, 'key2', id)
		) AS result
		FROM (
			VALUES
				(1, 'a'),
				(2, 'b')
		) AS t(id, name)`;
		const actual = await describeQuery(postres, sql, []);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json[]',
						properties: [
							{
								key: 'key',
								type: 'text',
								notNull: true,
							},
							{
								key: 'key2',
								type: 'int4',
								notNull: true
							}
						],
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
})