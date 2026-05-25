import assert from 'node:assert';
import Database from 'better-sqlite3';
import { update03, Update03Result, update04MultiRowResult, Update04MultiRowResultResult, update05, Update05Result } from './sql';

describe('sqlite-update', () => {
    const db = new Database('./mydb.db');

    after(() => {
        db.close();
    });

    it('update03-returning *', async () => {

        const insertTx = db.transaction(() => {
            const actual = update03(db, { param1: 10 }, { param1: 1 });
            const expected: Update03Result = {
                id: 1,
                value: 10
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

    it('update04 - multi-row-return', () => {

        const tx = db.transaction(() => {
            const actual = update04MultiRowResult(db, { value: 10 });
            const expected: Update04MultiRowResultResult[] = [
                {
                    id: 3,
                    value: 10,
                },
                {
                    id: 4,
                    value: 10,
                },
            ]

            assert.deepStrictEqual(actual, expected);

            // Force rollback so the database state is preserved
            throw new Error('__ROLLBACK__');
        });

        assert.throws(
            () => tx(),
            (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, '__ROLLBACK__');
                return true;
            }
        );
    });

    it('update05 - UPDATE ... WHERE id IN (:ids)', () => {

        const tx = db.transaction(() => {
            const actual = update05(db, { ids: [3, 4] });
            const expected: Update05Result[] = [
                {
                    id: 3,
                    value: 1,
                },
                {
                    id: 4,
                    value: 1,
                },
            ]

            assert.deepStrictEqual(actual, expected);

            // Force rollback so the database state is preserved
            throw new Error('__ROLLBACK__');
        });

        assert.throws(
            () => tx(),
            (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, '__ROLLBACK__');
                return true;
            }
        );
    });
});