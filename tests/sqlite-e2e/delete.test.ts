import assert from 'node:assert';
import Database from 'better-sqlite3';
import { delete02, Delete02Result } from './sql';

describe('sqlite-delete', () => {
    const db = new Database('./mydb.db');

    it('delete02-returning *', async () => {

        const deleteTx = db.transaction(() => {
            const actual = delete02(db, { param1: 2 });
            const expected: Delete02Result = {
                id: 2,
                value: 2
            }
            assert.deepStrictEqual(actual, expected);
            throw new Error('Rollback this transaction');
        });

        try {
            deleteTx();
        } catch (e) {
            if (e instanceof Error) {
                assert.strictEqual(e.message, 'Rollback this transaction');
            } else {
                throw e;
            }
        }
    })
});