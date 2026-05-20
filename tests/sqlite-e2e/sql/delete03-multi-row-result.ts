import type { Database } from 'better-sqlite3';

export type Delete03MultiRowResultResult = {
	id: number;
	value: number | null;
}

export function delete03MultiRowResult(db: Database): Delete03MultiRowResultResult[] {
	const sql = `
	DELETE FROM mytable1 WHERE id in (3, 4) RETURNING *
	`
	const rows = db.prepare(sql)
		.raw(true)
		.all();

	return rows.map(data => mapArrayToDelete03MultiRowResultResult(data));
}

function mapArrayToDelete03MultiRowResultResult(data: any) {
	const result: Delete03MultiRowResultResult = {
		id: data[0],
		value: data[1]
	}
	return result;
}