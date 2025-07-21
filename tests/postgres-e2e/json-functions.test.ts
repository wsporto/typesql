import assert from 'node:assert';
import pg from 'pg'
import { selectJson10, SelectJson10Result, selectJsonBuildArray01, SelectJsonBuildArray01Result, selectJsonBuildObject01, SelectJsonBuildObject01Result, selectJsonBuildObject02, SelectJsonBuildObject02Result } from './sql';

describe('e2e-postgres-dynamic-query', () => {
	const pool = new pg.Pool({
		connectionString: 'postgres://postgres:password@127.0.0.1:5432/postgres'
	})

	it('selectJsonBuildObject01', async () => {
		const result = await selectJsonBuildObject01(pool);

		const expectedResult: SelectJsonBuildObject01Result = {
			value1: {
				key1: 'str1'
			},
			value2: {
				key2: 10
			},
			value3: {
				key3: 'str2'
			},
			value4: {
				key4: 20
			}
		}


		assert.deepStrictEqual(result, expectedResult);
	});

	it('selectJsonBuildObject02', async () => {
		const result = await selectJsonBuildObject02(pool);

		const expectedResult: SelectJsonBuildObject02Result = {
			result: [
				{
					key: 'a',
					key2: 1
				},
				{
					key: 'b',
					key2: 2
				}
			]
		}

		assert.deepStrictEqual(result, expectedResult);
	});

	it('selectJsonBuildArray01', async () => {
		const result = await selectJsonBuildArray01(pool);

		const expectedResult: SelectJsonBuildArray01Result = {
			value1: ['a', 'b'],
			value2: [null, 'c', 10]
		}


		assert.deepStrictEqual(result, expectedResult);
	});

	it('select-json10', async () => {
		const result = await selectJson10(pool);

		const expectedResult: SelectJson10Result = {
			result1: {
				'1': 1,
				'2': 2,
				'3': 3,
				'4': 4,
			},
			result2: {
				'1': {
					id: 1,
					value: 1
				},
				'2': {
					id: 2,
					value: 2
				},
				'3': {
					id: 3,
					value: 3
				},
				'4': {
					id: 4,
					value: 4
				}
			}
		}


		assert.deepStrictEqual(result, expectedResult);
	});
});