import postgres, { Sql } from 'postgres';
import { PostgresColumnSchema, DescribeQueryColumn, Driver, PostgresDescribe, PostgresType } from './types';
import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { DatabaseClient, TypeSqlError } from '../types';
import { Either, right } from 'fp-ts/lib/Either';

export function loadDbSchema(sql: Sql): TaskEither<string, PostgresColumnSchema[]> {
	return tryCatch(
		async () => {
			const result = await sql`SELECT 
				c.oid,
				t.table_schema,
				t.table_name,
				col.column_name,
				col.is_nullable
			FROM 
				information_schema.tables t
			JOIN 
				pg_class c ON c.relname = t.table_name
			JOIN 
				information_schema.columns col
				ON t.table_name = col.table_name 
				AND t.table_schema = col.table_schema
			WHERE 
				t.table_type = 'BASE TABLE'  -- Only regular tables, excluding views
				AND t.table_schema NOT IN ('information_schema', 'pg_catalog')  -- Exclude system schemas
			ORDER BY 
				t.table_schema, t.table_name, col.ordinal_position;`;

			return result.map((row: any) => ({
				oid: row.oid,
				table_schema: row.table_schema,
				table_name: row.table_name,
				column_name: row.column_name,
				is_nullable: row.is_nullable === 'YES'
			}));
		},
		(reason: any) => {
			if (reason.errors && reason.errors.length > 0) {
				return reason.errors.map((e: { message: string }) => e.message).join(', '); // Join all error messages into one string
			}
			return 'Unknown error';
		}
	);
}

export function postgresDescribe(sql: Sql, sqlQuery: string): TaskEither<string, PostgresDescribe> {
	return tryCatch(
		async () => {
			const describeResult = await sql.unsafe(sqlQuery).describe();
			const columns: DescribeQueryColumn[] = describeResult.columns.map((col) => ({
				name: col.name,
				tableId: col.table,
				typeId: col.type
			}));
			const parameters = describeResult.types;
			return {
				columns,
				parameters

			}
		},
		(reason: any) => {
			if (reason.errors && reason.errors.length > 0) {
				return reason.errors.map((e: { message: string }) => e.message).join(', '); // Join all error messages into one string
			}
			return 'Unknown error';
		}
	);
}

export function postgresAnalyze(sql: Sql, sqlQuery: string, paramCount: number): TaskEither<string, string> {
	return tryCatch(
		async () => {
			const analyzeResult = await sql.unsafe(`EXPLAIN ${sqlQuery}`, [...Array(paramCount).keys()]);
			return analyzeResult[0]?.["QUERY PLAN"] || '';
		},
		(reason: any) => {
			if (reason.errors && reason.errors.length > 0) {
				return reason.errors.map((e: { message: string }) => e.message).join(', '); // Join all error messages into one string
			}
			return reason.message;
		}
	);
}

export function loadTypes(postgres: Sql): TaskEither<string, PostgresType[]> {
	return tryCatch(
		async () => {
			const result = await postgres`SELECT 
				oid as "typeId", typname as "typeName"
			FROM pg_type`.execute();
			return result.columns as unknown as PostgresType[];
		},
		(reason) => String(reason)
	);
}

export function createPostgresClient(databaseUri: string): Either<TypeSqlError, DatabaseClient> {
	const db = postgres(databaseUri);
	return right({
		type: 'pg',
		client: db
	});
}