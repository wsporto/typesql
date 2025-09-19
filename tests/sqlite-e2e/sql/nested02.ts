import type { Database } from 'better-sqlite3';

export type Nested02Result = {
	user_id: number;
	user_name: string;
	post_id: number;
	post_title: string;
	post_body: string;
	role_id: number;
	role: string;
	comment_id: number;
	comment: string;
}

export function nested02(db: Database): Nested02Result[] {
	const sql = `
	-- @nested
	SELECT
		u.id as user_id,
		u.name as user_name,
		p.id as post_id,
		p.title as post_title,
		p.body  as post_body,
		r.id as role_id,
		r.role,
		c.id as comment_id,
		c.comment
	FROM users u
	INNER JOIN posts p on p.fk_user = u.id
	INNER JOIN roles r on r.fk_user = u.id
	INNER JOIN comments c on c.fk_post = p.id
	`
	return db.prepare(sql)
		.raw(true)
		.all()
		.map(data => mapArrayToNested02Result(data));
}

function mapArrayToNested02Result(data: any) {
	const result: Nested02Result = {
		user_id: data[0],
		user_name: data[1],
		post_id: data[2],
		post_title: data[3],
		post_body: data[4],
		role_id: data[5],
		role: data[6],
		comment_id: data[7],
		comment: data[8]
	}
	return result;
}

export type Nested02NestedUsers = {
	user_id: number;
	user_name: string;
	posts: Nested02NestedPosts[];
	roles: Nested02NestedRoles[];
}

export type Nested02NestedPosts = {
	post_id: number;
	post_title: string;
	post_body: string;
	comments: Nested02NestedComments[];
}

export type Nested02NestedRoles = {
	role_id: number;
	role: string;
}

export type Nested02NestedComments = {
	comment_id: number;
	comment: string;
}

export function nested02Nested(db: Database): Nested02NestedUsers[] {
	const selectResult = nested02(db);
	if (selectResult.length == 0) {
		return [];
	}
	return collectNested02NestedUsers(selectResult);
}

function collectNested02NestedUsers(selectResult: Nested02Result[]): Nested02NestedUsers[] {
	const grouped = groupBy(selectResult.filter(r => r.user_id != null), r => r.user_id);
	return [...grouped.values()].map(row => ({
		user_id: row[0].user_id!,
		user_name: row[0].user_name!,
		posts: collectNested02NestedPosts(row),
		roles: collectNested02NestedRoles(row),
	}))
}

function collectNested02NestedPosts(selectResult: Nested02Result[]): Nested02NestedPosts[] {
	const grouped = groupBy(selectResult.filter(r => r.post_id != null), r => r.post_id);
	return [...grouped.values()].map(row => ({
		post_id: row[0].post_id!,
		post_title: row[0].post_title!,
		post_body: row[0].post_body!,
		comments: collectNested02NestedComments(row),
	}))
}

function collectNested02NestedRoles(selectResult: Nested02Result[]): Nested02NestedRoles[] {
	const grouped = groupBy(selectResult.filter(r => r.role_id != null), r => r.role_id);
	return [...grouped.values()].map(row => ({
		role_id: row[0].role_id!,
		role: row[0].role!,
	}))
}

function collectNested02NestedComments(selectResult: Nested02Result[]): Nested02NestedComments[] {
	const grouped = groupBy(selectResult.filter(r => r.comment_id != null), r => r.comment_id);
	return [...grouped.values()].map(row => ({
		comment_id: row[0].comment_id!,
		comment: row[0].comment!,
	}))
}

const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(value) ?? map.set(key, [value]);
		return map;
	}, new Map<Q, T[]>());
}