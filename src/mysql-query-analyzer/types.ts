import { MySqlType, InferType } from "../mysql-mapping"
import { ParameterDef } from "../types"
import { TypeVar } from "./collect-constraints";

export type ColumnSchema = {
    schema: string;
    table: string;
    column: string;
    column_type: MySqlType;
    columnKey: 'PRI' | 'MUL' | 'UNI' | '';
    notNull: boolean;
}

export type ColumnSchema2 = ColumnSchema & {
    autoincrement: boolean;
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
    type: MySqlType | 'any';
    notNull: boolean;
}

export type FieldInfo = {
    name: string;
    notNull: boolean;
}

export type ParameterInfo = {
    type: MySqlType | 'any'
    notNull: boolean;
}

export type TypeInferenceResult = {
    columns: InferType[]; //TODO - MySqlType
    parameters: InferType[]; //MySqlType
}

export type TypeAndNullInfer = {
    name: string;  //TODO - need?
    type: TypeVar;
    notNull: boolean;
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