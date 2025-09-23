import type { Database } from 'better-sqlite3';

export type DeleteFromRolesParams = {
	id: number;
}

export type DeleteFromRolesResult = {
	changes: number;
}

export function deleteFromRoles(db: Database, params: DeleteFromRolesParams): DeleteFromRolesResult {

	const sql = `DELETE
	FROM roles
	WHERE id = ?`

	return db.prepare(sql)
		.run([params.id]) as DeleteFromRolesResult;
}