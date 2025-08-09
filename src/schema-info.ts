import { createLibSqlClient } from './drivers/libsql';
import { CheckConstraintResult, createPostgresClient, EnumMap } from './drivers/postgres';
import { ColumnSchema, Table } from './mysql-query-analyzer/types';
import { createMysqlClient, loadMysqlSchema, loadMySqlTableSchema, selectTablesFromSchema } from './queryExectutor';
import { createSqliteClient, ForeignKeyInfo, loadDbSchema, selectSqliteTablesFromSchema } from './sqlite-query-analyzer/query-executor';
import { DatabaseClient, MySqlClient, SQLiteClient, TypeSqlDialect, TypeSqlError } from './types';
import {
	loadDbSchema as loadPostgresDbSchema, loadForeignKeys as loadPostgresForeignKeys,
	loadEnumsMap as loadPostgresEnumsMap, loadUserFunctions as loadPostgresUserFunctions, loadCheckConstraints as loadPostgresCheckConstraints
} from './drivers/postgres';
import { okAsync, ResultAsync } from 'neverthrow';
import { Either, right } from 'fp-ts/lib/Either';
import { UserFunctionSchema } from './postgres-query-analyzer/types';
import { PostgresColumnSchema } from './drivers/types';
import { Sql } from 'postgres';


export type SchemaInfo = {
	kind: SQLiteClient | MySqlClient;
	columns: ColumnSchema[];
}

export type PostgresSchemaInfo = {
	kind: 'pg';
	columns: PostgresColumnSchema[];
	foreignKeys: ForeignKeyInfo[];
	userFunctions: UserFunctionSchema[];
	enumTypes: EnumMap;
	checkConstraints: CheckConstraintResult;
}

export function createClient(databaseUri: string, dialect: TypeSqlDialect, attach?: string[], loadExtensions?: string[], authToken?: string): ResultAsync<DatabaseClient, TypeSqlError> {
	switch (dialect) {
		case 'mysql2':
			return createMysqlClient(databaseUri);
		case 'better-sqlite3':
		case 'bun:sqlite':
		case 'd1':
			return createSqliteClient(dialect, databaseUri, attach || [], loadExtensions || []).asyncAndThen(res => okAsync(res));
		case 'libsql':
			return createLibSqlClient(databaseUri, attach || [], loadExtensions || [], authToken || '').asyncAndThen(res => okAsync(res));
		case 'pg':
			return createPostgresClient(databaseUri).asyncAndThen(res => okAsync(res));;
	}
}

export function loadSchemaInfo(databaseClient: DatabaseClient, schemas?: string[]): ResultAsync<SchemaInfo | PostgresSchemaInfo, TypeSqlError> {
	switch (databaseClient.type) {
		case 'mysql2':
			return loadMysqlSchema(databaseClient.client, databaseClient.schema).map(schema => ({
				kind: databaseClient.type,
				columns: schema
			}) satisfies SchemaInfo);
		case 'better-sqlite3':
		case 'libsql':
		case 'bun:sqlite':
		case 'd1':
			return loadDbSchema(databaseClient.client).asyncAndThen(columns => okAsync({ kind: databaseClient.type, columns } satisfies SchemaInfo));
		case 'pg':
			return _loadPostgresSchemaInfo(databaseClient.client, schemas ?? null);

	}
}

export function loadTableSchema(databaseClient: DatabaseClient, tableName: string): ResultAsync<ColumnSchema[], TypeSqlError> {
	switch (databaseClient.type) {
		case 'mysql2':
			return loadMySqlTableSchema(databaseClient.client, databaseClient.schema, tableName);
		case 'better-sqlite3':
		case 'libsql':
		case 'bun:sqlite':
		case 'd1':
			return loadDbSchema(databaseClient.client).asyncAndThen(res => okAsync(res));
		case 'pg':
			return okAsync([]);
	}
}

function _loadPostgresSchemaInfo(client: Sql, schemas: string[] | null): ResultAsync<PostgresSchemaInfo, TypeSqlError> {
	const schemaResult = loadPostgresDbSchema(client, schemas);
	const foreignKeysResult = loadPostgresForeignKeys(client);
	const enumTypesResult = loadPostgresEnumsMap(client);
	const userFunctionsResult = loadPostgresUserFunctions(client, schemas);
	const checkConstraintsResult = loadPostgresCheckConstraints(client);
	const schemaInfo = ResultAsync.combine([schemaResult, foreignKeysResult, enumTypesResult, userFunctionsResult, checkConstraintsResult])
		.map(([schema, foreignKeys, enumTypes, userFunctions, checkConstraints]) => {
			const result: PostgresSchemaInfo = {
				kind: 'pg',
				columns: schema,
				foreignKeys,
				userFunctions,
				enumTypes,
				checkConstraints
			}
			return result;
		});
	return schemaInfo;
}

export async function closeClient(db: DatabaseClient) {
	switch (db.type) {
		case 'mysql2':
			await db.client.end();
			return;
		case 'better-sqlite3':
			db.client.close();
			return;
		case 'libsql':
			db.client.close();
			return;
		case 'bun:sqlite':
			db.client.close();
			return;
		case 'd1':
			db.client.close();
			return;
		case 'pg':
			await db.client.end();
			return;
	}
}


export async function selectTables(databaseClient: DatabaseClient): Promise<Either<TypeSqlError, Table[]>> {
	switch (databaseClient.type) {
		case 'mysql2':
			return await selectTablesFromSchema(databaseClient.client);
		case 'better-sqlite3':
		case 'libsql':
		case 'bun:sqlite':
		case 'd1':
			return selectSqliteTablesFromSchema(databaseClient.client);
		case 'pg':
			return right([])
	}
}
