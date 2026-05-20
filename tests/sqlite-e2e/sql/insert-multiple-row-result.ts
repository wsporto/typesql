import type { Database } from 'better-sqlite3';

export type InsertMultipleRowResultParams = {
	value1: number | null;
	value2: number | null;
	value3: number | null;
}

export type InsertMultipleRowResultResult = {
	id: number;
	value: number | null;
}

export function insertMultipleRowResult(db: Database, params: InsertMultipleRowResultParams): InsertMultipleRowResultResult[] {
	const sql = `
	INSERT INTO mytable1(
	    value
	) VALUES (?), (?), (?)
	RETURNING *
	`
	const rows = db.prepare(sql)
		.raw(true)
		.all([params.value1, params.value2, params.value3]);

	return rows.map(data => mapArrayToInsertMultipleRowResultResult(data));
}

function mapArrayToInsertMultipleRowResultResult(data: any) {
	const result: InsertMultipleRowResultResult = {
		id: data[0],
		value: data[1]
	}
	return result;
}