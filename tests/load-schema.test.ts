import assert from 'node:assert';
import { createMysqlClientForTest, loadMysqlSchema } from '../src/queryExectutor';
import type { MySqlDialect } from '../src/types';

describe('load-schema', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
	});

	it('filter schema', async () => {
		const actual = await loadMysqlSchema(client.client, client.schema);
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		const schemas = actual.value.map((s) => s.schema);
		const uniqueSchemas = [...new Set(schemas)];
		assert.deepStrictEqual(uniqueSchemas, ['mydb']);
	});
});
