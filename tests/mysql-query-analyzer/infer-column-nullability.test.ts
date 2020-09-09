import assert from "assert";
import { parseAndInferNotNull } from "../../src/mysql-query-analyzer/infer-column-nullability";
import { dbSchema } from "./create-schema";

describe('Infer column nullability', () => {

    it(`SELECT id FROM mytable1`, () => {
        const sql = `SELECT id FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT value FROM mytable1`, () => {
        const sql = `SELECT value FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT value FROM mytable1 WHERE value is not null`, () => {
        const sql = `SELECT value FROM mytable1 WHERE value is not null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT * FROM mytable1 WHERE value is not null`, () => {
        const sql = `SELECT * FROM mytable1 WHERE value is not null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id+id FROM mytable1`, () => {
        const sql = `SELECT id+id FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id+value FROM mytable1`, () => {
        const sql = `SELECT id+value FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id+null FROM mytable1`, () => {
        const sql = `SELECT id+null FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id*2.5 FROM mytable1`, () => {
        const sql = `SELECT id*2.5 FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id+value FROM mytable1 where value is not null`, () => {
        const sql = `SELECT id+value FROM mytable1 where value is not null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT count(*) FROM mytable1`, () => {
        const sql = `SELECT count(*) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT count(name) FROM mytable1`, () => {
        const sql = `SELECT count(value) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(id, id, id) FROM mytable1`, () => {
        const sql = `SELECT concat(id, id, id) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(id, '---', id) FROM mytable1`, () => {
        const sql = `SELECT concat(id, '---', id) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(id, null, id) FROM mytable1`, () => {
        const sql = `SELECT concat(id, null, id) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(id, id, value) FROM mytable1`, () => {
        const sql = `SELECT concat(id, id, value) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(id, id, value) FROM mytable1`, () => {
        const sql = `SELECT concat(id, id, value) FROM mytable1 where value is not null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(?, ?) FROM mytable1`, () => {
        const sql = `SELECT concat(?, ?) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat(?, ifnull(?, null)) FROM mytable1`, () => {
        const sql = `SELECT concat(?, ifnull(?, null)) FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT case when id = 1 then id else id end FROM mytable1`, () => {
        const sql = `SELECT case when id = 1 then id else id end FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT case when id = 1 then id else value end FROM mytable1`, () => {
        const sql = `SELECT case when id = 1 then id else value end FROM mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT case when id = 1 then id else value end FROM mytable1 WHERE value is not null`, () => {
        const sql = `SELECT case when id = 1 then id else value end FROM mytable1 WHERE value is not null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    //verify not null on from ( where value is  not null)
    it(`select quantity from mytable1, (select count(*) as quantity from mytable2) t2`, () => {
        const sql = `select quantity from mytable1, (select count(*) as quantity from mytable2) t2`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    //TODO - consulta inválida; pq passou nos testes?
    it(`SELECT name from mytable1 (SELECT name from mytable2 where name is not null)`, () => {
        const sql = `SELECT name from mytable1 (SELECT name from mytable2 where name is not null)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    //TODO - pq passou nos testes
    it(`SELECT name from (SELECT name from mytable2 where name is not null) t`, () => {
        const sql = `SELECT name from (SELECT name from mytable2 where name is not null) t`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT name from (SELECT name from mytable2) t WHERE name is not null`, () => {
        const sql = `SELECT name from (SELECT name from mytable2) t WHERE name is not null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT lpad(?, ?, ?)`, () => {
        const sql = `SELECT lpad(?, ?, ?)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT lpad(name, ?, ?) FROM mytable2`, () => {
        const sql = `SELECT lpad(name, ?, ?) FROM mytable2`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TRIM(LEADING ? FROM ?), TRIM(TRAILING ? FROM ?), TRIM(BOTH ? FROM ?)`, () => {
        const sql = `SELECT TRIM (?), TRIM(LEADING ? FROM ?), TRIM(TRAILING ? FROM ?), TRIM(BOTH ? FROM ?)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, true, true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TRIM(LEADING ? FROM null), TRIM(LEADING null FROM ?)`, () => {
        const sql = `SELECT 
            TRIM(null),
            TRIM(LEADING 'hi' FROM null), TRIM(LEADING null FROM 'hi'), 
            TRIM(TRAILING 'hi' FROM null), TRIM(TRAILING null FROM 'hi'), 
            TRIM(BOTH 'hi' FROM null), TRIM(BOTH null FROM 'hi')`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false, false, false, false, false, false, false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT SUBSTRING(?, ?), SUBSTRING(?, ?, ?)`, () => {
        const sql = `SELECT SUBSTRING(?, ?), SUBSTRING(?, ?, ?)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, true]

        assert.deepEqual(actual, expected);
    })

    it(`SELECT YEAR(?), MONTH(?), DAY(?), HOUR(?), MINUTE(?), SECOND(?)`, () => {
        const sql = `SELECT YEAR(?), MONTH(?), DAY(?), HOUR(?), MINUTE(?), SECOND(?)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, true, true, true, true, true]

        assert.deepEqual(actual, expected);
    })

    it(`SELECT YEAR(?), MONTH(?), DAY(?), HOUR(?), MINUTE(?), SECOND(?)`, () => {
        const sql = `SELECT COALESCE(id, id, id+id), COALESCE(id, value, id+id) from mytable1`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, false]

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TIMESTAMPDIFF(MONTH, ?, ?)`, () => {
        const sql = `SELECT 
            TIMESTAMPDIFF(MICROSECOND, ?, ?),
            TIMESTAMPDIFF(SECOND, ?, null),
            TIMESTAMPDIFF(MINUTE, ?, ?),
            TIMESTAMPDIFF(HOUR, ?, ?),
            TIMESTAMPDIFF(DAY, ?, ?),
            TIMESTAMPDIFF(WEEK, ?, ?),
            TIMESTAMPDIFF(MONTH, ?, ?),
            TIMESTAMPDIFF(QUARTER, ?, ?),
            TIMESTAMPDIFF(year, ?, ?)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, false, true, true, true, true, true, true, true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT INTERVAL ? MONTH + ?`, () => {
        const sql = `SELECT INTERVAL ? MONTH + ?`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT INTERVAL ? MONTH + STR_TO_DATE(?,'%d,%m,%Y')`, () => {
        const sql = `SELECT INTERVAL ? MONTH + STR_TO_DATE(?,'%d,%m,%Y')`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT INTERVAL ? MONTH + '2018-05-01'`, () => {
        const sql = `SELECT INTERVAL ? MONTH + '2018-05-01'`; //The type inference must guarantee a valid date.
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true];

        assert.deepEqual(actual, expected);
    })

    it(`SELECT INTERVAL ? MONTH + ?`, () => {
        const sql = `SELECT INTERVAL ? MONTH + null`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false];

        assert.deepEqual(actual, expected);
    })

    it(`test ADDDATE, SUBDATE, DATE_ADD and DATE_SUB nullability with date literal`, () => {
        const sql = `SELECT 
            ADDDATE('2008-01-02', INTERVAL 31 DAY),
            SUBDATE('2008-01-02', INTERVAL 31 DAY),
            DATE_ADD('2008-01-02', INTERVAL 31 DAY),
            DATE_SUB('2008-01-02', INTERVAL 31 DAY)`; //The type inference must guarantee a valid date.
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, true, true, true];

        assert.deepEqual(actual, expected);
    })

    it(`test ADDDATE, SUBDATE, DATE_ADD and and DATE_SUB nullability with parameters`, () => {
        const sql = `SELECT 
            ADDDATE(?, INTERVAL ? DAY),
            SUBDATE(?, INTERVAL ? DAY),
            DATE_ADD(?, INTERVAL ? DAY),
            DATE_SUB(?, INTERVAL ? DAY)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [true, true, true, true];

        assert.deepEqual(actual, expected);
    })

    it(`test ADDDATE, SUBDATE, DATE_ADD and DATE_SUB nullability with null paramters`, () => {
        const sql = `SELECT 
            ADDDATE(null, INTERVAL 10 DAY), ADDDATE('2008-01-02', INTERVAL null DAY),
            SUBDATE(null, INTERVAL 10 DAY), SUBDATE('2008-01-02', INTERVAL null DAY),
            DATE_ADD(null, INTERVAL 10 DAY), DATE_ADD('2008-01-02', INTERVAL null DAY),
            DATE_SUB(null, INTERVAL 10 DAY), DATE_SUB('2008-01-02', INTERVAL null DAY)`;
        const actual = parseAndInferNotNull(sql, dbSchema);

        const expected = [false, false, false, false, false, false, false, false];

        assert.deepEqual(actual, expected);
    })
});