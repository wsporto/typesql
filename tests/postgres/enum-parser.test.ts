import assert from 'node:assert';
import { transformCheckToEnum } from '../../src/postgres-query-analyzer/enum-parser';

describe('postgres-enum-parser', () => {

	it('enum-parser', () => {
		const checkConstraint = `CHECK ((enum_constraint = ANY (ARRAY['x-small'::text, 'small'::text, 'medium'::text, 'large'::text, 'x-large'::text])))`;
		const actual = transformCheckToEnum(checkConstraint);
		const expected = `enum('x-small','small','medium','large','x-large')`;
		assert.deepStrictEqual(actual, expected);
	});
});
