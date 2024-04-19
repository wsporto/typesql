import assert from "assert";

import { loadDbSchema } from "../../src/sqlite-query-analyzer/query-executor";
import { isLeft } from "fp-ts/lib/Either";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";

describe('sqlite-query-executor', () => {

	it('loadDbSchema - Type Affinity', async () => {
		const dbSchema = loadDbSchema('./mydb.db');
		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error`);
		}
		const actual = dbSchema.right.filter(col => col.table == 'all_types');
		const expected = sqliteDbSchema.filter(col => col.table == 'all_types');

		assert.deepStrictEqual(actual, expected);

	})
})