import { Either, right } from "fp-ts/lib/Either";
import { TypeSqlError } from "../types";
import { ColumnSchema } from "../mysql-query-analyzer/types";
import Database from 'better-sqlite3';

export function loadDbSchema(databaseUri: string): Either<TypeSqlError, ColumnSchema[]> {

	const db = new Database(databaseUri);
	const sql = `
		WITH all_tables AS (
			SELECT name FROM sqlite_schema WHERE type = 'table'
		)
		SELECT
			'' AS schema,
			t.name as 'table',
			ti.name as 'column', 
			ti.type as column_type,
			ti.'notnull' as 'notnull',
			IIF(ti.pk = 1, 'PRI', '') as columnKey
		FROM all_tables t INNER JOIN pragma_table_info(t.name) ti
		`

	const result = db.prepare(sql)
		.all() as ColumnSchema[];
	return right(result);
}