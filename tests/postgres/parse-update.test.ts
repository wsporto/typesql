import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('postgres-parse-update', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('update mytable1 set value = ? where id = ?', async () => {
		const sql = 'update mytable1 set value = $1 where id = $2';
		const actual = await describeQuery(postres, sql, ['value', 'id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql: 'update mytable1 set value = $1 where id = $2',
			columns: [],
			data: [
				{
					name: 'value',
					columnType: 'int4',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('update mytable3 set name = ? where id = ?', async () => {
		const sql = 'update mytable3 set name = $1 where id = $2';
		const actual = await describeQuery(postres, sql, ['name', 'id']);
		const expected: SchemaDef = {
			multipleRowsResult: false,
			queryType: 'Update',
			sql: 'update mytable3 set name = $1 where id = $2',
			columns: [],
			data: [
				{
					name: 'name',
					columnType: 'text',
					notNull: true
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				}
			]
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('UPDATE mytable1 SET id = CASE WHEN :valueSet THEN :value ELSE value END WHERE id = :id', async () => {
		const sql = `
			UPDATE mytable5 SET id = CASE WHEN $1 THEN $2 ELSE year END WHERE id = $3
				`;

		const actual = await describeQuery(postres, sql, ['valueSet', 'value', 'id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'valueSet',
					columnType: 'bool',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'value',
					columnType: 'int4',
					notNull: true //different from mysql and sqlite
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('UPDATE mytable2 SET name = CASE WHEN :nameSet THEN :name ELSE name END WHERE id = :id', async () => {
		const sql = `
			UPDATE mytable2 SET name = CASE WHEN $1 THEN $2 ELSE name END WHERE id = $3
				`;

		const actual = await describeQuery(postres, sql, ['nameSet', 'name', 'id']);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: [],
			data: [
				{
					name: 'nameSet',
					columnType: 'bool',
					notNull: true //different from mysql and sqlite
				},
				{
					name: 'name',
					columnType: 'text',
					notNull: true //different from mysql and sqlite
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int4',
					notNull: true
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});