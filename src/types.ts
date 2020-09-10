import { MySqlType } from "./mysql-mapping"
import { Brand } from "./utility-types"
import { ColumnSchema } from "./mysql-query-analyzer/types"

export type DBSchema = {
    columns: ColumnSchema[];
}

export type SchemaDef = {
    sql: string;
    queryType: 'Select' | 'Insert' | 'Update' | 'Delete'
    multipleRowsResult: boolean;
    columns: ColumnDef[]; //TODO - ColumnDef and ParamterDef should be the same
    orderByColumns?: string[];
    parameters: ParameterDef[]; 
    data?: ParameterDef[];
}

export type ColumnDef = {
    name: string;
    dbtype: MySqlType;
    notNull?: boolean;
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
    columnType: MySqlType;
    notNull: boolean,
    list?: boolean; //id in (?)
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

export type TypeSqlConfig = {
    databaseUri: string;
    sqlDir: string;
    target: 'node' | 'deno';
}

export type SqlGenOption = 'select' | 's' | 'insert' | 'i' | 'update' | 'u' | 'delete' | 'd';