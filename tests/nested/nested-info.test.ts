import assert from 'node:assert';
import { ColumnDescription, describeNestedQuery, Relation2, RelationInfo2 } from '../../src/sqlite-query-analyzer/sqlite-describe-nested-query';
import { isLeft } from 'fp-ts/lib/Either';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { createSchemaInfo, createTestClient } from '../postgres/schema';

describe('nested-info', () => {

	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end();
	});

	it('SELECT FROM users u INNER JOIN posts p', async () => {
		// SELECT
		// 	u.id as user_id,
		// 	u.name as user_name,
		// 	p.id as post_id,
		// 	p.title as post_title,
		// 	p.body  as post_body
		// FROM users u
		// INNER JOIN posts p on p.fk_user = u.id

		const columns: ColumnDescription[] = [
			{
				name: 'user_id',
				notNull: true,
				table: 'users',
			},
			{
				name: 'user_name',
				notNull: true,
				table: 'users',
			},
			{
				name: 'post_id',
				notNull: true,
				table: 'posts',
			},
			{
				name: 'post_title',
				notNull: true,
				table: 'posts',
			},
			{
				name: 'post_body',
				notNull: true,
				table: 'posts',
			},
		];

		const relations: Relation2[] = [
			{
				name: 'users',
				alias: 'u',
				renameAs: false,
				parentRelation: '',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: 'p',
				renameAs: false,
				parentRelation: 'u',
				joinColumn: 'post_id',
				cardinality: 'many',
				parentCardinality: 'one'
			}
		];

		const actual = describeNestedQuery(columns, relations);
		if (isLeft(actual)) {
			assert.fail('error');
		}

		const expected: RelationInfo2[] = [
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [
					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: [
					{
						name: 'posts',
						alias: 'p',
						notNull: true,
						cardinality: 'many'
					}
				]
			},
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: []
			}
		]


		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT FROM posts p INNER JOIN users u', async () => {
		// SELECT
		//     u.id as user_id,
		//     u.name as user_name,
		//     p.id as post_id,
		//     p.title as post_title,
		//     p.body  as post_body
		// FROM posts p
		// INNER JOIN users u on u.id = p.fk_user

		const columns: ColumnDescription[] = [
			{
				name: 'user_id',
				notNull: true,
				table: 'users',
			},
			{
				name: 'user_name',
				notNull: true,
				table: 'users',
			},
			{
				name: 'post_id',
				notNull: true,
				table: 'posts',
			},
			{
				name: 'post_title',
				notNull: true,
				table: 'posts',
			},
			{
				name: 'post_body',
				notNull: true,
				table: 'posts',
			},
		];

		const relations: Relation2[] = [
			{
				name: 'posts',
				alias: 'p',
				renameAs: false,
				parentRelation: '',
				joinColumn: 'post_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'users',
				alias: 'u',
				renameAs: false,
				parentRelation: 'p',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'many'
			}
		];

		const actual = describeNestedQuery(columns, relations);
		if (isLeft(actual)) {
			assert.fail('error');
		}

		const expected: RelationInfo2[] = [
			{
				name: 'posts',
				alias: 'p',
				groupIndex: 2,
				fields: [
					{
						name: 'post_id',
						index: 2
					},
					{
						name: 'post_title',
						index: 3
					},
					{
						name: 'post_body',
						index: 4
					}
				],
				relations: [
					{
						name: 'users',
						alias: 'u',
						notNull: true,
						cardinality: 'one'
					}
				]
			},
			{
				name: 'users',
				alias: 'u',
				groupIndex: 0,
				fields: [

					{
						name: 'user_id',
						index: 0
					},
					{
						name: 'user_name',
						index: 1
					}
				],
				relations: []
			}
		]


		assert.deepStrictEqual(actual.right, expected);
	});

	it('self relation - clients with primaryAddress and secondaryAddress', async () => {
		const sql = `
		-- @nested
        SELECT
            c.id,
            a1.*,
            a2.*
        FROM clients as c
        INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
        LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
        WHERE c.id = $1`

		const actual = await describeQuery(client, sql, ['clientId'], schemaInfo);

		const expected: RelationInfo2[] = [
			{
				name: 'c',
				alias: 'c',
				groupIndex: 0,
				fields: [
					{
						name: 'id',
						index: 0
					}
				],
				relations: [
					{
						name: 'a1',
						alias: 'a1',
						notNull: true,
						cardinality: 'one'
					},
					{
						name: 'a2',
						alias: 'a2',
						notNull: false,
						cardinality: 'one'
					}
				]
			},
			{
				name: 'a1',
				alias: 'a1',
				groupIndex: 1,
				fields: [

					{
						name: 'id',
						index: 1
					},
					{
						name: 'address',
						index: 2
					}
				],
				relations: []
			},
			{
				name: 'a2',
				alias: 'a2',
				groupIndex: 3,
				fields: [

					{
						name: 'id',
						index: 3
					},
					{
						name: 'address',
						index: 4
					}
				],
				relations: []
			}
		]


		assert.deepStrictEqual(actual._unsafeUnwrap().nestedInfo, expected);
	});

	it('many to many - surveys with users', async () => {
		const sql = `-- @nested
		SELECT
			s.id as surveyId,
			s.name as surveyName,
			u.id as userId,
			u.name as userName
		FROM surveys s
		INNER JOIN participants p on p.fk_survey = s.id
		INNER JOIN users u on u.id = p.fk_user`;

		const actual = await describeQuery(client, sql, [], schemaInfo);

		const expected: RelationInfo2[] = [
			{
				name: 'surveys',
				alias: 's',
				groupIndex: 0,
				fields: [
					{
						name: 'surveyid',
						index: 0
					},
					{
						name: 'surveyname',
						index: 1
					}
				],
				relations: [
					{
						name: 'users',
						alias: 'u',
						notNull: true,
						cardinality: 'many'
					}
				]
			},
			{
				name: 'users',
				alias: 'u',
				groupIndex: 2,
				fields: [

					{
						name: 'userid',
						index: 2
					},
					{
						name: 'username',
						index: 3
					}
				],
				relations: []
			}
		]
		assert.deepStrictEqual(actual._unsafeUnwrap().nestedInfo, expected);
	});
});
