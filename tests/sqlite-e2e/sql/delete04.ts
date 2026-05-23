import type { Database } from 'better-sqlite3';

export type Delete04Params = {
	ids: number[];
	ids2: number[];
}

export type Delete04Result = {
	id: number;
	value: number | null;
}

export function delete04(db: Database, params: Delete04Params): Delete04Result[] {
	const sql = `
	SELECT * FROM mytable1 WHERE id IN (${params.ids.map(() => '?')}) or id IN (${params.ids2.map(() => '?')})
	`
	const rows = db.prepare(sql)
		.raw(true)
		.all([...params.ids, ...params.ids2]);

	return rows.map(data => mapArrayToDelete04Result(data));
}

function mapArrayToDelete04Result(data: any) {
	const result: Delete04Result = {
		id: data[0],
		value: data[1]
	}
	return result;
}