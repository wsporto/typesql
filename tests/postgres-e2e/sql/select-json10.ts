import pg from 'pg';

export type SelectJson10Result = {
	result1: Record<string, number | undefined>;
	result2: Record<string, SelectJson10Result2Type | undefined>;
}

export type SelectJson10Result2Type = {
	id: number;
	value?: number;
}

export async function selectJson10(client: pg.Client | pg.Pool | pg.PoolClient): Promise<SelectJson10Result | null> {
	const sql = `
	SELECT
		json_object_agg(id, value) as result1,
		json_object_agg(id, row_to_json(mytable1)) as result2
	FROM mytable1
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.length > 0 ? mapArrayToSelectJson10Result(res.rows[0]) : null);
}

function mapArrayToSelectJson10Result(data: any) {
	const result: SelectJson10Result = {
		result1: data[0],
		result2: data[1]
	}
	return result;
}