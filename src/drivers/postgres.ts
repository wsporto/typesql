import postgres, { PostgresError, Sql } from 'postgres';
import { PostgresColumnSchema, DescribeQueryColumn, PostgresDescribe } from './types';
import { DatabaseClient, TypeSqlError } from '../types';
import { ok, Result, ResultAsync } from 'neverthrow';
import { ForeignKeyInfo } from '../sqlite-query-analyzer/query-executor';
import { groupBy } from '../util';
import { transformCheckToEnum } from '../postgres-query-analyzer/enum-parser';
import { UserFunctionSchema } from '../postgres-query-analyzer/types';
import { PostgresEnumType } from '../sqlite-query-analyzer/types';

export function loadDbSchema(sql: Sql, schemas: string[] | null = null): ResultAsync<PostgresColumnSchema[], TypeSqlError> {
	return ResultAsync.fromThrowable(
		async () => {
			const result = await sql`
			SELECT
				t.table_schema,
				t.table_name,
				col.column_name,
				CASE WHEN ty.typtype = 'e' THEN 'enum()' ELSE ty.typname END AS type,
				col.is_nullable,
				COALESCE(agg.column_key, '') AS column_key,
				COALESCE(
				(col.column_default LIKE 'nextval%' OR col.is_identity = 'YES'), false) AS autoincrement,
				col.column_default
				FROM information_schema.tables t
				JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.table_schema)
				JOIN information_schema.columns col ON col.table_name = t.table_name AND col.table_schema = t.table_schema
				JOIN pg_type ty ON ty.typname = col.udt_name
				LEFT JOIN (
				SELECT
					con.conrelid AS conrelid,
					att.attname AS column_name,
					MAX(
					CASE
						WHEN con.contype = 'p' THEN 'PRI'
						WHEN con.contype = 'u' THEN 'UNI'
						ELSE ''
					END
					) AS column_key
				FROM pg_constraint con
				JOIN unnest(con.conkey) AS colnum ON true
				JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = colnum
				WHERE con.contype IN ('p','u')
				GROUP BY con.conrelid, att.attname
				) AS agg
				ON agg.conrelid = c.oid AND agg.column_name = col.column_name
			WHERE 1 = 1
				-- t.table_type = 'BASE TABLE'  -- Only regular tables, excluding views
				AND (
						(${schemas}::text[] IS NULL AND t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') AND t.table_schema NOT LIKE 'pg_temp%')
						OR
						(${schemas}::text[] IS NOT NULL AND t.table_schema = ANY(${schemas}))
					)
			ORDER BY 
				t.table_schema, t.table_name, col.ordinal_position`;

			return result.map((row: any) => {
				const result: PostgresColumnSchema = {
					schema: row.table_schema,
					table: row.table_name,
					column_name: row.column_name,
					type: row.type,
					is_nullable: row.is_nullable === 'YES',
					column_key: row.column_key,
					autoincrement: row.autoincrement,
					...(row.column_default && { column_default: true })
				};
				return result;
			});
		}, err => convertPostgresErrorToTypeSQLError(err))();
}

export type EnumMap = Map<number, EnumResult[]>

export function loadEnumsMap(sql: Sql): ResultAsync<EnumMap, TypeSqlError> {
	return loadEnums(sql).map(enumResult => {
		const enumMap = groupBy(enumResult, (e) => e.type_oid);
		return enumMap;
	});
}

export type EnumResult = {
	type_oid: number;
	enum_name: string;
	enumlabel: string;
}

export function loadEnums(sql: Sql): ResultAsync<EnumResult[], TypeSqlError> {
	return ResultAsync.fromThrowable(async () => _loadEnums(sql), err => convertPostgresErrorToTypeSQLError(err))()
}

async function _loadEnums(sql: Sql): Promise<EnumResult[]> {
	const result = await sql<EnumResult[]>`
		SELECT 
		t.oid AS type_oid,
		t.typname AS enum_name,
		e.enumlabel
	FROM pg_type t
	JOIN pg_enum e ON t.oid = e.enumtypid
	ORDER BY e.enumsortorder`;
	return result;
}

export type CheckConstraintResult = Record<string, PostgresEnumType>
export function loadCheckConstraints(sql: Sql): ResultAsync<CheckConstraintResult, TypeSqlError> {
	return (ResultAsync.fromThrowable(() => _loadCheckConstraints(sql), err => convertPostgresErrorToTypeSQLError(err))()).map(enumResult => {
		const checkConstraintResult: CheckConstraintResult = {}
		for (const enumColumn of enumResult) {
			const key = `[${enumColumn.schema_name}][${enumColumn.table_name}][${enumColumn.column_name}]`;
			const value = transformCheckToEnum(enumColumn.constraint_definition);
			if (value) {
				checkConstraintResult[key] = value;
			}
		}
		return checkConstraintResult;
	});
}

export type CheckConstraintType = {
	schema_name: string;
	table_name: string;
	column_name: string;
	constraint_name: string;
	constraint_definition: string;
}
async function _loadCheckConstraints(sql: Sql): Promise<CheckConstraintType[]> {
	const result = await sql<CheckConstraintType[]>`
		SELECT
			n.nspname AS schema_name,
			t.relname AS table_name,
			c.conname AS constraint_name,
			pg_get_constraintdef(c.oid) AS constraint_definition,
			a.attname AS column_name
		FROM
			pg_constraint c
		JOIN
			pg_class t ON c.conrelid = t.oid
		JOIN
			pg_namespace n ON t.relnamespace = n.oid
		LEFT JOIN
			unnest(c.conkey) AS ck(attnum) ON TRUE
		LEFT JOIN
			pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ck.attnum
		WHERE
			c.contype = 'c'`;
	return result;
}

export const postgresDescribe = (sql: Sql, sqlQuery: string): ResultAsync<PostgresDescribe, TypeSqlError> => {
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
		err => convertPostgresErrorToTypeSQLError(err)
	)();
}

function convertPostgresErrorToTypeSQLError(err: any): TypeSqlError {
	const error = err as PostgresError;
	const typesqlError: TypeSqlError = {
		name: error.name,
		description: error.message
	}
	return typesqlError;
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
		err => convertPostgresErrorToTypeSQLError(err)
	)();
}

export function loadUserFunctions(sql: Sql, schemas: string[] | null = null): ResultAsync<UserFunctionSchema[], TypeSqlError> {
	return ResultAsync.fromThrowable(() =>
		_loadUserFunctions(sql, schemas),
		err => convertPostgresErrorToTypeSQLError(err)
	)();
}

function _loadUserFunctions(sql: Sql, schemas: string[] | null): Promise<UserFunctionSchema[]> {
	return sql<UserFunctionSchema[]>`SELECT 
			n.nspname AS schema,
			p.proname AS function_name,
			pg_get_function_identity_arguments(p.oid) AS arguments,
			pg_get_function_result(p.oid) AS return_type,
			-- pg_get_functiondef(p.oid) AS definition
			p.prosrc AS definition,
			l.lanname as language
		FROM pg_proc p
		JOIN pg_namespace n ON n.oid = p.pronamespace
		JOIN pg_language l ON l.oid = p.prolang
		WHERE (
			(${schemas}::text[] IS NULL AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')) -- exclude system functions
			OR
			(${schemas}::text[] IS NOT NULL AND n.nspname = ANY(${schemas}::text[]))
		)
		AND p.prokind = 'f'  -- 'f' = function, 'p' = procedure, 'a' = aggregate
		-- and l.lanname = 'sql'
		ORDER BY n.nspname, p.proname`;
}
