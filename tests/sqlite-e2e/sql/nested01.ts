import type { Database } from 'better-sqlite3';

export type Nested01Result = {
	user_id: number;
	user_name: string;
	post_id: number;
	post_title: string;
}

export function nested01(db: Database): Nested01Result[] {
	const sql = `
	-- @nested
	SELECT 
		u.id as user_id, 
		u.name as user_name,
		p.id as post_id,
		p.title as post_title
	FROM users u
	INNER JOIN posts p on p.fk_user = u.id
	`
	return db.prepare(sql)
		.raw(true)
		.all()
		.map(data => mapArrayToNested01Result(data));
}

function mapArrayToNested01Result(data: any) {
	const result: Nested01Result = {
		user_id: data[0],
		user_name: data[1],
		post_id: data[2],
		post_title: data[3]
	}
	return result;
}

export type Nested01NestedUsers = {
	user_id: number;
	user_name: string;
	posts: Nested01NestedPosts[];
}

export type Nested01NestedPosts = {
	post_id: number;
	post_title: string;
}

export function nested01Nested(db: Database): Nested01NestedUsers[] {
	const selectResult = nested01(db);
	if (selectResult.length == 0) {
		return [];
	}
	return collectNested01NestedUsers(selectResult);
}

function collectNested01NestedUsers(selectResult: Nested01Result[]): Nested01NestedUsers[] {
	const grouped = groupBy(selectResult.filter(r => r.user_id != null), r => r.user_id);
	return [...grouped.values()].map(row => ({
		user_id: row[0].user_id!,
		user_name: row[0].user_name!,
		posts: collectNested01NestedPosts(row),
	}))
}

function collectNested01NestedPosts(selectResult: Nested01Result[]): Nested01NestedPosts[] {
	const grouped = groupBy(selectResult.filter(r => r.post_id != null), r => r.post_id);
	return [...grouped.values()].map(row => ({
		post_id: row[0].post_id!,
		post_title: row[0].post_title!,
	}))
}

const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(value) ?? map.set(key, [value]);
		return map;
	}, new Map<Q, T[]>());
}