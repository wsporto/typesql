import assert from 'node:assert';
import { dynamicQuery01, DynamicQuery01Result } from './sql/dynamic-query01';
import Database from 'better-sqlite3';
import {
	dynamicQuery02, DynamicQuery02Result, dynamicQuery03, DynamicQuery03Result,
	dynamicQuery04, DynamicQuery04Result, dynamicQuery05, DynamicQuery05Result
} from './sql';

describe('e2e-sqlite-dynamic-query', () => {

	const db = new Database('./mydb.db');

	it('dynamicQuery01 - without filters', () => {
		const result = dynamicQuery01(db);

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

	it('dynamicQuery01 - select columns', () => {
		const result = dynamicQuery01(db, {
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

	it('dynamicQuery01 - where BETWEEN', () => {
		const result = dynamicQuery01(db, {
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

	it('dynamicQuery01 - IN', () => {
		const result = dynamicQuery01(db, {
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

	it('dynamicQuery01 - NOT IN', () => {
		const result = dynamicQuery01(db, {
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

	it('dynamicQuery01 - >= and <=', () => {
		const result = dynamicQuery01(db, {
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

	it('dynamic-query02 - derivated-table', () => {
		const result = dynamicQuery02(db, {
			params: {
				subqueryName: 'two'
			}
		});

		const expectedResult: DynamicQuery02Result[] = [
			{
				id: 2,
				name: 'two'
			}
		];

		assert.deepStrictEqual(result, expectedResult);
	});

	it('dynamic-query-03', () => {
		const result = dynamicQuery03(db, {
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

	it('dynamic-query-04 - LIKE o%', () => {
		const result = dynamicQuery04(db, {
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

	it('dynamic-query-04 - LIKE %o%', () => {
		const result = dynamicQuery04(db, {
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

	it('dynamic-query-05 - cte', () => {
		const result = dynamicQuery05(db, {
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

	it('dynamic-query-05 - exclude CTE', () => {
		const result = dynamicQuery05(db, {
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
});