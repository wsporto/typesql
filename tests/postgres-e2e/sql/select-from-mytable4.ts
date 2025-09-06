import pg from 'pg';

export type SelectFromMytable4Result = {
	id: string;
	name: string | null;
	year: number | null;
}

export async function selectFromMytable4(client: pg.Client | pg.Pool | pg.PoolClient): Promise<SelectFromMytable4Result[]> {
	const sql = `
	SELECT
		*
	FROM mytable4
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.map(row => mapArrayToSelectFromMytable4Result(row)));
}

function mapArrayToSelectFromMytable4Result(data: any) {
	const result: SelectFromMytable4Result = {
		id: data[0],
		name: data[1],
		year: data[2]
	}
	return result;
}