import assert from "assert";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql, traverseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import { DynamicSqlInfo, DynamicSqlInfo2, DynamicSqlInfoResult2 } from '../../src/mysql-query-analyzer/types';

describe('sqlite-generate-dynamic-info', () => {

	it('dynamic-traverse-result-01', () => {

		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id
		WHERE m2.name = :name
		OR m2.descr = :description`

		const actual = traverseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfo2 = {
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
				},
				{
					fragment: 'm1.value',
					fragmentWitoutAlias: 'm1.value',
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
				},
				{
					fragment: 'm2.descr as description',
					fragmentWitoutAlias: 'm2.descr',
				},
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relation: 'm1',
					parentRelation: '',
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
					relation: 'm2',
					parentRelation: 'm1',
					parameters: []
				}
			],
			where: [
				{
					fragment: 'AND m2.name = ?',
					fields: [
						{
							parameters: [0],
							dependOnRelation: 'm2'
						}
					]
				},
				{
					fragment: 'AND m2.descr = ?',
					fields: [
						{
							parameters: [1],
							dependOnRelation: 'm2'
						}
					]
				},
			]

		}

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert(actual.right.traverseResult.queryType == 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	})

	it('dynamic-info-result01', () => {

		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id
		WHERE m2.name = :name
		OR m2.descr = :description`

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
				},
				{
					fragment: 'm1.value',
					fragmentWitoutAlias: 'm1.value',
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
				},
				{
					fragment: 'm2.descr as description',
					fragmentWitoutAlias: 'm2.descr',
				},
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					dependOnFields: [],
					dependOnParams: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
					dependOnFields: [2, 3],
					dependOnParams: ['name', 'description'],
					parameters: []
				}
			],
			where: [
				{
					fragment: 'AND m2.name = ?',
					dependOnParams: ['name'],
					parameters: ['name']
				},
				{
					fragment: 'AND m2.descr = ?',
					dependOnParams: ['description'],
					parameters: ['description']
				},
			]

		}

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	})

	it('dynamic-traverse-result-02', () => {

		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = :subqueryName
		) m2 on m2.id = m1.id
		WHERE (:name is NULL or m2.name = :name)`

		const actual = traverseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfo2 = {
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
				},
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relation: 'm1',
					parentRelation: '',
					parameters: []
				},
				{
					fragment: `INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = ?
		) m2 on m2.id = m1.id`,
					relation: 'm2',
					parentRelation: 'm1',
					parameters: [0]
				}
			],
			where: [
				{
					fragment: 'AND (? is NULL or m2.name = ?)',
					fields: [
						{
							parameters: [1, 2],
							dependOnRelation: 'm2'
						}
					]
				}
			]

		}

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert(actual.right.traverseResult.queryType == 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	})

	it('dynamic-info-result02', () => {

		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = :subqueryName
		) m2 on m2.id = m1.id
		WHERE (:name is NULL or m2.name = :name)`

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					dependOnFields: [],
					dependOnParams: [],
					parameters: []
				},
				{
					fragment: `INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = ?
		) m2 on m2.id = m1.id`,
					dependOnFields: [1],
					dependOnParams: ['name'],
					parameters: ['subqueryName']
				}
			],
			where: [
				{
					fragment: 'AND (? is NULL or m2.name = ?)',
					dependOnParams: ['name'],
					parameters: ['name', 'name']
				}
			]

		}

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	})
})