import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres-json-functions', () => {
	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it(`SELECT json_build_object('key', 'value')`, async () => {
		const sql = `SELECT json_build_object('key', 'value'), jsonb_build_object('key', 'value')`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'json_build_object', //not null true
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key',
								type: { name: 'json_field', type: 'text', notNull: true }
							}
						]
					},
					notNull: true,
					table: ''
				},
				{
					name: 'jsonb_build_object', //not null true
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key',
								type: { name: 'json_field', type: 'text', notNull: true }
							}
						]
					},
					notNull: true,
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
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'json_build_object',
					notNull: true, //json_build_object notNull: true,
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key',
								type: { name: 'json_field', type: 'int4', notNull: true }
							}
						]
					},
					table: ''
				},
				{
					name: 'jsonb_build_object',
					notNull: true, //json_build_object notNull: true,
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key',
								type: { name: 'json_field', type: 'int4', notNull: true }
							}
						]
					},
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

	it(`SELECT json_build_object('key1', name, 'key2', id ) as value FROM mytable1`, async () => {
		const sql = `SELECT json_build_object('key1', name, 'key2', id ) as value FROM mytable2`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key1',
								type: { name: 'json_field', type: 'text', notNull: false }
							},
							{
								key: 'key2',
								type: { name: 'json_field', type: 'int4', notNull: true }
							}
						]
					},
					notNull: true,
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

	it(`SELECT json_build_object('key1', m2.name, 'key2', m2.descr, 'key3', m1.id, 'key4', m2.id ) as value`, async () => {
		const sql = `SELECT json_build_object('key1', m2.name, 'key2', m2.descr, 'key3', m1.id, 'key4', m2.id ) as value
					FROM mytable1 m1
					LEFT JOIN mytable2 m2 ON m1.id = m2.id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key1',
								type: { name: 'json_field', type: 'text', notNull: false }
							},
							{
								key: 'key2',
								type: { name: 'json_field', type: 'text', notNull: false }
							},
							{
								key: 'key3',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'key4',
								type: { name: 'json_field', type: 'int4', notNull: false }
							}
						]
					},
					notNull: true, //json_build_object
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

	it(`SELECT json_build_object('key1', m2.name, 'key2', json_build_object('nested', m1.id), 'key3', m2.id ) as value`, async () => {
		const sql = `SELECT json_build_object('key1', m2.name, 'key2', json_build_object('nested', m1.id), 'key3', m2.id ) as value
					FROM mytable1 m1
					LEFT JOIN mytable2 m2 ON m1.id = m2.id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'key1',
								type: { name: 'json_field', type: 'text', notNull: false }
							},
							{
								key: 'key2',
								type: {
									name: 'json',
									notNull: true,
									properties: [
										{
											key: 'nested',
											type: { name: 'json_field', type: 'int4', notNull: true }
										}
									]
								},
							},
							{
								key: 'key3',
								type: { name: 'json_field', type: 'int4', notNull: false }
							}
						]
					},
					notNull: true, //json_build_object
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

	it(`SELECT json_agg() FROM users u LEFT JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		json_agg(
			json_build_object(
				'id', p.id,
				'title', p.title
			)
		)
	FROM users u
	LEFT JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'json_agg',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: false } //left join
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: false } //left join
									}
								]
							}
						]
					},
					notNull: true, //[{id: null, title: null}]
					table: ''
				}
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`SELECT json_agg() FILTER(WHERE p.id is not null) FROM users u LEFT JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		json_agg(
			json_build_object(
				'id', p.id,
				'title', p.title
			)
		) FILTER(WHERE p.id is not null)
	FROM users u
	LEFT JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'json_agg',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true }//FILTER(WHERE p.id is not null)
									}
								]
							}
						]
					},
					notNull: false, //null
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

	it(`SELECT COALESCE(json_agg() FILTER(WHERE p.id is not null), '[]') FROM users u LEFT JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		COALESCE(json_agg(
			json_build_object(
				'id', p.id,
				'title', p.title
			)
		) FILTER(WHERE p.id is not null), '[]')
	FROM users u
	LEFT JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'coalesce',
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

	it(`SELECT json_agg() FROM users u INNER JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		json_agg(
			json_build_object(
				'id', p.id,
				'title', p.title
			)
		)
	FROM users u
	INNER JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'json_agg',
					notNull: true, // INNER JOIN without FILTER
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true }
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true } //INNER JOIN (title TEXT NOT NULL)
									}
								]
							}
						]
					},
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

	it(`SELECT json_agg() FILTER(WHERE p.id is not null) FROM users u INNER JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		json_agg(
			json_build_object(
				'id', p.id,
				'title', p.title
			)
		) FILTER(WHERE p.title = 'abc')
	FROM users u
	INNER JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'json_agg',
					notNull: false, // FILTER
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true }
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true } //INNER JOIN (title TEXT NOT NULL)
									}
								]
							}
						]
					},
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

	it(`SELECT json_agg(p.*) FILTER(WHERE p.id is not null) FROM users u LEFT JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		json_agg(p.*) FILTER(WHERE p.id is not null)
	FROM users u
	LEFT JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'json_agg',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'body',
										type: { name: 'json_field', type: 'text', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'fk_user',
										type: { name: 'json_field', type: 'int4', notNull: false }//FILTER(WHERE p.id is not null)
									}
								]
							}
						]
					},
					notNull: false, //null
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

	it(`SELECT json_agg(p) FILTER(WHERE p.id is not null) FROM users u LEFT JOIN posts p`, async () => {
		const sql = `SELECT
		u.id as user_id,
		u.name as user_name,
		json_agg(p) FILTER(WHERE p.id is not null)
	FROM users u
	LEFT JOIN posts p on p.fk_user = u.id
	group by u.id, u.name`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: 'json_agg',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'title',
										type: { name: 'json_field', type: 'text', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'body',
										type: { name: 'json_field', type: 'text', notNull: true }//FILTER(WHERE p.id is not null)
									},
									{
										key: 'fk_user',
										type: { name: 'json_field', type: 'int4', notNull: false }//FILTER(WHERE p.id is not null)
									}
								]
							}
						]
					},
					notNull: false, //null
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

	it(`SELECT json_agg(json_build_object('key', (subquery)))`, async () => {
		const sql = `SELECT 
		json_agg(
			json_build_object(
			'id', t.id,
			'value', t.value,
			'subquery', (select json_build_object('key', 10))
			)
		) 
		FROM mytable1 t`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: "json_agg",
					notNull: true,
					type: {
						name: "json[]",
						properties: [
							{
								name: "json",
								notNull: true,
								properties: [
									{
										key: "id",
										type: {
											name: "json_field",
											type: "int4",
											notNull: true,
										},
									},
									{
										key: "value",
										type: {
											name: "json_field",
											type: "int4",
											notNull: false,
										},
									},
									{
										key: "subquery",
										type: {
											name: "json",
											notNull: false,
											properties: [
												{
													key: "key",
													type: {
														name: "json_field",
														type: "int4",
														notNull: true,
													},
												},
											],
										},
									},
								],
							},
						],
					},
					table: "",
				},
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it(`SELECT id, name, (SELECT json_build_object(...))`, async () => {
		const sql = `SELECT
			u.id AS user_id,
			u.name AS user_name,
			(
				SELECT json_build_object(
				'id', p.id,
				'title', p.title
				)
				FROM posts p
				WHERE p.fk_user = u.id
				ORDER BY p.id DESC
				LIMIT 1
			) AS latest_order
			FROM users u`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'user_id',
					type: 'int4',
					notNull: true,
					table: 'u'
				},
				{
					name: 'user_name',
					type: 'text',
					notNull: true,
					table: 'u'
				},
				{
					name: "latest_order",
					notNull: false,
					type: {
						name: "json",
						notNull: false,
						properties: [
							{
								key: "id",
								type: {
									name: "json_field",
									type: "int4",
									notNull: true,
								},
							},
							{
								key: "title",
								type: {
									name: "json_field",
									type: "text",
									notNull: true,
								}
							}
						],
					},
					table: "",
				},
			],
			parameters: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	})

	it(`SELECT json_agg(t) FROM (SELECT, u.id, u.name, json_agg(json_build_object()))`, async () => {
		const sql = `SELECT 
			  json_agg(t)
			FROM (
			  SELECT 
			    u.id,
			    u.name,
			  json_agg(
			    json_build_object(
			      'id', p.id,
			      'title', p.title
			    )
			  ) FILTER(WHERE p.id is not null) as posts
			  FROM users u
			  LEFT JOIN posts p ON u.id = p.fk_user
			  GROUP BY u.id, u.name
			) t`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'json_agg',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'id',
										type: { name: 'json_field', type: 'int4', notNull: true }
									},
									{
										key: 'name',
										type: { name: 'json_field', type: 'text', notNull: true }
									},
									{
										key: 'posts',
										type: {
											name: 'json[]',
											properties: [
												{
													name: 'json',
													notNull: true,
													properties: [
														{
															key: 'id',
															type: { name: 'json_field', type: 'int4', notNull: true }//FILTER(WHERE p.id is not null)
														},
														{
															key: 'title',
															type: { name: 'json_field', type: 'text', notNull: true }//FILTER(WHERE p.id is not null)
														},
													]
												}
											]
										}
									}
								]
							}
						]

					},
					notNull: true, //json_agg
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'key',
										type: { name: 'json_field', type: 'int4', notNull: true }
									}
								]
							}
						]
					},
					notNull: true,
					table: '',
				},
				{
					name: 'col2',
					type: {
						name: 'json[]',
						properties: [
							{
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'key',
										type: { name: 'json_field', type: 'int4', notNull: true }
									}
								]
							}
						]
					},
					notNull: true,
					table: ''
				},
				{
					name: 'col3', //[null]
					type: {
						name: 'json[]',
						properties: [{ name: 'json_field', type: 'null', notNull: false }]
					},
					notNull: true,
					table: ''
				},
				{
					name: 'col4', //[null]
					type: {
						name: 'json[]',
						properties: [{ name: 'json_field', type: 'null', notNull: false }]
					},
					notNull: true,
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'key',
										type: { name: 'json_field', type: 'text', notNull: true }
									}
								]
							}
						],
					},
					notNull: true,
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
		const actual = await describeQuery(client, sql, schemaInfo);
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
								name: 'json',
								notNull: true,
								properties: [
									{
										key: 'key',
										type: { name: 'json_field', type: 'text', notNull: true }
									},
									{
										key: 'key2',
										type: { name: 'json_field', type: 'int4', notNull: true }
									}
								]
							}
						],
					},
					notNull: true,
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

	it(`SELECT json_build_object('total', SUM(m.id), 'count', ...) AS sum FROM mytable1 m`, async () => {
		const sql = `
				SELECT
					json_build_object(
						'total', SUM(m.id),
						'count', COUNT(m.id),
						'plus', id+id,
						'minus', id-id,
						'mult', id*id,
						'div', id/id, -- result type is the same 5/2 is 2: int4
						'concat', CONCAT('a', 'b'),
						'coalesce', COALESCE(m.id, 0),
						'days',  DATE '2020-01-02' - DATE '2020-01-01',
						'nested', COALESCE(json_agg(jsonb_build_object(
							'key1', 'value',
							'key2', 10
						))),
						'array', array[1, 2]
					) AS sum
				FROM mytable1 m
				GROUP BY id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'sum',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'total',
								type: { name: 'json_field', type: 'int8', notNull: false }
							},
							{
								key: 'count',
								type: { name: 'json_field', type: 'int8', notNull: true }
							},
							{
								key: 'plus',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'minus',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'mult',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'div',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'concat',
								type: { name: 'json_field', type: 'text', notNull: true }
							},
							{
								key: 'coalesce',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'days',
								type: { name: 'json_field', type: 'int4', notNull: true }
							},
							{
								key: 'nested',
								type: {
									name: 'json[]',
									properties: [
										{
											name: 'json',
											notNull: true,
											properties: [
												{
													key: 'key1',
													type: { name: 'json_field', type: 'text', notNull: true }
												},
												{
													key: 'key2',
													type: { name: 'json_field', type: 'int4', notNull: true }
												}
											]
										}

									]
								},

							},
							{
								key: 'array',
								type: { name: 'json_field', type: 'int4[]', notNull: true }
							}
						],
					},
					notNull: true,
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

	it(`SELECT json_build_object('total', SUM(m.id), ....) AS sum FROM mytable1 m`, async () => {
		const sql = `
				SELECT
					json_build_object(
						'sum_int2', SUM(t.int2_column),
						'sum_int4', SUM(t.int4_column),
						'sum_int8', SUM(t.int8_column),
						'sum_numeric', SUM(t.numeric_column),
						'sum_float4', SUM(t.float4_column),
						'sum_float8', SUM(t.float8_column)
					) AS result
				FROM all_types t`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'sum_int2',
								type: { name: 'json_field', type: 'int8', notNull: false }
							},
							{
								key: 'sum_int4',
								type: { name: 'json_field', type: 'int8', notNull: false }
							},
							{
								key: 'sum_int8',
								type: { name: 'json_field', type: 'numeric', notNull: false }
							},
							{
								key: 'sum_numeric',
								type: { name: 'json_field', type: 'numeric', notNull: false }
							},
							{
								key: 'sum_float4',
								type: { name: 'json_field', type: 'float4', notNull: false }
							},
							{
								key: 'sum_float8',
								type: { name: 'json_field', type: 'float8', notNull: false }
							}
						],
					},
					notNull: true,
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

	it(`SELECT json_build_object('total', EXTRACT(YEAR FROM DATE '2025-07-14')) AS sum FROM mytable1 m`, async () => {
		const sql = `
				SELECT
					json_build_object(
						'extract_year', EXTRACT(YEAR FROM DATE '2025-07-14')
					) AS result
				FROM mytable1 m
				GROUP BY id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'extract_year',
								type: { name: 'json_field', type: 'float8', notNull: true }
							}
						],
					},
					notNull: true,
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

	it(`SELECT json_build_object('nested', (SELECT COALESCE(json_agg())) AS sum FROM mytable1 m`, async () => {
		const sql = `
				SELECT
					json_build_object(
						'nested', (SELECT COALESCE(json_agg(jsonb_build_object(
							'key1', 'value',
							'key2', 10
						))))
					) AS sum
				FROM mytable1 m
				GROUP BY id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'sum',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'nested',
								type: {
									name: 'json[]',
									properties: [
										{
											name: 'json',
											notNull: true,
											properties: [
												{
													key: 'key1',
													type: { name: 'json_field', type: 'text', notNull: true }
												},
												{
													key: 'key2',
													type: { name: 'json_field', type: 'int4', notNull: true }
												}
											]
										}
									]
								},
							}
						],
					},
					notNull: true,
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

	it(`SELECT json_build_object('case', CASE WHEN id = 0 THEN 'a' ELSE 'b' END ) AS sum AS sum FROM mytable1 m`, async () => {
		const sql = `
				SELECT
					json_build_object(
						'case', CASE WHEN id = 0 THEN 'a' ELSE 'b' END
					) AS sum
				FROM mytable1 m
				GROUP BY id`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'sum',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'case',
								type: { name: 'json_field', type: 'text', notNull: true }
							}
						],
					},
					notNull: true,
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

	it(`json_build_object - dynamic json`, async () => {
		const sql = `
				SELECT
					json_build_object(
						'case', CASE
							WHEN id = 1 THEN json_build_object('a', 1)
							WHEN id = 2 THEN json_build_object('b', 2)
							ELSE json_build_object('c', 3) END
				) AS result
				FROM mytable1 m`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'case',
								type: { name: 'json_field', type: 'json', notNull: true }
							}
						],
					},
					notNull: true,
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

	it(`SELECT json_build_array('a', 1, 2, 3, 'b') as result`, async () => {

		const sql = `
				SELECT json_build_array('a', 1, 2, 3, 'b') as result`;
		const actual = await describeQuery(client, sql, schemaInfo);
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
							{ name: 'json_field', type: 'text', notNull: true },
							{ name: 'json_field', type: 'int4', notNull: true },
							{ name: 'json_field', type: 'int4', notNull: true },
							{ name: 'json_field', type: 'int4', notNull: true },
							{ name: 'json_field', type: 'text', notNull: true }
						]
					},
					notNull: true,
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

	it(`SELECT json_build_array(id, name, descr) as result FROM mytable2`, async () => {

		const sql = `
				SELECT json_build_array(id, name, descr) as result FROM mytable2`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json[]',
						properties: [
							{ name: 'json_field', type: 'int4', notNull: true },
							{ name: 'json_field', type: 'text', notNull: false },
							{ name: 'json_field', type: 'text', notNull: false },
						]
					},
					notNull: true,
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

	it(`SELECT json_build_array(json_build_array('a', 1), json_build_array('b', 2)) as result`, async () => {

		const sql = `
				SELECT json_build_array(json_build_array('a', 1), json_build_array('b', 2)) as result`;
		const actual = await describeQuery(client, sql, schemaInfo);
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
								name: 'json[]',
								properties: [
									{ name: 'json_field', type: 'text', notNull: true },
									{ name: 'json_field', type: 'int4', notNull: true }
								]
							},
							{
								name: 'json[]',
								properties: [
									{ name: 'json_field', type: 'text', notNull: true },
									{ name: 'json_field', type: 'int4', notNull: true }
								]
							}
						]
					},
					notNull: true,
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

	it(`SELECT json_build_array(json_build_array('a', null), json_build_array('b', null)) as result`, async () => {

		const sql = `
				SELECT json_build_array(json_build_array('a', null), json_build_array('b', null)) as result`;
		const actual = await describeQuery(client, sql, schemaInfo);
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
								name: 'json[]',
								properties: [
									{ name: 'json_field', type: 'text', notNull: true },
									{ name: 'json_field', type: 'null', notNull: false }
								]
							},
							{
								name: 'json[]',
								properties: [
									{ name: 'json_field', type: 'text', notNull: true },
									{ name: 'json_field', type: 'null', notNull: false }
								]
							}
						]
					},
					notNull: true,
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

	it(`SELECT row_to_json(mytable1) from mytable1`, async () => {

		const sql = 'SELECT row_to_json(mytable1) as result from mytable1';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'id',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: true
								}
							},
							{
								key: 'value',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: false
								}
							}
						]
					},
					notNull: true,
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

	it('SELECT row_to_json(t) as result from mytable1 t', async () => {

		const sql = 'SELECT row_to_json(t) as result from mytable1 t';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'id',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: true
								}
							},
							{
								key: 'value',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: false
								}
							}
						]
					},
					notNull: true,
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

	it(`select row_to_json(row(1, 2, 'b')) as result`, async () => {

		const sql = `select row_to_json(row(1, 2, 'b')) as result`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'f1',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: true
								}
							},
							{
								key: 'f2',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: true
								}
							},
							{
								key: 'f3',
								type: {
									name: 'json_field',
									type: 'text',
									notNull: true
								}
							}
						]
					},
					notNull: true,
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

	it('SELECT u.id, json_agg(row_to_json(p)) filter (where p.id is not null) as posts', async () => {

		const sql = `SELECT
		u.id,
		json_agg(row_to_json(p)) filter (where p.id is not null) as posts
	FROM users u
	LEFT JOIN posts p ON u.id = p.fk_user
	GROUP BY u.id`;
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
										type: {
											name: 'json_field',
											type: 'int4',
											notNull: true
										}
									},
									{
										key: 'title',
										type: {
											name: 'json_field',
											type: 'text',
											notNull: true //FILTER (WHERE...)
										}
									},
									{
										key: 'body',
										type: {
											name: 'json_field',
											type: 'text',
											notNull: true //FILTER (WHERE...)
										}
									},
									{
										key: 'fk_user',
										type: {
											name: 'json_field',
											type: 'int4',
											notNull: false //should be non-null, guaranteed by join condition (ON u.id = p.fk_user)
										}
									}
								]
							}
						]
					},
					notNull: false, //filter
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

	it('SELECT * FROM clients JOIN addresses primaryAddress LEFT JOIN addresses secondaryAddress', async () => {
		const sql = `
			  SELECT
	    c.id,
	    json_build_object(
	      'id', a1.id,
	      'address', a1.address
	    ) AS primaryAddress,
	    CASE
	      WHEN a2.id IS NOT NULL THEN json_build_object(
	        'id', a2.id,
	        'address', a2.address,
	        'value', t1.id
	      )
	      ELSE NULL
	    END AS secondaryAddress
	  FROM clients c
	  JOIN addresses a1 ON c.primaryAddress = a1.id
	  LEFT JOIN addresses a2 ON c.secondaryAddress = a2.id
	  LEFT JOIN mytable1 t1 ON c.secondaryAddress = t1.id
			`;
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
					table: 'c'
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
					table: ''
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
							},
							{
								key: 'value',
								type: { name: 'json_field', type: 'int4', notNull: false } //LEFT JOIN
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

	it(`SELECT json_object_agg(id, value) as result from mytable1`, async () => {

		const sql = 'SELECT json_object_agg(id, value) as result from mytable1';
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json_map',
						type: {
							name: 'json_field',
							type: 'int4',
							notNull: false
						}
					},
					notNull: true,
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

	it(`SELECT json_build_object('positive_number_column', positive_number_column) as result FROM all_types`, async () => {

		const sql = `SELECT json_build_object('positive_number_column', positive_number_column) as result FROM all_types`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'result',
					type: {
						name: 'json',
						notNull: true,
						properties: [
							{
								key: 'positive_number_column',
								type: {
									name: 'json_field',
									type: 'int4',
									notNull: false
								}
							}
						]
					},
					notNull: true,
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