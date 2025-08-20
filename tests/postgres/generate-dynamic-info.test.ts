import assert from 'node:assert';
import type { DynamicSqlInfo2, DynamicSqlInfoResult2 } from '../../src/mysql-query-analyzer/types';
import { parseSql } from '../../src/postgres-query-analyzer/parser';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { createTestClient, createSchemaInfo, schema } from './schema';

describe('postgres-generate-dynamic-info', () => {
	const databaseClient = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await databaseClient.end();
	});

	it('dynamic-traverse-result-01', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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

	it('dynamic-info-result01', async () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m1.value, m2.name, m2.descr as description
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
			where: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
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

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
					fragment: '($2 is NULL or m2.name = $3)',
					dependOnRelations: ['m2'],
					parameters: [1, 2]
				}
			]
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result02', async () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m
			WHERE m.name = $1
		) m2 on m2.id = m1.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
			WHERE m.name = $1
		) m2 on m2.id = m1.id`,
					relationName: 'm2',
					dependOnFields: [1],
					dependOnOrderBy: [],
					parameters: [0]
				}
			],
			where: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-info-result02-with-where', async () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN ( -- derivated table
			SELECT id, name from mytable2 m
			WHERE m.name = :subqueryName
		) m2 on m2.id = m1.id
		WHERE (:name::text is NULL or m2.name = :name)`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
			WHERE m.name = $1
		) m2 on m2.id = m1.id`,
					relationName: 'm2',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: [0]
				}
			],
			where: [
				{
					fragment: '($2::text is NULL or m2.name = $2)',
					parameters: [1, 2]
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
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
		WHERE m2.name LIKE concat('%', $1, '%')`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
					fragment: `m2.name LIKE concat('%', $1, '%')`,
					dependOnRelations: ['m2'],
					parameters: [0]
				}
			]
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result05', async () => {
		const sql = `-- @dynamicQuery
		WITH
			cte as (
				select id, name from mytable2
			)
		SELECT
			m1.id,
			m2.name
		FROM mytable1 m1
		INNER JOIN cte m2 on m2.id = m1.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
			where: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-info-result05-with-where', async () => {
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
		WHERE m2.name LIKE concat('%', :name::text, '%')`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
		const expected: DynamicSqlInfoResult2 = {
			with: [
				{
					fragment: `cte as (
				select id, name from mytable2
			)`,
					relationName: 'cte',
					dependOnFields: [], //where expr made this block mandatory
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
					dependOnFields: [], //m2.name
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: `m2.name LIKE concat('%', $1::text, '%')`,
					parameters: [0]
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-06', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.*, m3.*
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m2.id = m1.id
		INNER JOIN mytable3 m3 on m3.id = m2.id`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result06', async () => {
		const sql = `-- @dynamicQuery
		SELECT m1.*, m3.*
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m2.id = m1.id
		INNER JOIN mytable3 m3 on m3.id = m2.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-06 - with where', () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where (concat('%', t2.name, '%') = $1 OR concat('%', t3.name, '%') = $1)`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
					fragment: 'inner JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					relationAlias: 't3',
					parentRelation: 't2',
					fields: ['id', 'double_value', 'name'],
					parameters: []
				}
			],
			where: [
				{
					fragment: `(concat('%', t2.name, '%') = $1 OR concat('%', t3.name, '%') = $1)`,
					dependOnRelations: ['t2', 't3'],
					parameters: [0, 1]
				}
			]
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result06', async () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
					fragment: 'inner JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					dependOnFields: [1],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-info-result06-with-where', async () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where (concat('%', t2.name, '%') = :name OR concat('%', t3.name, '%') = :name)`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
					fragment: 'inner JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					dependOnFields: [], //where made this block mandatory (t3.name)
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: `(concat('%', t2.name, '%') = $1 OR concat('%', t3.name, '%') = $1)`,
					parameters: [0, 1]
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result: where t3.id > 1', () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where t3.id > 1`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
					fragment: 'inner JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					relationAlias: 't3',
					parentRelation: 't2',
					fields: ['id', 'double_value', 'name'],
					parameters: []
				}
			],
			where: [
				{
					fragment: 't3.id > 1',
					dependOnRelations: ['t3'],
					parameters: []
				}
			]
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result: where t3.id > 1', async () => {
		const sql = `-- @dynamicQuery
		select t2.name, t3.name as name2
		from mytable2 t2
		inner join mytable3 t3 on t3.id = t2.id
		where t3.id > 1`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
					fragment: 'inner JOIN mytable3 t3 on t3.id = t2.id',
					relationName: 'mytable3',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: 't3.id > 1',
					parameters: []
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result: SELECT with parameters', () => {
		const sql = `-- @dynamicQuery
		SELECT
			t2.id,
			t3.double_value,
			$1 is null OR concat('%', t2.name, t3.name, '%') LIKE $1 as likeName
		FROM mytable2 t2
		INNER JOIN mytable3 t3 on t3.id = t2.id`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
					fragment: `$1 is null OR concat('%', t2.name, t3.name, '%') LIKE $1 as likeName`,
					fragmentWitoutAlias: `$1 is null OR concat('%', t2.name, t3.name, '%') LIKE $1`,
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
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result: SELECT with parameters', async () => {
		const sql = `-- @dynamicQuery
		SELECT
			t2.id,
			t3.double_value,
			:name::text is null OR concat('%', t2.name, t3.name, '%') LIKE :name as likeName
		FROM mytable2 t2
		INNER JOIN mytable3 t3 on t3.id = t2.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
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
					fragment: `$1::text is null OR concat('%', t2.name, t3.name, '%') LIKE $1 as likeName`,
					fragmentWitoutAlias: `$1::text is null OR concat('%', t2.name, t3.name, '%') LIKE $1`,
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
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-limit and offset', () => {
		const sql = `-- @dynamicQuery
		SELECT m1.id, m2.name
		FROM mytable1 m1
		INNER JOIN mytable2 m2 on m1.id = m2.id
		WHERE m2.name = $1
		LIMIT $2 OFFSET $3`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
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
					fragment: 'm2.name = $1',
					dependOnRelations: ['m2'],
					parameters: [0]
				}
			],
			limitOffset: {
				fragment: 'LIMIT $2 OFFSET $3',
				parameters: [1, 2]
			}
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-traverse-result-11', () => {
		const sql = `-- @dynamicQuery
		WITH
			cte1 as (
				select id, value from mytable1
				WHERE greatest(value, $1) = least(value, $1)
			),
			cte2 as (
				select id, name from mytable2
				WHERE greatest(name, $2) = least(name, $2)
			)
		SELECT
			c1.id,
			c2.name
		FROM cte1 c1
		INNER JOIN cte2 c2 on c1.id = c2.id`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
		const expected: DynamicSqlInfo2 = {
			with: [
				{
					fragment: `cte1 as (
				select id, value from mytable1
				WHERE greatest(value, $1) = least(value, $1)
			)`,
					relationName: 'cte1',
					parameters: [0, 1]
				},
				{
					fragment: `cte2 as (
				select id, name from mytable2
				WHERE greatest(name, $2) = least(name, $2)
			)`,
					relationName: 'cte2',
					parameters: [2, 3]
				}
			],
			select: [
				{
					fragment: 'c1.id',
					fragmentWitoutAlias: 'c1.id',
					dependOnRelations: ['c1'],
					parameters: []
				},
				{
					fragment: 'c2.name',
					fragmentWitoutAlias: 'c2.name',
					dependOnRelations: ['c2'],
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM cte1 c1',
					relationName: 'cte1',
					relationAlias: 'c1',
					parentRelation: '',
					fields: ['id', 'value'],
					parameters: []
				},
				{
					fragment: 'INNER JOIN cte2 c2 on c1.id = c2.id',
					relationName: 'cte2',
					relationAlias: 'c2',
					parentRelation: 'c1',
					fields: ['id', 'name'],
					parameters: []
				}
			],
			where: []
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result11', async () => {
		const sql = `-- @dynamicQuery
		WITH
			cte1 as (
				select id, value from mytable1
				WHERE greatest(value, :param1) = least(value, :param1)
			),
			cte2 as (
				select id, name from mytable2
				WHERE greatest(name, :param2) = least(name, :param2)
			)
		SELECT
			c1.id,
			c2.name
		FROM cte1 c1
		INNER JOIN cte2 c2 on c1.id = c2.id`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
		const expected: DynamicSqlInfoResult2 = {
			with: [
				{
					fragment: `cte1 as (
				select id, value from mytable1
				WHERE greatest(value, $1) = least(value, $1)
			)`,
					relationName: 'cte1',
					dependOnFields: [], //FROM made this block mandatory
					dependOnOrderBy: [],
					parameters: [0, 1]
				},
				{
					fragment: `cte2 as (
				select id, name from mytable2
				WHERE greatest(name, $2) = least(name, $2)
			)`,
					relationName: 'cte2',
					dependOnFields: [1], //c2.name
					dependOnOrderBy: [],
					parameters: [2, 3]
				}
			],
			select: [
				{
					fragment: 'c1.id',
					fragmentWitoutAlias: 'c1.id',
					parameters: []
				},
				{
					fragment: 'c2.name',
					fragmentWitoutAlias: 'c2.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM cte1 c1',
					relationName: 'cte1',
					dependOnFields: [], //FROM dependOnFields always []; Can't remove the FROM
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN cte2 c2 on c1.id = c2.id',
					relationName: 'cte2',
					dependOnFields: [1], //c2.name;
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: []
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});

	it('dynamic-traverse-result-12', () => {
		const sql = `-- @dynamicQuery
		WITH
			cte1 as (
				select id, value from mytable1
				WHERE greatest(value, $1) = least(value, $1)
			),
			cte2 as (
				select id, name from mytable2
				WHERE greatest(name, $2) = least(name, $2)
			)
		SELECT
			c1.id,
			c2.name
		FROM cte1 c1
		INNER JOIN cte2 c2 on c1.id = c2.id
		WHERE greatest(c1.id, $3) = least(c2.id, $3)`;

		const actual = parseSql(sql, schema, {}, [], { collectDynamicQueryInfo: true });
		const expected: DynamicSqlInfo2 = {
			with: [
				{
					fragment: `cte1 as (
				select id, value from mytable1
				WHERE greatest(value, $1) = least(value, $1)
			)`,
					relationName: 'cte1',
					parameters: [0, 1]
				},
				{
					fragment: `cte2 as (
				select id, name from mytable2
				WHERE greatest(name, $2) = least(name, $2)
			)`,
					relationName: 'cte2',
					parameters: [2, 3]
				}
			],
			select: [
				{
					fragment: 'c1.id',
					fragmentWitoutAlias: 'c1.id',
					dependOnRelations: ['c1'],
					parameters: []
				},
				{
					fragment: 'c2.name',
					fragmentWitoutAlias: 'c2.name',
					dependOnRelations: ['c2'],
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM cte1 c1',
					relationName: 'cte1',
					relationAlias: 'c1',
					parentRelation: '',
					fields: ['id', 'value'],
					parameters: []
				},
				{
					fragment: 'INNER JOIN cte2 c2 on c1.id = c2.id',
					relationName: 'cte2',
					relationAlias: 'c2',
					parentRelation: 'c1',
					fields: ['id', 'name'],
					parameters: []
				}
			],
			where: [
				{
					fragment: `greatest(c1.id, $3) = least(c2.id, $3)`,
					dependOnRelations: ['c1', 'c2'],
					parameters: [4, 5]
				}
			]
		};
		assert.deepStrictEqual(actual.dynamicQueryInfo, expected);
	});

	it('dynamic-info-result12', async () => {
		const sql = `-- @dynamicQuery
		WITH
			cte1 as (
				select id, value from mytable1
				WHERE greatest(value, :param1) = least(value, :param1)
			),
			cte2 as (
				select id, name from mytable2
				WHERE greatest(name, :param2) = least(name, :param2)
			)
		SELECT
			c1.id,
			c2.name
		FROM cte1 c1
		INNER JOIN cte2 c2 on c1.id = c2.id
		WHERE greatest(c1.id, :param3) = least(c2.id, :param3)`;

		const actual = await describeQuery(databaseClient, sql, schemaInfo);
		const expected: DynamicSqlInfoResult2 = {
			with: [
				{
					fragment: `cte1 as (
				select id, value from mytable1
				WHERE greatest(value, $1) = least(value, $1)
			)`,
					relationName: 'cte1',
					dependOnFields: [],
					dependOnOrderBy: [],
					parameters: [0, 1]
				},
				{
					fragment: `cte2 as (
				select id, name from mytable2
				WHERE greatest(name, $2) = least(name, $2)
			)`,
					relationName: 'cte2',
					dependOnFields: [], //The WHERE expr made this block mandatory (WHERE ... min(c2.id, ?))
					dependOnOrderBy: [],
					parameters: [2, 3]
				}
			],
			select: [
				{
					fragment: 'c1.id',
					fragmentWitoutAlias: 'c1.id',
					parameters: []
				},
				{
					fragment: 'c2.name',
					fragmentWitoutAlias: 'c2.name',
					parameters: []
				}
			],
			from: [
				{
					fragment: 'FROM cte1 c1',
					relationName: 'cte1',
					dependOnFields: [], //FROM dependOnFields always []; Can't remove the FROM
					dependOnOrderBy: [],
					parameters: []
				},
				{
					fragment: 'INNER JOIN cte2 c2 on c1.id = c2.id',
					relationName: 'cte2',
					dependOnFields: [], //c2.name; //The WHERE expr made this block mandatory (WHERE ... min(c2.id, ?))
					dependOnOrderBy: [],
					parameters: []
				}
			],
			where: [
				{
					fragment: `greatest(c1.id, $3) = least(c2.id, $3)`,
					parameters: [4, 5]
				}
			]
		};
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value.dynamicSqlQuery2, expected);
	});
});
