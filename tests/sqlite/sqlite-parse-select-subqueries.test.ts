import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';

describe('sqlite-parse-select-subqueries', () => {
	it('parse a select with nested select', async () => {
		const sql = `
        select id from (
            select id from mytable1
        ) t
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with nested select2', async () => {
		const sql = `
        select id, name from (
            select t1.id, t2.name from mytable1 t1
            inner join mytable2 t2 on t1.id = t2.id
        ) t
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't'
				},
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with nested select and alias', async () => {
		const sql = `
        select id from (
            select value as id from mytable1
        ) t1
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with nested select and alias 2', async () => {
		const sql = `
        select id as code from (
            select value as id from mytable1
        ) t1
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'code',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from (subquery)', () => {
		const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				},
				{
					columnName: 'id',
					type: 'TEXT',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select * from (subquery) where', () => {
		const sql = `
        select * from (
            select name, name as id from mytable2
        ) t2
        WHERE t2.id = ? and t2.name = ?
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: true,
					table: 't2'
				},
				{
					columnName: 'id',
					type: 'TEXT',
					notNull: true,
					table: 't2'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with 3-levels nested select', async () => {
		const sql = `
        select id from (
            select id from (
                select id from mytable1 
            ) t1
        ) t2
        `;
		const actual = await parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 't2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
