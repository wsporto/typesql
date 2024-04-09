import assert from "assert";

import { readFileSync } from "fs";
import { generateTsCode } from "../../src/sqlite-query-analyzer/code-generator";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-code-generator', () => {

	it.only('select01 - select id, name from mytable2 where id = ?', async () => {
		const sql = `select id, name from mytable2 where id = ?`;

		const actual = await generateTsCode(sql, 'select01', sqliteDbSchema);
		const expected = readFileSync('tests/sqlite/expected-code/select01.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	})
});