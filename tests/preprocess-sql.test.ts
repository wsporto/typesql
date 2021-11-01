import assert from "assert";
import { preprocessSql } from "../src/describe-query";
import { PreprocessedSql } from "../src/types";

describe('preprocess-sql', () => {

    it('preprocess sql with several parameters', async () => {

        const sql = 'select * from mytable1 where :id = 10 or :id=1 or : name > 10or:param1>0and :PARAM>0 and :PARAM1>0 and 10>20';
        const actual = preprocessSql(sql);

        const expected: PreprocessedSql = {
            sql: 'select * from mytable1 where ? = 10 or ?=1 or : name > 10or?>0and ?>0 and ?>0 and 10>20',
            namedParameters: ['id', 'id', 'param1', 'PARAM', 'PARAM1']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it('preprocess sql with undescore and dollar in the param name', async () => {

        const sql = 'select * from mytable1 where id = :emp_id or id = :$1';
        const actual = preprocessSql(sql);

        const expected: PreprocessedSql = {
            sql: 'select * from mytable1 where id = ? or id = ?',
            namedParameters: ['emp_id', '$1']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it('preprocess sql without parameters', async () => {

        const sql = 'select * from mytable1';
        const actual = preprocessSql(sql);

        const expected: PreprocessedSql = {
            sql: 'select * from mytable1',
            namedParameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it('preprocess with string literal', async () => {

        const sql = `SELECT HOUR('13:01:02')`;
        const actual = preprocessSql(sql);

        const expected: PreprocessedSql = {
            sql: `SELECT HOUR('13:01:02')`,
            namedParameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it('preprocess with string literal', async () => {

        const sql = `SELECT HOUR("13:01:02")`;
        const actual = preprocessSql(sql);

        const expected: PreprocessedSql = {
            sql: `SELECT HOUR("13:01:02")`,
            namedParameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it.skip('preprocess sql with invalid parameter names', async () => {

        const sql = 'select * from mytable1 where :1 > 0 or :=0 or :111 > 0';
        const actual = preprocessSql(sql);

        const expected: PreprocessedSql = {
            sql: 'select * from mytable1',
            namedParameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })


});