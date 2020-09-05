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

    it(`SELECT HOUR(?), MINUTE(?), SECOND(?)`, () => {
        const sql = `SELECT HOUR(?), MINUTE(?), SECOND(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int', 'tinyint', 'tinyint'],
            parameters: ['time', 'time', 'time']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT HOUR(?), MINUTE(?), SECOND(?)`, () => {
        const sql = `SELECT MINUTE(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['tinyint'],
            parameters: ['time']   
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT HOUR("2017-06-20 09:34:00");', () => {
        const sql = `SELECT 
            HOUR("2017-06-20 09:34:00"), HOUR('2017-06-20 09:34:00'), 
            HOUR("09:34:00"), HOUR('09:34:00'),
            HOUR("09:34"), HOUR('09:34')
        `
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int', 'int', 'int', 'int', 'int', 'int'],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT MINUTE("2017-06-20 09:34:00");', () => {
        const sql = `SELECT 
            MINUTE("2017-06-20 09:34:00"), MINUTE('2017-06-20 09:34:00'), 
            MINUTE("09:34:00"), MINUTE('09:34:00'),
            MINUTE("09:34"), MINUTE('09:34')
        `
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['tinyint', 'tinyint', 'tinyint', 'tinyint', 'tinyint', 'tinyint'],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT SECOND("2017-06-20 09:34:00");', () => {
        const sql = `SELECT 
            SECOND("2017-06-20 09:34:00"), SECOND('2017-06-20 09:34:00'), 
            SECOND("09:34:00"), SECOND('09:34:00'),
            SECOND("09:34"), SECOND('09:34')
        `
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['tinyint', 'tinyint', 'tinyint', 'tinyint', 'tinyint', 'tinyint'],
            parameters: []
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
            parameters: ['?', '?']   
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
            parameters: ['?']   
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

    it(`SELECT COALESCE (VALUE, ID) FROM mytable1`, () => {
        const sql = `SELECT COALESCE (VALUE, ID) FROM mytable1`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT COALESCE (double_column, int_column, ?) FROM all_types`, () => {
        const sql = `
        SELECT 
            COALESCE (double_column, int_column), 
            COALESCE (double_column, int_column, ?), 
            COALESCE (int_column, bigint_column, smallint_column, ?) 
        FROM all_types`;
        // const sql = 'SELECT COALESCE (double_column, int_column, ?) from all_types';
        
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['double', 'any', 'any'],
            parameters: ['any', 'any']   
        }
        // const expected : TypeInferenceResult = {
        //     columns: ['?'],
        //     parameters: ['?']   
        // }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT COALESCE (varchar_column, ?) FROM all_types`, () => {
        const sql = `SELECT COALESCE (varchar_column, CONCAT(?, ?)) FROM all_types`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['varchar'],
            parameters: ['?', '?']   
        }

        assert.deepEqual(actual, expected);
    })

    //unit: MICROSECOND (microseconds), SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, or YEAR
    it(`SELECT TIMESTAMPDIFF(MONTH, ?, ?), ...`, () => {
        const sql = `SELECT 
            TIMESTAMPDIFF(MICROSECOND, ?, ?),
            TIMESTAMPDIFF(SECOND, ?, ?),
            TIMESTAMPDIFF(MINUTE, ?, ?),
            TIMESTAMPDIFF(HOUR, ?, ?),
            TIMESTAMPDIFF(DAY, ?, ?),
            TIMESTAMPDIFF(WEEK, ?, ?),
            TIMESTAMPDIFF(MONTH, ?, ?),
            TIMESTAMPDIFF(QUARTER, ?, ?),
            TIMESTAMPDIFF(year, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int'],
            parameters: ['date', 'date', 'date', 'date', 'date', 'date', 'date', 'date', 
            'date', 'date', 'date', 'date', 'date', 'date', 'date', 'date', 'date', 'date']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT TIMESTAMPDIFF(SECOND, CURTIME(), CURTIME())`, () => {
        const sql = `SELECT TIMESTAMPDIFF(SECOND, CURTIME(), CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception'); //Only DATE and DATETIME are allowed
        }
        catch(e) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT TIMESTAMPDIFF(SECOND, CURDATE(), CURDATE())`, () => {
        const sql = `SELECT TIMESTAMPDIFF(SECOND, CURDATE(), CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: ['int'],
            parameters: []   
        }

        assert.deepEqual(actual, expected);
    })
    
})