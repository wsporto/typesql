import assert from 'node:assert';
import type { ParameterDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';

describe('parse-params', () => {
	it('parse select with case when expression (? is not null)', () => {
		const sql = `
        SELECT
            CASE WHEN (? IS NOT NULL)
              THEN ?
              ELSE 'a'
            END
        FROM mytable2`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expectedParameters: ParameterDef[] = [
			{
				name: 'param1',
				columnType: 'any',
				notNull: false //diff from mysql
			},
			{
				name: 'param2',
				columnType: 'TEXT',
				notNull: false //diff from mysql
			}
		];

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.parameters, expectedParameters);
	});

	it('parse select with case when expression (param is not null)', () => {
		//new
		const sql = `
        SELECT
            CASE WHEN (:param IS NOT NULL)
              THEN :param
              ELSE 'a'
            END
        FROM mytable2`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expectedParameters: ParameterDef[] = [
			{
				name: 'param',
				columnType: 'TEXT',
				notNull: false //diff from mysql
			},
			{
				name: 'param',
				columnType: 'TEXT',
				notNull: false //diff from mysql
			}
		];

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right.parameters, expectedParameters);
	});
});
