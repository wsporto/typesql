import assert from 'node:assert';

import { loadCreateTableStmt, loadCreateTableStmtWithCheckConstraint, loadDbSchema } from '../../src/sqlite-query-analyzer/query-executor';
import { isLeft } from 'fp-ts/lib/Either';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';
import Database from 'better-sqlite3';
import type { ColumnSchema } from '../../src/mysql-query-analyzer/types';

describe('sqlite-query-executor', () => {
	it('loadDbSchema - Type Affinity', async () => {
		const db = new Database('./mydb.db');
		const dbSchema = loadDbSchema(db);
		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}
		const actual = dbSchema.right.filter((col) => col.table === 'all_types');
		const expected = sqliteDbSchema.filter((col) => col.table === 'all_types');

		assert.deepStrictEqual(actual, expected);
	});

	it('loadDbSchema - test composite primary', async () => {
		const db = new Database('./mydb.db');
		const dbSchema = loadDbSchema(db);
		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}
		const actual = dbSchema.right.filter((col) => col.table === 'playlist_track');
		const expected: ColumnSchema[] = [
			{
				schema: 'main',
				table: 'playlist_track',
				column: 'PlaylistId',
				column_type: 'INTEGER',
				notNull: true,
				columnKey: 'PRI'
			},
			{
				schema: 'main',
				table: 'playlist_track',
				column: 'TrackId',
				column_type: 'INTEGER',
				notNull: true,
				columnKey: 'PRI'
			}
		];

		assert.deepStrictEqual(actual, expected);
	});

	it('loadDbSchema with attached database', async () => {
		const db = new Database('./mydb.db');
		db.exec(`attach database './users.db' as users`);

		const dbSchema = loadDbSchema(db);
		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}

		const actual = dbSchema.right.filter((col) => col.table === 'mytable1' || (col.table === 'users' && col.schema === 'users'));
		const expected: ColumnSchema[] = [
			{
				column: 'id',
				column_type: 'INTEGER',
				columnKey: 'PRI',
				table: 'mytable1',
				schema: 'main',
				notNull: true
			},
			{
				column: 'value',
				column_type: 'INTEGER',
				columnKey: '',
				table: 'mytable1',
				schema: 'main',
				notNull: false
			},
			{
				column: 'id',
				column_type: 'INTEGER',
				columnKey: 'PRI',
				table: 'users',
				schema: 'users',
				notNull: true
			},
			{
				column: 'username',
				column_type: 'TEXT',
				columnKey: 'UNI',
				table: 'users',
				schema: 'users',
				notNull: true
			}
		];
		assert.deepStrictEqual(actual, expected);
	});

	it('loadDbSchema FTS', async () => {
		const db = new Database('./mydb.db');

		const dbSchema = loadDbSchema(db);
		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}

		const actual = dbSchema.right.filter((col) => col.table === 'mytable2_fts');
		const expected: ColumnSchema[] = [
			{
				column: 'id',
				column_type: '?',
				columnKey: 'VT',
				table: 'mytable2_fts',
				schema: 'main',
				notNull: false
			},
			{
				column: 'name',
				column_type: '?',
				columnKey: 'VT',
				table: 'mytable2_fts',
				schema: 'main',
				notNull: false
			},
			{
				column: 'descr',
				column_type: '?',
				columnKey: 'VT',
				table: 'mytable2_fts',
				schema: 'main',
				notNull: false
			}
		];
		assert.deepStrictEqual(actual, expected);
	});

	it('loadCreateTableStmt', () => {
		const db = new Database('./mydb.db');

		const dbSchema = loadCreateTableStmt(db, 'mytable1');
		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}

		const actual = dbSchema.right;
		const expected = replaceNewlines(`CREATE TABLE mytable1 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value INTEGER
)`);
		assert.deepStrictEqual(actual, expected);
	});

	it('loadCreateTableStmtWithCheckConstraint', () => {
		const db = new Database('./mydb.db');

		const queryResult = loadCreateTableStmtWithCheckConstraint(db);
		if (isLeft(queryResult)) {
			assert.fail(`Shouldn't return an error: ` + queryResult.left.description);
		}

		const actual = queryResult.right;
		const expected = replaceNewlines(`CREATE TABLE all_types (
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
)`);
		assert.deepStrictEqual(actual, expected);
	});
});

function replaceNewlines(input: string): string {
	return input.replace(/\n/g, '\r\n');
}
