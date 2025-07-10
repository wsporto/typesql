import assert from 'node:assert';
import type { ParameterDef, SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

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
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'json_build_object',
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'jsonb_build_object',
					type: 'jsonb',
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

	it(`select json_build_array(1,2,'foo',4,5)`, async () => {
		const sql = `select json_build_array(1,2,'foo',4,5)`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'json_build_array',
					type: 'json',
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
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'col1', //to_json(10::int) as col1
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'col2', //to_jsonb(10::int) as col2
					type: 'jsonb',
					notNull: true,
					table: ''
				},
				{
					name: 'col3', //to_json('a'::text) as col3
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'col4', //to_jsonb('a'::text) as col4
					type: 'jsonb',
					notNull: true,
					table: ''
				},
				{
					name: 'col5', //to_json(array[1, 2, 3]) as col5
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'col6', //to_jsonb(array[1, 2, 3]) as col6
					type: 'jsonb',
					notNull: true,
					table: ''
				},
				{
					name: 'col7', //to_json(array['a', 'b', 'c']) as col7
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'col8', //to_jsonb(array['a', 'b', 'c']) as col8
					type: 'jsonb',
					notNull: true,
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
					notNull: true,
					table: ''
				},
				{
					name: 'col12', //to_jsonb(array[null]) as col11
					type: 'jsonb',
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

	it(`select json_agg()`, async () => {
		const sql = `select 
			json_agg(json_build_object('key', 10)) as col1, 
			jsonb_agg(json_build_object('key', 10)) as col2, 
			json_agg(null::text) as col3,
			jsonb_agg(null::text) as col4
			`;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: 'col1',
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'col2',
					type: 'jsonb',
					notNull: true,
					table: ''
				},
				{
					name: 'col3',
					type: 'json',
					notNull: true,
					table: ''
				},
				{
					name: 'col4',
					type: 'jsonb',
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