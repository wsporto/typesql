import pg from 'pg';

export type Nested04WithoutJoinTableResult = {
	id: number;
	name: string;
	id_2: number;
	name_2: string;
	email: string | null;
}

export type Nested04WithoutJoinTableNestedSurveys = {
	id: number;
	name: string;
	users: Nested04WithoutJoinTableNestedUsers[];
}

export type Nested04WithoutJoinTableNestedUsers = {
	id: number;
	name: string;
	email: string | null;
}

export async function nested04WithoutJoinTable(client: pg.Client | pg.Pool | pg.PoolClient): Promise<Nested04WithoutJoinTableResult[]> {
	const sql = `
	-- @nested
	SELECT
		s.*,
		u.*
	FROM surveys s
	INNER JOIN participants p on p.fk_survey = s.id
	INNER JOIN users u on u.id = p.fk_user
	`
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.map(row => mapArrayToNested04WithoutJoinTableResult(row)));
}

function mapArrayToNested04WithoutJoinTableResult(data: any) {
	const result: Nested04WithoutJoinTableResult = {
		id: data[0],
		name: data[1],
		id_2: data[2],
		name_2: data[3],
		email: data[4]
	}
	return result;
}

export async function nested04WithoutJoinTableNested(client: pg.Client | pg.Pool | pg.PoolClient): Promise<Nested04WithoutJoinTableNestedSurveys[]> {
	const selectResult = await nested04WithoutJoinTable(client);
	if (selectResult.length == 0) {
		return [];
	}
	return collectNested04WithoutJoinTableNestedSurveys(selectResult);
}

function collectNested04WithoutJoinTableNestedSurveys(selectResult: Nested04WithoutJoinTableResult[]): Nested04WithoutJoinTableNestedSurveys[] {
	const grouped = groupBy(selectResult.filter(r => r.id != null), r => r.id);
	return [...grouped.values()].map(row => ({
		id: row[0].id!,
		name: row[0].name!,
		users: collectNested04WithoutJoinTableNestedUsers(row),
	}))
}

function collectNested04WithoutJoinTableNestedUsers(selectResult: Nested04WithoutJoinTableResult[]): Nested04WithoutJoinTableNestedUsers[] {
	const grouped = groupBy(selectResult.filter(r => r.id_2 != null), r => r.id_2);
	return [...grouped.values()].map(row => ({
		id: row[0].id_2!,
		name: row[0].name_2!,
		email: row[0].email!,
	}))
}

const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(value) ?? map.set(key, [value]);
		return map;
	}, new Map<Q, T[]>());
}