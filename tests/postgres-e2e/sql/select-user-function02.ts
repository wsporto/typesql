import pg from 'pg';

export type SelectUserFunction02Params = {
	id: number;
}

export type SelectUserFunction02Result = {
	id: number;
	value?: number;
}

export async function selectUserFunction02(client: pg.Client | pg.Pool, params: SelectUserFunction02Params): Promise<SelectUserFunction02Result | null> {
	const sql = `
	SELECT * FROM get_mytable1_by_id($1)
	`
	return client.query({ text: sql, rowMode: 'array', values: [params.id] })
		.then(res => res.rows.length > 0 ? mapArrayToSelectUserFunction02Result(res.rows[0]) : null);
}

function mapArrayToSelectUserFunction02Result(data: any) {
	const result: SelectUserFunction02Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}