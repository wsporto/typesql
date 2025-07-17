import pg from 'pg';

export type SelectJsonBuildArray01Result = {
	value1: string[];
	value2: (any | null | string | number)[];
}

export async function selectJsonBuildArray01(client: pg.Client | pg.Pool): Promise<SelectJsonBuildArray01Result | null> {
	const sql = `
	SELECT
		json_build_array('a', 'b') as value1,
		jsonb_build_array(null, 'c', 10) as value2
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.length > 0 ? mapArrayToSelectJsonBuildArray01Result(res.rows[0]) : null);
}

function mapArrayToSelectJsonBuildArray01Result(data: any) {
	const result: SelectJsonBuildArray01Result = {
		value1: data[0],
		value2: data[1]
	}
	return result;
}