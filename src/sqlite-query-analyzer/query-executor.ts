import { Either, left, right } from "fp-ts/lib/Either";
import { DatabaseClient, TypeSqlError } from "../types";
import { ColumnSchema, Table } from "../mysql-query-analyzer/types";
import Database, { Database as DatabaseType } from 'better-sqlite3';

export function createSqliteClient(databaseUri: string): Either<TypeSqlError, DatabaseClient> {
	const db = new Database(databaseUri);
	return right({
		type: 'sqlite',
		client: db
	});
}

export function loadDbSchema(db: DatabaseType): Either<TypeSqlError, ColumnSchema[]> {

	const sql = `
		WITH all_tables AS (
			SELECT name FROM sqlite_schema WHERE type = 'table'
		),
		uniqueIndex as (
			SELECT DISTINCT t.name as table_name, ii.name as column_name
			FROM all_tables t,
			pragma_index_list(t.name) AS il,
			pragma_index_info(il.name) AS ii
		WHERE il.[unique] = 1
		)
		SELECT
			'' AS schema,
			t.name as 'table',
			ti.name as 'column', 
			CASE 
				WHEN ti.type LIKE '%INT%' THEN 'INTEGER'
				WHEN ti.type LIKE '%CHAR%' OR ti.type LIKE '%CLOB%' OR ti.type like '%TEXT%' THEN 'TEXT'
				WHEN ti.type LIKE '%BLOB%' OR ti.type = '' THEN 'BLOB'
				WHEN ti.type LIKE '%REAL%' OR ti.type LIKE '%FLOA%' OR ti.type like '%DOUB%' THEN 'REAL'
				ELSE 'NUMERIC'
			END	as column_type,
			ti.'notnull' or ti.pk = 1 as 'notNull',
			CASE WHEN ti.pk = 1 THEN 'PRI'
			WHEN u.table_name is not null THEN 'UNI' 
			ELSE '' END as columnKey
		FROM all_tables t 
		INNER JOIN pragma_table_info(t.name) ti
		LEFT JOIN uniqueIndex u on u.table_name = t.name and u.column_name = ti.name
		`
	try {
		const result = db.prepare(sql)
			.all() as ColumnSchema[];
		return right(result.map(col => ({ ...col, notNull: !!col.notNull })));
	}
	catch (err_) {
		const err = err_ as Error;
		return left({
			name: err.name,
			description: err.message
		})
	}
}

export function selectSqliteTablesFromSchema(db: DatabaseType): Either<TypeSqlError, Table[]> {
	const sql = `
    SELECT 
		'' as schema,
		name as 'table'
	FROM sqlite_schema 
	WHERE type='table' 
	ORDER BY name
    `

	try {
		const result = db.prepare(sql)
			.all() as Table[];
		return right(result);
	}
	catch (e) {
		const err = e as Error;
		return left({
			name: err.name,
			description: err.message
		});
	}
}

export function explainSql(db: DatabaseType, sql: string): Either<TypeSqlError, boolean> {
	try {
		db.prepare(sql);
		return right(true);
	}
	catch (err_) {
		const err = err_ as Error;
		return left({
			name: err.name,
			description: err.message
		})
	}
}