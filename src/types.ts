import { MySqlType } from "./mysql-database"

export type DBSchema = {
    columns: ColumnSchema[];
}

export type ColumnSchema = {
    schema: string;
    table: string;
    column: string;
    column_type: MySqlType;
    notNull: boolean;
}

export type SchemaDef = {
    sql: string;
    multipleRowsResult: boolean;
    columns: ColumnDef[];
    orderByColumns?: string[];
    parameters: ParameterDef[];
    data?: ParameterDef[];
    parameterNames?: string[];
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
    columnType: MySqlType | MySqlType[] | '?';
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

export type ResolvedParameter = {
    type: 'resolved';
    notNull: boolean;
    columnType: MySqlType;
}

export type ParameterContext = ExpressionParamContext | FunctionParamContext | ResolvedParameter;


export type FieldDescriptor = {
    name: string;
    column: string;
    columnType: number;
    notNull: boolean;
}

export type InvalidSqlError = {
    name: string;
    description: string;
}

export type PreprocessedSql = {
    sql: string;
    namedParameters: string[];
}