import assert from "assert";
import { parseAndInfer } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { TypeInferenceResult } from "../../src/mysql-query-analyzer/types";

describe('type-inference - functions', () => {

    it(`SELECT NOW(), CURDATE(), CURTIME()`, () => {
        const sql = `SELECT NOW(), CURDATE(), CURTIME()`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime', 'date', 'time'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    //The YEAR Type: As the result of functions that return a value that is acceptable in YEAR context, such as NOW().
    //https://dev.mysql.com/doc/refman/8.0/en/year.html
    //But the SQL binary protocol returns BIGINT
    it(`SELECT YEAR(NOW()), YEAR(CURDATE())`, () => {
        const sql = `SELECT YEAR(NOW()), YEAR(CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['year', 'year'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT MONTH(NOW()), MONTH(CURDATE())`, () => {
        const sql = `SELECT MONTH(NOW()), MONTH(CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['tinyint', 'tinyint'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT DAY(NOW()), DAY(CURDATE())`, () => {
        const sql = `SELECT DAY(NOW()), DAY(CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['tinyint', 'tinyint'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT YEAR(CURTIME())`, () => {
        const sql = `SELECT YEAR(CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception');
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT MONTH(CURTIME())`, () => {
        const sql = `SELECT MONTH(CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception');
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT DAY(CURTIME())`, () => {
        const sql = `SELECT DAY(CURTIME())`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception');
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: time and date';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })

    it(`SELECT YEAR(?), MONTH(?), DAY(?)`, () => {
        const sql = `SELECT YEAR(?), MONTH(?), DAY(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['year', 'tinyint', 'tinyint'],
            parameters: ['date', 'date', 'date']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT HOUR(?), MINUTE(?), SECOND(?)`, () => {
        const sql = `SELECT HOUR(?), MINUTE(?), SECOND(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int', 'tinyint', 'tinyint'],
            parameters: ['time', 'time', 'time']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it('SELECT HOUR, MINUTE and SECOND with literal', () => {
        const sql = `SELECT 
            HOUR("2017-06-20 09:34:00"), MINUTE('2017-06-20 09:34:00'), SECOND('2017-06-20 09:34:00'),
            HOUR("09:34:00"), MINUTE('09:34:00'), SECOND('09:34:00'),
            HOUR("09:34"), MINUTE('09:34'), SECOND('09:34')
        `
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int', 'tinyint', 'tinyint', 'int', 'tinyint', 'tinyint', 'int', 'tinyint', 'tinyint'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT HOUR('2017-06-20')`, () => {
        const sql = `SELECT HOUR('2017-06-20')`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception'); //Only DATE and DATETIME are allowed
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: date and time';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })
    it(`SELECT MINUTE('2017-06-20')`, () => {
        const sql = `SELECT MINUTE('2017-06-20')`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception'); //Only DATE and DATETIME are allowed
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: date and time';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })
    it(`SELECT SECOND('2017-06-20')`, () => {
        const sql = `SELECT SECOND('2017-06-20')`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception'); //Only DATE and DATETIME are allowed
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: date and time';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })

    it('SELECT YEAR, MONTH and DAY with literal', () => {
        const sql = `SELECT 
            YEAR("2017-06-20 09:34:00"), MONTH('2017-06-20 09:34:00'), DAY('2017-06-20 09:34:00'),
            YEAR("2017-06-20"), MONTH('2017-06-20'), DAY('2017-06-20')
        `
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['year', 'tinyint', 'tinyint', 'year', 'tinyint', 'tinyint'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT LPAD('hi',4,'??')`, () => {
        const sql = `SELECT LPAD('hi',4,'??')`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT LPAD(?, ?, ?), RPAD(?, ?, ?)`, () => {
        const sql = `SELECT LPAD(?, ?, ?), RPAD(?, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar'],
            parameters: ['varchar', 'int', 'varchar', 'varchar', 'int', 'varchar']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT LOWER(?), LCASE(?), UPPER(?), UCASE(?), LTRIM(?), RTRIM(?)`, () => {
        const sql = `SELECT LOWER(?), LCASE(?), UPPER(?), UCASE(?), LTRIM(?), RTRIM(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar', 'varchar', 'varchar'],
            parameters: ['varchar', 'varchar', 'varchar', 'varchar', 'varchar', 'varchar']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TRIM(' x '), TRIM(' ? '), TRIM(?)`, () => {
        const sql = `SELECT TRIM(' x '), TRIM(' ? '), TRIM(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar'],
            parameters: ['varchar']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TRIM(LEADING ? FROM ?), TRIM(TRAILING ? FROM ?), TRIM(BOTH ? FROM ?)`, () => {
        const sql = `SELECT TRIM(LEADING ? FROM ?), TRIM(TRAILING ? FROM ?), TRIM(BOTH ? FROM ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar'],
            parameters: ['varchar', 'varchar', 'varchar', 'varchar', 'varchar', 'varchar']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`TRIM varchar - table column`, () => {
        const sql = `SELECT TRIM(name), TRIM(LEADING 'x' FROM name), TRIM(TRAILING 'x' FROM t1.name), TRIM(BOTH 'x' FROM t1.name) FROM mytable2 t1`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TRIM(concat(?, ?, name)) FROM mytable2`, () => {
        const sql = `SELECT TRIM(concat(?, ?, name)) FROM mytable2`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar'],
            parameters: ['?', '?']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT CHAR_LENGTH(?), LENGTH(?)`, () => {
        const sql = `SELECT CHAR_LENGTH(?), LENGTH(?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int', 'int'],
            parameters: ['varchar', 'varchar']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT LENGTH(concat(name, ?)), CHAR_LENGTH(concat(name, ?)) FROM mytable2`, () => {
        const sql = `SELECT LENGTH(concat(name, ?)), CHAR_LENGTH(concat(name, ?)) FROM mytable2`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int', 'int'],
            parameters: ['?', '?']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT SUBSTRING(?, ?), SUBSTRING(?, ?, ?)`, () => {
        const sql = `SELECT SUBSTRING(?, ?), SUBSTRING(?, ?, ?), SUBSTR(?, ?), SUBSTR(?, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar'],
            parameters: ['varchar', 'int', 'varchar', 'int', 'int',
                'varchar', 'int', 'varchar', 'int', 'int']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`Test SUBSTRING(?, ?) function with literal`, () => {
        const sql = `SELECT SUBSTRING('Quadratically', ?), SUBSTRING('Quadratically', ?, ?), SUBSTR('Quadratically', ?), SUBSTR('Quadratically', ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar'],
            parameters: ['int', 'int', 'int',
                'int', 'int', 'int']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`Test SUBSTRING function with FROM and FOR operators`, () => {
        const sql = `SELECT SUBSTRING(? FROM ?), SUBSTRING(? FROM ? FOR ?), SUBSTR(? FROM ?), SUBSTR(? FROM ? FOR ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar', 'varchar', 'varchar'],
            parameters: ['varchar', 'int', 'varchar', 'int', 'int',
                'varchar', 'int', 'varchar', 'int', 'int']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT COALESCE (VALUE, ID) FROM mytable1`, () => {
        const sql = `SELECT COALESCE (VALUE, ID) FROM mytable1`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
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

        const expected: TypeInferenceResult = {
            columns: ['double', 'any', 'any'],
            parameters: ['any', 'any']
        }
        // const expected : TypeInferenceResult = {
        //     columns: ['?'],
        //     parameters: ['?']   
        // }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT COALESCE (varchar_column, ?) FROM all_types`, () => {
        const sql = `SELECT COALESCE (varchar_column, CONCAT(?, ?)) FROM all_types`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar'],
            parameters: ['?', '?']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT DATEDIFF('2003-02-01','2003-05-01 12:05:55')`, () => {
        const sql = `SELECT DATEDIFF('2003-02-01','2003-05-01 12:05:55')`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['bigint'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
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

        const expected: TypeInferenceResult = {
            columns: ['int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int'],
            parameters: ['datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime',
                'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime', 'datetime']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TIMESTAMPDIFF(SECOND, CURTIME(), CURTIME())`, () => {
        const sql = `SELECT TIMESTAMPDIFF(SECOND, CURTIME(), CURTIME())`;
        const actual = parseAndInfer(sql, dbSchema);
        const expected: TypeInferenceResult = {
            columns: ['int'],
            parameters: []
        }
        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TIMESTAMPDIFF(SECOND, CURDATE(), CURDATE())`, () => {
        const sql = `SELECT TIMESTAMPDIFF(SECOND, CURDATE(), CURDATE())`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TIMESTAMPDIFF(MINUTE,'2003-02-01','2003-05-01 12:05:55')`, () => {
        const sql = `SELECT TIMESTAMPDIFF(MINUTE,'2003-02-01','2003-05-01 12:05:55')`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT TIMESTAMPDIFF(SECOND, name, name) FROM mytable2`, () => {
        const sql = `SELECT TIMESTAMPDIFF(SECOND, name, name) FROM mytable2`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail('Should throw an exception'); //Only DATE and DATETIME are allowed
        }
        catch (e: any) {
            const expectedMessage = 'Type mismatch: varchar and datetime';
            assert.deepStrictEqual(e.message, expectedMessage);
        }
    })

    // - str_to_date('2014-01-01', '%Y-%m-%d') AS days
    it(`SELECT str_to_date('2015-01-12', '%Y-%m-%d')`, () => {
        const sql = `SELECT str_to_date('2015-01-12', '%Y-%m-%d') - str_to_date('2014-01-01', '%Y-%m-%d') AS days`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['bigint'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    //INTERVAL expr unit is permitted on either side of the + operator if the expression on the other side is a date or datetime value. 
    //https://dev.mysql.com/doc/refman/8.0/en/expressions.html#temporal-intervals
    it(`select current_date - INTERVAL 1 DAY`, () => {
        const sql = `select current_date - INTERVAL 1 DAY`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT ? - INTERVAL 1 DAY`, () => {
        const sql = `SELECT ? - INTERVAL 1 DAY`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime'],
            parameters: ['datetime']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT INTERVAL 1 DAY + '2018-12-31'`, () => {
        const sql = `SELECT INTERVAL 1 DAY + '2018-12-31'`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT INTERVAL 1 DAY + '2018-12-31'`, () => {
        const sql = `SELECT INTERVAL ? DAY + '2018-12-31'`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime'],
            parameters: ['bigint']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT INTERVAL ? MONTH + '2018-12-31 13:01:02'`, () => {
        const sql = `SELECT INTERVAL ? MONTH + '2018-12-31 13:01:02'`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime'],
            parameters: ['bigint']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`INTERVAL expression with invalid date`, () => {
        const sql = `SELECT INTERVAL ? MONTH + '2018-12-3'`;

        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: varchar and datetime';
            assert.deepStrictEqual(e.message, expected);
        }
    })

    it(`test ADDDATE, DATE_ADD, SUBDATE and DATE_SUB with literal`, () => {
        const sql = `SELECT 
            ADDDATE('2008-01-02', INTERVAL 31 DAY),
            SUBDATE('2008-01-02', INTERVAL 31 DAY),
            DATE_ADD('2008-01-02', INTERVAL 31 DAY),
            DATE_SUB('2008-01-02', INTERVAL 31 DAY)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime', 'datetime', 'datetime', 'datetime'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`test ADDDATE, DATE_ADD, SUBDATE and DATE_SUB with parameters`, () => {
        const sql = `SELECT 
            ADDDATE(?, INTERVAL ? DAY), 
            SUBDATE(?, INTERVAL ? DAY), 
            DATE_ADD(?, INTERVAL ? DAY),
            DATE_SUB(?, INTERVAL ? DAY)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime', 'datetime', 'datetime', 'datetime'],
            parameters: ['datetime', 'bigint', 'datetime', 'bigint', 'datetime', 'bigint', 'datetime', 'bigint']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT ADDDATE and SUBDATE without INTERVAL (with literal)`, () => {
        const sql = `SELECT 
            ADDDATE('2008-01-02', 31),
            SUBDATE('2008-01-02', 31)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime', 'datetime'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT ADDDATE(?, ?), SUBDATE(?, ?)`, () => {
        const sql = `SELECT ADDDATE(?, ?), SUBDATE(?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime', 'datetime'],
            parameters: ['datetime', 'bigint', 'datetime', 'bigint']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`Pass invalid date to ADDDATE function`, () => {
        const sql = `SELECT ADDDATE('2008-01-0', 31)`;

        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: varchar and datetime';
            assert.deepStrictEqual(e.message, expected);
        }
    })

    it(`Pass invalid date to SUBDATE function`, () => {
        const sql = `SELECT SUBDATE('2008-01-0', 31)`;

        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: varchar and datetime';
            assert.deepStrictEqual(e.message, expected);
        }
    })

    it(`Pass invalid date to DATE_ADD function`, () => {
        const sql = `SELECT DATE_ADD('2008-01-0', INTERVAL 31 DAY)`;

        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: varchar and datetime';
            assert.deepStrictEqual(e.message, expected);
        }
    })

    it(`Pass invalid date to DATE_SUB function`, () => {
        const sql = `SELECT DATE_SUB('2008-01-0', INTERVAL 31 DAY)`;

        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: varchar and datetime';
            assert.deepStrictEqual(e.message, expected);
        }
    })

    it(`SELECT REPLACE(?, ?, ?)`, () => {
        const sql = `SELECT 
            REPLACE('www.mysql.com', 'w', 'Ww'),
            REPLACE(?, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['varchar', 'varchar'],
            parameters: ['varchar', 'varchar', 'varchar']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`test ADDDATE, DATE_ADD, SUBDATE and DATE_SUB with parameters`, () => {
        const sql = `SELECT 
            ADDDATE(?, INTERVAL ? DAY), 
            SUBDATE(?, INTERVAL ? DAY), 
            DATE_ADD(?, INTERVAL ? DAY),
            DATE_SUB(?, INTERVAL ? DAY)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['datetime', 'datetime', 'datetime', 'datetime'],
            parameters: ['datetime', 'bigint', 'datetime', 'bigint', 'datetime', 'bigint', 'datetime', 'bigint']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT MOD(?, ?)`, () => {
        const sql = `SELECT MOD(?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['number'],
            parameters: ['number', 'number']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`SELECT MOD(?+?, ?+?)`, () => {
        const sql = `SELECT MOD(?+?, ?+?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['double'],
            parameters: ['double', 'double', 'double', 'double']
        }

        assert.deepStrictEqual(actual, expected);
    })


    it(`SELECT MOD function with several input types`, () => {
        const sql = `SELECT 
            MOD(int_column, int_column), -- int
            MOD(int_column, 10), -- bigint
            MOD(bigint_column, int_column), -- bigint 
            MOD(int_column, bigint_column), -- bigint
            MOD(float_column, int_column), -- float
            MOD(double_column, int_column), -- double
            MOD(int_column, float_column), -- float
            MOD(int_column, decimal_column) -- decimal (newdecimal(246))
            FROM all_types`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['int', 'bigint', 'bigint', 'bigint', 'float', 'double', 'float', 'decimal'],
            parameters: []
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`Test MOD function with string param`, () => {
        const sql = `SELECT 
            MOD('abs', 10)
            FROM all_types`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: number and varchar';
            assert.deepStrictEqual(e.message, expected);
        }

    })

    it(`Test MOD function with string param`, () => {
        const sql = `SELECT 
            MOD(10, 'a')
            FROM all_types`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: number and varchar';
            assert.deepStrictEqual(e.message, expected);
        }

    })

    it(`Test ABS function with several input types`, () => {
        const sql = `SELECT 
            ABS(?), -- number
            ABS(int_column), -- int
            ABS(bigint_column), -- bigint
            ABS(float_column), -- float
            ABS(double_column), -- double
            ABS(decimal_column) -- decimal
            FROM all_types`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['number', 'int', 'bigint', 'float', 'double', 'decimal'],
            parameters: ['number']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`Test ABS function with string param`, () => {
        const sql = `SELECT 
            ABS('abs')
            FROM all_types`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: number and varchar';
            assert.deepStrictEqual(e.message, expected);
        }

    })

    it(`Test ABS function with datetime param`, () => {
        const sql = `SELECT 
            ABS(datetime_column)
            FROM all_types`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: number and datetime';
            assert.deepStrictEqual(e.message, expected);
        }

    })

    it(`Test CEILING function with several input types`, () => {
        const sql = `SELECT 
            CEILING(?), CEIL(?), -- number,
            CEILING(int_column), CEIL(int_column), -- int
            CEILING(bigint_column), CEIL(bigint_column), -- bigint
            CEILING(float_column), CEIL(float_column), -- float
            CEILING(double_column), CEIL(double_column),-- double
            CEILING(decimal_column), CEIL(decimal_column) -- bigint
            FROM all_types`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected: TypeInferenceResult = {
            columns: ['number', 'number', 'int', 'int', 'bigint', 'bigint', 'float', 'float', 'double', 'double', 'bigint', 'bigint'
            ],
            parameters: ['number', 'number']
        }

        assert.deepStrictEqual(actual, expected);
    })

    it(`Test CEILING function with datetime param`, () => {
        const sql = `SELECT 
            CEILING(datetime_column)
            FROM all_types`;
        try {
            parseAndInfer(sql, dbSchema);
            assert.fail("Should thrown an exception.");
        }
        catch (e: any) {
            const expected = 'Type mismatch: number and datetime';
            assert.deepStrictEqual(e.message, expected);
        }
    })
})