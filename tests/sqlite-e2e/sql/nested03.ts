import type { Database } from 'better-sqlite3';

export type Nested03Params = {
	param1: number;
}

export type Nested03Result = {
	id: number;
	id_2: number;
	address: string;
	id_3?: number;
	address_2?: string;
}

export function nested03(db: Database, params: Nested03Params): Nested03Result[] {
	const sql = `
	-- @nested
	SELECT
		c.id,
		a1.*,
		a2.*
	FROM clients as c
	INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
	LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
	WHERE c.id = ?
	`
	return db.prepare(sql)
		.raw(true)
		.all([params.param1])
		.map(data => mapArrayToNested03Result(data));
}

function mapArrayToNested03Result(data: any) {
	const result: Nested03Result = {
		id: data[0],
		id_2: data[1],
		address: data[2],
		id_3: data[3],
		address_2: data[4]
	}
	return result;
}

export type Nested03NestedC = {
	id: number;
	a1: Nested03NestedA1;
	a2?: Nested03NestedA2;
}

export type Nested03NestedA1 = {
	id: number;
	address: string;
}

export type Nested03NestedA2 = {
	id: number;
	address: string;
}

export function nested03Nested(db: Database, params: Nested03Params): Nested03NestedC[] {
	const selectResult = nested03(db, params);
	if (selectResult.length == 0) {
		return [];
	}
	return collectNested03NestedC(selectResult);
}

function collectNested03NestedC(selectResult: Nested03Result[]): Nested03NestedC[] {
	const grouped = groupBy(selectResult.filter(r => r.id != null), r => r.id);
	return [...grouped.values()].map(row => ({
		id: row[0].id!,
		a1: collectNested03NestedA1(row)[0],
		a2: collectNested03NestedA2(row)[0],
	}))
}

function collectNested03NestedA1(selectResult: Nested03Result[]): Nested03NestedA1[] {
	const grouped = groupBy(selectResult.filter(r => r.id_2 != null), r => r.id_2);
	return [...grouped.values()].map(row => ({
		id: row[0].id_2!,
		address: row[0].address!,
	}))
}

function collectNested03NestedA2(selectResult: Nested03Result[]): Nested03NestedA2[] {
	const grouped = groupBy(selectResult.filter(r => r.id_3 != null), r => r.id_3);
	return [...grouped.values()].map(row => ({
		id: row[0].id_3!,
		address: row[0].address_2!,
	}))
}

const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(value) ?? map.set(key, [value]);
		return map;
	}, new Map<Q, T[]>());
}