import type { Database } from 'better-sqlite3';

export type Update05Params = {
	ids: number[];
}

export type Update05Result = {
	id: number;
	value: number | null;
}

export function update05(db: Database, params: Update05Params): Update05Result[] {
	const sql = `
	UPDATE mytable1 SET value = 1 where id IN (${params.ids.map(() => '?')}) RETURNING *
	`
	const rows = db.prepare(sql)
		.raw(true)
		.all([...params.ids]);

	return rows.map(data => mapArrayToUpdate05Result(data));
}

function mapArrayToUpdate05Result(data: any) {
	const result: Update05Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}