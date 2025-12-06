import assert from 'node:assert';
import Database from 'better-sqlite3';
import { insert03, Insert03Result } from './sql';

describe('sqlite-insert', () => {
	const db = new Database('./mydb.db');

	it('insert03-returning *', async () => {

		const insertTx = db.transaction(() => {
			const actual = insert03(db, { param1: 5 });
			const expected: Insert03Result = {
				id: 5,
				value: 5
			}
			assert.deepStrictEqual(actual, expected);
			throw new Error('Rollback this transaction');
		});

		try {
			insertTx();
		} catch (e) {
			if (e instanceof Error) {
				assert.strictEqual(e.message, 'Rollback this transaction');
			} else {
				throw e;
			}
		}
	})
});