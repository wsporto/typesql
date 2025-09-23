import assert from 'node:assert';
import Database from 'better-sqlite3';
import { insertIntoRoles, selectFromRoles, SelectFromRolesResult, updateRoles } from './sql/crud/roles';

describe('sqlite-nested-result', () => {
	const db = new Database('./mydb.db');

	it('insert-default-value', async () => {

		const insertTx = db.transaction(() => {
			const insertedRole = insertIntoRoles(db, { fk_user: 1 });
			const actual = selectFromRoles(db, { id: insertedRole!.lastInsertRowid });
			const expected: SelectFromRolesResult = {
				id: insertedRole!.lastInsertRowid,
				fk_user: 1,
				role: 'user'
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

	it('update-default-value', async () => {

		const updateTx = db.transaction(() => {
			const insertedRole = insertIntoRoles(db, { fk_user: 1 });
			updateRoles(db, { role: 'admin' }, { id: insertedRole!.lastInsertRowid })
			const actual = selectFromRoles(db, { id: insertedRole!.lastInsertRowid });
			const expected: SelectFromRolesResult = {
				id: insertedRole!.lastInsertRowid,
				fk_user: 1,
				role: 'admin'
			}
			assert.deepStrictEqual(actual, expected);
			throw new Error('Rollback this transaction');
		});

		try {
			updateTx();
		} catch (e) {
			if (e instanceof Error) {
				assert.strictEqual(e.message, 'Rollback this transaction');
			} else {
				throw e;
			}
		}
	})
});