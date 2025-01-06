import assert from 'node:assert';
import pg from 'pg'
import { dynamicQuery01, DynamicQuery01Result } from './sql/dynamic-query-01';
import { derivatedTable, DerivatedTableResult, dynamicQuery03, DynamicQuery03Result } from './sql';

describe('e2e-postgres-dynamic-query', () => {

	const pool = new pg.Pool({
		connectionString: 'postgres://postgres:password@127.0.0.1:5432/postgres'
	})

	it('dynamicQuery01 - without filters', async () => {
		const result = await dynamicQuery01(pool);

		const expectedResult: DynamicQuery01Result[] = [
			{
				id: 1,
				value: 1,
				name: 'one',
				description: 'descr-one'
			},
			{
				id: 2,
				value: 2,
				name: 'two',
				description: 'descr-two'
			},
			{
				id: 3,
				value: 3,
				name: 'three',
				description: 'descr-three'
			},
			{
				id: 4,
				value: 4,
				name: 'four',
				//@ts-ignore
				description: null
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamicQuery01 - select columns', async () => {
		const result = await dynamicQuery01(pool, {
			select: {
				id: true,
				name: true
			}
		});

		const expectedResult: DynamicQuery01Result[] = [
			{
				id: 1,
				name: 'one'
			},
			{
				id: 2,
				name: 'two'
			},
			{
				id: 3,
				name: 'three'
			},
			{
				id: 4,
				name: 'four'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamicQuery01 - where BETWEEN', async () => {
		const result = await dynamicQuery01(pool, {
			select: {
				id: true,
				name: true
			},
			where: [
				['id', 'BETWEEN', 2, 3]
			]
		});

		const expectedResult: DynamicQuery01Result[] = [
			{
				id: 2,
				name: 'two'
			},
			{
				id: 3,
				name: 'three'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamicQuery01 - IN', async () => {
		const result = await dynamicQuery01(pool, {
			select: {
				id: true,
				name: true
			},
			where: [
				['id', 'IN', [1, 4]]
			]
		});

		const expectedResult: DynamicQuery01Result[] = [
			{
				id: 1,
				name: 'one'
			},
			{
				id: 4,
				name: 'four'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamicQuery01 - NOT IN', async () => {
		const result = await dynamicQuery01(pool, {
			select: {
				id: true,
				name: true
			},
			where: [
				['id', 'NOT IN', [1, 4]]
			]
		});

		const expectedResult: DynamicQuery01Result[] = [
			{
				id: 2,
				name: 'two'
			},
			{
				id: 3,
				name: 'three'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamicQuery01 - >= and <=', async () => {
		const result = await dynamicQuery01(pool, {
			select: {
				id: true,
				name: true
			},
			where: [
				['id', '>=', 2],
				['id', '<=', 3]
			]
		});

		const expectedResult: DynamicQuery01Result[] = [
			{
				id: 2,
				name: 'two'
			},
			{
				id: 3,
				name: 'three'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('derivated-table', async () => {
		const result = await derivatedTable(pool, {
			params: {
				subqueryName: 'two'
			}
		});

		const expectedResult: DerivatedTableResult[] = [
			{
				id: 2,
				name: 'two'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-03', async () => {
		const result = await dynamicQuery03(pool, {
			select: {
				value: true
			},
			where: [
				['value', '=', 2]
			]
		});

		const expectedResult: DynamicQuery03Result[] = [
			{
				value: 2
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});
});
