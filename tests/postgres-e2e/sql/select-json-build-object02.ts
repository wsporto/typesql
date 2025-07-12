import pg from 'pg';

export type SelectJsonBuildObject02ResultType = {
	key: string;
	key2: number;
}

export type SelectJsonBuildObject02Result = {
	result?: SelectJsonBuildObject02ResultType[];
}

export async function selectJsonBuildObject02(client: pg.Client | pg.Pool): Promise<SelectJsonBuildObject02Result | null> {
	const sql = `
	SELECT json_agg(
		json_build_object('key', name, 'key2', id)
	) AS result
	FROM (
		VALUES
			(1, 'a'),
			(2, 'b')
	) AS t(id, name)
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.length > 0 ? mapArrayToSelectJsonBuildObject02Result(res.rows[0]) : null);
}

function mapArrayToSelectJsonBuildObject02Result(data: any) {
	const result: SelectJsonBuildObject02Result = {
		result: data[0]
	}
	return result;
}