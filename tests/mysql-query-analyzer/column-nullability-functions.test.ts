import assert from 'node:assert';
import { dbSchema } from './create-schema';
import { parseAndInferNotNull } from '../../src/mysql-query-analyzer/infer-column-nullability';

describe('column-nullability - functions', () => {
	it('SELECT id FROM mytable1', () => {
		const sql = 'SELECT NOW(), CURDATE(), CURTIME()';
		const actual = parseAndInferNotNull(sql, dbSchema);

		const expected = [true, true, true];

		assert.deepStrictEqual(actual, expected);
	});
});
