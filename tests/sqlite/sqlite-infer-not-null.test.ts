import assert from 'node:assert';
import { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';
import type { ColumnInfo } from '../../src/mysql-query-analyzer/types';

describe('sqlite-infer-not-null.test', () => {
	it('select with left join', () => {
		const sql = `
        select t1.id, t2.id, t1.value, t2.name 
        from mytable1 t1 
        left join mytable2 t2 on t1.id = t2.id;
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		const expected = [true, false, false, false];

		assert.deepStrictEqual(actual, expected);
	});

	it('select with left join when the first table has no alias', () => {
		//the parser reads LEFT as the alias of mytable1, so the join operator is only JOIN
		const sql = `
        select mytable1.id, mytable2.id, mytable1.value, mytable2.name
        from mytable1
        left join mytable2 on mytable1.id = mytable2.id
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true, false, false, false]);
	});

	it('select with left join when only the joined table has an alias', () => {
		const sql = `
        select mytable1.id, t2.id
        from mytable1
        LEFT JOIN mytable2 t2 on mytable1.id = t2.id
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true, false]);
	});

	it('select from mytable1 as left join: left is an alias, so this is an inner join', () => {
		//sqlite: "from a as left join b" is "a" aliased as "left", then a plain JOIN
		const sql = `
        select left.id, mytable2.id
        from mytable1 as left
        join mytable2 on left.id = mytable2.id
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true, true]);
	});

	it('select value from mytable1 where value >= 1', () => {
		const sql = 'select value from mytable1 where value >= 1';

		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true]);
	});

	it('select value from mytable1 where value <= 1', () => {
		const sql = 'select value from mytable1 where value <= 1';

		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true]);
	});

	it('SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1', () => {
		const sql = 'SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1'; // not null union null
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [false]);
	});

	it('SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1 where value is not null', () => {
		const sql = 'SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1 where value is not null'; // not null union not null
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true]);
	});
});

function getColumnNullability(columns: ColumnInfo[]) {
	return columns.map((col) => col.notNull);
}
