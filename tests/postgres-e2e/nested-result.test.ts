import assert from 'node:assert';
import pg from 'pg'
import { nested01Nested, Nested01NestedUsers, nested02Nested, Nested02NestedUsers, nested03Nested, Nested03NestedC, nested04Nested, Nested04NestedSurveys } from './sql'

describe('postgres-nested-result', () => {

	const pool = new pg.Pool({
		connectionString: 'postgres://postgres:password@127.0.0.1:5432/postgres'
	})

	it('nested01 - users -> posts', async () => {
		const result = await nested01Nested(pool);

		const expectedResult: Nested01NestedUsers[] = [
			{
				user_id: 1,
				user_name: 'user1',
				posts: [
					{
						post_id: 1,
						post_title: 'title1',
					},
					{
						post_id: 2,
						post_title: 'title2',
					},
					{
						post_id: 3,
						post_title: 'title3',
					}
				]
			},
			// { //INNER JOIN
			// 	user_id: 2,
			// 	user_name: 'user2',
			// 	posts: []
			// },
			{
				user_id: 3,
				user_name: 'user3',
				posts: [
					{
						post_id: 4,
						post_title: 'title4',
					},
					{
						post_id: 5,
						post_title: 'title5',
					}
				],
			},
			{
				user_id: 4,
				user_name: 'user4',
				posts: [
					{
						post_id: 6,
						post_title: 'title6',
					}
				]
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('nested02 - users -> posts -> roles -> comments', async () => {
		const result = await nested02Nested(pool);

		const expectedResult: Nested02NestedUsers[] = [
			{
				user_id: 1,
				user_name: 'user1',
				posts: [
					{
						post_id: 1,
						post_title: 'title1',
						post_body: 'body1',
						comments: [
							{
								comment_id: 1,
								comment: 'comment1'
							},
							{
								comment_id: 2,
								comment: 'comment2'
							}
						]
					},
					// {
					// 	post_id: 2,
					// 	post_title: 'title2',
					// 	post_body: 'body2',
					// 	comments: []
					// },
					{
						post_id: 3,
						post_title: 'title3',
						post_body: 'body3',
						comments: [
							{
								comment_id: 3,
								comment: 'comment3'
							}
						]
					}
				],
				roles: [
					{
						role_id: 1,
						role: 'role1'
					},
					{
						role_id: 2,
						role: 'role2'
					}
				]
			},
			{
				user_id: 3,
				user_name: 'user3',
				posts: [
					{
						post_id: 4,
						post_title: 'title4',
						post_body: 'body4',
						comments: [
							{
								comment_id: 4,
								comment: 'comment4'
							},
							{
								comment_id: 5,
								comment: 'comment5'
							},
							{
								comment_id: 6,
								comment: 'comment6'
							}
						]
					},
					{
						post_id: 5,
						post_title: 'title5',
						post_body: 'body5',
						comments: [
							{
								comment_id: 7,
								comment: 'comment7'
							}
						]
					}
				],
				roles: [
					{
						role_id: 4,
						role: 'role4'
					}
				]
			},
			{
				user_id: 4,
				user_name: 'user4',
				posts: [
					{
						post_id: 6,
						post_title: 'title6',
						post_body: 'body6',
						comments: [
							{
								comment_id: 8,
								comment: 'comment8'
							}
						]
					}
				],
				roles: [
					{
						role_id: 5,
						role: 'role5'
					},
					{
						role_id: 6,
						role: 'role6'
					}
				]
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('nested03 - client1', async () => {
		const result = await nested03Nested(pool, {
			param1: 1
		});

		const expectedResult: Nested03NestedC[] = [
			{
				id: 1,
				a1: {
					id: 1,
					address: 'address1'
				},
				a2: {
					id: 2,
					address: 'address2'
				}
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('nested03 - client3', async () => {
		const result = await nested03Nested(pool, {
			param1: 3
		});

		const expectedResult: Nested03NestedC[] = [
			{
				id: 3,
				a1: {
					id: 3,
					address: 'address3'
				},
				//@ts-ignore
				a2: undefined
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('nested04 - surveys -> participants -> users (with join table)', async () => {
		const result = await nested04Nested(pool);

		const expectedResult: Nested04NestedSurveys[] = [
			{
				surveyid: 1,
				surveyname: 's1',
				participants: [
					{
						participantid: 1,
						users: {
							userid: 1,
							username: 'user1'
						}
					}
				]
			},
			{
				surveyid: 2,
				surveyname: 's2',
				participants: [
					{
						participantid: 2,
						users: {
							userid: 1,
							username: 'user1'
						}
					},
					{
						participantid: 3,
						users: {
							userid: 3,
							username: 'user3'
						}
					}
				]
			},
			{
				surveyid: 3,
				surveyname: 's3',
				participants: [
					{
						participantid: 4,
						users: {
							userid: 3,
							username: 'user3'
						}
					},
					{
						participantid: 6,
						users: {
							userid: 4,
							username: 'user4'
						}
					}
				]
			},
			{
				surveyid: 4,
				surveyname: 's4',
				participants: [
					{
						participantid: 5,
						users: {
							userid: 3,
							username: 'user3'
						}
					}
				]
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});
});
