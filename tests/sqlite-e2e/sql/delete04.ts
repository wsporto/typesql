import type { Database } from 'better-sqlite3';

export type Delete04Params = {
	ids: number[];
}

export type Delete04Result = {
	id: number;
	value: number | null;
}

export function delete04(db: Database, params: Delete04Params): Delete04Result[] {
	const sql = `
	DELETE FROM mytable1 WHERE id IN (${params.ids.map(() => '?')}) RETURNING *
	`
	const rows = db.prepare(sql)
		.raw(true)
		.all([...params.ids]);

	return rows.map(data => mapArrayToDelete04Result(data));
}

function mapArrayToDelete04Result(data: any) {
	const result: Delete04Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}