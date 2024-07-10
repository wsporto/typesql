import assert from 'node:assert';
import { parseSql } from '@wsporto/ts-mysql-parser/dist/sqlite';
import { isNotNull } from '../../src/sqlite-query-analyzer/traverse';

function getWhereExpr(sql: string) {
	const parser = parseSql(sql);
	const sql_stmt = parser.sql_stmt();
	const whereExpr = sql_stmt.select_stmt().select_core(0)._whereExpr;
	return whereExpr;
}

describe('sqlite-infer-nullability', () => {
	it('SELECT value FROM mytable1 WHERE value is not null', () => {
		const sql = 'SELECT value FROM mytable1 WHERE value is not null';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});

	it('select value from mytable1 where 10 > value', () => {
		const sql = 'select value from mytable1 where 10 > value';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});

	it('select value from mytable1 where value is not null or (id > 0 or value is not null)', () => {
		const sql =
			'select value from mytable1 where value is not null or (id > 0 or value is not null)';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, false); //todo changed
	});

	it('select value from mytable1 where value is not null and (id > 0 or value is not null)', () => {
		const sql =
			'select value from mytable1 where value is not null and (id > 0 or value is not null)';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});

	it('select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))', () => {
		const sql =
			'select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});

	it('select value from mytable1 where id > 0 and id < 10 and value > 1', () => {
		const sql =
			'select value from mytable1 where id > 0 and id < 10 and value > 1';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});

	it('select value from mytable1 where value is not null and (value > 1 or value is null)', () => {
		const sql =
			'select value from mytable1 where value is not null and (value > 1 or value is null)';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});

	it('select value from mytable1 where value is not null or (value > 1 and value is null)', () => {
		const sql =
			'select value from mytable1 where value is not null or (value > 1 and value is null)';
		const whereExpr = getWhereExpr(sql);

		const actual = isNotNull('value', whereExpr);

		assert.deepStrictEqual(actual, true);
	});
});
