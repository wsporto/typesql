import moment from 'moment';

import {
    SimpleExprFunctionContext,
    ExprContext,
    InsertStatementContext, DeleteStatementContext
} from "ts-mysql-parser";

import { ColumnSchema, ColumnDef, TypeVar, Type, Constraint, SubstitutionHash } from "./types";
import { findColumn, splitName } from "./select-columns";
import { MySqlType, InferType } from "../mysql-mapping";
import { unify } from "./unify";
import { TerminalNode } from "antlr4ts/tree";

let counter = 0;
export function freshVar(name: string, typeVar: InferType, table?: string, selectItem?: true, list?: true): TypeVar {
    const param: TypeVar = {
        kind: 'TypeVar',
        id: (++counter).toString(),
        name,
        type: typeVar,
        table
    }
    if (list) {
        param.list = true;
    }
    if (selectItem) {
        param.selectItem = true;
    }
    return param;
}

export function createColumnType(col: ColumnDef) {
    const columnType: TypeVar = {
        kind: 'TypeVar',
        id: col.columnType.id,
        name: col.columnName,
        type: col.columnType.type,
        table: col.table
    }
    return columnType;
}

export function createColumnTypeFomColumnSchema(col: ColumnSchema) {
    const columnType: TypeVar = {
        kind: 'TypeVar',
        id: col.column,
        name: col.column,
        type: col.column_type,
        table: col.table
    }
    return columnType;
}

export type ExprOrDefault = ExprContext | TerminalNode;


export function getInsertIntoTable(insertStatement: InsertStatementContext) {
    const insertIntoTable = splitName(insertStatement.tableRef().text).name;
    return insertIntoTable;
}

export function getInsertColumns(insertStatement: InsertStatementContext, fromColumns: ColumnDef[]) {
    const insertIntoTable = getInsertIntoTable(insertStatement);

    const insertFields = insertStatement.insertFromConstructor() ||
        insertStatement.insertQueryExpression();

    const fields = insertFields?.fields()?.insertIdentifier().map(insertIdentifier => {
        const colRef = insertIdentifier.columnRef();
        if (colRef) {
            const fieldName = splitName(colRef.text);
            const column = findColumn(fieldName, fromColumns);
            return column;

        }
        throw Error('Invalid sql');

    });

    //check insert stmt without fields (only values). Ex.: insert into mytable values()
    if (!fields) {
        return fromColumns.filter(column => column.table == insertIntoTable);
    }
    return fields;
}

export function getDeleteColumns(deleteStatement: DeleteStatementContext, dbSchema: ColumnSchema[]): ColumnDef[] {
    //TODO - Use extractColumnsFromTableReferences
    const tableNameStr = deleteStatement.tableRef()?.text!
    const tableAlias = deleteStatement.tableAlias()?.text;
    const tableName = splitName(tableNameStr).name;
    const columns = dbSchema
        .filter(col => col.table == tableName)
        .map(col => {
            const colDef: ColumnDef = {
                table: tableNameStr,
                tableAlias: tableAlias,
                columnName: col.column,
                columnType: createColumnTypeFomColumnSchema(col),
                columnKey: col.columnKey,
                notNull: col.notNull
            }
            return colDef;
        })
    return columns;
}

export function generateTypeInfo(namedNodes: TypeVar[], constraints: Constraint[]): InferType[] {

    const substitutions: SubstitutionHash = {}
    unify(constraints, substitutions);

    const parameters = namedNodes.map(param => getVarType(substitutions, param));
    return parameters;
}

export function getVarType(substitutions: SubstitutionHash, typeVar: Type): InferType {
    if (typeVar.kind == 'TypeVar') {
        // if (typeVar.type != '?') {
        //     return typeVar.type;
        // }
        const subs = substitutions[typeVar.id];
        if (subs) {
            if (subs.id != typeVar.id) {
                return getVarType(substitutions, subs)
            }
            const resultType = subs.list || typeVar.list ? subs.type + '[]' : subs.type;
            return resultType as MySqlType;
        }
        // if (!subs) {
        //     return typeVar.type as MySqlType;
        // }
        const resultType = typeVar.list ? typeVar.type + '[]' : typeVar.type;
        return resultType as MySqlType;
    }
    return '?'

}

export function verifyDateTypesCoercion(type: Type) {

    if (type.kind == 'TypeVar' && isDateTimeLiteral(type.name)) {
        type.type = 'datetime';
    }
    if (type.kind == 'TypeVar' && isDateLiteral(type.name)) {
        type.type = 'date';
    }
    if (type.kind == 'TypeVar' && isTimeLiteral(type.name)) {
        type.type = 'time';
    }
    return type;

}

export function isTimeLiteral(literal: string) {
    return moment(literal, 'HH:mm:ss', true).isValid() || moment(literal, 'HH:mm', true).isValid();
}

export function isDateTimeLiteral(literal: string) {
    return moment(literal, 'YYYY-MM-DD HH:mm:ss', true).isValid()
}

export function isDateLiteral(literal: string) {
    return moment(literal, "YYYY-MM-DD", true).isValid();
}

export function getFunctionName(simpleExprFunction: SimpleExprFunctionContext) {
    return simpleExprFunction.functionCall().pureIdentifier()?.text.toLowerCase()
        || simpleExprFunction.functionCall().qualifiedIdentifier()?.text.toLowerCase();
}

export type VariableLengthParams = {
    kind: 'VariableLengthParams';
    paramType: InferType;
}

export type FixedLengthParams = {
    kind: 'FixedLengthParams';
    paramsType: TypeVar[];
}

export type FunctionParams = VariableLengthParams | FixedLengthParams;