import { NestedResultInfo } from "../describe-nested-query";
import { MySqlType, InferType, DbType } from "../mysql-mapping"
import { SQLiteType } from "../sqlite-query-analyzer/types";
import { ParameterDef } from "../types"

export type TypeVar = {
    kind: 'TypeVar';
    id: string;
    name: string;
    type: InferType;
    table?: string;
    list?: true;
    selectItem?: true
}

export type SQliteTypeVar = {
    kind: 'TypeVar';
    id: string;
    name: string;
    type: InferType;
    table?: string;
    list?: true;
    selectItem?: true
}

export type NamedNodes = {
    [key: string]: Type;
}

export type Type = TypeVar | TypeOperator;

export type TypeOperator = {
    kind: 'TypeOperator';
    types: TypeVar[];
    selectItem?: true
};

export type CoercionType = 'Sum' | 'Coalesce' | 'SumFunction' | 'Ceiling' | 'Union' | 'Numeric'; //Numeric means: Don't convert to string

export type TraverseContext = {
    dbSchema: ColumnSchema[];
    withSchema: ColumnDef[];
    constraints: Constraint[];
    parameters: TypeVar[];
    fromColumns: ColumnDef[];
    subQueryColumns: ColumnDef[];
    subQuery: boolean;
    where: boolean;
    currentFragement?: FragmentInfo;
    dynamicSqlInfo: DynamicSqlInfo;
}

export type Constraint = {
    type1: Type;
    type2: Type;
    expression: string;
    aliasConstraint?: true;
    mostGeneralType?: true;
    coercionType?: CoercionType;
    list?: true;
}

export type ColumnSchema = GenericColumnSchema<MySqlType> | GenericColumnSchema<SQLiteType>;

export type GenericColumnSchema<DbType> = {
    schema: string;
    table: string;
    column: string;
    column_type: DbType;
    columnKey: 'PRI' | 'MUL' | 'UNI' | '';
    notNull: boolean;
    autoincrement?: boolean;
}

export type Table = {
    schema: string;
    table: string;
}

export type ColumnDef = {
    table: string;
    columnName: string;
    columnType: TypeVar;
    columnKey: 'PRI' | 'MUL' | 'UNI' | '';
    tableAlias?: string;
    notNull: boolean;
}

export type FieldName = {
    name: string;
    prefix: string;
}

export type ColumnInfo = {
    columnName: string;
    type: DbType | 'any';
    notNull: boolean;
    table?: string;
}

export type FieldInfo = {
    name: string;
    notNull: boolean;
}

export type ParameterInfo = {
    type: DbType | 'any'
    notNull: boolean;
}

export type TableField = {
    field: string;
    table: string;
    name: string;
}

export type FragmentInfo = {
    fragment: string;
    fragementWithoutAlias?: string;
    relation?: string;
    parentRelation?: string;
    fields: TableField[];
    dependOnFields: TableField[];
    dependOnParams: number[];
    parameters: number[];
    dependOn: string[];
}

export type FragmentInfoResult = {
    fragment: string;
    fragmentWitoutAlias?: string;
    dependOnFields: number[];
    dependOnParams: string[];
    dependOnOrderBy?: string[];
    parameters: string[];
}

export type DynamicSqlInfo = {
    with: FragmentInfo[];
    select: FragmentInfo[];
    from: FragmentInfo[];
    where: FragmentInfo[];
}

export type DynamicSqlInfoResult = {
    with?: FragmentInfoResult[];
    select: FragmentInfoResult[];
    from: FragmentInfoResult[];
    where: FragmentInfoResult[];
}

export type SubstitutionHash = {
    [index: string]: TypeVar
}

export type TypeInferenceResult = {
    columns: InferType[];
    parameters: InferType[];
}

export type TypeAndNullInfer = {
    name: string;  //TODO - need?
    type: TypeVar;
    notNull: boolean;
    table: string;
}

export type TypeAndNullInferResult = {
    columns: TypeAndNullInfer[];
    parameters: TypeAndNullInfer[];
}

export type TypeAndNullInferResultWithIdentifier = {
    queryResult: TypeAndNullInferResult;
    identifier: string;
}

export type QueryInfoResult = {
    kind: 'Select'
    columns: ColumnInfo[];
    parameters: ParameterInfo[];
    multipleRowsResult: boolean;
    orderByColumns?: string[];
    nestedResultInfo?: NestedResultInfo;
    dynamicQuery?: DynamicSqlInfoResult;
}

export type InsertInfoResult = {
    kind: 'Insert'
    parameters: ParameterDef[];
}

export type UpdateInfoResult = {
    kind: 'Update';
    data: ParameterDef[];
    parameters: ParameterDef[];
}

export type DeleteInfoResult = {
    kind: 'Delete';
    parameters: ParameterDef[];
}