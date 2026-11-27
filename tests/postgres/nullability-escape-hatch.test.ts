import assert from 'node:assert';
import ts from 'typescript';
import { loadDbSchema } from '../../src/drivers/postgres';
import type { PostgresColumnSchema } from '../../src/drivers/types';
import { generateCode } from '../../src/codegen/pg';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { parseSql } from '../../src/postgres-query-analyzer/parser';
import type { PostgresColumnInfo } from '../../src/postgres-query-analyzer/types';
import type { PgDielect } from '../../src/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres nullability escape hatch (! and ? alias suffixes)', () => {
	const client = createTestClient();
	let dbSchema: PostgresColumnSchema[] = [];

	before(async () => {
		const dbSchemaResult = await loadDbSchema(client);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${dbSchemaResult.error.description}`);
		}
		dbSchema = dbSchemaResult.value;
	});

	after(async () => {
		await client.end();
	});

	function analyze(sql: string, schema = dbSchema): [string, boolean][] {
		return parseSql(sql, schema, {}, []).columns.map(col => [col.column_name, col.is_nullable]);
	}

	async function describeColumns(sql: string): Promise<PostgresColumnInfo[]> {
		const actual = await describeQuery(client, sql, { ...createSchemaInfo(), columns: dbSchema });
		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		return actual.value.columns;
	}

	describe('select list', () => {
		it('! suffix forces NOT NULL', () => {
			assert.deepStrictEqual(analyze('SELECT value AS "value!" FROM mytable1'), [['value!', false]]);
		});

		it('? suffix forces nullable', () => {
			assert.deepStrictEqual(analyze('SELECT id AS "id?" FROM mytable1'), [['id?', true]]);
		});

		it('! overrides a nullable function result', () => {
			const sql = `SELECT regexp_match(name, 'pattern') AS "match!" FROM mytable2 WHERE name IS NOT NULL`;
			assert.deepStrictEqual(analyze(sql), [['match!', false]]);
		});

		it('alias without a suffix has no effect', () => {
			assert.deepStrictEqual(analyze('SELECT value AS val FROM mytable1'), [['val', true]]);
		});

		it('bare alias without AS', () => {
			assert.deepStrictEqual(analyze('SELECT value "value!", id "id?" FROM mytable1'), [['value!', false], ['id?', true]]);
		});

		it('bare alias without a suffix keeps its existing handling', () => {
			const actual = parseSql('SELECT id i FROM mytable1 WHERE id = $1', dbSchema, {}, []);
			assert.deepStrictEqual(actual.columns.map(col => col.column_name), ['id']);
			assert.strictEqual(actual.multipleRowsResult, false);
		});

		it('a suffixed primary key alias keeps single-row inference', () => {
			const actual = parseSql('SELECT id AS "id!" FROM mytable1 WHERE id = $1', dbSchema, {}, []);
			assert.strictEqual(actual.multipleRowsResult, false);
		});

		it('single-character aliases "!" and "?" are plain names', () => {
			assert.deepStrictEqual(analyze('SELECT value AS "!", id AS "?" FROM mytable1'), [['!', true], ['?', false]]);
		});

		it('"?column?" alias is a plain name', () => {
			assert.deepStrictEqual(analyze('SELECT id AS "?column?" FROM mytable1'), [['?column?', false]]);
		});

		it('a real column whose name ends in ? is not an override', () => {
			const schema: PostgresColumnSchema[] = [
				{ schema: 'public', table: 'flags', column_name: 'done?', type: 'bool', is_nullable: false, column_key: '' }
			];
			const actual = parseSql('SELECT "done?" FROM flags', schema, {}, []);
			assert.deepStrictEqual(actual.columns, [{ column_name: 'done?', is_nullable: false, table: 'flags', schema: 'public', type: 'bool' }]);
		});
	});

	describe('CTEs and subqueries', () => {
		it('CTE: outer query references the suffixed name Postgres uses', () => {
			const sql = 'WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT t."v!" FROM t';
			assert.deepStrictEqual(analyze(sql), [['v!', false]]);
		});

		it('CTE: referencing the stripped name is an error, as it is in Postgres', () => {
			const sql = 'WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT t.v FROM t';
			assert.throws(() => analyze(sql), /Column not found: t.v$/);
		});

		it('subquery: outer query references the suffixed name', () => {
			const sql = 'SELECT s."v!" FROM (SELECT value AS "v!" FROM mytable1) s';
			assert.deepStrictEqual(analyze(sql), [['v!', false]]);
		});

		it('SELECT * from a CTE keeps the suffix', () => {
			const sql = 'WITH t AS (SELECT value AS "v!", id AS "id?" FROM mytable1) SELECT * FROM t';
			assert.deepStrictEqual(analyze(sql), [['v!', false], ['id?', true]]);
		});

		it('an outer alias replaces the inner suffix', () => {
			const sql = 'WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT t."v!" AS w, t."v!" AS "x?" FROM t';
			const actual = parseSql(sql, dbSchema, {}, []);
			assert.deepStrictEqual(actual.columns.map(col => [col.column_name, col.is_nullable, col.has_nullability_suffix]), [
				['w', false, undefined],
				['x?', true, true]
			]);
		});

		it('LEFT JOIN makes a forced NOT NULL CTE column nullable again', () => {
			const sql = 'WITH t AS (SELECT id, value AS "v!" FROM mytable1) SELECT t."v!" FROM mytable2 m LEFT JOIN t ON t.id = m.id';
			assert.deepStrictEqual(analyze(sql), [['v!', true]]);
		});

		it('outer WHERE ... IS NOT NULL refines a forced nullable CTE column', () => {
			const sql = 'WITH t AS (SELECT id AS "id?" FROM mytable1) SELECT t."id?" FROM t WHERE t."id?" IS NOT NULL';
			assert.deepStrictEqual(analyze(sql), [['id?', false]]);
		});

		it('CTE column list with a suffix', () => {
			const sql = 'WITH t("v!", "id?") AS (SELECT value, id FROM mytable1) SELECT t."v!", t."id?" FROM t';
			assert.deepStrictEqual(analyze(sql), [['v!', false], ['id?', true]]);
		});

		it('subquery column list with a suffix', () => {
			const sql = 'SELECT * FROM (SELECT value, id FROM mytable1) s("v!", "id?")';
			assert.deepStrictEqual(analyze(sql), [['v!', false], ['id?', true]]);
		});

		it('CTE column list without a suffix renames the column and keeps the forced nullability', () => {
			const sql = 'WITH RECURSIVE t(n) AS (SELECT value AS "x!" FROM mytable1 UNION ALL SELECT n FROM t WHERE false) SELECT n FROM t';
			const actual = parseSql(sql, dbSchema, {}, []);
			assert.deepStrictEqual(actual.columns.map(col => [col.column_name, col.is_nullable, col.has_nullability_suffix]), [['n', false, undefined]]);
		});

		it('recursive CTE column list with a suffix', () => {
			const sql = 'WITH RECURSIVE t("n!") AS (SELECT value FROM mytable1 UNION ALL SELECT t."n!" FROM t WHERE false) SELECT * FROM t';
			assert.deepStrictEqual(analyze(sql), [['n!', false]]);
		});

		it('column lists without a suffix keep their existing names (keywords, quoted names)', () => {
			assert.deepStrictEqual(analyze('WITH t(position) AS (SELECT id FROM mytable1) SELECT * FROM t'), [['position', false]]);
			assert.deepStrictEqual(analyze('SELECT * FROM (SELECT id FROM mytable1) s(position)'), [['position', false]]);
			assert.deepStrictEqual(analyze('SELECT * FROM (SELECT id FROM mytable1) s("Id")'), [['"Id"', false]]);
		});

		it('scalar subquery keeps the suffixed name but stays nullable', () => {
			const sql = 'SELECT (SELECT max(value) AS "m!" FROM mytable1) FROM mytable2';
			assert.deepStrictEqual(analyze(sql), [['m!', true]]);
		});

		it('suffix on the scalar subquery alias forces it', () => {
			const sql = 'SELECT (SELECT max(value) FROM mytable1) AS "m!" FROM mytable2';
			assert.deepStrictEqual(analyze(sql), [['m!', false]]);
		});

		it('a cast keeps the suffix flag, a function over the column does not', () => {
			const sql = 'SELECT s."v?"::text, coalesce(s."v?", 0) FROM (SELECT value AS "v?" FROM mytable1) s';
			const actual = parseSql(sql, dbSchema, {}, []);
			assert.deepStrictEqual(actual.columns.map(col => [col.column_name, col.has_nullability_suffix]), [['v?', true], ['coalesce', undefined]]);
		});
	});

	describe('UNION', () => {
		it('! on the first branch wins over a nullable later branch', () => {
			const sql = 'SELECT id AS "v!" FROM mytable1 UNION SELECT value FROM mytable1';
			assert.deepStrictEqual(analyze(sql), [['v!', false]]);
		});

		it('? on the first branch wins over NOT NULL branches', () => {
			const sql = 'SELECT id AS "v?" FROM mytable1 UNION SELECT id FROM mytable1';
			assert.deepStrictEqual(analyze(sql), [['v?', true]]);
		});

		it('! on the first branch wins over every later branch', () => {
			const sql = 'SELECT id AS "v!" FROM mytable1 UNION SELECT id FROM mytable1 UNION SELECT value FROM mytable1';
			assert.deepStrictEqual(analyze(sql), [['v!', false]]);
		});

		it('a suffix on a later branch does not name the output column', () => {
			const sql = 'SELECT value FROM mytable1 UNION SELECT id AS "v!" FROM mytable1';
			assert.deepStrictEqual(analyze(sql), [['value', true]]);
		});

		it('a suffix on a later branch only affects that branch', () => {
			const sql = 'SELECT id FROM mytable1 UNION SELECT id AS "v?" FROM mytable1';
			assert.deepStrictEqual(analyze(sql), [['id', true]]);
		});

		it('a suffix carried from a CTE (not written in the first branch) does not override the union', () => {
			const sql = 'WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT t."v!" FROM t UNION ALL SELECT NULL';
			assert.deepStrictEqual(analyze(sql), [['v!', true]]);
		});
	});

	describe('INSERT, UPDATE and DELETE ... RETURNING', () => {
		it('INSERT ... RETURNING', () => {
			assert.deepStrictEqual(analyze('INSERT INTO mytable1 (value) VALUES (1) RETURNING id AS "id?", value AS "value!"'), [['id?', true], ['value!', false]]);
		});

		it('UPDATE ... RETURNING', () => {
			assert.deepStrictEqual(analyze('UPDATE mytable1 SET value = 1 RETURNING value AS "value!"'), [['value!', false]]);
		});

		it('DELETE ... RETURNING', () => {
			assert.deepStrictEqual(analyze('DELETE FROM mytable1 RETURNING value AS "value!"'), [['value!', false]]);
		});
	});

	describe('nested results', () => {
		it('a real primary key whose name ends in ? is the join column as is', () => {
			const schema: PostgresColumnSchema[] = [{ schema: 'public', table: 'flags', column_name: 'id?', type: 'int4', is_nullable: false, column_key: 'PRI' }];
			const actual = parseSql('SELECT f."id?" FROM flags f', schema, {}, [], { collectNestedInfo: true });
			assert.deepStrictEqual(actual.relations?.map(relation => relation.joinColumn), ['id?']);
		});

		it('the join column of a CTE with a suffixed key follows the outer alias', () => {
			const sql = 'WITH u AS (SELECT id AS "id!", name FROM users) SELECT u."id!" AS uid, u.name FROM u';
			const actual = parseSql(sql, dbSchema, {}, [], { collectNestedInfo: true });
			assert.deepStrictEqual(actual.relations?.map(relation => [relation.name, relation.joinColumn]), [['users', 'id'], ['u', 'uid']]);
		});
	});

	describe('describeQuery (generated field names)', () => {
		it('drops the suffix from the field name', async () => {
			const columns = await describeColumns('SELECT value AS "value!", id AS "id?" FROM mytable1');
			assert.deepStrictEqual(columns, [
				{ name: 'value', type: 'int4', notNull: true, table: 'mytable1' },
				{ name: 'id', type: 'int4', notNull: false, table: 'mytable1' }
			]);
		});

		it('CTE reference', async () => {
			const columns = await describeColumns('WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT t."v!" FROM t');
			assert.deepStrictEqual(columns, [{ name: 'v', type: 'int4', notNull: true, table: 't' }]);
		});

		it('SELECT * from a subquery', async () => {
			const columns = await describeColumns('SELECT * FROM (SELECT value AS "v!" FROM mytable1) s');
			assert.deepStrictEqual(columns, [{ name: 'v', type: 'int4', notNull: true, table: 's' }]);
		});

		it('UNION', async () => {
			const columns = await describeColumns('SELECT id AS "v!" FROM mytable1 UNION SELECT value FROM mytable1');
			assert.deepStrictEqual(columns, [{ name: 'v', type: 'int4', notNull: true, table: '' }]);
		});

		it('keeps the name Postgres gives an expression over a suffixed column', async () => {
			const columns = await describeColumns('WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT -t."v!", (t."v!") FROM t');
			assert.deepStrictEqual(columns.map(col => col.name), ['?column?', 'v']);
		});

		it('scalar subquery', async () => {
			const columns = await describeColumns('SELECT (SELECT max(value) AS "m!" FROM mytable1), (SELECT max(value) FROM mytable1) AS "n!" FROM mytable2');
			assert.deepStrictEqual(columns.map(col => [col.name, col.notNull]), [['m', false], ['n', true]]);
		});

		it('RETURNING', async () => {
			const columns = await describeColumns('INSERT INTO mytable1 (value) VALUES (1) RETURNING id AS "id?", value AS "value!"');
			assert.deepStrictEqual(columns, [
				{ name: 'id', type: 'int4', notNull: false, table: 'mytable1' },
				{ name: 'value', type: 'int4', notNull: true, table: 'mytable1' }
			]);
		});

		it('re-aliased reference keeps the outer name', async () => {
			const columns = await describeColumns('WITH t AS (SELECT value AS "v!" FROM mytable1) SELECT t."v!" AS w FROM t');
			assert.deepStrictEqual(columns, [{ name: 'w', type: 'int4', notNull: true, table: 't' }]);
		});

		it('keeps the enum type from a check constraint', async () => {
			const columns = await describeColumns('SELECT enum_constraint AS "enum_constraint!" FROM all_types');
			assert.deepStrictEqual(columns, [
				{ name: 'enum_constraint', type: `enum('x-small','small','medium','large','x-large')`, notNull: true, table: 'all_types' }
			]);
		});

		it('ORDER BY allowlist uses the suffixed name, which is the name Postgres can sort by', async () => {
			const actual = await describeQuery(client, 'SELECT value AS "v!" FROM mytable1 ORDER BY :sort', { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.deepStrictEqual(actual.value.orderByColumns, ['id', 'value', 'v!']);
		});

		it('@nested: suffixed join column', async () => {
			const sql = `-- @nested
			SELECT u.id AS "user_id!", u.name AS user_name, p.id AS "post_id!", p.title AS post_title
			FROM users u
			INNER JOIN posts p ON p.fk_user = u.id`;
			const actual = await describeQuery(client, sql, { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.deepStrictEqual(actual.value.columns.map(col => col.name), ['user_id', 'user_name', 'post_id', 'post_title']);
			assert.deepStrictEqual(actual.value.nestedInfo?.map(relation => [relation.name, relation.groupIndex]), [['users', 0], ['posts', 2]]);
		});

		it('@dynamicQuery: SELECT * fragment quotes a suffixed column', async () => {
			const sql = `-- @dynamicQuery
			SELECT * FROM (SELECT value AS "v!" FROM mytable1) s`;
			const actual = await describeQuery(client, sql, { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.deepStrictEqual(actual.value.columns.map(col => [col.name, col.notNull]), [['v', true]]);
			const fragment = actual.value.dynamicSqlQuery2?.select[0].fragment;
			assert.strictEqual(fragment, 's."v!"');
			// the fragment must be valid SQL
			await client.unsafe(`SELECT ${fragment} FROM (SELECT value AS "v!" FROM mytable1) s`);
		});

		it('@dynamicQuery: SELECT * fragment for a quoted column list name is unchanged', async () => {
			const sql = `-- @dynamicQuery
			SELECT * FROM (SELECT id FROM mytable1) s("Id")`;
			const actual = await describeQuery(client, sql, { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.strictEqual(actual.value.dynamicSqlQuery2?.select[0].fragment, 's."Id"');
		});
	});

	describe('generated code', () => {
		it('result type uses the stripped name and reads the column by position', async () => {
			const dialect: PgDielect = { type: 'pg', client };
			const actual = await generateCode(dialect, 'SELECT value AS "value!" FROM mytable1', 'selectValue', { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.match(actual.value, /export type SelectValueResult = \{\n\tvalue: number;\n\}/);
			assert.match(actual.value, /value: data\[0\]/);
		});

		it('JSON keys keep the suffix, quoted, because Postgres keeps it in the JSON', async () => {
			const dialect: PgDielect = { type: 'pg', client };
			const sql = 'SELECT json_agg(t) AS "items!" FROM (SELECT value AS "v!" FROM mytable1) t';
			const actual = await generateCode(dialect, sql, 'jsonAgg', { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.match(actual.value, /\titems: JsonAggItemsType\[\];/);
			assert.match(actual.value, /\t"v!": number;/);
			const { diagnostics } = ts.transpileModule(actual.value, { reportDiagnostics: true });
			assert.deepStrictEqual(diagnostics?.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);

			const rows = await client.unsafe(sql);
			assert.ok(Object.keys(rows[0]['items!'][0]).includes('v!'));
		});

		it('JSON object and array keys with a suffix generate valid type names', async () => {
			const dialect: PgDielect = { type: 'pg', client };
			const sql = `SELECT json_agg(t) AS "items!" FROM (SELECT json_build_object('k', value) AS "obj!", json_build_array(value) AS "arr!" FROM mytable1) t`;
			const actual = await generateCode(dialect, sql, 'jsonAgg', { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.match(actual.value, /\t"obj!": JsonAggItemsObjType;/);
			assert.match(actual.value, /\t"arr!": \(number \| null\)\[\];/);
			const { diagnostics } = ts.transpileModule(actual.value, { reportDiagnostics: true });
			assert.deepStrictEqual(diagnostics?.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
		});

		it('a stripped name that starts with a digit is quoted', async () => {
			const dialect: PgDielect = { type: 'pg', client };
			const actual = await generateCode(dialect, 'SELECT value AS "1a!" FROM mytable1', 'selectValue', { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.match(actual.value, /\t"1a": number;/);
			assert.match(actual.value, /\t\t"1a": data\[0\]/);
			const { diagnostics } = ts.transpileModule(actual.value, { reportDiagnostics: true });
			assert.deepStrictEqual(diagnostics?.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
		});

		it('a Date forced NOT NULL is still null-guarded, so a wrong ! gives null rather than 1970-01-01', async () => {
			const dialect: PgDielect = { type: 'pg', client };
			const actual = await generateCode(dialect, 'SELECT date_column AS "d!" FROM all_types', 'selectDate', { ...createSchemaInfo(), columns: dbSchema });
			if (actual.isErr()) {
				assert.fail(`Shouldn't return an error: ${actual.error.description}`);
			}
			assert.match(actual.value, /\td: Date;/);
			assert.match(actual.value, /\t\td: data\[0\] != null \? new Date\(data\[0\]\) : data\[0\]/);
		});
	});
});
