import type { Database } from 'better-sqlite3';

export type InsertReturningNoRowsResult = {
	id: number;
	value: number | null;
}

export function insertReturningNoRows(db: Database): InsertReturningNoRowsResult[] {
	const sql = `
	INSERT INTO mytable1(
	    value
	)
	SELECT value
	FROM mytable1
	WHERE 1 > 2
	RETURNING *
	`
	const rows = db.prepare(sql)
		.raw(true)
		.all();

	return rows.map(data => mapArrayToInsertReturningNoRowsResult(data));
}

function mapArrayToInsertReturningNoRowsResult(data: any) {
	const result: InsertReturningNoRowsResult = {
		id: data[0],
		value: data[1]
	}
	return result;
}