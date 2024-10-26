import type { Database } from 'better-sqlite3';

export type Nested04Result = {
	surveyId: number;
	surveyName: string;
	participantId: number;
	userId: number;
	userName: string;
}

export function nested04(db: Database): Nested04Result[] {
	const sql = `
	-- @nested
	SELECT
		s.id as surveyId,
		s.name as surveyName,
		p.id as participantId,
		u.id as userId,
		u.name as userName
	FROM surveys s
	INNER JOIN participants p on p.fk_survey = s.id
	INNER JOIN users u on u.id = p.fk_user
	`
	return db.prepare(sql)
		.raw(true)
		.all()
		.map(data => mapArrayToNested04Result(data));
}

function mapArrayToNested04Result(data: any) {
	const result: Nested04Result = {
		surveyId: data[0],
		surveyName: data[1],
		participantId: data[2],
		userId: data[3],
		userName: data[4]
	}
	return result;
}

export type Nested04NestedSurveys = {
	surveyId: number;
	surveyName: string;
	participants: Nested04NestedParticipants[];
}

export type Nested04NestedParticipants = {
	participantId: number;
	users: Nested04NestedUsers;
}

export type Nested04NestedUsers = {
	userId: number;
	userName: string;
}

export function nested04Nested(db: Database): Nested04NestedSurveys[] {
	const selectResult = nested04(db);
	if (selectResult.length == 0) {
		return [];
	}
	return collectNested04NestedSurveys(selectResult);
}

function collectNested04NestedSurveys(selectResult: Nested04Result[]): Nested04NestedSurveys[] {
	const grouped = groupBy(selectResult.filter(r => r.surveyId != null), r => r.surveyId);
	return [...grouped.values()].map(row => ({
		surveyId: row[0].surveyId!,
		surveyName: row[0].surveyName!,
		participants: collectNested04NestedParticipants(row),
	}))
}

function collectNested04NestedParticipants(selectResult: Nested04Result[]): Nested04NestedParticipants[] {
	const grouped = groupBy(selectResult.filter(r => r.participantId != null), r => r.participantId);
	return [...grouped.values()].map(row => ({
		participantId: row[0].participantId!,
		users: collectNested04NestedUsers(row)[0],
	}))
}

function collectNested04NestedUsers(selectResult: Nested04Result[]): Nested04NestedUsers[] {
	const grouped = groupBy(selectResult.filter(r => r.userId != null), r => r.userId);
	return [...grouped.values()].map(row => ({
		userId: row[0].userId!,
		userName: row[0].userName!,
	}))
}

const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(value) ?? map.set(key, [value]);
		return map;
	}, new Map<Q, T[]>());
}