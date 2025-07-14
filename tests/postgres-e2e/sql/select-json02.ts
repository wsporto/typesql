import pg from 'pg';

export type SelectJson02SumType = {
	total?: string;
	count: string;
	coalesce: number;
	nested: SelectJson02SumNestedType[];
}

export type SelectJson02SumNestedType = {
	key1: string;
	key2: number;
}

export type SelectJson02Result = {
	sum?: SelectJson02SumType;
}

export async function selectJson02(client: pg.Client | pg.Pool): Promise<SelectJson02Result[]> {
	const sql = `
	SELECT
		json_build_object(
			'total', SUM(m.id),
			'count', COUNT(m.id),
			'coalesce', COALESCE(m.id, 0),
			'nested', COALESCE(json_agg(jsonb_build_object(
				'key1', 'value',
				'key2', 10
			)))
		) AS sum
	FROM mytable1 m
	GROUP BY id
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.map(row => mapArrayToSelectJson02Result(row)));
}

function mapArrayToSelectJson02Result(data: any) {
	const result: SelectJson02Result = {
		sum: data[0]
	}
	return result;
}