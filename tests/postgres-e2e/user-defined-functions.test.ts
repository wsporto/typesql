import assert from 'node:assert';
import pg from 'pg'
import { selectUserFunction02 } from './sql';
import { selectUserFunction01, SelectUserFunction01Result } from './sql/select-user-function01';

describe('e2e-postgres-user-defined-functions', () => {
	const pool = new pg.Pool({
		connectionString: 'postgres://postgres:password@127.0.0.1:5432/postgres'
	})

	it('get_mytable1()', async () => {
		const result = await selectUserFunction01(pool);

		const expectedResult: SelectUserFunction01Result[] = [
			{
				id: 1,
				value: 1
			},
			{
				id: 2,
				value: 2
			},
			{
				id: 3,
				value: 3
			},
			{
				id: 4,
				value: 4
			},
		]

		assert.deepStrictEqual(result, expectedResult);
	});

	it('get_mytable1_by_id(:id)', async () => {
		const result = await selectUserFunction02(pool, { id: 2 });

		const expectedResult: SelectUserFunction01Result = {
			id: 2,
			value: 2
		}

		assert.deepStrictEqual(result, expectedResult);
	});
});