import pg from 'pg'
import assert from 'node:assert';
import { copy02, Copy02Params, selectFromMytable4, SelectFromMytable4Result } from './sql';


describe('e2e-postgres-crud', async () => {

	const pool = new pg.Pool({
		connectionString: 'postgres://postgres:password@127.0.0.1:5432/postgres'
	})

	it('copy-from02', async () => {

		const client = await pool.connect();
		await client.query('BEGIN');

		const values: Copy02Params[] = [
			{
				year: 2001,
				name: 'name1',
				id: '1'
			},
			{
				year: null,
				name: 'name2',
				id: '2'
			},
			{
				id: '3',
				year: 2004,
				name: null,
			},
			{
				name: 'name4',
				year: 2004,
				id: '4'
			}
		]
		try {

			await copy02(client, values);
			const actual = await selectFromMytable4(client);
			const expected: SelectFromMytable4Result[] = [
				{
					year: 2001,
					name: 'name1',
					id: '1'
				},
				{
					year: null,
					name: 'name2',
					id: '2'
				},
				{
					id: '3',
					year: 2004,
					name: null,
				},
				{
					name: 'name4',
					year: 2004,
					id: '4'
				}
			]
			assert.deepStrictEqual(actual, expected);
		}
		finally {
			await client.query('ROLLBACK');
			client.release();
		}

	})

});