import assert from 'node:assert';
import Database from 'better-sqlite3';
import { delete02, Delete02Result, delete03MultiRowResult, Delete03MultiRowResultResult } from './sql';

describe('sqlite-delete', () => {
    const db = new Database('./mydb.db');

    after(() => {
        db.close();
    });

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

    it('delete03 - multi-row-result', async () => {

        const deleteTx = db.transaction(() => {
            const actual = delete03MultiRowResult(db);
            const expected: Delete03MultiRowResultResult[] = [
                {
                    id: 3,
                    value: 3
                },
                {
                    id: 4,
                    value: 4
                }
            ]
            assert.deepStrictEqual(actual, expected);
            throw new Error('__ROLLBACK__');
        });

        assert.throws(
            () => deleteTx(),
            (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, '__ROLLBACK__');
                return true;
            }
        );
    })
});