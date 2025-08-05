import pg from 'pg';

export type DeleteFromRolesParams = {
	id: number;
}

export type DeleteFromRolesResult = {
	id: number;
	role: string;
	fk_user: number;
}

export async function deleteFromRoles(client: pg.Client | pg.Pool | pg.PoolClient, params: DeleteFromRolesParams): Promise<DeleteFromRolesResult | null> {
	const sql = `
	DELETE FROM roles WHERE id = $1
	`
	return client.query({ text: sql, rowMode: 'array', values: [params.id] })
		.then(res => res.rows.length > 0 ? mapArrayToDeleteFromRolesResult(res.rows[0]) : null);
}

function mapArrayToDeleteFromRolesResult(data: any) {
	const result: DeleteFromRolesResult = {
		id: data[0],
		role: data[1],
		fk_user: data[2]
	}
	return result;
}