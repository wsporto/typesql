import type { DbType, MySqlType } from './mysql-mapping';
import type { Brand } from './utility-types';
import type { ColumnInfo, ColumnSchema, DynamicSqlInfoResult, DynamicSqlInfoResult2 } from './mysql-query-analyzer/types';
import type { QueryContext } from '@wsporto/typesql-parser/mysql/MySQLParser';
import type { NestedResultInfo } from './describe-nested-query';
import type { PostgresType, SQLiteType } from './sqlite-query-analyzer/types';
import type { Database } from 'better-sqlite3';
import type { Pool } from 'mysql2/promise';
import type { RelationInfo2 } from './sqlite-query-analyzer/sqlite-describe-nested-query';
import type { Database as LibSQLDatabase } from 'libsql';
import { Sql } from 'postgres';

export type DBSchema = {
	columns: ColumnSchema[];
};

export type ParseResult = {
	sql: string;
	namedParameters: string[];
	dbSchema: ColumnSchema[];
	queryContext: QueryContext;
};

export type CrudQueryType = 'Select' | 'Insert' | 'Update' | 'Delete';
export type QueryType = CrudQueryType | 'Copy';

export type SchemaDef = {
	sql: string;
	queryType: QueryType;
	multipleRowsResult: boolean;
	returning?: true;
	columns: ColumnInfo[]; //TODO - ColumnDef and ParamterDef should be the same
	orderByColumns?: string[];
	parameters: ParameterDef[];
	data?: ParameterDef[];
	nestedResultInfo?: NestedResultInfo;
	dynamicSqlQuery?: DynamicSqlInfoResult;
	dynamicSqlQuery2?: DynamicSqlInfoResult2;
	nestedInfo?: RelationInfo2[];
};

export type FieldNullability = {
	name: string;
	notNull: boolean;
};

export type ColumnDef2 = {
	table: string;
	column: string;
	columnName: string;
	tableAlias?: string;
	notNull: boolean;
};

export type ParameterDef = {
	name: string;
	columnType: DbType;
	notNull: boolean;
	list?: boolean; //id in (?)
};

export type ParameterNameAndPosition = {
	name: string;
	paramPosition: number;
};

export type FunctionParamContext = {
	type: 'function';
	functionName: string;
	notNull: boolean;
};
export type ExpressionParamContext = {
	type: 'expression';
	expression: string;
	notNull: boolean;
	from?: string;
	list?: boolean;
};

export type ExpressionCompareParamContext = {
	type: 'expressionCompare';
	expressionLeft: string;
	expressionRight: string;
	notNull: boolean;
	from?: string;
	list?: boolean;
};

export type ResolvedParameter = {
	type: 'resolved';
	notNull: boolean;
	columnType: MySqlType | '?';
};

export type ParameterContext = ExpressionParamContext | FunctionParamContext | ResolvedParameter | ExpressionCompareParamContext;

export type FieldDescriptor = {
	name: string;
	column: string;
	columnType: MySqlType;
	notNull: boolean;
};

export type TsFieldDescriptor = {
	name: string;
	tsType: string;
	notNull: boolean;
	optional?: boolean;
};

export type TsParameterDescriptor = TsFieldDescriptor & {
	toDriver: string;
	isArray: boolean;
};

export type TypeSqlError = {
	name: string;
	description: string;
};

export type PreprocessedSql = {
	sql: string;
	namedParameters: string[];
};

export type CamelCaseName = Brand<string, 'CamelCase'>;

export type DatabaseClient = MySqlDialect | SQLiteDialect | LibSqlClient | BunDialect | D1Dialect | PgDielect;

export type TypeSqlDialect = DatabaseClient['type'];

export type SQLiteClient = SQLiteDialect['type'] | LibSqlClient['type'] | BunDialect['type'] | D1Dialect['type'];
export type MySqlClient = MySqlDialect['type'];

export type MySqlDialect = {
	type: 'mysql2';
	client: Pool;
	databaseVersion: string;
	schema: string;
	isVersion8: boolean;
};

export type SQLiteDialect = {
	type: 'better-sqlite3';
	client: Database;
};

export type BunDialect = {
	type: 'bun:sqlite';
	client: Database;
};

export type LibSqlClient = {
	type: 'libsql';
	client: LibSQLDatabase;
};

export type D1Dialect = {
	type: 'd1';
	client: Database;
};

export type PgDielect = {
	type: 'pg',
	client: Sql
}

export type TypeSqlConfig = {
	databaseUri: string;
	sqlDir: string;
	outDir?: string;
	client: TypeSqlDialect;
	authToken?: string;
	attach?: string[];
	loadExtensions?: string[];
	includeCrudTables: string[];
	moduleExtension?: 'js' | 'ts';
	/**
	 * Optional list of schemas to include during introspection.
	 * Defaults to ['public'] if not specified.
	 */
	schemas?: string[];
};

export type SqlGenOption = 'select' | 's' | 'insert' | 'i' | 'update' | 'u' | 'delete' | 'd';
