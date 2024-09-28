import assert from 'node:assert';
import { enumParser } from '../../src/sqlite-query-analyzer/enum-parser';
import { EnumMap } from '../../src/sqlite-query-analyzer/types';

describe('enum-parser', () => {

	const createTableStmt = `CREATE TABLE all_types (
    int_column INT,
    integer_column INTEGER,
    tinyiny_column TINYINT,
    smallint_column SMALLINT,
    mediumint_column MEDIUMINT,
    bigint_column BIGINT,
    unsignedbigint_column UNSIGNED BIGINT,
    int2_column INT2,
    int8_column INT8,
    character_column CHARACTER(20),
    varchar_column VARCHAR(255),
    varyingcharacter_column VARYING CHARACTER(255),
    nchar_column NCHAR(55),
    native_character_column NATIVE CHARACTER(70),
    nvarchar_column NVARCHAR(100),
    text_column TEXT,
    clob_column CLOB,
    blob_column BLOB,
    blob_column2,
    real_column REAL,
    double_column DOUBLE,
    doubleprecision_column DOUBLE PRECISION,
    float_column FLOAT,
    numeric_column NUMERIC,
    decimal_column DECIMAL(10,5),
    boolean_column BOOLEAN,
    date_column DATE,
    datetime_column DATETIME,
    integer_column_default INTEGER DEFAULT 10
, enum_column TEXT CHECK(enum_column IN ('x-small', 'small', 'medium', 'large', 'x-large')));CREATE TABLE enum_types(
    id INTEGER PRIMARY KEY,
    column1 TEXT CHECK(column1 IN ('A', 'B', 'C')),
    column2 INTEGER CHECK(column2 IN (1, 2)),
    column3 TEXT CHECK(column3 NOT IN ('A', 'B', 'C')),
    column4 TEXT CHECK(column4 LIKE '%a%'),
	column5 NOT NULL CHECK(column5 IN ('D', 'E'))
);CREATE TABLE enum_types2(
    id INTEGER PRIMARY KEY,
    column1 TEXT CHECK         (   column1 IN ('f', 'g')   )
)`

	it('enum-parser', () => {
		const actual = enumParser(createTableStmt);
		const expected: EnumMap = {
			all_types: {
				enum_column: `ENUM('x-small','small','medium','large','x-large')`
			},
			enum_types: {
				column1: `ENUM('A','B','C')`,
				column5: `ENUM('D','E')`
			},
			enum_types2: {
				column1: `ENUM('f','g')`
			}
		}
		assert.deepStrictEqual(actual, expected);
	});
});
