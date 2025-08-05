import pg from 'pg';

export type SelectJsonBuildObject01Result = {
	value1: SelectJsonBuildObject01Value1Type;
	value2: SelectJsonBuildObject01Value2Type;
	value3: SelectJsonBuildObject01Value3Type;
	value4: SelectJsonBuildObject01Value4Type;
}

export type SelectJsonBuildObject01Value1Type = {
	key1: string;
}

export type SelectJsonBuildObject01Value2Type = {
	key2: number;
}

export type SelectJsonBuildObject01Value3Type = {
	key3: string;
}

export type SelectJsonBuildObject01Value4Type = {
	key4: number;
}

export async function selectJsonBuildObject01(client: pg.Client | pg.Pool | pg.PoolClient): Promise<SelectJsonBuildObject01Result | null> {
	const sql = `
	SELECT
		json_build_object('key1', 'str1') as value1,
		json_build_object('key2', 10) as value2,
		jsonb_build_object('key3', 'str2') as value3,
		jsonb_build_object('key4', 20) as value4
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.length > 0 ? mapArrayToSelectJsonBuildObject01Result(res.rows[0]) : null);
}

function mapArrayToSelectJsonBuildObject01Result(data: any) {
	const result: SelectJsonBuildObject01Result = {
		value1: data[0],
		value2: data[1],
		value3: data[2],
		value4: data[3]
	}
	return result;
}