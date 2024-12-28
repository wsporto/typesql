import postgres, { Sql } from 'postgres';
import { PostgresColumnSchema, DescribeQueryColumn, PostgresDescribe } from './types';
import { DatabaseClient, TypeSqlError } from '../types';
import { Either, right } from 'fp-ts/lib/Either';
import { ResultAsync } from 'neverthrow';
import { ColumnSchema } from '../mysql-query-analyzer/types';
import { postgresTypes } from '../dialects/postgres';

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
    			END AS column_key
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
				column_key: row.column_key
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
		hidden: 0
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

export function createPostgresClient(databaseUri: string): Either<TypeSqlError, DatabaseClient> {
	const db = postgres(databaseUri);
	return right({
		type: 'pg',
		client: db
	});
}