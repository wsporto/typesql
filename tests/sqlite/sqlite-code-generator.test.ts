import assert from "assert";

import { readFileSync } from "fs";
import { generateTsCode } from "../../src/sqlite-query-analyzer/code-generator";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import Database from "better-sqlite3";
import { isLeft } from "fp-ts/lib/Either";

describe('sqlite-code-generator', () => {

	const db = new Database('./mydb.db');

	it('select01 - select id, name from mytable2 where id = ?', async () => {
		const sql = `select id, name from mytable2 where id = ?`;

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('select01-libsql - select id, name from mytable2 where id = ?', async () => {
		const sql = `select id, name from mytable2 where id = ?`;

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema, false, 'libsql');
		const expected = readFileSync('tests/sqlite/expected-code/select01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('select02 - select without parameters', async () => {
		const sql = `select id from mytable1`;

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('select02-libsql - select without parameters', async () => {
		const sql = `select id from mytable1`;

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema, false, 'libsql');
		const expected = readFileSync('tests/sqlite/expected-code/select02-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('select03 - select with same parameter used twice', async () => {
		const sql = 'select id from mytable1 where id = :id or id = :id';

		const actual = await generateTsCode(sql, 'select03', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select03.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('select04 - select with same parameter used twice', async () => {
		const sql = 'SELECT text_column FROM all_types WHERE date(text_column) = date(:date)';

		const actual = await generateTsCode(sql, 'select04', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select04.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('insert01 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateTsCode(sql, 'insert01', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/insert01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('insert01-libsql - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateTsCode(sql, 'insert01', sqliteDbSchema, false, 'libsql');
		const expected = readFileSync('tests/sqlite/expected-code/insert01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('insert02 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values(?)';

		const actual = await generateTsCode(sql, 'insert02', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/insert02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('update01 - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value=? WHERE id=?';

		const actual = generateTsCode(sql, 'update01', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/update01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('update01-libsql - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value=? WHERE id=?';

		const actual = generateTsCode(sql, 'update01', sqliteDbSchema, false, 'libsql');
		const expected = readFileSync('tests/sqlite/expected-code/update01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('delete01 - DELETE FROM mytable1 WHERE id=?', () => {
		const sql = 'DELETE FROM mytable1 WHERE id=?';

		const actual = generateTsCode(sql, 'delete01', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/delete01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('delete01-libsql - DELETE FROM mytable1 WHERE id=?', () => {//
		const sql = 'DELETE FROM mytable1 WHERE id=?';

		const actual = generateTsCode(sql, 'delete01', sqliteDbSchema, false, 'libsql');
		const expected = readFileSync('tests/sqlite/expected-code/delete01-libsql.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('crud-update01 - UPDATE mytable1 SET value=? WHERE id=?', () => {
		const sql = 'UPDATE mytable1 SET value = CASE WHEN :valueSet THEN :value ELSE value END';

		const isCrud = true;
		const actual = generateTsCode(sql, 'crud-update01', sqliteDbSchema, isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/crud-update01.ts.txt', 'utf-8').replace(/\r/gm, '');//

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('select05 - SELECT id FROM mytable1 ORDER BY ?', () => {
		const sql = 'SELECT id FROM mytable1 ORDER BY ?';

		const isCrud = true;
		const actual = generateTsCode(sql, 'select05', sqliteDbSchema, isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/select05.ts.txt', 'utf-8').replace(/\r/gm, '');//

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})

	it('nested01 - FROM users u INNER JOIN posts p', () => {
		const sql = `-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title
FROM users u
INNER JOIN posts p on p.fk_user = u.id`

		const isCrud = true;
		const actual = generateTsCode(sql, 'nested01', sqliteDbSchema, isCrud);
		const expected = readFileSync('tests/sqlite/expected-code/nested01.ts.txt', 'utf-8').replace(/\r/gm, '');//

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right, expected);
	})
});