import assert from "assert";
import { preprocessSql } from "../src/parser";
import { PreprocessedSql } from "../src/types";

describe('preprocess-sql', () => {

    it('preprocess sql with several parameters', async () => {

        const sql = 'select * from mytable1 where :id = 10 or :id=1 or : name > 10or:param1>0and :PARAM>0 and :PARAM1>0 and 10>20';
        const actual = preprocessSql(sql);

        const expected :PreprocessedSql = {
            sql: 'select * from mytable1 where ? = 10 or ?=1 or : name > 10or?>0and ?>0 and ?>0 and 10>20',
            namedParameters: ['id', 'id', 'param1', 'PARAM', 'PARAM1']
        }

        assert.deepEqual(actual, expected);
    })

    it('preprocess sql without parameters', async () => {

        const sql = 'select * from mytable1';
        const actual = preprocessSql(sql);

        const expected :PreprocessedSql = {
            sql: 'select * from mytable1',
            namedParameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it.skip('preprocess sql with invalid parameter names', async () => {

        const sql = 'select * from mytable1 where :1 > 0 or :=0 or :111 > 0';
        const actual = preprocessSql(sql);

        const expected :PreprocessedSql = {
            sql: 'select * from mytable1',
            namedParameters: []
        }

        assert.deepEqual(actual, expected);
    })


});