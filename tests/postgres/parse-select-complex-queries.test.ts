import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import postgres from 'postgres';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';

describe('parse-select-complex-queries', () => {
	const postres = postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});

	it('parse SELECT t1.name, t2.mycolumn2, t3.mycolumn3, count', async () => {
		//mytable1 (id, value); mytable2 (id, name, descr); mytable3 (id)
		const sql = `
        SELECT t1.value, t2.name, t3.id, count(*) AS quantity
        FROM mytable1 t1
        INNER JOIN mytable2 t2 ON t2.id = t1.id
        LEFT JOIN mytable3 t3 ON t3.id = t2.id
        GROUP BY t1.value, t2.name, t3.id
        HAVING count(*) > 1
        `;
		const actual = await describeQuery(postres, sql, []);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'value',
					type: 'int4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'name',
					type: 'text',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'id',
					type: 'int4',
					notNull: false,
					table: 'table'
				},
				{
					columnName: 'quantity',
					notNull: true,
					type: 'int8',
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
});