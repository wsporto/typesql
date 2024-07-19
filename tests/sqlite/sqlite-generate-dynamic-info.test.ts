import assert from 'node:assert';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql, traverseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';
import type { DynamicSqlInfo2, DynamicSqlInfoResult2 } from '../../src/mysql-query-analyzer/types';

describe('sqlite-generate-dynamic-info', () => {
	it('dynamic-traverse-result-01', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id
		WHERE m2.name = :name
		OR m2.descr = :description`;

		const actual = traverseSql(sql, sqliteDbSchema);
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
			where: [
				{
					fragment: `AND m2.name = ?
		OR m2.descr = ?`,
					dependOnRelations: ['m2'],
					parameters: [0, 1]
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result01', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id
		WHERE m2.name = :name
		OR m2.descr = :description`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [],
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
					parameters: []
				},
				{
					fragment: 'm1.value',
					fragmentWitoutAlias: 'm1.value',
					parameters: []
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
					parameters: []
				},
				{
					fragment: 'm2.descr as description',
					fragmentWitoutAlias: 'm2.descr',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relationName: 'mytable1',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
					relationName: 'mytable2',
					dependOnFields: [2, 3],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: `AND m2.name = ?
		OR m2.descr = ?`,
					parameters: ['name', 'description']
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-02', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = :subqueryName
		) m2 on m2.id = m1.id
		WHERE (:name is NULL or m2.name = :name)`;

		const actual = traverseSql(sql, sqliteDbSchema);
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
			WHERE m.name = ?
		) m2 on m2.id = m1.id`,
					relationName: '',
					relationAlias: 'm2',
					parentRelation: 'm1',
					fields: ['id', 'name'],
					parameters: [0]
				}
			],
			where: [
				{
					fragment: 'AND (? is NULL or m2.name = ?)',
					dependOnRelations: ['m2'],
					parameters: [1, 2]
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result02', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = :subqueryName
		) m2 on m2.id = m1.id
		WHERE (:name is NULL or m2.name = :name)`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [],
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
					parameters: []
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relationName: 'mytable1',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: `INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m 
			WHERE m.name = ?
		) m2 on m2.id = m1.id`,
					relationName: '',
					dependOnFields: [1],
					dependOnOrderBy: [],
					parameters: ['subqueryName']
				}
			],
			where: [
				{
					fragment: 'AND (? is NULL or m2.name = ?)',
					parameters: ['name', 'name']
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-05', () => {
		const sql = `-- @dynamicQuery
		WITH 
			cte as (
				select id, name from mytable2
			)
		SELECT 
			m1.id,
			m2.name
		FROM mytable1 m1
		INNER JOIN cte m2 on m2.id = m1.id
		WHERE m2.name LIKE concat('%', :name, '%')`;

		const actual = traverseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfo2 = {
			with: [
				{
					fragment: `cte as (
				select id, name from mytable2
			)`,
					relationName: 'cte',
					parameters: []
				}
			],
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
					fragment: 'INNER JOIN cte m2 on m2.id = m1.id',
					relationName: 'cte',
					relationAlias: 'm2',
					parentRelation: 'm1',
					fields: ['id', 'name'],
					parameters: []
				}
			],
			where: [
				{
					fragment: `AND m2.name LIKE concat('%', ?, '%')`,
					dependOnRelations: ['m2'],
					parameters: [0]
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result05', () => {
		const sql = `-- @dynamicQuery
		WITH 
			cte as (
				select id, name from mytable2
			)
		SELECT 
			m1.id,
			m2.name
		FROM mytable1 m1
		INNER JOIN cte m2 on m2.id = m1.id
		WHERE m2.name LIKE concat('%', :name, '%')`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [
				{
					fragment: `cte as (
				select id, name from mytable2
			)`,
					relationName: 'cte',
					dependOnFields: [1],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
					parameters: []
				},
				{
					fragment: 'm2.name',
					fragmentWitoutAlias: 'm2.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relationName: 'mytable1',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN cte m2 on m2.id = m1.id',
					relationName: 'cte',
					dependOnFields: [1], //m2.name
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: `AND m2.name LIKE concat('%', ?, '%')`,
					parameters: ['name']
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-06', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.*, m3.*
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m2.id = m1.id
		INNER JOIN mytable3 m3 on m3.id = m2.id`;

		const actual = traverseSql(sql, sqliteDbSchema);
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
					fragment: 'm3.id',
					fragmentWitoutAlias: 'm3.id',
					dependOnRelations: ['m3'],
					parameters: []
				},
				{
					fragment: 'm3.double_value',
					fragmentWitoutAlias: 'm3.double_value',
					dependOnRelations: ['m3'],
					parameters: []
				},
				{
					fragment: 'm3.name',
					fragmentWitoutAlias: 'm3.name',
					dependOnRelations: ['m3'],
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
					fragment: 'INNER JOIN mytable2 m2 on m2.id = m1.id',
					relationName: 'mytable2',
					relationAlias: 'm2',
					parentRelation: 'm1',
					fields: ['id', 'name', 'descr'],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable3 m3 on m3.id = m2.id',
					relationName: 'mytable3',
					relationAlias: 'm3',
					parentRelation: 'm2',
					fields: ['id', 'double_value', 'name'],
					parameters: []
				}
			],
			where: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result06', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.*, m3.*
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m2.id = m1.id
		INNER JOIN mytable3 m3 on m3.id = m2.id`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [],
			select: [
				{
					fragment: 'm1.id',
					fragmentWitoutAlias: 'm1.id',
					parameters: []
				},
				{
					fragment: 'm1.value',
					fragmentWitoutAlias: 'm1.value',
					parameters: []
				},
				{
					fragment: 'm3.id',
					fragmentWitoutAlias: 'm3.id',
					parameters: []
				},
				{
					fragment: 'm3.double_value',
					fragmentWitoutAlias: 'm3.double_value',
					parameters: []
				},
				{
					fragment: 'm3.name',
					fragmentWitoutAlias: 'm3.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable1 m1',
					relationName: 'mytable1',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable2 m2 on m2.id = m1.id',
					relationName: 'mytable2',
					dependOnFields: [2, 3, 4],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable3 m3 on m3.id = m2.id',
					relationName: 'mytable3',
					dependOnFields: [2, 3, 4],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-06', () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where (concat('%', t2.name, '%') = :name OR concat('%', t3.name, '%') = :name)`;

		const actual = traverseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfo2 = {
			with: [],
			select: [
				{
					fragment: 't2.name',
					fragmentWitoutAlias: 't2.name',
					dependOnRelations: ['t2'],
					parameters: []
				},
				{
					fragment: 't3.name as name2',
					fragmentWitoutAlias: 't3.name',
					dependOnRelations: ['t3'],
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable2 t2',
					relationName: 'mytable2',
					relationAlias: 't2',
					parentRelation: '',
					fields: ['id', 'name', 'descr'],
					parameters: []
				},
				{
					fragment: 'inner join mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					relationAlias: 't3',
					parentRelation: 't2',
					fields: ['id', 'double_value', 'name'],
					parameters: []
				}
			],
			where: [
				{
					fragment: `AND (concat('%', t2.name, '%') = ? OR concat('%', t3.name, '%') = ?)`,
					dependOnRelations: ['t2', 't3'],
					parameters: [0, 1]
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result06', () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where (concat('%', t2.name, '%') = :name OR concat('%', t3.name, '%') = :name)`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [],
			select: [
				{
					fragment: 't2.name',
					fragmentWitoutAlias: 't2.name',
					parameters: []
				},
				{
					fragment: 't3.name as name2',
					fragmentWitoutAlias: 't3.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable2 t2',
					relationName: 'mytable2',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'inner join mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					dependOnFields: [1],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: `AND (concat('%', t2.name, '%') = ? OR concat('%', t3.name, '%') = ?)`,
					parameters: ['name', 'name']
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result: where t3.id > 1', () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where t3.id > 1`;

		const actual = traverseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfo2 = {
			with: [],
			select: [
				{
					fragment: 't2.name',
					fragmentWitoutAlias: 't2.name',
					dependOnRelations: ['t2'],
					parameters: []
				},
				{
					fragment: 't3.name as name2',
					fragmentWitoutAlias: 't3.name',
					dependOnRelations: ['t3'],
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable2 t2',
					relationName: 'mytable2',
					relationAlias: 't2',
					parentRelation: '',
					fields: ['id', 'name', 'descr'],
					parameters: []
				},
				{
					fragment: 'inner join mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					relationAlias: 't3',
					parentRelation: 't2',
					fields: ['id', 'double_value', 'name'],
					parameters: []
				}
			],
			where: [
				{
					fragment: 'AND t3.id > 1',
					dependOnRelations: ['t3'],
					parameters: []
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result: where t3.id > 1', () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where t3.id > 1`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [],
			select: [
				{
					fragment: 't2.name',
					fragmentWitoutAlias: 't2.name',
					parameters: []
				},
				{
					fragment: 't3.name as name2',
					fragmentWitoutAlias: 't3.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM mytable2 t2',
					relationName: 'mytable2',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'inner join mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					dependOnFields: [1],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: 'AND t3.id > 1',
					parameters: []
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result: SELECT with parameters', () => {
		const sql = `-- @dynamicQuery
		SELECT 
			t2.id, 
			t3.double_value, 
			:name is null OR concat('%', t2.name, t3.name, '%') LIKE :name as likeName
		FROM mytable2 t2
		INNER JOIN mytable3 t3 on t3.id = t2.id`;

		const actual = traverseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfo2 = {
			with: [],
			select: [
				{
					fragment: 't2.id',
					fragmentWitoutAlias: 't2.id',
					dependOnRelations: ['t2'],
					parameters: []
				},
				{
					fragment: 't3.double_value',
					fragmentWitoutAlias: 't3.double_value',
					dependOnRelations: ['t3'],
					parameters: []
				},
				{
					fragment: `? is null OR concat('%', t2.name, t3.name, '%') LIKE ? as likeName`,
					fragmentWitoutAlias: `? is null OR concat('%', t2.name, t3.name, '%') LIKE ?`,
					dependOnRelations: ['t2', 't3'],
					parameters: [0, 1]
				}
			],
			from: [
				{
					fragment: 'FROM mytable2 t2',
					relationName: 'mytable2',
					relationAlias: 't2',
					parentRelation: '',
					fields: ['id', 'name', 'descr'],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					relationAlias: 't3',
					parentRelation: 't2',
					fields: ['id', 'double_value', 'name'],
					parameters: []
				}
			],
			where: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result: SELECT with parameters', () => {
		const sql = `-- @dynamicQuery
		SELECT 
			t2.id, 
			t3.double_value, 
			:name is null OR concat('%', t2.name, t3.name, '%') LIKE :name as likeName
		FROM mytable2 t2
		INNER JOIN mytable3 t3 on t3.id = t2.id`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: DynamicSqlInfoResult2 = {
			with: [],
			select: [
				{
					fragment: 't2.id',
					fragmentWitoutAlias: 't2.id',
					parameters: []
				},
				{
					fragment: 't3.double_value',
					fragmentWitoutAlias: 't3.double_value',
					parameters: []
				},
				{
					fragment: `? is null OR concat('%', t2.name, t3.name, '%') LIKE ? as likeName`,
					fragmentWitoutAlias: `? is null OR concat('%', t2.name, t3.name, '%') LIKE ?`,
					parameters: ['name', 'name']
				}
			],
			from: [
				{
					fragment: 'FROM mytable2 t2',
					relationName: 'mytable2',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					dependOnFields: [1, 2],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-limit and offset', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id
		WHERE m2.name = :name
		LIMIT :limit OFFSET :offset`;

		const actual = traverseSql(sql, sqliteDbSchema);
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
					fragment: 'INNER JOIN mytable2 m2 on m1.id = m2.id',
					relationName: 'mytable2',
					relationAlias: 'm2',
					parentRelation: 'm1',
					fields: ['id', 'name', 'descr'],
					parameters: []
				}
			],
			where: [
				{
					fragment: 'AND m2.name = ?',
					dependOnRelations: ['m2'],
					parameters: [0]
				}
			],
			limitOffset: {
				fragment: 'LIMIT ? OFFSET ?',
				parameters: [1, 2]
			}
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert(actual.right.traverseResult.queryType === 'Select');
		assert.deepStrictEqual(actual.right.traverseResult.dynamicQueryInfo, expected);
	});
});
