import assert from "assert";
import { parseAndInfer } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { TypeInferenceResult } from "../../src/mysql-query-analyzer/types";

describe('type-inference - functions', () => {

    it(`SELECT NOW(), CURDATE(), CURTIME()`, () => {
        const sql = `SELECT NOW(), CURDATE(), CURTIME()`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['datetime', 'date', 'time'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    //The YEAR Type: As the result of functions that return a value that is acceptable in YEAR context, such as NOW().
    //https://dev.mysql.com/doc/refman/8.0/en/year.html
    //But the SQL binary protocol returns BIGINT
    it(`SELECT YEAR(NOW()), YEAR(CURDATE())`, () => {
        const sql = `SELECT YEAR(NOW()), YEAR(CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['year', 'year'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT MONTH(NOW()), MONTH(CURDATE())`, () => {
        const sql = `SELECT MONTH(NOW()), MONTH(CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['tinyint', 'tinyint'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT DAY(NOW()), DAY(CURDATE())`, () => {
        const sql = `SELECT DAY(NOW()), DAY(CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['tinyint', 'tinyint'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT YEAR(CURTIME())`, () => {
        const sql = `SELECT YEAR(CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception');
        }
        catch(e) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT MONTH(CURTIME())`, () => {
        const sql = `SELECT MONTH(CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception');
        }
        catch(e) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT DAY(CURTIME())`, () => {
        const sql = `SELECT DAY(CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception');
        }
        catch(e) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT YEAR(?), MONTH(?), DAY(?)`, () => {
        const sql = `SELECT YEAR(?), MONTH(?), DAY(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['year', 'tinyint', 'tinyint'],
            parameters: ['date', 'date', 'date']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT LPAD('hi',4,'??')`, () => {
        const sql = `SELECT LPAD('hi',4,'??')`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT LPAD(?, ?, ?), RPAD(?, ?, ?)`, () => {
        const sql = `SELECT LPAD(?, ?, ?), RPAD(?, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar', 'varchar'],
            parameters: ['varchar', 'int', 'varchar', 'varchar', 'int', 'varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT LOWER(?), LCASE(?), UPPER(?), UCASE(?), LTRIM(?), RTRIM(?)`, () => {
        const sql = `SELECT LOWER(?), LCASE(?), UPPER(?), UCASE(?), LTRIM(?), RTRIM(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar', 'varchar', 'varchar'],
            parameters: ['varchar', 'varchar', 'varchar', 'varchar', 'varchar', 'varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TRIM(' x '), TRIM(' ? '), TRIM(?)`, () => {
        const sql = `SELECT TRIM(' x '), TRIM(' ? '), TRIM(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar'],
            parameters: ['varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TRIM(LEADING ? FROM ?), TRIM(TRAILING ? FROM ?), TRIM(BOTH ? FROM ?)`, () => {
        const sql = `SELECT TRIM(LEADING ? FROM ?), TRIM(TRAILING ? FROM ?), TRIM(BOTH ? FROM ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar'],
            parameters: ['varchar', 'varchar', 'varchar', 'varchar', 'varchar', 'varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`TRIM varchar - table column`, () => {
        const sql = `SELECT TRIM(name), TRIM(LEADING 'x' FROM name), TRIM(TRAILING 'x' FROM t1.name), TRIM(BOTH 'x' FROM t1.name) FROM mytable2 t1`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TRIM(concat(?, ?, name)) FROM mytable2`, () => {
        const sql = `SELECT TRIM(concat(?, ?, name)) FROM mytable2`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar'],
            parameters: ['varchar', 'varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT LENGTH(?)`, () => {
        const sql = `SELECT LENGTH(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int'],
            parameters: ['varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT LENGTH(concat(name, ?)) FROM mytable2`, () => {
        const sql = `SELECT LENGTH(concat(name, ?)) FROM mytable2`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int'],
            parameters: ['varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT SUBSTRING(?, ?), SUBSTRING(?, ?, ?)`, () => {
        const sql = `SELECT SUBSTRING(?, ?), SUBSTRING(?, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar', 'varchar'],
            parameters: ['varchar', 'int', 'varchar', 'int', 'int']   
        }

        assert.deepEqual(actual, expected);
    })
})