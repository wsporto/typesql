export type DBSchema = {
    columns: ColumnSchema[];
}

export type ColumnSchema = {
    table: string;
    column: string;
    notNull: boolean;
}

export type SchemaDef = {
    columns: ColumnDef[];
    parameters: ParameterDef[];
    parameterNames?: string[];
}

export type ColumnDef = {
    name: string;
    dbtype: string;
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
    columnType: string | string[];
    list?: boolean; //id in (?)
}

export type FunctionParamContext = {
    type: 'function'
    functionName: string;
}
export type ExpressionParamContext = {
    type: 'expression';
    name?: string;
    expression: string;
    from?: string;
    list?: boolean;
}

export type ResolvedParameter = {
    type: 'resolved';
    name: string;
    columnType: string;
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