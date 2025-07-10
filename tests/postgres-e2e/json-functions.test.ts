import assert from 'node:assert';
import pg from 'pg'
import { selectJsonBuildArray01, SelectJsonBuildArray01Result, selectJsonBuildObject01, SelectJsonBuildObject01Result } from './sql';

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

	it('selectJsonBuildArray01', async () => {
		const result = await selectJsonBuildArray01(pool);

		const expectedResult: SelectJsonBuildArray01Result = {
			value1: ['a', 'b'],
			value2: [null, 'c', 10]
		}


		assert.deepStrictEqual(result, expectedResult);
	});
});