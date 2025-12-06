import type { Database } from 'better-sqlite3';

export type Delete02Params = {
	param1: number;
}

export type Delete02Result = {
	id: number;
	value?: number;
}

export function delete02(db: Database, params: Delete02Params): Delete02Result {
	const sql = `
	DELETE FROM mytable1 WHERE id=? RETURNING *
	`
	const res = db.prepare(sql)
		.raw(true)
		.get([params.param1]);

	return mapArrayToDelete02Result(res);
}

function mapArrayToDelete02Result(data: any) {
	const result: Delete02Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}