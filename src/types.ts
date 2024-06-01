import { MySqlType } from "./mysql-mapping"
import { Brand } from "./utility-types"
import { ColumnInfo, ColumnSchema, DynamicSqlInfoResult } from "./mysql-query-analyzer/types"
import { QueryContext } from '@wsporto/ts-mysql-parser';
import { NestedResultInfo } from "./describe-nested-query";
import { SQLiteType } from "./sqlite-query-analyzer/types";
import { Database } from "better-sqlite3";
import { Pool } from "mysql2/promise";
import { RelationInfo2 } from "./sqlite-query-analyzer/sqlite-describe-nested-query";
import { Database as LibSQLDatabase } from "libsql";

export type DBSchema = {
    columns: ColumnSchema[];
}

export type ParseResult = {
    sql: string;
    namedParameters: string[];
    dbSchema: ColumnSchema[];
    queryContext: QueryContext;
}

export type QueryType = 'Select' | 'Insert' | 'Update' | 'Delete';

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
    nestedInfo?: RelationInfo2[];
}

export type FieldNullability = {
    name: string;
    notNull: boolean;
}

export type ColumnDef2 = {
    table: string;
    column: string;
    columnName: string;
    tableAlias?: string;
    notNull: boolean;
}

export type ParameterDef = {
    name: string,
    columnType: MySqlType | SQLiteType | 'any';
    notNull: boolean,
    list?: boolean; //id in (?)
}

export type ParameterNameAndPosition = {
    name: string;
    paramPosition: number;
}

export type FunctionParamContext = {
    type: 'function'
    functionName: string;
    notNull: boolean;
}
export type ExpressionParamContext = {
    type: 'expression';
    expression: string;
    notNull: boolean;
    from?: string;
    list?: boolean;
}

export type ExpressionCompareParamContext = {
    type: 'expressionCompare';
    expressionLeft: string;
    expressionRight: string;
    notNull: boolean;
    from?: string;
    list?: boolean;
}

export type ResolvedParameter = {
    type: 'resolved';
    notNull: boolean;
    columnType: MySqlType | '?';
}

export type ParameterContext = ExpressionParamContext | FunctionParamContext | ResolvedParameter | ExpressionCompareParamContext;


export type FieldDescriptor = {
    name: string;
    column: string;
    columnType: MySqlType;
    notNull: boolean;
}

export type TsFieldDescriptor = {
    name: string;
    tsType: string;
    notNull: boolean;
}

export type TypeSqlError = {
    name: string;
    description: string;
}

export type PreprocessedSql = {
    sql: string;
    namedParameters: string[];
}

export type CamelCaseName = Brand<string, 'CamelCase'>;

export type DatabaseClient = MySqlDialect | SQLiteDialect | LibSqlClient;

export type TypeSqlDialect = DatabaseClient['type'];

export type SQLiteClient = 'sqlite' | 'libsql';

export type MySqlDialect = {
    type: 'mysql';
    client: Pool;
    databaseVersion: string;
    schema: string;
    isVersion8: boolean;
}

export type SQLiteDialect = {
    type: 'sqlite';
    client: Database;
}

export type LibSqlClient = {
    type: 'libsql';
    client: LibSQLDatabase;
}

export type TypeSqlConfig = {
    databaseUri: string;
    sqlDir: string;
    target: 'node' | 'deno';
    client: TypeSqlDialect;
    authToken?: string;
    includeCrudTables: string[];
}

export type SqlGenOption = 'select' | 's' | 'insert' | 'i' | 'update' | 'u' | 'delete' | 'd';