import assert from 'node:assert';
import pg from 'pg'
import { dynamicQuery01, DynamicQuery01Result } from './sql/dynamic-query-01';
import { derivatedTable, DerivatedTableResult, dynamicQuery03, DynamicQuery03Result, dynamicQuery04, DynamicQuery04Result, dynamicQuery05, DynamicQuery05Result, dynamicQuery08, DynamicQuery08Result } from './sql';

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
				{ column: 'id', op: 'BETWEEN', value: [2, 3] }
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
				{ column: 'id', op: 'IN', value: [1, 4] }
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
				{ column: 'id', op: 'NOT IN', value: [1, 4] }
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
				{ column: 'id', op: '>=', value: 2 },
				{ column: 'id', op: '<=', value: 3 }
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
				{ column: 'value', op: '=', value: 2 }
			]
		});

		const expectedResult: DynamicQuery03Result[] = [
			{
				value: 2
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-04 - LIKE o%', async () => {
		const result = await dynamicQuery04(pool, {
			select: {
				value: true,
				name: true
			},
			where: [
				{ column: 'name', op: 'LIKE', value: 'o%' }
			]
		});

		const expectedResult: DynamicQuery04Result[] = [
			{
				value: 1,
				name: 'one'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-04 - LIKE %o%', async () => {
		const result = await dynamicQuery04(pool, {
			select: {
				value: true,
				name: true
			},
			where: [
				{ column: 'name', op: 'LIKE', value: '%o%' }
			]
		});

		const expectedResult: DynamicQuery04Result[] = [
			{
				value: 1,
				name: 'one'
			},
			{
				value: 2,
				name: 'two'
			},
			{
				value: 4,
				name: 'four'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-05 - cte', async () => {
		const result = await dynamicQuery05(pool, {
			select: {
				id: true,
				name: true
			},
			where: [
				{ column: 'name', op: '=', value: 'two' }
			]
		});

		const expectedResult: DynamicQuery05Result[] = [
			{
				id: 2,
				name: 'two'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-05 - exclude CTE', async () => {
		const result = await dynamicQuery05(pool, {
			select: {
				id: true
			},
			where: [
				{ column: 'id', op: '=', value: 1 }
			]
		});

		const expectedResult: DynamicQuery05Result[] = [
			{
				id: 1
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-08 - date', async () => {
		const result = await dynamicQuery08(pool, {
			params: {
				param1: 2024,
				param2: 12
			}
		});

		const expectedResult: DynamicQuery08Result[] = [
			{
				timestamp_not_null_column: new Date(2024, 11, 31)
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-08 - date >= new Date(2025, 0, 2)', async () => {
		const result = await dynamicQuery08(pool, {
			params: {
				param1: 2025,
				param2: 1
			},
			where: [
				{ column: 'timestamp_not_null_column', op: '>=', value: new Date(2025, 0, 2) }
			]
		});

		const expectedResult: DynamicQuery08Result[] = [
			{
				timestamp_not_null_column: new Date(2025, 0, 2)
			},
			{
				timestamp_not_null_column: new Date(2025, 0, 3)
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});
});
