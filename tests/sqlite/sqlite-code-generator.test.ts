import assert from 'node:assert';

import { readFileSync } from 'node:fs';
import { generateCrud, generateTsCode } from '../../src/codegen/sqlite';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';
import Database from 'better-sqlite3';
import { isLeft } from 'fp-ts/lib/Either';
import { loadDbSchema } from '../../src/sqlite-query-analyzer/query-executor';

describe('sqlite-code-generator', () => {
	const db = new Database('./mydb.db');

	it('select01 - select id, name from mytable2 where id = ?', async () => {
		const sql = 'select id, name from mytable2 where id = ?';

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/select01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select01-libsql - select id, name from mytable2 where id = ?', async () => {
		const sql = 'select id, name from mytable2 where id = ?';

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema, 'libsql', false);
		const expected = readFileSync('tests/sqlite/expected-code/select01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select01-bun - select id, name from mytable2 where id = ?', async () => {
		const sql = 'select id, name from mytable2 where id = ?';

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema, 'bun:sqlite', false);
		const expected = readFileSync('tests/sqlite/expected-code/select01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select01-d1 - select id, name from mytable2 where id = ?', async () => {
		const sql = 'select id, name from mytable2 where id = ?';

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema, 'd1', false);
		const expected = readFileSync('tests/sqlite/expected-code/select01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select02 - select without parameters', async () => {
		const sql = 'select id from mytable1';

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/select02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select02-libsql - select without parameters', async () => {
		const sql = 'select id from mytable1';

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema, 'libsql', false);
		const expected = readFileSync('tests/sqlite/expected-code/select02-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select02-bun - select without parameters', async () => {
		const sql = 'select id from mytable1';

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/select02-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select02-d1 - select without parameters', async () => {
		const sql = 'select id from mytable1';

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/select02-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select03 - select with same parameter used twice', async () => {
		const sql = 'select id from mytable1 where id = :id or id = :id';

		const actual = await generateTsCode(sql, 'select03', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/select03.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select03-bun - select with same parameter used twice', async () => {
		const sql = 'select id from mytable1 where id = :id or id = :id';

		const actual = await generateTsCode(sql, 'select03', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/select03-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select03-d1 - select with same parameter used twice', async () => {
		const sql = 'select id from mytable1 where id = :id or id = :id';

		const actual = await generateTsCode(sql, 'select03', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/select03-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select04 - select with same parameter used twice', async () => {//
		const sql = `SELECT 
	text_column, 
	date(text_column) as date_text,
	datetime(text_column) as datetime_text,
	integer_column,
	date(integer_column, 'auto') as date_integer,
	datetime(integer_column, 'auto') as datetime_integer
FROM all_types 
WHERE date(text_column) = :date
AND date(integer_column, 'auto') = :date
AND datetime(text_column) = :date_time
AND datetime(integer_column, 'auto') = :date_time`;

		const actual = await generateTsCode(sql, 'select04', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/select04.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select04-bun - select with same parameter used twice', async () => {
		const sql = `SELECT 
	text_column, 
	date(text_column) as date_text,
	datetime(text_column) as datetime_text,
	integer_column,
	date(integer_column, 'auto') as date_integer,
	datetime(integer_column, 'auto') as datetime_integer
FROM all_types 
WHERE date(text_column) = :date
AND date(integer_column, 'auto') = :date
AND datetime(text_column) = :date_time
AND datetime(integer_column, 'auto') = :date_time`;

		const actual = await generateTsCode(sql, 'select04', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/select04-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select04-d1 - select with same parameter used twice', async () => {
		const sql = `SELECT 
	text_column, 
	date(text_column) as date_text,
	datetime(text_column) as datetime_text,
	integer_column,
	date(integer_column, 'auto') as date_integer,
	datetime(integer_column, 'auto') as datetime_integer
FROM all_types 
WHERE date(text_column) = :date
AND date(integer_column, 'auto') = :date
AND datetime(text_column) = :date_time
AND datetime(integer_column, 'auto') = :date_time`;

		const actual = await generateTsCode(sql, 'select04', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/select04-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert01 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateTsCode(sql, 'insert01', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/insert01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert01-libsql - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateTsCode(sql, 'insert01', sqliteDbSchema, 'libsql', false);
		const expected = readFileSync('tests/sqlite/expected-code/insert01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert01-bun - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateTsCode(sql, 'insert01', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/insert01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert01-d1 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateTsCode(sql, 'insert01', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/insert01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert02 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(?)';

		const actual = await generateTsCode(sql, 'insert02', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/insert02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert02-bun - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(?)';

		const actual = await generateTsCode(sql, 'insert02', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/insert02-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert02-d1 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(?)';

		const actual = await generateTsCode(sql, 'insert02', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/insert02-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert03-libsql - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) VALUES(:value) RETURNING *';

		const actual = await generateTsCode(sql, 'insert03', sqliteDbSchema, 'libsql', false);
		const expected = readFileSync('tests/sqlite/expected-code/insert03-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('insert03-d1 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) VALUES(:value) RETURNING *';

		const actual = await generateTsCode(sql, 'insert03', sqliteDbSchema, 'd1', false);
		const expected = readFileSync('tests/sqlite/expected-code/insert03-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update01 - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value=? WHERE id=?';

		const actual = generateTsCode(sql, 'update01', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/update01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update02 - update-no-data - UPDATE with no SET parameters should not include data parameter', () => {
		const sql = 'UPDATE mytable1 SET value = 42 WHERE id = :id';

		const actual = generateTsCode(sql, 'update02', sqliteDbSchema, 'better-sqlite3');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}

		const expected = readFileSync('tests/sqlite/expected-code/update02.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update01-libsql - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value=? WHERE id=?';

		const actual = generateTsCode(sql, 'update01', sqliteDbSchema, 'libsql', false);
		const expected = readFileSync('tests/sqlite/expected-code/update01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update02-libsql - update-no-data - UPDATE with no SET parameters should not include data parameter', () => {
		const sql = 'UPDATE mytable1 SET value = 42 WHERE id = :id';

		const actual = generateTsCode(sql, 'update02', sqliteDbSchema, 'libsql');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}

		const expected = readFileSync('tests/sqlite/expected-code/update02-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update01-bun - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value=? WHERE id=?';

		const actual = generateTsCode(sql, 'update01', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/update01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update02-bun - update-no-data - UPDATE with no SET parameters should not include data parameter', () => {
		const sql = 'UPDATE mytable1 SET value = 42 WHERE id = :id';

		const actual = generateTsCode(sql, 'update02', sqliteDbSchema, 'bun:sqlite');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}

		const expected = readFileSync('tests/sqlite/expected-code/update02-bun.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update01-d1 - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value=? WHERE id=?';

		const actual = generateTsCode(sql, 'update01', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/update01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update02-d1 - update-no-data - UPDATE with no SET parameters should not include data parameter', () => {
		const sql = 'UPDATE mytable1 SET value = 42 WHERE id = :id';

		const actual = generateTsCode(sql, 'update02', sqliteDbSchema, 'd1');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}

		const expected = readFileSync('tests/sqlite/expected-code/update02-d1.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual.right, expected);
	});

	it('delete01 - DELETE FROM mytable1 WHERE id=?', () => {
		const sql = 'DELETE FROM mytable1 WHERE id=?';

		const actual = generateTsCode(sql, 'delete01', sqliteDbSchema, 'better-sqlite3');
		const expected = readFileSync('tests/sqlite/expected-code/delete01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('delete01-libsql - DELETE FROM mytable1 WHERE id=?', () => {
		const sql = 'DELETE FROM mytable1 WHERE id=?';

		const actual = generateTsCode(sql, 'delete01', sqliteDbSchema, 'libsql', false);
		const expected = readFileSync('tests/sqlite/expected-code/delete01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('delete01-bun - DELETE FROM mytable1 WHERE id=?', () => {
		const sql = 'DELETE FROM mytable1 WHERE id=?';

		const actual = generateTsCode(sql, 'delete01', sqliteDbSchema, 'bun:sqlite');
		const expected = readFileSync('tests/sqlite/expected-code/delete01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('delete01-bun - DELETE FROM mytable1 WHERE id=?', () => {
		const sql = 'DELETE FROM mytable1 WHERE id=?';

		const actual = generateTsCode(sql, 'delete01', sqliteDbSchema, 'd1');
		const expected = readFileSync('tests/sqlite/expected-code/delete01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('crud-select01', () => {
		const actual = generateCrud('better-sqlite3', 'Select', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-select01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-select01-libsql', () => {
		const actual = generateCrud('libsql', 'Select', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-select01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-select01-bun', () => {
		const actual = generateCrud('bun:sqlite', 'Select', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-select01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-select01-d1', () => {
		const actual = generateCrud('d1', 'Select', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-select01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-insert01', () => {
		const actual = generateCrud('better-sqlite3', 'Insert', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-insert01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-insert01-libsql', () => {
		const actual = generateCrud('libsql', 'Insert', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-insert01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-insert01-bun', () => {//
		const actual = generateCrud('bun:sqlite', 'Insert', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-insert01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-insert01-d1', () => {//
		const actual = generateCrud('d1', 'Insert', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-insert01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update01', () => {
		const actual = generateCrud('better-sqlite3', 'Update', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-update01.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update01-libsql', () => {
		const actual = generateCrud('libsql', 'Update', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-update01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update01-bun', () => {
		const actual = generateCrud('bun:sqlite', 'Update', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-update01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update01-d1', () => {
		const actual = generateCrud('d1', 'Update', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-update01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-delete01', () => {
		const actual = generateCrud('better-sqlite3', 'Delete', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-delete01.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-delete01-libsql', () => {
		const actual = generateCrud('libsql', 'Delete', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-delete01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-delete01-bun', () => {
		const actual = generateCrud('bun:sqlite', 'Delete', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-delete01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('crud-delete01-d1', () => {
		const actual = generateCrud('d1', 'Delete', 'mytable1', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/crud-delete01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('select05 - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = 'SELECT id FROM mytable1 ORDER BY ?';

		const isCrud = false;
		const actual = generateTsCode(sql, 'select05', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select05.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select05-bun - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = 'SELECT id FROM mytable1 ORDER BY ?';

		const isCrud = false;
		const actual = generateTsCode(sql, 'select05', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select05-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select05-d1 - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = 'SELECT id FROM mytable1 ORDER BY ?';

		const isCrud = false;
		const actual = generateTsCode(sql, 'select05', sqliteDbSchema, 'd1', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select05-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select06 - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = `SELECT id
FROM mytable2
WHERE id IN (:ids)
AND name IN (:names)`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select06', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select06.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select06-bun - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = `SELECT id
FROM mytable2
WHERE id IN (:ids)
AND name IN (:names)`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select06', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select06-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select06-d1 - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = `SELECT id
FROM mytable2
WHERE id IN (:ids)
AND name IN (:names)`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select06', sqliteDbSchema, 'd1', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select06-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select07 - fts', () => {
		const sql = `SELECT
	id,
	name,
	descr
FROM mytable2_fts
WHERE mytable2_fts MATCH :match
LIMIT 20`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select07', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select07-fts.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select08 - boolean', () => {
		const sql = `SELECT
	id,
	:param1 as param1,
	:param2 as param2
FROM mytable1 
WHERE :param1 is true OR (:param2 is true OR :param2 is null)`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select08', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select08-boolean.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select09 - enum', () => {
		const sql = `SELECT
	enum_column
FROM all_types
where enum_column = :enum_value`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select09', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select09-enum.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select09-libsql - enum', () => {
		const sql = `SELECT
	enum_column
FROM all_types
where enum_column = :enum_value`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select09', sqliteDbSchema, 'libsql', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select09-libsql-enum.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select09-bun - enum', () => {
		const sql = `SELECT
	enum_column
FROM all_types
where enum_column = :enum_value`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'select09', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select09-bun-enum.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested01 - FROM users u INNER JOIN posts p', () => {
		const sql = `-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title
FROM users u
INNER JOIN posts p on p.fk_user = u.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested01', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested01-libsql - FROM users u INNER JOIN posts p', () => {
		const sql = `-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title
FROM users u
INNER JOIN posts p on p.fk_user = u.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested01', sqliteDbSchema, 'libsql', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested01-bun - FROM users u INNER JOIN posts p', () => {
		const sql = `-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title
FROM users u
INNER JOIN posts p on p.fk_user = u.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested01', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested01-d1 - FROM users u INNER JOIN posts p', () => {
		const sql = `-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title
FROM users u
INNER JOIN posts p on p.fk_user = u.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested01', sqliteDbSchema, 'd1', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested02 - self relation', () => {
		const sql = `-- @nested
SELECT
	c.id,
	a1.*,
	a2.*
FROM clients as c
INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
WHERE c.id = :clientId`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested02', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested02-clients-with-addresses.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested02-bun - self relation', () => {
		const sql = `-- @nested
SELECT
	c.id,
	a1.*,
	a2.*
FROM clients as c
INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
WHERE c.id = :clientId`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested02', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested02-bun-clients-with-addresses.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested02-d1 - self relation', () => {
		const sql = `-- @nested
SELECT
	c.id,
	a1.*,
	a2.*
FROM clients as c
INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
WHERE c.id = :clientId`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested02', sqliteDbSchema, 'd1', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested02-d1-clients-with-addresses.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested03 - many to many', () => {
		const sql = `-- @nested
SELECT
	s.id as surveyId,
	s.name as surveyName,
	u.id as userId,
	u.name as userName
FROM surveys s
INNER JOIN participants p on p.fk_survey = s.id
INNER JOIN users u on u.id = p.fk_user`;

		const schemaResult = loadDbSchema(db);
		if (schemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${schemaResult.error.description}`);
		}

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested03', schemaResult.value, 'libsql', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested03-libsql-many-to-many.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('nested03-bun - many to many', () => {
		const sql = `-- @nested
SELECT
	s.id as surveyId,
	s.name as surveyName,
	u.id as userId,
	u.name as userName
FROM surveys s
INNER JOIN participants p on p.fk_survey = s.id
INNER JOIN users u on u.id = p.fk_user`;

		const schemaResult = loadDbSchema(db);
		if (schemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${schemaResult.error.description}`);
		}

		const isCrud = false;
		const actual = generateTsCode(sql, 'nested03', schemaResult.value, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested03-bun-many-to-many.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-01', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m1.value, m2.name, m2.descr as description
FROM mytable1 m1
INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query-01', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-01-libsql', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m1.value, m2.name, m2.descr as description
FROM mytable1 m1
INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query-01', sqliteDbSchema, 'libsql', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-01-bun', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m1.value, m2.name, m2.descr as description
FROM mytable1 m1
INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query-01', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query01-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-01-d1', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m1.value, m2.name, m2.descr as description
FROM mytable1 m1
INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query-01', sqliteDbSchema, 'd1', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query01-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-02', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m2.name
FROM mytable1 m1
INNER JOIN ( -- derivated table
	SELECT id, name from mytable2 m 
	WHERE m.name = :subqueryName
) m2 on m2.id = m1.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'derivated-table', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-02-bun', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m2.name
FROM mytable1 m1
INNER JOIN ( -- derivated table
	SELECT id, name from mytable2 m 
	WHERE m.name = :subqueryName
) m2 on m2.id = m1.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'derivated-table', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query02-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-02-d1', () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m2.name
FROM mytable1 m1
INNER JOIN ( -- derivated table
	SELECT id, name from mytable2 m 
	WHERE m.name = :subqueryName
) m2 on m2.id = m1.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query02', sqliteDbSchema, 'd1', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query02-d1.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-03', () => {
		const sql = `-- @dynamicQuery
SELECT t1.id, t1.value
FROM mytable1 t1`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query03', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query03.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-03-bun', () => {
		const sql = `-- @dynamicQuery
SELECT t1.id, t1.value
FROM mytable1 t1`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query03', sqliteDbSchema, 'bun:sqlite', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query03-bun.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-04', () => {
		const sql = `-- @dynamicQuery
SELECT 
    *
FROM mytable1 m1
INNER JOIN mytable2 m2 on m2.id = m1.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query04', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query04.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-05', () => {
		const sql = `-- @dynamicQuery
WITH 
cte as (
	select id, name from mytable2
)
SELECT 
	m1.id,
	m2.name
FROM mytable1 m1
INNER JOIN cte m2 on m2.id = m1.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'cte', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query05.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-06', () => {
		const sql = `-- @dynamicQuery
SELECT 
    *
FROM mytable1 m1
INNER JOIN mytable2 m2 on m2.id = m1.id
ORDER BY ?`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query06', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query06.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-07', () => {
		const sql = `-- @dynamicQuery
SELECT 
    m1.id as myId,
    m2.name
FROM mytable1 m1
INNER JOIN mytable2 m2 on m2.id = m1.id
ORDER BY ?`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query07', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query07.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-08 - date', () => {
		const sql = `-- @dynamicQuery
SELECT 
	text_column, 
	date(text_column) as date, 
	datetime(text_column) as date_time 
FROM all_types 
WHERE date(text_column) = :param1 AND datetime(text_column) = :param2`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query08', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query08-date.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-09 - params on select', () => {
		const sql = `-- @dynamicQuery
SELECT 
	t2.id, 
	t3.double_value, 
	:name is null OR concat('%', t2.name, t3.name, '%') LIKE :name as likeName
FROM mytable2 t2
INNER JOIN mytable3 t3 on t3.id = t2.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query09', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query09-params-on-select.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-10 - limit offset', () => {
		const sql = `-- @dynamicQuery
SELECT 
	t1.id, 
	t2.name
FROM mytable1 t1
INNER JOIN mytable2 t2 on t2.id = t1.id
WHERE name = :name
LIMIT :limit OFFSET :offset`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query10', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query10-limit-offset.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-11-multiple-CTEs', () => {
		const sql = `-- @dynamicQuery
WITH 
	cte1 as (
		select id, value from mytable1
		WHERE max(value, :param1) = min(value, :param1)
	),
	cte2 as (
		select id, name from mytable2
		WHERE max(name, :param2) = min(name, :param2)
	)
SELECT 
	c1.id,
	c2.name
FROM cte1 c1
INNER JOIN cte2 c2 on c1.id = c2.id`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query11', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query11.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('dynamic-query-12-multiple-CTEs-with-where', () => {
		const sql = `-- @dynamicQuery
WITH 
	cte1 as (
		select id, value from mytable1
		WHERE max(date(value, 'auto'), :param1) = min(date(value, 'auto'), :param1)
	),
	cte2 as (
		select id, name from mytable2
		WHERE max(name, :param2) = min(name, :param2)
	)
SELECT 
	c1.id,
	c2.name
FROM cte1 c1
INNER JOIN cte2 c2 on c1.id = c2.id
WHERE max(c1.id, :param3) = min(c2.id, :param3)`;

		const isCrud = false;
		const actual = generateTsCode(sql, 'dynamic-query12', sqliteDbSchema, 'better-sqlite3', isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/dynamic-query12.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

});
