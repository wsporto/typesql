import assert from "assert";
import { parseAndInferParamNullability } from "../../src/mysql-query-analyzer/parse";

describe('Infer param nullability', () => {

    it(`SELECT ? FROM mytable1`, () => {
        const sql = `SELECT ? FROM mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT ? + id FROM mytable1`, () => {
        const sql = `SELECT ? + id, ?+?, (id+?)*? FROM mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true, true, true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT ? > 1, 1 < ?, ? > 'a', 'a' > ?, ? from mytable1`, () => {
        const sql = `SELECT ? > 1, 1 < ?, ? > 'a', 'a' > ?, ? from mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true, true, true, true];

        assert.deepEqual(actual, expected);
    })
    
    it(`SELECT (select ? from mytable2) from mytable1`, () => {
        const sql = `SELECT (select ?, ?+? from mytable2) from mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT (select ? from mytable2) from mytable1`, () => {
        const sql = `SELECT (select ? from mytable2), ?+id from mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true];

        assert.deepEqual(actual, expected);
    })
    
    it(`SELECT * from mytable1 where id > ?`, () => {
        const sql = `SELECT * from mytable1 WHERE id > ? OR id < ?`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(?, ?) from mytable1 where concat_ws('/', ?) < id`, () => {
        const sql = `SELECT concat(?, ?) from mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(nullif(?, null), ?) from mytable1`, () => {
        const sql = `SELECT concat(nullif(?, null), ?) from mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [false, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(nullif(?, null), ?) from mytable1`, () => {
        const sql = `SELECT concat(nullif(?, 10), ?) from mytable1`;
        const actual = parseAndInferParamNullability(sql);

        const expected = [true, true];

        assert.deepEqual(actual, expected);
    })
});