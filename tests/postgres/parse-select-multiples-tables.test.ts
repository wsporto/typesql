import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('sqlite-parse-select-multiples-tables', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('parse a basic with inner join', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr)
		const sql = `
        SELECT * 
        FROM mytable1 t1 
        INNER JOIN mytable2 t2 on t2.id = t1.id
        `;
		const actual = await describeQuery(postres, sql, [])();
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'id', //TODO - rename fields
					type: 'int4',
					notNull: true,
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'descr',
					type: 'text',
					notNull: false,
					table: 'table'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
