import pg from 'pg';

export type UpdateRolesData = {
	role?: string;
	fk_user?: number;
}

export type UpdateRolesParams = {
	id: number;
}

export type UpdateRolesResult = {
	id: number;
	role: string;
	fk_user: number;
}

export async function updateRoles(client: pg.Client | pg.Pool | pg.PoolClient, data: UpdateRolesData, params: UpdateRolesParams): Promise<UpdateRolesResult | null> {
	const updateColumns = ['role', 'fk_user'] as const;
	const updates: string[] = [];
	const values: unknown[] = [];
	let parameterNumber = 1;

	for (const column of updateColumns) {
		const value = data[column];
		if (value !== undefined) {
			updates.push(`${column} = $${parameterNumber++}`);
			values.push(value);
		}
	}
	if (updates.length === 0) return null;
	values.push(params.id);

	const sql = `UPDATE roles SET ${updates.join(', ')} WHERE id = $${parameterNumber} RETURNING *`;
	return client.query({ text: sql, values })
		.then(res => res.rows[0] ?? null);
}