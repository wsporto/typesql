import pg from 'pg';

export type SelectUserFunction01Result = {
	id: number;
	value: number | null;
}

export async function selectUserFunction01(client: pg.Client | pg.Pool | pg.PoolClient): Promise<SelectUserFunction01Result[]> {
	const sql = `
	SELECT * FROM get_mytable1()
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.map(row => mapArrayToSelectUserFunction01Result(row)));
}

function mapArrayToSelectUserFunction01Result(data: any) {
	const result: SelectUserFunction01Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}