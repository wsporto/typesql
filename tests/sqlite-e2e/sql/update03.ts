import type { Database } from 'better-sqlite3';

export type Update03Data = {
	param1: number | null;
}

export type Update03Params = {
	param1: number;
}

export type Update03Result = {
	id: number;
	value?: number;
}

export function update03(db: Database, data: Update03Data, params: Update03Params): Update03Result {
	const sql = `
	UPDATE mytable1 SET value = ? WHERE id = ? RETURNING *
	`
	const res = db.prepare(sql)
		.raw(true)
		.get([data.param1, params.param1]);

	return mapArrayToUpdate03Result(res);
}

function mapArrayToUpdate03Result(data: any) {
	const result: Update03Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}