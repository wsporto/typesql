import type { Database } from 'better-sqlite3';

export type SelectFromRolesParams = {
	id: number;
}

export type SelectFromRolesResult = {
	id: number;
	role: string;
	fk_user: number;
}

export function selectFromRoles(db: Database, params: SelectFromRolesParams): SelectFromRolesResult | null {

	const sql = `SELECT
		id,
		role,
		fk_user
	FROM roles
	WHERE id = ?`

	return db.prepare(sql)
		.raw(true)
		.all([params.id])
		.map(data => mapArrayToSelectFromRolesResult(data))[0];
}

function mapArrayToSelectFromRolesResult(data: any) {
	const result: SelectFromRolesResult = {
		id: data[0],
		role: data[1],
		fk_user: data[2]
	}
	return result;
}