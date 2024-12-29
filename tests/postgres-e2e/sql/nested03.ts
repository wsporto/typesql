import pg from 'pg';

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

export type Nested03NestedC = {
	id: number;
	a1: Nested03NestedA1;
	a2: Nested03NestedA2;
}

export type Nested03NestedA1 = {
	id: number;
	address: string;
}

export type Nested03NestedA2 = {
	id: number | null;
	address: string | null;
}

export async function nested03(client: pg.Client | pg.Pool, params: Nested03Params): Promise<Nested03Result[]> {
	const sql = `
	-- @nested
	SELECT
		c.id,
		a1.*,
		a2.*
	FROM clients as c
	INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
	LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
	WHERE c.id = $1
	`
	return client.query({ text: sql, rowMode: 'array', values: [params.param1] })
		.then(res => res.rows.map(row => mapArrayToNested03Result(row)));
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

export async function nested03Nested(client: pg.Client | pg.Pool, params: Nested03Params): Promise<Nested03NestedC[]> {
	const selectResult = await nested03(client, params);
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