import assert from 'node:assert';
import Database from 'better-sqlite3';
import { insert03, Insert03Result, insertReturningNoRows, insertMultipleRowResult, InsertMultipleRowResultResult } from './sql';

describe('sqlite-insert', () => {
	const db = new Database('./mydb.db');

	after(() => {
		db.close();
	});

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
	});

	it('insert-returning-no-rows', async () => {

		const insertTx = db.transaction(() => {
			const actual = insertReturningNoRows(db);
			assert.deepStrictEqual(actual, []);
			throw new Error('Rollback this transaction');
		});

		assert.throws(
			() => insertTx(),
			(error: unknown) =>
				error instanceof Error &&
				error.message === 'Rollback this transaction'
		);
	});

	it('insert-returning-multiple-rows', () => {

		const insertTx = db.transaction(() => {
			const actual = insertMultipleRowResult(db, { value1: 5, value2: 6, value3: 7 });
			const expected: InsertMultipleRowResultResult[] = [
				{
					id: 5,
					value: 5
				},
				{
					id: 6,
					value: 6
				},
				{
					id: 7,
					value: 7
				},

			]
			assert.deepStrictEqual(actual, expected);
			throw new Error('Rollback this transaction');
		});

		assert.throws(
			() => insertTx(),
			(error: unknown) =>
				error instanceof Error &&
				error.message === 'Rollback this transaction'
		);
	});
});