import assert from 'node:assert';
import { parseSql } from '../src/describe-query';
import type { MySqlDialect, SchemaDef } from '../src/types';
import { createMysqlClientForTest } from '../src/queryExectutor';
import { isLeft } from 'fp-ts/lib/Either';
import type { ColumnInfo } from '../src/mysql-query-analyzer/types';

describe('parse update statements', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
	});

	const columns: ColumnInfo[] = [
		{
			columnName: 'affectedRows',
			type: 'int',
			notNull: true
		}
	];

	it('update mytable1 set value = ? where id = ?', async () => {
		const sql = `
        update mytable1 set value = ? where id = ?
            `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [
				{
					name: 'value',
					columnType: 'int',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('UPDATE mytable2 SET name = :name, descr= :descr WHERE id = :id', async () => {
		const sql = `
        UPDATE mytable2 SET name = ?, descr= ? WHERE id = ?
            `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [
				{
					name: 'name',
					columnType: 'varchar',
					notNull: false
				},
				{
					name: 'descr',
					columnType: 'varchar',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'int',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update mytable1 set value = :value where id > :min and id < :max', async () => {
		const sql = `
        update mytable1 set value = :value where id > :min and id < :max
            `;
		const expectedSql = `
        update mytable1 set value = ? where id > ? and id < ?
            `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [
				{
					name: 'value',
					columnType: 'int',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'min',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'max',
					columnType: 'int',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('update mytable1 set value = :value where id > :value or id < :value', async () => {
		const sql = `
        update mytable1 set value = :value where id > :value or id < :value
            `;
		const expectedSql = `
        update mytable1 set value = ? where id > ? or id < ?
            `;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [
				{
					name: 'value',
					columnType: 'int',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'value',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'value',
					columnType: 'int',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('UPDATE mytable1 SET id = IFNULL(:id, id)', async () => {
		const sql = `
        UPDATE mytable1 SET id = IFNULL(:id, id)
            `;
		const expectedSql = `
        UPDATE mytable1 SET id = IFNULL(?, id)
            `;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [
				{
					name: 'id',
					columnType: 'int',
					notNull: false
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('UPDATE mytable1 t1 SET t1.value = 10 WHERE t1.id = 1', async () => {
		const sql = `
            UPDATE mytable1 t1
            SET t1.value = 10
            WHERE t1.id = 1`;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('UPDATE mytable2 t2, mytable3 t3 SET t2.name = t3.name WHERE t2.id = t3.id', async () => {
		const sql = `
            UPDATE mytable2 t2, mytable3 t3
            SET t2.name = t3.name
            WHERE t2.id = t3.id`;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: sql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(' WITH withTable3 as (...) UPDATE mytable2 t2, withTable3 t3', async () => {
		const sql = `
        WITH withTable3 as (
            select * from mytable3 where id = :id
        )
        UPDATE mytable2 t2, withTable3 t3
        SET t2.name = t3.name
        WHERE t2.id = t3.id`;

		const expectedSql = `
        WITH withTable3 as (
            select * from mytable3 where id = ?
        )
        UPDATE mytable2 t2, withTable3 t3
        SET t2.name = t3.name
        WHERE t2.id = t3.id`;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [],
			parameters: [
				{
					name: 'id',
					columnType: 'int',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(' WITH withTable3 as (...) UPDATE mytable2 t2, withTable3 t3', async () => {
		const sql = `
        WITH withTable3 as (
            select * from mytable3 where id = :id
        )
        UPDATE mytable2 t2, withTable3 t3
        SET t2.name = t3.name, t2.descr = :descr
        WHERE t2.id = t3.id
        AND t3.double_value = :value`;

		const expectedSql = `
        WITH withTable3 as (
            select * from mytable3 where id = ?
        )
        UPDATE mytable2 t2, withTable3 t3
        SET t2.name = t3.name, t2.descr = ?
        WHERE t2.id = t3.id
        AND t3.double_value = ?`;

		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql: expectedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns,
			data: [
				{
					name: 'descr',
					columnType: 'varchar',
					notNull: false
				}
			],
			parameters: [
				{
					name: 'id',
					columnType: 'int',
					notNull: true
				},
				{
					name: 'value',
					columnType: 'double',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
