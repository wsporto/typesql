import assert from 'node:assert';
import { replaceListParams } from '../../src/sqlite-query-analyzer/replace-list-params';
import type { ParameterNameAndPosition } from '../../src/types';

describe('sqlite-teste-replace-list-params', () => {
	it('SELECT id FROM mytable1 WHERE id in (?)', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id in (?)';
		const newSql = replaceListParams(sql, getParamIndices(sql));

		const expected = "SELECT id FROM mytable1 WHERE id in (${params.param1.map(() => '?')})";

		assert.deepStrictEqual(newSql, expected);
	});

	it('multiples parameters', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id in (?) and value in (1, 2, ?)';
		const newSql = replaceListParams(sql, getParamIndices(sql));

		const expected =
			"SELECT id FROM mytable1 WHERE id in (${params.param1.map(() => '?')}) and value in (1, 2, ${params.param2.map(() => '?')})";

		assert.deepStrictEqual(newSql, expected);
	});

	it('multiple lines', async () => {
		const sql = `SELECT id FROM mytable1
        WHERE id in (?)
        and value in (1, 2, ?)`;
		const newSql = replaceListParams(sql, getParamIndices(sql));

		const expected = `SELECT id FROM mytable1
        WHERE id in (\${params.param1.map(() => \'?\')})
        and value in (1, 2, \${params.param2.map(() => \'?\')})`;

		assert.deepStrictEqual(newSql, expected);
	});
});

function getParamIndices(sql: string): ParameterNameAndPosition[] {
	const indices: ParameterNameAndPosition[] = [];
	for (let i = 0; i < sql.length; i++) {
		if (sql[i] === '?') {
			indices.push({
				name: `param${indices.length + 1}`,
				paramPosition: i
			});
		}
	}
	return indices;
}
