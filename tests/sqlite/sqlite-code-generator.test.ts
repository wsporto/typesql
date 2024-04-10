import assert from "assert";

import { readFileSync } from "fs";
import { generateTsCode } from "../../src/sqlite-query-analyzer/code-generator";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-code-generator', () => {

	it('select01 - select id, name from mytable2 where id = ?', async () => {
		const sql = `select id, name from mytable2 where id = ?`;

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select01.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	})

	it('select02 - select without parameters', async () => {
		const sql = `select id from mytable1`;

		const actual = await generateTsCode(sql, 'select02', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select02.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	})

	it('select03 - select with same parameter used twice', async () => {
		const sql = 'select id from mytable1 where id = :id or id = :id';

		const actual = await generateTsCode(sql, 'select03', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select03.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	})
});