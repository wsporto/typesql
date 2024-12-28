import assert from 'node:assert';
import { describeNestedQuery, Relation2, RelationInfo2 } from '../../src/sqlite-query-analyzer/sqlite-describe-nested-query';
import { ColumnInfo } from '../../src/mysql-query-analyzer/types';
import { isLeft } from 'fp-ts/lib/Either';

describe('nested-info', () => {

	it('SELECT FROM users u INNER JOIN posts p', async () => {
		// SELECT
		// 	u.id as user_id,
		// 	u.name as user_name,
		// 	p.id as post_id,
		// 	p.title as post_title,
		// 	p.body  as post_body
		// FROM users u
		// INNER JOIN posts p on p.fk_user = u.id

		const columns: ColumnInfo[] = [
			{
				columnName: 'user_id',
				notNull: true,
				type: 'int4',
				table: 'users',
			},
			{
				columnName: 'user_name',
				notNull: true,
				type: 'text',
				table: 'users',
			},
			{
				columnName: 'post_id',
				notNull: true,
				type: 'int4',
				table: 'posts',
			},
			{
				columnName: 'post_title',
				notNull: true,
				type: 'text',
				table: 'posts',
			},
			{
				columnName: 'post_body',
				notNull: true,
				type: 'text',
				table: 'posts',
			},
		];

		const relations: Relation2[] = [
			{
				name: 'users',
				alias: 'u',
				parentRelation: '',
				joinColumn: 'user_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'posts',
				alias: 'p',
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

		const columns: ColumnInfo[] = [
			{
				columnName: 'user_id',
				notNull: true,
				type: 'int4',
				table: 'users',
			},
			{
				columnName: 'user_name',
				notNull: true,
				type: 'text',
				table: 'users',
			},
			{
				columnName: 'post_id',
				notNull: true,
				type: 'int4',
				table: 'posts',
			},
			{
				columnName: 'post_title',
				notNull: true,
				type: 'text',
				table: 'posts',
			},
			{
				columnName: 'post_body',
				notNull: true,
				type: 'text',
				table: 'posts',
			},
		];

		const relations: Relation2[] = [
			{
				name: 'posts',
				alias: 'p',
				parentRelation: '',
				joinColumn: 'post_id',
				cardinality: 'one',
				parentCardinality: 'one'
			},
			{
				name: 'users',
				alias: 'u',
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
});
