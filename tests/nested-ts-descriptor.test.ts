import assert from 'node:assert';
import { describeNestedQuery } from '../src/describe-nested-query';
import {
	createMysqlClientForTest,
	loadMysqlSchema
} from '../src/queryExectutor';
import { isLeft } from 'fp-ts/lib/Either';
import { extractQueryInfo } from '../src/mysql-query-analyzer/parse';
import {
	type NestedTsDescriptor,
	createNestedTsDescriptor
} from '../src/ts-nested-descriptor';
import type { MySqlDialect } from '../src/types';

describe('Test nested-ts-descriptor', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest(
			'mysql://root:password@localhost/mydb'
		);
	});

	it('SELECT FROM users u INNER JOIN posts p', async () => {
		const dbSchema = await loadMysqlSchema(client.client, client.schema);

		const sql = `
        SELECT
            u.id as user_id,
            u.name as user_name,
            p.id as post_id,
            p.title as post_title
        FROM users u
        INNER JOIN posts p on p.fk_user = u.id
        `;

		if (isLeft(dbSchema)) {
			assert.fail(`Shouldn't return an error: ${dbSchema.left.description}`);
		}
		const model = describeNestedQuery(sql, dbSchema.right);
		const queryInfo = extractQueryInfo(sql, dbSchema.right);
		assert(queryInfo.kind === 'Select');
		const actual = createNestedTsDescriptor(queryInfo.columns, model);
		const expected: NestedTsDescriptor = {
			relations: [
				{
					name: 'users',
					groupKeyIndex: 0,
					fields: [
						{
							type: 'field',
							name: 'user_id',
							index: 0,
							tsType: 'number',
							notNull: true
						},
						{
							type: 'field',
							name: 'user_name',
							index: 1,
							tsType: 'string',
							notNull: true
						},
						{
							type: 'relation',
							name: 'posts',
							list: true,
							tsType: 'posts[]',
							notNull: true
						}
					]
				},
				{
					name: 'posts',
					groupKeyIndex: 2,
					fields: [
						{
							type: 'field',
							name: 'post_id',
							index: 2,
							tsType: 'number',
							notNull: true
						},
						{
							type: 'field',
							name: 'post_title',
							index: 3,
							tsType: 'string',
							notNull: true
						}
					]
				}
			]
		};
		assert.deepStrictEqual(actual, expected);
	});
});
