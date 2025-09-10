import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export type Copy02Params = {
	id: string;
	name: string | null;
	year: number | null;
}

const columns = ['id', 'name', 'year'] as const;

export async function copy02(client: pg.Client | pg.PoolClient, values: Copy02Params[]): Promise<void> {
	const sql = `
	COPY mytable4 FROM STDIN WITH CSV
	`
	const csv = jsonToCsv(values);

	const sourceStream = Readable.from(csv);
	const stream = client.query(copyFrom(sql));
	await pipeline(sourceStream, stream)
}

function jsonToCsv(values: Copy02Params[]): string {
	return values
		.map(value =>
			columns.map(col => value[col])
				.map(val => escapeValue(val))
				.join(',')
		)
		.join('\n');
}

function escapeValue(val: any): string {
	if (val == null) {
		return '';
	}
	const str = String(val);
	const escaped = str.replace(/"/g, '""');
	return `"${escaped}"`;
}