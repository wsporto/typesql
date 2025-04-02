import assert from 'node:assert';
import type { SchemaDef } from '../../src/types';
import { isLeft } from 'fp-ts/lib/Either';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';

describe('sqlite-parse-select-functions', () => {
	it('select sum(value) as total from mytable1', () => {
		const sql = `
        select sum(value) as total from mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'total',
					type: 'INTEGER',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select sum(t1.value) as total from mytable1 t1', () => {
		const sql = `
        select sum(t1.value) as total from mytable1 t1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'total',
					type: 'INTEGER',
					notNull: false,
					table: 't1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select count(id) from mytable1', () => {
		const sql = `
        select count(id) from mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'count(id)',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select count(*) from mytable1', () => {
		const sql = `
        select count(*) from mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'count(*)',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select sum(2*value) from  mytable1', () => {
		const sql = `
        select sum(2*value) from  mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'sum(2*value)',
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select avg(value) from mytable1', () => {
		const sql = `
        select avg(value) from mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'avg(value)',
					type: 'REAL',
					notNull: false,
					table: 'mytable1' //TODO: empty?
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('select avg(value + (value + 2)) from mytable1', () => {
		const sql = `
        select avg(value + (value + 2)) from mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'avg(value+(value+2))', //TODO: spaces
					type: 'REAL',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT AVG(value) as avgResult FROM mytable1', () => {
		const sql = `
        SELECT AVG(value) as avgResult FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'avgResult',
					type: 'REAL',
					notNull: false,
					table: 'mytable1' //TODO - empty?
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with SUM and with expression from multiple tables', () => {
		const sql = `
        select sum(t2.id + (t1.value + 2)) from mytable1 t1 inner join mytable2 t2 on t1.id = t2.id
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'sum(t2.id+(t1.value+2))', //TODO - spaces
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('parse a select with MIN function', () => {
		const sql = `
        SELECT MIN(value) FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'MIN(value)',
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	//TODO - add for mysql
	it('SELECT MIN(value)/100 as min FROM mytable1', () => {
		const sql = `
        SELECT MIN(value)/100 as min FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'min',
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	//TODO - add for mysql
	it('SELECT 100/ifnull(max(value), 10) as value FROM mytable1', () => {
		const sql = `
        SELECT 100/ifnull(max(value), 10) as value FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	//TODO - add for mysql
	it('SELECT id, 100/ifnull(max(value), 10) as value FROM mytable1', () => {
		const sql = `
        SELECT id, 100/ifnull(max(value), 10) as value FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'value',
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT max(id, ?, ?, ?) as max FROM mytable1', () => {
		const sql = `
        SELECT max(id, ?, ?, ?) as max, min(name, ?) as min FROM mytable2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'max',
					type: 'INTEGER',
					notNull: true,
					table: ''
				},
				{
					columnName: 'min',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'INTEGER',
					notNull: true
				},
				{
					name: 'param4',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT MIN(name) FROM mytable2', () => {
		const sql = `
        SELECT MIN(name) FROM mytable2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'MIN(name)',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT round(double_value) FROM mytable3', () => {
		const sql = `
        SELECT 
            round(double_value) AS round1, 
            round(double_value, ?) AS round2, 
            round(double_value, 0) AS round3,
            round(double_value, 1) AS round4 
        FROM mytable3
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'round1',
					type: 'REAL',
					notNull: false,
					table: 'mytable3'
				},
				{
					columnName: 'round2',
					type: 'REAL',
					notNull: false,
					table: 'mytable3'
				},
				{
					columnName: 'round3',
					type: 'REAL',
					notNull: false,
					table: 'mytable3'
				},
				{
					columnName: 'round4',
					type: 'REAL',
					notNull: false,
					table: 'mytable3'
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'INTEGER',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT group_concat(name) FROM mytable2', () => {
		const sql = `
        SELECT 
            group_concat(name) AS group1,
            group_concat(name, ?) AS group2
        FROM mytable2
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'group1',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					columnName: 'group2',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'TEXT',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT NULLIF(?, 'a') FROM mytable1`, async () => {
		const sql = `
			SELECT NULLIF(?, 'a') FROM mytable1
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: `NULLIF(?,'a')`,
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT NULLIF(?, id) FROM mytable1`, async () => {
		const sql = `
			SELECT NULLIF(?, id) FROM mytable1
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: `NULLIF(?,id)`,
					type: 'INTEGER',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'INTEGER',
					name: 'param1',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT lower(?), upper(?)', () => {
		const sql = `
			SELECT lower(?), upper(?)
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'lower(?)',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					columnName: 'upper(?)',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param2',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT lower(name), upper(name) FROM mytable2', () => {
		const sql = `
			SELECT lower(name), upper(name) FROM mytable2
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'lower(name)',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					columnName: 'upper(name)',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT COALESCE (VALUE, ID) FROM mytable1', () => {
		const sql = `
        SELECT COALESCE(VALUE, ID) FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'COALESCE(VALUE,ID)',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT strftime('%d/%m/%Y', '2013-05-21')`, () => {
		const sql = `
        SELECT strftime('%d/%m/%Y', '2013-05-21'), date('2013-05-21'), datetime('2013-05-21')
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: `strftime('%d/%m/%Y','2013-05-21')`,
					type: 'TEXT',
					notNull: false, //invalid date
					table: ''
				},
				{
					columnName: `date('2013-05-21')`,
					type: 'DATE',
					notNull: false, //invalid date
					table: ''
				},
				{
					columnName: `datetime('2013-05-21')`,
					type: 'DATE_TIME',
					notNull: false, //invalid date
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT strftime('%d/%m/%Y', :param1)`, () => {
		const sql = `SELECT strftime('%d/%m/%Y', :param1), date(:param2), datetime(:param3)`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: `SELECT strftime('%d/%m/%Y', ?), date(?), datetime(?)`,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: `strftime('%d/%m/%Y',?)`,
					type: 'TEXT',
					notNull: false, //invalid date
					table: ''
				},
				{
					columnName: 'date(?)',
					type: 'DATE',
					notNull: false, //invalid date
					table: ''
				},
				{
					columnName: 'datetime(?)',
					type: 'DATE_TIME',
					notNull: false, //invalid date
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE_TIME',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'DATE',
					notNull: true
				},
				{
					name: 'param3',
					columnType: 'DATE_TIME',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	/**
	 * The type affinity for DATE is NUMERIC.
	 * To insert into a DATE column you must use julianday(?)
	 */
	it.skip(`SELECT date(date_column, '+1 day') as result FROM all_types`, () => {
		const sql = `SELECT date(date_column, '+1 day') as result, datetime(date_column, '+1 day') as result2 FROM all_types`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'result',
					type: 'DATE',
					notNull: false, //invalid date
					table: ''
				},
				{
					columnName: 'result2',
					type: 'DATE_TIME',
					notNull: false, //invalid date
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT julianday('now') as result`, () => {
		const sql = `SELECT julianday('now') as result`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'REAL',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT julianday(?) as result', () => {
		const sql = 'SELECT julianday(?) as result';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'REAL',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT unixepoch('now') as result`, () => {
		const sql = `SELECT unixepoch('now') as result`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT unixepoch(?) as result', () => {
		const sql = 'SELECT unixepoch(?) as result';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT max(t1.value, date(?)) as result FROM mytable1 t1', () => {
		const sql = 'SELECT max(date(t1.value, \'unixepoch\'), ?) as result, max(datetime(t1.value, \'unixepoch\'), ?) as result2 FROM mytable1 t1';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'DATE',
					notNull: false,
					table: ''
				},
				{
					columnName: 'result2',
					type: 'DATE_TIME',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'DATE_TIME',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT max(t3.double_value, date(?)) as result FROM mytable3 t3', () => {
		const sql = 'SELECT max(date(t3.double_value, \'auto\'), ?) as result, max(datetime(t3.double_value, \'auto\'), ?) as result2 FROM mytable3 t3';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'DATE',
					notNull: false, //double_value is null
					table: ''
				},
				{
					columnName: 'result2',
					type: 'DATE_TIME',
					notNull: false, //double_value is null
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'DATE_TIME',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT max(t1.value, date(:param1), date(:param1), :param1) as result FROM mytable1 t1', () => {
		const sql = `SELECT 
			max(date(t1.value, \'auto\'), date(:param1), :param1) as result,
			max(datetime(t1.value, \'auto\'), datetime(:param2), :param2) as result2
		 FROM mytable1 t1`;

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: sql.replace(':param1', '?').replace(':param1', '?')
				.replace(':param2', '?').replace(':param2', '?'),
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'DATE',
					notNull: false,
					table: ''
				},
				{
					columnName: 'result2',
					type: 'DATE_TIME',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				},
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'DATE_TIME',
					notNull: true
				},
				{
					name: 'param2',
					columnType: 'DATE_TIME',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT t3.double_value, max(t3.double_value, date(:param1), :param1) as result FROM mytable3 t3', () => {
		const sql = 'SELECT t3.double_value, max(date(t3.double_value, \'auto\'), date(:param1, \'auto\'), date(:param1, \'auto\')) as result FROM mytable3 t3';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: sql.replace(':param1', '?').replace(':param1', '?'),
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'double_value',
					type: 'REAL',
					notNull: false,
					table: 't3'
				},
				{
					columnName: 'result',
					type: 'DATE',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'NUMERIC',
					notNull: true
				},
				{
					name: 'param1',
					columnType: 'NUMERIC',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('WITH cte ... SELECT c1.name, min(c1.name, date(:param1)) as result2 FROM cte c1', () => {
		const sql = `WITH cte AS (
			SELECT t2.name, max(t2.name, date(:param1)) as result FROM mytable2 t2
		)
		SELECT c1.name, min(date(c1.name), date(:param1)) as result2 FROM cte c1`

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql: sql.replace(':param1', '?').replace(':param1', '?'),
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'name',
					type: 'TEXT',
					notNull: false,
					table: 'c1'
				},
				{
					columnName: 'result2',
					type: 'DATE',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				},
				{
					name: 'param1',
					columnType: 'DATE',
					notNull: true
				}
			]
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT IF(1>2,2,3) as result', () => {
		const sql = `
        SELECT IIF(1>2,2,3) as result
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT IF(1>2,'a','b') as result`, () => {
		const sql = `
        SELECT IIF(1>2,'a','b') as result
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT IF(1>2, NULL,'b') as result`, () => {
		const sql = `
        SELECT IIF(1>2, NULL,'b') as result
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT IF(1>2,'a',NULL) as result`, () => {
		const sql = `
        SELECT IIF(1>2,'a',NULL) as result
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT IF(1>2, id, ?) as result FROM mytable1', async () => {
		const sql = `
        SELECT IIF(1>2, id, ?) as result FROM mytable1
        `;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'result',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1' //correct?
				}
			],
			parameters: [
				{
					columnType: 'INTEGER',
					name: 'param1',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT LENGTH(concat(name, ?)) FROM mytable2', () => {
		const sql = 'SELECT LENGTH(concat(name, ?)) as result FROM mytable2';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'result',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT concat_ws('-', 'b', 'c')`, () => {
		const sql = `
			SELECT concat_ws('-', 'b', 'c')
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: `concat_ws('-','b','c')`, //If the separator is NULL, the result is NULL.
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT concat_ws(?, name, descr, ?) FROM mytable2`, () => {
		const sql = `
			SELECT concat_ws(?, name, descr, ?) FROM mytable2
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: `concat_ws(?,name,descr,?)`, //If the separator is NULL, the result is NULL.
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param2',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT concat_ws(name, descr) FROM mytable2`, () => {
		const sql = `
			SELECT concat_ws(name, descr) FROM mytable2
			`;
		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: `concat_ws(name,descr)`, //If the separator (name) is NULL, the result is NULL.
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT id, random() as rand FROM mytable1 ORDER BY random()', () => {
		const sql = `
        SELECT id, random() as rand 
        FROM mytable1
        ORDER BY random() 
        `;
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'id',
					type: 'INTEGER',
					notNull: true,
					table: 'mytable1'
				},
				{
					columnName: 'rand',
					type: 'INTEGER',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT 'a' || 'b' as result`, () => {
		const sql = `SELECT 'a' || 'b' as result`;
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT 'a' || ? as result, ? || 'b' as result2, ? || ? as result3`, () => {
		const sql = `SELECT 'a' || ? as result, ? || 'b' as result2, ? || ? as result3`;
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					columnName: 'result2',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					columnName: 'result3',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param2',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param3',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param4',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT 'a' || ? as result, ? || 'b' as result2, ? || ? as result3`, () => {
		const sql = `SELECT trim('a') as result1, rtrim('a') as result2, ltrim('a') as result3`;
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result1',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					columnName: 'result2',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					columnName: 'result3',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT trim(?, ?) as result1, rtrim(?, ?) as result2, ltrim(?, ?) as result3`, () => {
		const sql = `SELECT trim(?, ?) as result1, rtrim(?, ?) as result2, ltrim(?, ?) as result3`;
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result1',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					columnName: 'result2',
					type: 'TEXT',
					notNull: false,
					table: ''
				},
				{
					columnName: 'result3',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: false
				},
				{
					columnType: 'TEXT',
					name: 'param2',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param3',
					notNull: false
				},
				{
					columnType: 'TEXT',
					name: 'param4',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param5',
					notNull: false
				},
				{
					columnType: 'TEXT',
					name: 'param6',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it(`SELECT replace('abd', 'd', 'c')`, () => {
		const sql = `SELECT replace('abd', 'd', 'c') as result`;
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT replace(?, ?, ?) as result', () => {
		const sql = 'SELECT replace(?, ?, ?) as result';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: false
				},
				{
					columnType: 'TEXT',
					name: 'param2',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param3',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT char(?, ?, ?) as result', () => {
		const sql = 'SELECT char(?, ?, ?) as result';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'INTEGER',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'INTEGER',
					name: 'param2',
					notNull: true
				},
				{
					columnType: 'INTEGER',
					name: 'param3',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT glob(?, ?)', () => {
		const sql = 'SELECT glob(?, ?)';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'glob(?,?)',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'TEXT',
					name: 'param2',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT glob(name, descr) FROM mytable2', () => {
		const sql = 'SELECT glob(name, descr) FROM mytable2';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'glob(name,descr)',
					type: 'TEXT',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT likelihood(?, ?) as result', () => {
		const sql = 'SELECT likelihood(?, ?) as result';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'TEXT',
					name: 'param1',
					notNull: true
				},
				{
					columnType: 'REAL',
					name: 'param2',
					notNull: true
				}
			]
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT likelihood(name, ?) as result FROM mytable2', () => {
		const sql = 'SELECT likelihood(name, ?) as result FROM mytable2';
		const actual = parseSql(sql, sqliteDbSchema);

		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					columnName: 'result',
					type: 'TEXT',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					columnType: 'REAL',
					name: 'param1',
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
