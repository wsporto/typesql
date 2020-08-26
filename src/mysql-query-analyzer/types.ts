import { MySqlType } from "../mysql-mapping"
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
    columnType: MySqlType;
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
    columns: MySqlType[];
    parameters: MySqlType[];
}

export type QueryInfoResult = {
    kind: 'Select'
    columns: ColumnInfo[];
    parameters: ParameterInfo[];
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