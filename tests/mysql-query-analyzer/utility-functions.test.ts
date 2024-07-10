import assert from 'node:assert';
import type { ColumnDef } from '../../src/mysql-query-analyzer/types';
import {
	splitName,
	findColumn
} from '../../src/mysql-query-analyzer/select-columns';
import { getParameterIndexes } from '../../src/mysql-query-analyzer/util';
import { freshVar } from '../../src/mysql-query-analyzer/collect-constraints';
import { unionTypeResult } from '../../src/mysql-query-analyzer/unify';

describe('Utility functions tests', () => {
	it('findColumn should be case insensitive', () => {
		const colDef: ColumnDef[] = [
			{
				columnName: 'name',
				columnType: freshVar('varchar', 'varchar'),
				columnKey: '',
				notNull: true,
				table: 'mytable2'
			}
		];
		const fieldName = splitName('name');
		const actual = findColumn(fieldName, colDef);
		assert.deepStrictEqual(actual, colDef[0]);

		const fieldNameUperCase = splitName('NAME');
		const actualUpperCase = findColumn(fieldNameUperCase, colDef);
		assert.deepStrictEqual(actualUpperCase, colDef[0]);
	});

	it('test unionTypeResult', () => {
		assert.deepStrictEqual(unionTypeResult('tinyint', 'tinyint'), 'tinyint');
		assert.deepStrictEqual(unionTypeResult('tinyint', 'smallint'), 'smallint');
		assert.deepStrictEqual(
			unionTypeResult('tinyint', 'mediumint'),
			'mediumint'
		);
		assert.deepStrictEqual(unionTypeResult('tinyint', 'int'), 'int');
		assert.deepStrictEqual(unionTypeResult('tinyint', 'bigint'), 'bigint');

		assert.deepStrictEqual(unionTypeResult('smallint', 'tinyint'), 'smallint');
		assert.deepStrictEqual(unionTypeResult('smallint', 'smallint'), 'smallint');
		assert.deepStrictEqual(
			unionTypeResult('smallint', 'mediumint'),
			'mediumint'
		);
		assert.deepStrictEqual(unionTypeResult('smallint', 'int'), 'int');
		assert.deepStrictEqual(unionTypeResult('smallint', 'bigint'), 'bigint');

		assert.deepStrictEqual(
			unionTypeResult('mediumint', 'tinyint'),
			'mediumint'
		);
		assert.deepStrictEqual(
			unionTypeResult('mediumint', 'smallint'),
			'mediumint'
		);
		assert.deepStrictEqual(
			unionTypeResult('mediumint', 'mediumint'),
			'mediumint'
		);
		assert.deepStrictEqual(unionTypeResult('mediumint', 'int'), 'int');
		assert.deepStrictEqual(unionTypeResult('mediumint', 'bigint'), 'bigint');

		assert.deepStrictEqual(unionTypeResult('int', 'tinyint'), 'int');
		assert.deepStrictEqual(unionTypeResult('int', 'smallint'), 'int');
		assert.deepStrictEqual(unionTypeResult('int', 'mediumint'), 'int');
		assert.deepStrictEqual(unionTypeResult('int', 'int'), 'int');
		assert.deepStrictEqual(unionTypeResult('int', 'bigint'), 'bigint');

		assert.deepStrictEqual(unionTypeResult('bigint', 'tinyint'), 'bigint');
		assert.deepStrictEqual(unionTypeResult('bigint', 'smallint'), 'bigint');
		assert.deepStrictEqual(unionTypeResult('bigint', 'mediumint'), 'bigint');
		assert.deepStrictEqual(unionTypeResult('bigint', 'int'), 'bigint');
		assert.deepStrictEqual(unionTypeResult('bigint', 'bigint'), 'bigint');
	});

	it('test getIndex', () => {
		const namedParameters = ['a', 'b', 'b', 'c', 'c', 'd'];
		const actual = getParameterIndexes(namedParameters);
		const expected = [
			{
				paramName: 'a',
				indexes: [0]
			},
			{
				paramName: 'b',
				indexes: [1, 2]
			},
			{
				paramName: 'c',
				indexes: [3, 4]
			},
			{
				paramName: 'd',
				indexes: [5]
			}
		];
		assert.deepStrictEqual(actual, expected);
	});
});
