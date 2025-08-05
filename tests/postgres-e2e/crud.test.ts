import pg from 'pg'
import assert from 'node:assert';
import { insertIntoRoles } from './sql/crud/roles/insert-into-roles';
import { selectFromRoles, SelectFromRolesResult } from './sql/crud/roles/select-from-roles';
import { updateRoles } from './sql/crud/roles/update-roles';

describe('e2e-postgres-crud', () => {

	const pool = new pg.Pool({
		connectionString: 'postgres://postgres:password@127.0.0.1:5432/postgres'
	})

	it('insert-default-value', async () => {
		const client = await pool.connect();
		await client.query('BEGIN');
		try {
			const insertedRole = await insertIntoRoles(client, { fk_user: 1 });
			const actual = await selectFromRoles(client, { id: insertedRole!.id });
			const expected: SelectFromRolesResult = {
				id: insertedRole!.id,
				fk_user: 1,
				role: 'user'
			}
			assert.deepStrictEqual(actual, expected);

		} finally {
			await client.query('ROLLBACK');
			client.release();
		}
	})

	it('update-default-value', async () => {
		const client = await pool.connect();
		await client.query('BEGIN');
		try {
			const insertedRole = await insertIntoRoles(client, { fk_user: 1 });
			await updateRoles(client, { role: 'admin' }, { id: insertedRole!.id })
			const actual = await selectFromRoles(client, { id: insertedRole!.id });
			const expected: SelectFromRolesResult = {
				id: insertedRole!.id,
				fk_user: 1,
				role: 'admin'
			}
			assert.deepStrictEqual(actual, expected);

		} finally {
			await client.query('ROLLBACK');
			client.release();
		}
	})

});