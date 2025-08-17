import assert from 'node:assert';
import { hasAnnotation, preprocessSql } from '../src/describe-query';
import type { PreprocessedSql } from '../src/types';
import { replaceOrderByParamWithPlaceholder, replaceOrderByPlaceholderWithBuildOrderBy } from '../src/postgres-query-analyzer/util';

describe('preprocess-sql', () => {
	it('preprocess sql with one parameter', async () => {
		const sql = 'select * from mytable1 where :id = 10';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1 where ? = 10',
			namedParameters: [{ paramName: 'id', paramNumber: 1 }]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql with one parameter (?)', async () => {
		const sql = 'select * from mytable1 where ? = 10';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1 where ? = 10',
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql with one parameter ($1)', async () => {
		const sql = 'select * from mytable1 where $1 = 10';
		const actual = preprocessSql(sql, 'postgres');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1 where $1 = 10',
			namedParameters: [{ paramName: 'param1', paramNumber: 1 },]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql with several parameters', async () => {
		const sql = 'select * from mytable1 where :id = 10 or :id=1 or : name > 10or:param1>0and :PARAM>0 and :PARAM1>0 and 10>20';
		const actual = preprocessSql(sql, 'mysql');

		const expected = {
			sql: 'select * from mytable1 where ? = 10 or ?=1 or : name > 10or?>0and ?>0 and ?>0 and 10>20',
			namedParameters: [
				{ paramName: 'id', paramNumber: 1 },
				{ paramName: 'id', paramNumber: 1 },
				{ paramName: 'param1', paramNumber: 2 },
				{ paramName: 'PARAM', paramNumber: 3 },
				{ paramName: 'PARAM1', paramNumber: 4 },
			],
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql with undescore and dollar in the param name', async () => {
		const sql = 'select * from mytable1 where id = :emp_id or id = :$1';
		const actual = preprocessSql(sql, 'mysql');

		const expected = {
			sql: 'select * from mytable1 where id = ? or id = ?',
			namedParameters: [
				{ paramName: 'emp_id', paramNumber: 1 },
				{ paramName: '$1', paramNumber: 2 }
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql without parameters', async () => {
		const sql = 'select * from mytable1';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1',
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess with string literal', async () => {
		const sql = `SELECT HOUR('13:01:02')`;
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: `SELECT HOUR('13:01:02')`,
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess with string literal', async () => {
		const sql = `SELECT HOUR("13:01:02")`;
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: `SELECT HOUR("13:01:02")`,
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it.skip('preprocess sql with invalid parameter names', async () => {
		const sql = 'select * from mytable1 where :1 > 0 or :=0 or :111 > 0';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1',
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('verify @nested comment', async () => {
		const sql = `
        -- @nested
        `;
		const actual = hasAnnotation(sql, '@nested');

		assert.deepStrictEqual(actual, true);
	});

	it('verify without @nested comment', async () => {
		const sql = `
        SELECT * FROM mytable1
        `;
		const actual = hasAnnotation(sql, '@nested');

		assert.deepStrictEqual(actual, false);
	});

	it('verify without @nested not int comment', async () => {
		const sql = `
        SELECT id as @nested FROM mytable1
        `;
		const actual = hasAnnotation(sql, '@nested');

		assert.deepStrictEqual(actual, false);
	});

	it('@safeIntegers:true in comments', async () => {
		const sql = `
        -- @safeIntegers:true
        select * from mytable1`;

		const actual = preprocessSql(sql, 'mysql');
		const expected: PreprocessedSql = {
			sql: `
        -- @safeIntegers:true
        select * from mytable1`,
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('postgres-replace named paramters', async () => {
		const sql = `
        select :value1, :value1, :value2, :value3, :value2 from mytable1`;

		const actual = preprocessSql(sql, 'postgres');
		const expected: PreprocessedSql = {
			sql: `
        select $1, $1, $2, $3, $2 from mytable1`,
			namedParameters: [
				{ paramName: 'value1', paramNumber: 1 },
				{ paramName: 'value1', paramNumber: 1 },
				{ paramName: 'value2', paramNumber: 2 },
				{ paramName: 'value3', paramNumber: 3 },
				{ paramName: 'value2', paramNumber: 2 },
			],
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('handle type-cast id::int2', async () => {
		const sql = `
        select id::int2 from mytable1`;

		const actual = preprocessSql(sql, 'postgres');
		const expected: PreprocessedSql = {
			sql: `
        select id::int2 from mytable1`,
			namedParameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});
});

describe('replaceOrderByParamWithPlaceholder', () => {
	it('replaces ORDER BY with a parameter placeholder', () => {
		const sql = 'SELECT * FROM mytable1 ORDER BY $1';
		const actual = replaceOrderByParamWithPlaceholder(sql);

		const expected = {
			sql: 'SELECT * FROM mytable1 ORDER BY /*__orderByPlaceholder__*/ 1',
			replaced: true,
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('replaces ORDER BY with a named parameter placeholder', () => {
		const sql = 'SELECT * FROM mytable1 ORDER BY :sortKey';
		const actual = replaceOrderByParamWithPlaceholder(sql);

		const expected = {
			sql: 'SELECT * FROM mytable1 ORDER BY /*__orderByPlaceholder__*/ 1',
			replaced: true,
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('returns original sql if no ORDER BY with param found', () => {
		const sql = 'SELECT * FROM mytable1 ORDER BY id DESC';
		const actual = replaceOrderByParamWithPlaceholder(sql);

		const expected = {
			sql,
			replaced: false,
		};

		assert.deepStrictEqual(actual, expected);
	});
});

describe('replaceOrderByPlaceholderWithBuildOrderBy', () => {
	it('replaces the orderBy placeholder with buildOrderBy call', () => {
		const sql = 'SELECT * FROM mytable ORDER BY /*__orderByPlaceholder__*/ 1';
		const actual = replaceOrderByPlaceholderWithBuildOrderBy(sql);

		const expected = 'SELECT * FROM mytable ORDER BY ${buildOrderBy(params.orderBy)}';

		assert.strictEqual(actual, expected);
	});

	it('works with different casing for ORDER BY', () => {
		const sql = 'select * from mytable order by /*__orderByPlaceholder__*/ 1';
		const actual = replaceOrderByPlaceholderWithBuildOrderBy(sql);

		const expected = 'select * from mytable order by ${buildOrderBy(params.orderBy)}';

		assert.strictEqual(actual, expected);
	});

	it('returns original sql if placeholder not present', () => {
		const sql = 'SELECT * FROM mytable ORDER BY created_at DESC';
		const actual = replaceOrderByPlaceholderWithBuildOrderBy(sql);

		assert.strictEqual(actual, sql);
	});

	it('does not replace ORDER BY with numeric constant 1', () => {
		const sql = 'SELECT * FROM mytable ORDER BY 1';
		const actual = replaceOrderByPlaceholderWithBuildOrderBy(sql);

		// Should return the original SQL unchanged
		assert.strictEqual(actual, sql);
	});
});
