import postgres, { Sql } from 'postgres';
import { PostgresColumnSchema, DescribeQueryColumn, PostgresDescribe } from './types';
import { DatabaseClient, TypeSqlError } from '../types';
import { ok, Result, ResultAsync } from 'neverthrow';
import { ColumnSchema } from '../mysql-query-analyzer/types';
import { postgresTypes } from '../dialects/postgres';
import { ForeignKeyInfo } from '../sqlite-query-analyzer/query-executor';

export function loadDbSchema(sql: Sql): ResultAsync<PostgresColumnSchema[], string> {
	return ResultAsync.fromThrowable(
		async () => {
			const result = await sql`
			SELECT 
				c.oid,
				t.table_schema,
				t.table_name,
				col.column_name,
				ty.oid as type_id,
				col.is_nullable,
				CASE 
					WHEN con.contype = 'p' THEN 'PRI'  -- Primary key
					WHEN con.contype = 'u' THEN 'UNI'  -- Unique constraint
					ELSE ''  -- Otherwise, empty string
    			END AS column_key,
				CASE
					WHEN (
						-- Check if the column is of type SERIAL
						col.column_default LIKE 'nextval%'
						OR 
						-- Check if the column is GENERATED ALWAYS AS IDENTITY
						col.is_identity = 'YES'
					) THEN true
					ELSE false
				END AS autoincrement
			FROM 
				information_schema.tables t
			JOIN 
				pg_class c ON c.relname = t.table_name
			JOIN 
				information_schema.columns col
				ON t.table_name = col.table_name 
				AND t.table_schema = col.table_schema
			JOIN
				pg_catalog.pg_type ty on pg_catalog.format_type(ty.oid, NULL) = col.data_type
			LEFT JOIN 
			    pg_constraint con ON con.conrelid = c.oid
			    AND col.ordinal_position = ANY (con.conkey)
			WHERE 
				t.table_type = 'BASE TABLE'  -- Only regular tables, excluding views
				AND t.table_schema NOT IN ('information_schema', 'pg_catalog')  -- Exclude system schemas
			ORDER BY 
				t.table_schema, t.table_name, col.ordinal_position`;

			return result.map((row: any) => ({
				oid: row.oid,
				table_schema: row.table_schema,
				table_name: row.table_name,
				column_name: row.column_name,
				type_id: row.type_id,
				is_nullable: row.is_nullable === 'YES',
				column_key: row.column_key,
				autoincrement: row.autoincrement
			} satisfies PostgresColumnSchema));
		},
		(reason: any) => {
			if (reason.errors && reason.errors.length > 0) {
				return reason.errors.map((e: { message: string }) => e.message).join(', '); // Join all error messages into one string
			}
			return 'Unknown error';
		}
	)();
}

export function mapToColumnSchema(col: PostgresColumnSchema): ColumnSchema {
	const columnSchema: ColumnSchema = {
		column: col.column_name,
		column_type: postgresTypes[col.type_id],
		columnKey: col.column_key,
		notNull: !col.is_nullable,
		schema: col.table_schema,
		table: col.table_name,
		hidden: 0,
		autoincrement: col.autoincrement
	}
	return columnSchema;
}

export const postgresDescribe = (sql: Sql, sqlQuery: string): ResultAsync<PostgresDescribe, string> => {
	return ResultAsync.fromThrowable(
		async () => {
			const describeResult = await sql.unsafe(sqlQuery).describe();
			const columns: DescribeQueryColumn[] = describeResult.columns.map((col) => ({
				name: col.name,
				tableId: col.table,
				typeId: col.type
			}));
			const parameters = describeResult.types;
			const result: PostgresDescribe = {
				columns,
				parameters
			};
			return result;
		},
		(reason: unknown): string => {
			if (reason instanceof Error) {
				return reason.message;
			}
			return 'Unknown error';
		}
	)();
}


export function postgresAnalyze(sql: Sql, sqlQuery: string): ResultAsync<string[], string> {
	return ResultAsync.fromThrowable(
		async () => {
			const analyzeResult = await sql.unsafe(`EXPLAIN ${sqlQuery}`);
			return analyzeResult.map(res => {
				return res['QUERY PLAN'];
			});
		},
		(reason: any) => {
			if (reason.errors && reason.errors.length > 0) {
				return reason.errors.map((e: { message: string }) => e.message).join(', '); // Join all error messages into one string
			}
			return reason.message;
		}
	)();
}

export function createPostgresClient(databaseUri: string): Result<DatabaseClient, TypeSqlError> {
	const db = postgres(databaseUri);
	return ok({
		type: 'pg',
		client: db
	});
}

export function loadForeignKeys(sql: Sql): ResultAsync<ForeignKeyInfo[], TypeSqlError> {
	return ResultAsync.fromThrowable(
		async () => {
			const result = await sql<ForeignKeyInfo[]>`
			SELECT 
				cl1.relname AS "fromTable",
				cl2.relname AS "toTable",
				att1.attname AS "fromColumn",
				att2.attname AS "toColumn"
			FROM 
				pg_constraint AS c
			JOIN 
				pg_attribute AS att1 ON att1.attnum = ANY(c.conkey) AND att1.attrelid = c.conrelid
			JOIN 
				pg_attribute AS att2 ON att2.attnum = ANY(c.confkey) AND att2.attrelid = c.confrelid
			JOIN 
				pg_class AS cl1 ON cl1.oid = att1.attrelid
			JOIN 
				pg_class AS cl2 ON cl2.oid = att2.attrelid
			JOIN 
				pg_namespace AS ns1 ON ns1.oid = cl1.relnamespace
			JOIN 
				pg_namespace AS ns2 ON ns2.oid = cl2.relnamespace
			WHERE 
				c.contype = 'f'`;

			return result;
		},
		(err) => {
			const error = err as Error;
			const typesqlError: TypeSqlError = {
				name: error.name,
				description: error.message
			}
			return typesqlError;
		}
	)();
}
