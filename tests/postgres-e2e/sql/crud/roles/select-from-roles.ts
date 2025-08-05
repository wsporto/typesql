import pg from 'pg';

export type SelectFromRolesParams = {
	id: number;
}

export type SelectFromRolesResult = {
	id: number;
	role: string;
	fk_user: number;
}

export async function selectFromRoles(client: pg.Client | pg.Pool | pg.PoolClient, params: SelectFromRolesParams): Promise<SelectFromRolesResult | null> {
	const sql = `
	SELECT
		id,
		role,
		fk_user
	FROM roles
	WHERE id = $1
	`
	return client.query({ text: sql, rowMode: 'array', values: [params.id] })
		.then(res => res.rows.length > 0 ? mapArrayToSelectFromRolesResult(res.rows[0]) : null);
}

function mapArrayToSelectFromRolesResult(data: any) {
	const result: SelectFromRolesResult = {
		id: data[0],
		role: data[1],
		fk_user: data[2]
	}
	return result;
}