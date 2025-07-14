import assert from 'node:assert';
import { parseSql } from '../src/describe-query';
import { createMysqlClientForTest } from '../src/queryExectutor';
import { isLeft } from 'fp-ts/lib/Either';
import type { MySqlDialect, SchemaDef } from '../src/types';

describe('Test simple select statements', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
	});

	//https://dev.mysql.com/doc/refman/8.0/en/comments.html
	it('# This comment continues to the end of line', async () => {
		const sql = `
        SELECT id FROM mytable1     # This comment continues to the end of line
        `;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('-- This comment continues to the end of line', async () => {
		const sql = `
        SELECT id FROM mytable1    -- This comment continues to the end of line
        `;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('/* this is an in-line comment */', async () => {
		const sql = `
        SELECT id /* this is an in-line comment */ FROM mytable1
        `;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('/* this is a multiple-line comment */', async () => {
		const sql = `
        /*
        this is a
        multiple-line comment
        */
        SELECT id
        /*
        this is a
        multiple-line comment
        */
        FROM mytable1
        `;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
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
