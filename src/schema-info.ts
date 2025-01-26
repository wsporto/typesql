import { createLibSqlClient } from './drivers/libsql';
import { createPostgresClient } from './drivers/postgres';
import { ColumnSchema, Table } from './mysql-query-analyzer/types';
import { createMysqlClient, loadMysqlSchema, loadMySqlTableSchema, selectTablesFromSchema } from './queryExectutor';
import { createSqliteClient, ForeignKeyInfo, loadDbSchema, loadForeignKeys as loadSqliteForeignKeys, selectSqliteTablesFromSchema } from './sqlite-query-analyzer/query-executor';
import { DatabaseClient, TypeSqlDialect, TypeSqlError } from './types';
import { loadDbSchema as loadPostgresDbSchema, mapToColumnSchema, loadForeignKeys as loadPostgresForeignKeys } from './drivers/postgres';
import { okAsync, ResultAsync } from 'neverthrow';
import { Either, right } from 'fp-ts/lib/Either';

type SchemaInfo = {
	columns: ColumnSchema[];
	foreignKeys: ForeignKeyInfo[];
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

export function loadSchema(databaseClient: DatabaseClient): ResultAsync<ColumnSchema[], TypeSqlError> {
	switch (databaseClient.type) {
		case 'mysql2':
			return loadMysqlSchema(databaseClient.client, databaseClient.schema);
		case 'better-sqlite3':
		case 'libsql':
		case 'bun:sqlite':
		case 'd1':
			return loadDbSchema(databaseClient.client).asyncAndThen(res => okAsync(res));
		case 'pg':
			const result = loadPostgresDbSchema(databaseClient.client)
				.map(schema => schema.map(col => mapToColumnSchema(col)))
				.mapErr(err => {
					const typesqlError: TypeSqlError = {
						description: err,
						name: err
					}
					return typesqlError;
				});
			return result;

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

export function loadForeignKeys(databaseClient: DatabaseClient): ResultAsync<ForeignKeyInfo[], TypeSqlError> {
	switch (databaseClient.type) {
		case 'better-sqlite3':
		case 'libsql':
		case 'bun:sqlite':
		case 'd1':
			return loadSqliteForeignKeys(databaseClient.client).asyncAndThen(res => okAsync(res));
		case 'mysql2':
			return okAsync([]);
		case 'pg':
			return loadPostgresForeignKeys(databaseClient.client);
	}
}

export function loadSchemaInfo(databaseUri: string, client: TypeSqlDialect): ResultAsync<SchemaInfo, TypeSqlError> {
	const result = createClient(databaseUri, client)
		.andThen(db => {
			const schemaResult = loadSchema(db);
			const foreignKeysResult = loadForeignKeys(db);
			const schemaInfo = ResultAsync.combine([schemaResult, foreignKeysResult])
				.map(([schema, foreignKeys]) => {
					const result: SchemaInfo = {
						columns: schema,
						foreignKeys
					}
					return result;
				});
			closeClient(db);
			return schemaInfo;

		})
	return result;
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
