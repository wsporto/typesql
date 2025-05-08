import assert from 'node:assert';
import { hasAnnotation, preprocessSql } from '../src/describe-query';
import type { PreprocessedSql } from '../src/types';

describe('preprocess-sql', () => {
	it('preprocess sql with one parameter', async () => {
		const sql = 'select * from mytable1 where :id = 10';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1 where ? = 10',
			namedParameters: ['id']
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql with several parameters', async () => {
		const sql = 'select * from mytable1 where :id = 10 or :id=1 or : name > 10or:param1>0and :PARAM>0 and :PARAM1>0 and 10>20';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1 where ? = 10 or ?=1 or : name > 10or?>0and ?>0 and ?>0 and 10>20',
			namedParameters: ['id', 'id', 'param1', 'PARAM', 'PARAM1']
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('preprocess sql with undescore and dollar in the param name', async () => {
		const sql = 'select * from mytable1 where id = :emp_id or id = :$1';
		const actual = preprocessSql(sql, 'mysql');

		const expected: PreprocessedSql = {
			sql: 'select * from mytable1 where id = ? or id = ?',
			namedParameters: ['emp_id', '$1']
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
        select $1, $2, $3, $4, $5 from mytable1`,
			namedParameters: ['value1', 'value1', 'value2', 'value3', 'value2']
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
