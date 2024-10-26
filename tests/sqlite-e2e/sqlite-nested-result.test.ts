import assert from 'node:assert';
import Database from 'better-sqlite3';
import { nested01Nested, Nested01NestedUsers, nested02Nested, Nested02NestedUsers, nested03Nested, Nested03NestedC, nested04Nested, Nested04NestedSurveys, nested04WithoutJoinTableNested, Nested04WithoutJoinTableNestedSurveys } from '../../tests/sqlite-e2e/sql';

describe('sqlite-nested-result', () => {
	const db = new Database('./mydb.db');

	it('nested01 - users -> posts', () => {
		const result = nested01Nested(db);

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

	it('nested02 - users -> posts -> roles -> comments', () => {
		const result = nested02Nested(db);

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

	it('nested03 - client1', () => {
		const result = nested03Nested(db, {
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

	it('nested03 - client3', () => {
		const result = nested03Nested(db, {
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

	it('nested04 - surveys -> participants -> users (with join table)', () => {
		const result = nested04Nested(db);

		const expectedResult: Nested04NestedSurveys[] = [
			{
				surveyId: 1,
				surveyName: 's1',
				participants: [
					{
						participantId: 1,
						users: {
							userId: 1,
							userName: 'user1'
						}
					}
				]
			},
			{
				surveyId: 2,
				surveyName: 's2',
				participants: [
					{
						participantId: 2,
						users: {
							userId: 1,
							userName: 'user1'
						}
					},
					{
						participantId: 3,
						users: {
							userId: 3,
							userName: 'user3'
						}
					}
				]
			},
			{
				surveyId: 3,
				surveyName: 's3',
				participants: [
					{
						participantId: 4,
						users: {
							userId: 3,
							userName: 'user3'
						}
					},
					{
						participantId: 6,
						users: {
							userId: 4,
							userName: 'user4'
						}
					}
				]
			},
			{
				surveyId: 4,
				surveyName: 's4',
				participants: [
					{
						participantId: 5,
						users: {
							userId: 3,
							userName: 'user3'
						}
					}
				]
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('nested04 - surveys -> participants -> users (without join table)', () => {
		const result = nested04WithoutJoinTableNested(db);

		const expectedResult: Nested04WithoutJoinTableNestedSurveys[] = [
			{
				id: 1,
				name: 's1',
				users: [
					{
						id: 1,
						name: 'user1'
					}
				]
			},
			{
				id: 2,
				name: 's2',
				users: [
					{
						id: 1,
						name: 'user1'
					},
					{
						id: 3,
						name: 'user3'
					}
				]
			},
			{
				id: 3,
				name: 's3',
				users: [
					{
						id: 3,
						name: 'user3'
					},
					{
						id: 4,
						name: 'user4'
					}
				]
			},
			{
				id: 4,
				name: 's4',
				users: [
					{
						id: 3,
						name: 'user3'
					}
				]
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});
});
