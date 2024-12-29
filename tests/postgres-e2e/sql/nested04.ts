import pg from 'pg';

export type Nested04Result = {
	surveyid: number;
	surveyname: string;
	participantid: number;
	userid: number;
	username: string;
}

export type Nested04NestedSurveys = {
	surveyid: number;
	surveyname: string;
	participants: Nested04NestedParticipants[];
}

export type Nested04NestedParticipants = {
	participantid: number;
	users: Nested04NestedUsers;
}

export type Nested04NestedUsers = {
	userid: number;
	username: string;
}

export async function nested04(client: pg.Client | pg.Pool): Promise<Nested04Result[]> {
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
	return client.query({ text: sql, rowMode: 'array' })
		.then(res => res.rows.map(row => mapArrayToNested04Result(row)));
}

function mapArrayToNested04Result(data: any) {
	const result: Nested04Result = {
		surveyid: data[0],
		surveyname: data[1],
		participantid: data[2],
		userid: data[3],
		username: data[4]
	}
	return result;
}

export async function nested04Nested(client: pg.Client | pg.Pool): Promise<Nested04NestedSurveys[]> {
	const selectResult = await nested04(client);
	if (selectResult.length == 0) {
		return [];
	}
	return collectNested04NestedSurveys(selectResult);
}

function collectNested04NestedSurveys(selectResult: Nested04Result[]): Nested04NestedSurveys[] {
	const grouped = groupBy(selectResult.filter(r => r.surveyid != null), r => r.surveyid);
	return [...grouped.values()].map(row => ({
		surveyid: row[0].surveyid!,
		surveyname: row[0].surveyname!,
		participants: collectNested04NestedParticipants(row),
	}))
}

function collectNested04NestedParticipants(selectResult: Nested04Result[]): Nested04NestedParticipants[] {
	const grouped = groupBy(selectResult.filter(r => r.participantid != null), r => r.participantid);
	return [...grouped.values()].map(row => ({
		participantid: row[0].participantid!,
		users: collectNested04NestedUsers(row)[0],
	}))
}

function collectNested04NestedUsers(selectResult: Nested04Result[]): Nested04NestedUsers[] {
	const grouped = groupBy(selectResult.filter(r => r.userid != null), r => r.userid);
	return [...grouped.values()].map(row => ({
		userid: row[0].userid!,
		username: row[0].username!,
	}))
}

const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) => {
	return array.reduce((map, value, index, array) => {
		const key = predicate(value, index, array);
		map.get(key)?.push(value) ?? map.set(key, [value]);
		return map;
	}, new Map<Q, T[]>());
}