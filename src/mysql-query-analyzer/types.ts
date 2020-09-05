import { MySqlType, InferType } from "../mysql-mapping"
import { ParameterDef } from "../types"

export type ColumnSchema = {
    schema: string;
    table: string;
    column: string;
    column_type: MySqlType;
    notNull: boolean;
}

export type ColumnDef = {
    table: string;
    column: string;
    columnName: string;
    columnType: InferType;
    tableAlias?: string;
    notNull: boolean;
}

export type FieldName = {
    name: string;
    prefix: string;
}

export type ColumnInfo = {
    columnName: string;
    type: MySqlType;
    notNull: boolean;
}

export type FieldInfo = {
    name: string;
    notNull: boolean;
}

export type ParameterInfo = {
    type: MySqlType
    notNull: boolean;
}

export type TypeInferenceResult = {
    columns: InferType[];
    parameters: InferType[];
}

export type TypeAndNullInfer = {
    name: string;
    type: InferType;
    notNull: boolean;
}

export type TypeAndNullInferResult = {
    columns: TypeAndNullInfer[];
    parameters: TypeAndNullInfer[];
}

export type QueryInfoResult = {
    kind: 'Select'
    columns: ColumnInfo[];
    parameters: ParameterInfo[];
    multipleRowsResult: boolean;
    orderByColumns?: string[];
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