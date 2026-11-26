import assert from 'node:assert';
import { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';
import type { ColumnInfo } from '../../src/mysql-query-analyzer/types';

describe('sqlite-infer-not-null.test', () => {
	it('select with left join', () => {
		const sql = `
        select t1.id, t2.id, t1.value, t2.name 
        from mytable1 t1 
        left join mytable2 t2 on t1.id = t2.id;
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		const expected = [true, false, false, false];

		assert.deepStrictEqual(actual, expected);
	});

	it('select with left join when the first table has no alias', () => {
		//the parser reads LEFT as the alias of mytable1, so the join operator is only JOIN
		const sql = `
        select mytable1.id, mytable2.id, mytable1.value, mytable2.name
        from mytable1
        left join mytable2 on mytable1.id = mytable2.id
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true, false, false, false]);
	});

	it('select with left join when only the joined table has an alias', () => {
		const sql = `
        select mytable1.id, t2.id
        from mytable1
        LEFT JOIN mytable2 t2 on mytable1.id = t2.id
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true, false]);
	});

	it('left join after a cross join, a comma join and a join without ON', () => {
		//the ON belongs to the left join, not to the join before it
		const sqls = [
			'select t1.id, t2.id as id2, t3.id as id3 from mytable1 t1 CROSS JOIN mytable2 t2 LEFT JOIN mytable3 t3 ON t3.id = t2.id',
			'select t1.id, t2.id as id2, t3.id as id3 from mytable1 t1, mytable2 t2 LEFT JOIN mytable3 t3 ON t3.id = t2.id',
			'select t1.id, t2.id as id2, t3.id as id3 from mytable1 t1 JOIN mytable2 t2 LEFT JOIN mytable3 t3 ON t3.id = t2.id',
			'select t1.id, t2.id as id2, t3.id as id3 from mytable1 t1 NATURAL JOIN mytable2 t2 LEFT JOIN mytable3 t3 ON t3.id = t1.id'
		];
		for (const sql of sqls) {
			const result = parseSql(sql, sqliteDbSchema);
			if (isLeft(result)) {
				assert.fail(
					`Shouldn't return an error: ${result.left.description} (${sql})`
				);
			}
			assert.deepStrictEqual(
				getColumnNullability(result.right.columns),
				[true, true, false],
				sql
			);
		}
	});

	it('select * with a left join using after a cross join', () => {
		const sql =
			'select * from mytable1 t1 CROSS JOIN mytable2 t2 LEFT JOIN mytable3 t3 USING (id)';
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		//same columns as sqlite: t3.id is merged into the USING column
		assert.deepStrictEqual(
			result.right.columns.map((col) => [col.name, col.notNull]),
			[
				['id', true],
				['value', false],
				['id', true],
				['name', false],
				['descr', false],
				['double_value', false],
				['name', false]
			]
		);
	});

	it('select from mytable1 as left join: left is an alias, so this is an inner join', () => {
		//sqlite: "from a as left join b" is "a" aliased as "left", then a plain JOIN
		const sql = `
        select left.id, mytable2.id
        from mytable1 as left
        join mytable2 on left.id = mytable2.id
        `;
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true, true]);
	});

	it('select value from mytable1 where value >= 1', () => {
		const sql = 'select value from mytable1 where value >= 1';

		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true]);
	});

	it('select value from mytable1 where value <= 1', () => {
		const sql = 'select value from mytable1 where value <= 1';

		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true]);
	});

	it('SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1', () => {
		const sql = 'SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1'; // not null union null
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [false]);
	});

	it('SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1 where value is not null', () => {
		const sql = 'SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1 where value is not null'; // not null union not null
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [true]);
	});

	it('SELECT id AS val FROM mytable1 UNION SELECT value FROM mytable1 where value is not null', () => {
		const sql = 'SELECT max(id) AS max, min(id) AS min, avg(id) AS avg, sum(id) AS sum FROM mytable1 WHERE id > 999';
		const result = parseSql(sql, sqliteDbSchema);
		if (isLeft(result)) {
			assert.fail(`Shouldn't return an error: ${result.left.description}`);
		}
		const actual = getColumnNullability(result.right.columns);

		assert.deepStrictEqual(actual, [false, false, false, false]);
	});
});

function getColumnNullability(columns: ColumnInfo[]) {
	return columns.map((col) => col.notNull);
}
