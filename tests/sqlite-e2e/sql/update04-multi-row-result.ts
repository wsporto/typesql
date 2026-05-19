import type { Database } from 'better-sqlite3';

export type Update04MultiRowResultData = {
	value: number | null;
}

export type Update04MultiRowResultResult = {
	id: number;
	value: number | null;
}

export function update04MultiRowResult(db: Database, data: Update04MultiRowResultData): Update04MultiRowResultResult[] {
	const sql = `
	UPDATE mytable1 SET value = ? WHERE id in (3, 4) RETURNING *
	`
	return db.prepare(sql)
		.raw(true)
		.all([data.value])
		.map(data => mapArrayToUpdate04MultiRowResultResult(data));
}

function mapArrayToUpdate04MultiRowResultResult(data: any) {
	const result: Update04MultiRowResultResult = {
		id: data[0],
		value: data[1]
	}
	return result;
}