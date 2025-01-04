import assert from 'node:assert';
import type { DynamicSqlInfo2 } from '../../src/mysql-query-analyzer/types';
import { PostgresColumnSchema } from '../../src/drivers/types';
import postgres from 'postgres';
import { loadDbSchema } from '../../src/drivers/postgres';
import { parseSql } from '../../src/postgres-query-analyzer/parser';

describe('postgres-generate-dynamic-info', () => {
	let dbSchema: PostgresColumnSchema[] = [];

	const databaseClient = postgres({
		host: 'localhost',
		user: 'postgres',
		password: 'password',
		port: 5432,
		database: 'postgres',
	});

	before(async function () {
		const dbSchemaResult = await await loadDbSchema(databaseClient);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${dbSchemaResult.error}`);
		}
		dbSchema = dbSchemaResult.value;
	});

	it('dynamic-traverse-result-01', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const actual = parseSql(sql, dbSchema, { collectDynamicQueryInfo: true });
		const expected: DynamicSqlInfo2 = {
			with: [],
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
					dependOnRelations: ['m1'],
					parameters: []
				},
				{
					fragment: 'm1.value',
					fragmentWitoutAlias: 'm1.value',
					dependOnRelations: ['m1'],
					parameters: []
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
					dependOnRelations: ['m2'],
					parameters: []
				},
				{
					fragment: 'm2.descr as description',
					fragmentWitoutAlias: 'm2.descr',
					dependOnRelations: ['m2'],
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relationName: 'mytable1',
					relationAlias: 'm1',
					parentRelation: '',
					fields: ['id', 'value'],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
					relationName: 'mytable2',
					relationAlias: 'm2',
					parentRelation: 'm1',
					fields: ['id', 'name', 'descr'],
					parameters: []
				}
			],
			where: []
		};

		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-traverse-result-02', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = $1
		) m2 on m2.id = m1.id
		WHERE ($2 is NULL or m2.name = $3)`;

		const actual = parseSql(sql, dbSchema, { collectDynamicQueryInfo: true });
		const expected: DynamicSqlInfo2 = {
			with: [],
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
					dependOnRelations: ['m1'],
					parameters: []
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
					dependOnRelations: ['m2'],
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relationName: 'mytable1',
					relationAlias: 'm1',
					parentRelation: '',
					fields: ['id', 'value'],
					parameters: []
				},
				{
					fragment: `INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = $1
		) m2 on m2.id = m1.id`,
					relationName: 'm2',
					relationAlias: 'm2',
					parentRelation: 'm1',
					fields: ['id', 'name'],
					parameters: [0]
				}
			],
			where: [
				{
					fragment: 'AND ($2 is NULL or m2.name = $3)',
					dependOnRelations: ['m2'],
					parameters: [1, 2]
				}
			]
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});
});
