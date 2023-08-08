import { RuleContext } from "antlr4ts";
import moment from 'moment';

import {
    QueryContext, PrimaryExprCompareContext, BitExprContext, SimpleExprColumnRefContext, SimpleExprLiteralContext,
    SimpleExprParamMarkerContext, SimpleExprCaseContext, SimpleExprFunctionContext, SimpleExprSumContext,
    PredicateExprInContext, PredicateContext, SimpleExprSubQueryContext, QuerySpecificationContext,
    SimpleExprListContext, ExprListContext, PrimaryExprIsNullContext, ExprContext, ExprIsContext, BoolPriContext,
    PrimaryExprPredicateContext, SimpleExprContext, PredicateOperationsContext, ExprNotContext, ExprAndContext,
    ExprOrContext, ExprXorContext, PredicateExprLikeContext, SelectStatementContext, SimpleExprRuntimeFunctionContext,
    SubqueryContext, InsertStatementContext, UpdateStatementContext, DeleteStatementContext, PrimaryExprAllAnyContext,
    FromClauseContext, SimpleExprIntervalContext, HavingClauseContext, QueryExpressionOrParensContext, QueryExpressionContext, QueryExpressionParensContext, QueryExpressionBodyContext, InsertQueryExpressionContext, SimpleExprWindowingFunctionContext, WindowFunctionCallContext, SimpleExprCastContext
} from "ts-mysql-parser";

import { ColumnSchema, ColumnDef, TypeInferenceResult, InsertInfoResult, UpdateInfoResult, DeleteInfoResult, TypeAndNullInfer } from "./types";
import { getColumnsFrom, findColumn, splitName, selectAllColumns, findColumn2 } from "./select-columns";
import {
    SubstitutionHash, getQuerySpecificationsFromSelectStatement as getQuerySpecificationsFromQuery,
    getQuerySpecificationsFromSelectStatement
} from "./parse";
import { MySqlType, InferType } from "../mysql-mapping";
import { ParameterDef } from "../types";
import { unify } from "./unify";
import { getParentContext, inferParamNullability, inferParamNullabilityQuery } from "./infer-param-nullability";
import { verifyNotInferred } from "../describe-query";
import { TerminalNode } from "antlr4ts/tree";
import { getPairWise, getParameterIndexes } from "./util";

export type TypeVar = {
    kind: 'TypeVar';
    id: number;
    name: string;
    type: InferType;
    list?: true;
    selectItem?: true
}

export type Type = TypeVar | TypeOperator;

type TypeOperator = {
    kind: 'TypeOperator';
    types: Type[];
    selectItem?: true
};

export type Constraint = {
    type1: Type;
    type2: Type;
    expression: string;
    aliasConstraint?: true;
    mostGeneralType?: true;
    coercionType?: 'Sum' | 'Coalesce' | 'SumFunction' | 'Ceiling';
    list?: true;
}

export type InferenceContext = {
    dbSchema: ColumnSchema[];
    withSchema: TypeAndNullInfer[];
    parameters: TypeVar[];
    constraints: Constraint[];
    fromColumns: ColumnDef[];
    havingExpr?: boolean;
}

let counter = 0;
export function freshVar(name: string, typeVar: InferType, selectItem?: true, list?: true): TypeVar {
    const param: TypeVar = {
        kind: 'TypeVar',
        id: ++counter,
        name,
        type: typeVar

    }
    if (list) {
        param.list = true;
    }
    if (selectItem) {
        param.selectItem = true;
    }
    return param;
}


export type NamedNodes = {
    [key: string]: Type;
}

export function analiseTree(tree: RuleContext, context: InferenceContext, namedParameters: string[]): TypeInferenceResult {

    if (tree instanceof QueryContext) {

        const selectStatement = tree.simpleStatement()?.selectStatement();
        if (selectStatement) {
            return analiseSelectStatement(selectStatement, context.dbSchema, context.withSchema, namedParameters);
        }
        const insertStatement = tree.simpleStatement()?.insertStatement();
        if (insertStatement) {
            const insertStmt = analiseInsertStatement(insertStatement, context);
            const TypeInfer: TypeInferenceResult = {
                columns: [],
                parameters: insertStmt.parameters.map(param => param.columnType)
            }
            return TypeInfer;
        }
        const updateStatement = tree.simpleStatement()?.updateStatement();
        if (updateStatement) {
            const updateStmt = analiseUpdateStatement(updateStatement, context.dbSchema, context.withSchema);
            const TypeInfer: TypeInferenceResult = {
                columns: [],
                parameters: updateStmt.data.map(param => param.columnType)
            }
            return TypeInfer;
        }

    }
    throw Error('invalid type of tree');

}

type ExprOrDefault = ExprContext | TerminalNode;

export function analiseInsertStatement(insertStatement: InsertStatementContext, context: InferenceContext): InsertInfoResult {

    const insertColumns = getInsertColumns(insertStatement, context.dbSchema);
    const allParameters: ParameterDef[] = [];
    const paramsNullability: { [paramId: number]: boolean } = {};

    const exprOrDefaultList: ExprOrDefault[] = [];
    const valuesContext = insertStatement.insertFromConstructor()?.insertValues().valueList().values()[0];
    if (valuesContext) {
        valuesContext.DEFAULT_SYMBOL().forEach(terminalNode => {
            exprOrDefaultList.push(terminalNode);
        })
        valuesContext.expr().forEach(expr => {
            exprOrDefaultList.push(expr);
        })
    }

    //order the tokens based on sql position
    exprOrDefaultList.sort((token1, token2) => token1.sourceInterval.a - token2.sourceInterval.a);

    const insertIntoTable = getInsertIntoTable(insertStatement);

    const fromColumns = context.dbSchema
        .filter(c => c.table == insertIntoTable)
        .map(c => {
            const col: ColumnDef = {
                table: c.table,
                column: c.column,
                columnName: c.column,
                columnType: c.column_type,
                columnKey: "",
                notNull: c.notNull
            }
            return col;
        })

    context.fromColumns = fromColumns;

    exprOrDefaultList.forEach((expr, index) => {
        const column = insertColumns[index];

        if (expr instanceof ExprContext) {
            const numberParamsBefore = context.parameters.length;
            const exprType = walkExpr(context, expr);
            context.parameters.slice(numberParamsBefore).forEach(param => {
                paramsNullability[param.id] = column.notNull;
            })
            context.constraints.push({
                expression: expr.text,
                type1: freshVar(column.column, column.column_type),
                type2: exprType.kind == 'TypeOperator' ? exprType.types[0] : exprType
            })
        }
    })

    const updateList = insertStatement.insertUpdateList()?.updateList().updateElement() || [];
    updateList.forEach(updateElement => {
        const columnName = updateElement.columnRef().text;
        const field = splitName(columnName);
        const expr = updateElement.expr();
        if (expr) {
            const numberParamsBefore = context.parameters.length;
            const exprType = walkExpr(context, expr);
            const column = findColumn2(field, insertIntoTable, context.dbSchema);
            context.parameters.slice(numberParamsBefore).forEach(param => {
                paramsNullability[param.id] = column.notNull;
            })
            context.constraints.push({
                expression: expr.text,
                type1: exprType,
                type2: freshVar(column.column, column.column_type)

            })
        }
    });

    const insertQueryExpression = insertStatement.insertQueryExpression();
    if (insertQueryExpression) {
        const numberParamsBefore = context.parameters.length;
        const exprTypes = walkInsertQueryExpression(insertQueryExpression, context);

        exprTypes.types.forEach((type, index) => {
            const column = insertColumns[index];
            if (type.kind == 'TypeVar') {
                paramsNullability[type.id] = column.notNull;
            }
            context.constraints.push({
                expression: insertQueryExpression.text,
                type1: type,
                type2: freshVar(column.column, column.column_type)
            })

        })
        const paramNullabilityExpr = inferParamNullabilityQuery(insertQueryExpression);
        context.parameters.slice(numberParamsBefore).forEach((param, index) => {
            if (paramsNullability[param.id] == null) {
                paramsNullability[param.id] = paramNullabilityExpr[index];
            }
        })

    }

    const typeInfo = generateTypeInfo(context.parameters, context.constraints);
    typeInfo.forEach((param, index) => {
        const paramId = context.parameters[index].id;
        allParameters.push({
            name: 'param' + (allParameters.length + 1),
            columnType: verifyNotInferred(param),
            notNull: paramsNullability[paramId]
        })
    })

    const typeInferenceResult: InsertInfoResult = {
        kind: 'Insert',
        parameters: allParameters
    }
    return typeInferenceResult;
}

function walkInsertQueryExpression(insertQueryExpression: InsertQueryExpressionContext, context: InferenceContext): TypeOperator {
    const queryExpressionOrParens = insertQueryExpression.queryExpressionOrParens();
    return walkQueryExpressionOrParens(queryExpressionOrParens, context);
}

function walkQueryExpressionOrParens(queryExpressionOrParens: QueryExpressionOrParensContext, context: InferenceContext): TypeOperator {
    const queryExpression = queryExpressionOrParens.queryExpression();
    if (queryExpression) {
        return walkQueryExpression(queryExpression, context);
    }
    const queryEpressionParens = queryExpressionOrParens.queryExpressionParens();
    if (queryEpressionParens) {
        return walkQueryExpressionParens(queryEpressionParens);
    }
    throw Error("walkQueryExpressionOrParens");
}

function walkQueryExpression(queryExpression: QueryExpressionContext, context: InferenceContext): TypeOperator {
    const queryExpressionBody = queryExpression.queryExpressionBody();
    if (queryExpressionBody) {
        return walkQueryExpressionBody(queryExpressionBody, context)
    }
    const queryExpressionParens = queryExpression.queryExpressionParens();
    if (queryExpressionParens) {
        return walkQueryExpressionParens(queryExpressionParens);
    }
    throw Error("walkQueryExpression");
}

function walkQueryExpressionParens(queryExpressionParens: QueryExpressionParensContext): TypeOperator {
    throw Error("walkQueryExpressionParens not implemented:" + queryExpressionParens.text);
}

function walkQueryExpressionBody(queryExpressionBody: QueryExpressionBodyContext, context: InferenceContext): TypeOperator {
    const childQueryExpressionBody = queryExpressionBody.queryExpressionBody();
    if (childQueryExpressionBody) {
        return walkQueryExpressionBody(childQueryExpressionBody, context);
    }
    const queryExpressionParensList = queryExpressionBody.queryExpressionParens();
    queryExpressionParensList.forEach(queryExpressionParens => {
        return walkQueryExpressionParens(queryExpressionParens);
    })

    const querySpecification = queryExpressionBody.querySpecification();
    if (querySpecification) {
        return walkQuerySpecification(context, querySpecification);
    }
    throw Error("walkQueryExpressionBody");
}

export function analiseDeleteStatement(deleteStatement: DeleteStatementContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[]): DeleteInfoResult {

    const whereExpr = deleteStatement.whereClause()?.expr();
    const deleteColumns = getDeleteColumns(deleteStatement, dbSchema);
    const allParameters: ParameterDef[] = [];

    if (whereExpr) {
        const context: InferenceContext = {
            fromColumns: deleteColumns,
            parameters: [],
            constraints: [],
            dbSchema,
            withSchema
        }
        walkExpr(context, whereExpr);
        const typeInfo = generateTypeInfo(context.parameters, context.constraints);

        const paramNullability = inferParamNullability(whereExpr);
        typeInfo.forEach((param, paramIndex) => {
            allParameters.push({
                name: 'param' + (allParameters.length + 1),
                columnType: verifyNotInferred(param),
                notNull: paramNullability[paramIndex]
            })
        })
    }


    const typeInferenceResult: DeleteInfoResult = {
        kind: 'Delete',
        parameters: allParameters
    }
    return typeInferenceResult;
}

export function analiseUpdateStatement(updateStatement: UpdateStatementContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[]): UpdateInfoResult {

    const updateElement = updateStatement.updateList().updateElement();
    const updateColumns = getUpdateColumns(updateStatement, dbSchema);
    const dataParameters: ParameterDef[] = [];
    const whereParameters: ParameterDef[] = [];

    updateElement.forEach(updateElement => {
        const expr = updateElement.expr();
        if (expr) {
            const context: InferenceContext = {
                dbSchema,
                withSchema,
                parameters: [],
                constraints: [],
                fromColumns: updateColumns
            }

            const result = walkExpr(context, expr);
            const columnName = updateElement.columnRef().text;
            const field = splitName(columnName);
            const column = findColumn(field, updateColumns);
            context.constraints.push({
                expression: updateStatement.text,
                type1: result,
                type2: freshVar(column.table, column.columnType)

            })
            const typeInfo = generateTypeInfo(context.parameters, context.constraints);
            typeInfo.forEach(param => {
                dataParameters.push({
                    name: column.columnName,
                    columnType: verifyNotInferred(param),
                    notNull: column.notNull
                })
            })
        }

    })
    const whereExpr = updateStatement.whereClause()?.expr();
    if (whereExpr) {
        const context: InferenceContext = {
            dbSchema,
            withSchema,
            parameters: [],
            constraints: [],
            fromColumns: updateColumns
        }
        walkExpr(context, whereExpr);
        const typeInfo = generateTypeInfo(context.parameters, context.constraints);

        const paramNullability = inferParamNullability(whereExpr);
        typeInfo.forEach((param, paramIndex) => {
            whereParameters.push({
                name: 'param' + (whereParameters.length + 1),
                columnType: verifyNotInferred(param),
                notNull: paramNullability[paramIndex]
            })
        })


    }
    const typeInferenceResult: UpdateInfoResult = {
        kind: 'Update',
        data: dataParameters,
        parameters: whereParameters
    }

    return typeInferenceResult;
}

function getInsertIntoTable(insertStatement: InsertStatementContext) {
    const insertIntoTable = splitName(insertStatement.tableRef().text).name;
    return insertIntoTable;
}

export function getInsertColumns(insertStatement: InsertStatementContext, dbSchema: ColumnSchema[]) {
    const insertIntoTable = getInsertIntoTable(insertStatement);

    const insertFields = insertStatement.insertFromConstructor() ||
        insertStatement.insertQueryExpression();

    const fields = insertFields?.fields()?.insertIdentifier().map(insertIdentifier => {
        const colRef = insertIdentifier.columnRef();
        if (colRef) {
            const fieldName = splitName(colRef.text);
            const column = findColumn2(fieldName, insertIntoTable, dbSchema);
            return column;

        }
        throw Error('Invalid sql');

    });

    //check insert stmt without fields (only values). Ex.: insert into mytable values()
    if (!fields) {
        return dbSchema.filter(column => column.table == insertIntoTable);
    }
    return fields;
}

export function getUpdateColumns(updateStatement: UpdateStatementContext, dbSchema: ColumnSchema[]) {
    const insertIntoTable = splitName(updateStatement.tableReferenceList().tableReference()[0].text).name;
    const columns = dbSchema
        .filter(col => col.table == insertIntoTable)
        .map(col => {
            const colDef: ColumnDef = {
                table: col.table,
                column: col.column,
                columnName: col.column,
                columnType: col.column_type,
                columnKey: col.columnKey,
                notNull: col.notNull,
                tableAlias: ''
            }
            return colDef;
        })
    return columns;
}

export function getDeleteColumns(deleteStatement: DeleteStatementContext, dbSchema: ColumnSchema[]) {
    const tableNameStr = deleteStatement.tableRef()?.text!
    const tableAlias = deleteStatement.tableAlias()?.text;
    const tableName = splitName(tableNameStr).name;
    const columns = dbSchema
        .filter(col => col.table == tableName)
        .map(col => {
            const colDef: ColumnDef = {
                table: col.table,
                column: col.column,
                columnName: col.column,
                columnType: col.column_type,
                columnKey: col.columnKey,
                notNull: col.notNull,
                tableAlias: tableAlias
            }
            return colDef;
        })
    return columns;
}


export function analiseSelectStatement(selectStatement: SelectStatementContext | SubqueryContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[], namedParameters: string[]): TypeInferenceResult {
    const querySpec = getQuerySpecificationsFromSelectStatement(selectStatement);
    const fromColumns = getColumnsFrom(querySpec[0], dbSchema, withSchema);
    let result = analiseQuerySpecification(querySpec[0], dbSchema, withSchema, fromColumns, namedParameters);
    for (let index = 1; index < querySpec.length; index++) {
        const unionQuery = querySpec[index];
        const fromColumns2 = getColumnsFrom(unionQuery, dbSchema, withSchema);
        const result2 = analiseQuerySpecification(unionQuery, dbSchema, withSchema, fromColumns2, namedParameters);
        result = unionResult(result, result2);
    }
    return result;
}

function unionResult(typeInference1: TypeInferenceResult, typeInference2: TypeInferenceResult): TypeInferenceResult {
    const resultColumnTypes = typeInference1.columns.map((col1, index) => {
        const col2 = typeInference2.columns[index];
        const resultType = unionTypeResult(col1, col2);
        return resultType;
    });

    return {
        columns: resultColumnTypes,
        parameters: [...typeInference1.parameters, ...typeInference2.parameters] //TODO-INVERSE?
    }
}

export function unionTypeResult(type1: InferType, type2: InferType) {

    //Gernerated with tests\check-mysql-inference.ts
    const typeMapping = {
        "decimal_tinyint": "decimal",
        "decimal_smallint": "decimal",
        "decimal_int": "decimal",
        "decimal_float": "double",
        "decimal_double": "double",
        "decimal_timestamp": "varchar",
        "decimal_bigint": "decimal",
        "decimal_mediumint": "decimal",
        "decimal_date": "varchar",
        "decimal_time": "varchar",
        "decimal_datetime": "varchar",
        "decimal_year": "decimal",
        "decimal_varchar": "varchar",
        "decimal_bit": "decimal",
        "decimal_json": "varbinary",
        "decimal_enum": "varchar",
        "decimal_set": "varchar",
        "decimal_tinyblob": "text",
        "decimal_mediumblob": "text",
        "decimal_longblob": "longtext",
        "decimal_blob": "text",
        "decimal_tinytext": "text",
        "decimal_mediumtext": "text",
        "decimal_longtext": "longtext",
        "decimal_text": "text",
        "decimal_varbinary": "varbinary",
        "decimal_binary": "binary",
        "decimal_char": "binary",
        "decimal_geometry": "varbinary",
        "tinyint_smallint": "smallint",
        "tinyint_int": "int",
        "tinyint_float": "float",
        "tinyint_double": "double",
        "tinyint_timestamp": "varchar",
        "tinyint_bigint": "bigint",
        "tinyint_mediumint": "mediumint",
        "tinyint_date": "varchar",
        "tinyint_time": "varchar",
        "tinyint_datetime": "varchar",
        "tinyint_year": "tinyint",
        "tinyint_varchar": "varchar",
        "tinyint_bit": "decimal",
        "tinyint_json": "varbinary",
        "tinyint_enum": "varchar",
        "tinyint_set": "varchar",
        "tinyint_tinyblob": "text",
        "tinyint_mediumblob": "text",
        "tinyint_longblob": "longtext",
        "tinyint_blob": "text",
        "tinyint_tinytext": "text",
        "tinyint_mediumtext": "text",
        "tinyint_longtext": "longtext",
        "tinyint_text": "text",
        "tinyint_varbinary": "varbinary",
        "tinyint_binary": "binary",
        "tinyint_char": "binary",
        "tinyint_geometry": "varbinary",
        "smallint_int": "int",
        "smallint_float": "float",
        "smallint_double": "double",
        "smallint_timestamp": "varchar",
        "smallint_bigint": "bigint",
        "smallint_mediumint": "mediumint",
        "smallint_date": "varchar",
        "smallint_time": "varchar",
        "smallint_datetime": "varchar",
        "smallint_year": "smallint",
        "smallint_varchar": "varchar",
        "smallint_bit": "decimal",
        "smallint_json": "varbinary",
        "smallint_enum": "varchar",
        "smallint_set": "varchar",
        "smallint_tinyblob": "text",
        "smallint_mediumblob": "text",
        "smallint_longblob": "longtext",
        "smallint_blob": "text",
        "smallint_tinytext": "text",
        "smallint_mediumtext": "text",
        "smallint_longtext": "longtext",
        "smallint_text": "text",
        "smallint_varbinary": "varbinary",
        "smallint_binary": "binary",
        "smallint_char": "binary",
        "smallint_geometry": "varbinary",
        "int_float": "double",
        "int_double": "double",
        "int_timestamp": "varchar",
        "int_bigint": "bigint",
        "int_mediumint": "int",
        "int_date": "varchar",
        "int_time": "varchar",
        "int_datetime": "varchar",
        "int_year": "int",
        "int_varchar": "varchar",
        "int_bit": "decimal",
        "int_json": "varbinary",
        "int_enum": "varchar",
        "int_set": "varchar",
        "int_tinyblob": "text",
        "int_mediumblob": "text",
        "int_longblob": "longtext",
        "int_blob": "text",
        "int_tinytext": "text",
        "int_mediumtext": "text",
        "int_longtext": "longtext",
        "int_text": "text",
        "int_varbinary": "varbinary",
        "int_binary": "binary",
        "int_char": "binary",
        "int_geometry": "varbinary",
        "float_double": "double",
        "float_timestamp": "varchar",
        "float_bigint": "float",
        "float_mediumint": "float",
        "float_date": "varchar",
        "float_time": "varchar",
        "float_datetime": "varchar",
        "float_year": "float",
        "float_varchar": "varchar",
        "float_bit": "double",
        "float_json": "varbinary",
        "float_enum": "varchar",
        "float_set": "varchar",
        "float_tinyblob": "text",
        "float_mediumblob": "text",
        "float_longblob": "longtext",
        "float_blob": "text",
        "float_tinytext": "text",
        "float_mediumtext": "text",
        "float_longtext": "longtext",
        "float_text": "text",
        "float_varbinary": "varbinary",
        "float_binary": "binary",
        "float_char": "binary",
        "float_geometry": "varbinary",
        "double_timestamp": "varchar",
        "double_bigint": "double",
        "double_mediumint": "double",
        "double_date": "varchar",
        "double_time": "varchar",
        "double_datetime": "varchar",
        "double_year": "double",
        "double_varchar": "varchar",
        "double_bit": "double",
        "double_json": "varbinary",
        "double_enum": "varchar",
        "double_set": "varchar",
        "double_tinyblob": "text",
        "double_mediumblob": "text",
        "double_longblob": "longtext",
        "double_blob": "text",
        "double_tinytext": "text",
        "double_mediumtext": "text",
        "double_longtext": "longtext",
        "double_text": "text",
        "double_varbinary": "varbinary",
        "double_binary": "binary",
        "double_char": "binary",
        "double_geometry": "varbinary",
        "timestamp_bigint": "varchar",
        "timestamp_mediumint": "varchar",
        "timestamp_date": "datetime",
        "timestamp_time": "datetime",
        "timestamp_datetime": "datetime",
        "timestamp_year": "varchar",
        "timestamp_varchar": "varchar",
        "timestamp_bit": "varbinary",
        "timestamp_json": "varbinary",
        "timestamp_enum": "varchar",
        "timestamp_set": "varchar",
        "timestamp_tinyblob": "text",
        "timestamp_mediumblob": "text",
        "timestamp_longblob": "longtext",
        "timestamp_blob": "text",
        "timestamp_tinytext": "text",
        "timestamp_mediumtext": "text",
        "timestamp_longtext": "longtext",
        "timestamp_text": "text",
        "timestamp_varbinary": "varbinary",
        "timestamp_binary": "binary",
        "timestamp_char": "binary",
        "timestamp_geometry": "varbinary",
        "bigint_mediumint": "bigint",
        "bigint_date": "varchar",
        "bigint_time": "varchar",
        "bigint_datetime": "varchar",
        "bigint_year": "bigint",
        "bigint_varchar": "varchar",
        "bigint_bit": "decimal",
        "bigint_json": "varbinary",
        "bigint_enum": "varchar",
        "bigint_set": "varchar",
        "bigint_tinyblob": "text",
        "bigint_mediumblob": "text",
        "bigint_longblob": "longtext",
        "bigint_blob": "text",
        "bigint_tinytext": "text",
        "bigint_mediumtext": "text",
        "bigint_longtext": "longtext",
        "bigint_text": "text",
        "bigint_varbinary": "varbinary",
        "bigint_binary": "binary",
        "bigint_char": "binary",
        "bigint_geometry": "varbinary",
        "mediumint_date": "varchar",
        "mediumint_time": "varchar",
        "mediumint_datetime": "varchar",
        "mediumint_year": "mediumint",
        "mediumint_varchar": "varchar",
        "mediumint_bit": "decimal",
        "mediumint_json": "varbinary",
        "mediumint_enum": "varchar",
        "mediumint_set": "varchar",
        "mediumint_tinyblob": "text",
        "mediumint_mediumblob": "text",
        "mediumint_longblob": "longtext",
        "mediumint_blob": "text",
        "mediumint_tinytext": "text",
        "mediumint_mediumtext": "text",
        "mediumint_longtext": "longtext",
        "mediumint_text": "text",
        "mediumint_varbinary": "varbinary",
        "mediumint_binary": "binary",
        "mediumint_char": "binary",
        "mediumint_geometry": "varbinary",
        "date_time": "datetime",
        "date_datetime": "datetime",
        "date_year": "varchar",
        "date_varchar": "varchar",
        "date_bit": "varbinary",
        "date_json": "varbinary",
        "date_enum": "varchar",
        "date_set": "varchar",
        "date_tinyblob": "text",
        "date_mediumblob": "text",
        "date_longblob": "longtext",
        "date_blob": "text",
        "date_tinytext": "text",
        "date_mediumtext": "text",
        "date_longtext": "longtext",
        "date_text": "text",
        "date_varbinary": "varbinary",
        "date_binary": "binary",
        "date_char": "binary",
        "date_geometry": "varbinary",
        "time_datetime": "datetime",
        "time_year": "varchar",
        "time_varchar": "varchar",
        "time_bit": "varbinary",
        "time_json": "varbinary",
        "time_enum": "varchar",
        "time_set": "varchar",
        "time_tinyblob": "text",
        "time_mediumblob": "text",
        "time_longblob": "longtext",
        "time_blob": "text",
        "time_tinytext": "text",
        "time_mediumtext": "text",
        "time_longtext": "longtext",
        "time_text": "text",
        "time_varbinary": "varbinary",
        "time_binary": "binary",
        "time_char": "binary",
        "time_geometry": "varbinary",
        "datetime_year": "varchar",
        "datetime_varchar": "varchar",
        "datetime_bit": "varbinary",
        "datetime_json": "varbinary",
        "datetime_enum": "varchar",
        "datetime_set": "varchar",
        "datetime_tinyblob": "text",
        "datetime_mediumblob": "text",
        "datetime_longblob": "longtext",
        "datetime_blob": "text",
        "datetime_tinytext": "text",
        "datetime_mediumtext": "text",
        "datetime_longtext": "longtext",
        "datetime_text": "text",
        "datetime_varbinary": "varbinary",
        "datetime_binary": "binary",
        "datetime_char": "binary",
        "datetime_geometry": "varbinary",
        "year_varchar": "varchar",
        "year_bit": "bigint",
        "year_json": "varbinary",
        "year_enum": "varchar",
        "year_set": "varchar",
        "year_tinyblob": "text",
        "year_mediumblob": "text",
        "year_longblob": "longtext",
        "year_blob": "text",
        "year_tinytext": "text",
        "year_mediumtext": "text",
        "year_longtext": "longtext",
        "year_text": "text",
        "year_varbinary": "varbinary",
        "year_binary": "binary",
        "year_char": "binary",
        "year_geometry": "varbinary",
        "varchar_bit": "varbinary",
        "varchar_json": "varbinary",
        "varchar_enum": "varchar",
        "varchar_set": "varchar",
        "varchar_tinyblob": "text",
        "varchar_mediumblob": "text",
        "varchar_longblob": "longtext",
        "varchar_blob": "text",
        "varchar_tinytext": "text",
        "varchar_mediumtext": "text",
        "varchar_longtext": "longtext",
        "varchar_text": "text",
        "varchar_varbinary": "varbinary",
        "varchar_binary": "varbinary",
        "varchar_char": "varchar",
        "varchar_geometry": "varbinary",
        "bit_json": "varbinary",
        "bit_enum": "varbinary",
        "bit_set": "varbinary",
        "bit_tinyblob": "text",
        "bit_mediumblob": "text",
        "bit_longblob": "longtext",
        "bit_blob": "text",
        "bit_tinytext": "tinytext",
        "bit_mediumtext": "mediumtext",
        "bit_longtext": "longtext",
        "bit_text": "text",
        "bit_varbinary": "varbinary",
        "bit_binary": "binary",
        "bit_char": "binary",
        "bit_geometry": "varbinary",
        "json_enum": "varbinary",
        "json_set": "varbinary",
        "json_tinyblob": "longtext",
        "json_mediumblob": "longtext",
        "json_longblob": "longtext",
        "json_blob": "longtext",
        "json_tinytext": "longtext",
        "json_mediumtext": "longtext",
        "json_longtext": "longtext",
        "json_text": "longtext",
        "json_varbinary": "varbinary",
        "json_binary": "varbinary",
        "json_char": "varbinary",
        "json_geometry": "varbinary",
        "enum_set": "varchar",
        "enum_tinyblob": "text",
        "enum_mediumblob": "text",
        "enum_longblob": "longtext",
        "enum_blob": "text",
        "enum_tinytext": "text",
        "enum_mediumtext": "text",
        "enum_longtext": "longtext",
        "enum_text": "text",
        "enum_varbinary": "varbinary",
        "enum_binary": "binary",
        "enum_char": "binary",
        "enum_geometry": "varbinary",
        "set_tinyblob": "text",
        "set_mediumblob": "text",
        "set_longblob": "longtext",
        "set_blob": "text",
        "set_tinytext": "text",
        "set_mediumtext": "text",
        "set_longtext": "longtext",
        "set_text": "text",
        "set_varbinary": "varbinary",
        "set_binary": "binary",
        "set_char": "binary",
        "set_geometry": "varbinary",
        "tinyblob_mediumblob": "text",
        "tinyblob_longblob": "longtext",
        "tinyblob_blob": "text",
        "tinyblob_tinytext": "tinytext",
        "tinyblob_mediumtext": "mediumtext",
        "tinyblob_longtext": "longtext",
        "tinyblob_text": "text",
        "tinyblob_varbinary": "text",
        "tinyblob_binary": "text",
        "tinyblob_char": "text",
        "tinyblob_geometry": "longtext",
        "mediumblob_longblob": "longtext",
        "mediumblob_blob": "text",
        "mediumblob_tinytext": "text",
        "mediumblob_mediumtext": "mediumtext",
        "mediumblob_longtext": "longtext",
        "mediumblob_text": "text",
        "mediumblob_varbinary": "text",
        "mediumblob_binary": "text",
        "mediumblob_char": "text",
        "mediumblob_geometry": "longtext",
        "longblob_blob": "longtext",
        "longblob_tinytext": "longtext",
        "longblob_mediumtext": "longtext",
        "longblob_longtext": "longtext",
        "longblob_text": "longtext",
        "longblob_varbinary": "longtext",
        "longblob_binary": "longtext",
        "longblob_char": "longtext",
        "longblob_geometry": "longtext",
        "blob_tinytext": "text",
        "blob_mediumtext": "mediumtext",
        "blob_longtext": "longtext",
        "blob_text": "text",
        "blob_varbinary": "text",
        "blob_binary": "text",
        "blob_char": "text",
        "blob_geometry": "longtext",
        "tinytext_mediumtext": "text",
        "tinytext_longtext": "longtext",
        "tinytext_text": "text",
        "tinytext_varbinary": "tinytext",
        "tinytext_binary": "tinytext",
        "tinytext_char": "text",
        "tinytext_geometry": "longtext",
        "mediumtext_longtext": "longtext",
        "mediumtext_text": "text",
        "mediumtext_varbinary": "mediumtext",
        "mediumtext_binary": "mediumtext",
        "mediumtext_char": "text",
        "mediumtext_geometry": "longtext",
        "longtext_text": "longtext",
        "longtext_varbinary": "longtext",
        "longtext_binary": "longtext",
        "longtext_char": "longtext",
        "longtext_geometry": "longtext",
        "text_varbinary": "text",
        "text_binary": "text",
        "text_char": "text",
        "text_geometry": "longtext",
        "varbinary_binary": "varbinary",
        "varbinary_char": "varbinary",
        "varbinary_geometry": "varbinary",
        "binary_char": "binary",
        "binary_geometry": "varbinary",
        "char_geometry": "varbinary"
    }

    if (type1 == type2) return type1;
    //@ts-ignore
    //ex. tinyint_smallint or smallint_tinyint
    return typeMapping[type1 + "_" + type2] || typeMapping[type2 + "_" + type1];
}

export function analiseQuerySpecification(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[], fromColumns: ColumnDef[], namedParameters: string[]): TypeInferenceResult {

    const context: InferenceContext = {
        dbSchema,
        withSchema,
        fromColumns,
        parameters: [],
        constraints: [],
    }

    const queryTypes = walkQuerySpecification(context, querySpec);
    const paramIndexes = getParameterIndexes(namedParameters.slice(0, context.parameters.length)); //for [a, a, b, a] will return a: [0, 1, 3]; b: [2]
    paramIndexes.forEach(paramIndex => {
        getPairWise(paramIndex.indexes, (cur, next) => { //for [0, 1, 3] will return [0, 1], [1, 3]
            context.constraints.push({
                expression: paramIndex.paramName,
                type1: context.parameters[cur],
                type2: context.parameters[next]
            })
        });
    })
    // console.log("namedNodes");
    // console.dir(namedNodes, { depth: null });
    // console.log("constraints2=");
    // console.dir(constraints, { depth: null });

    const substitutions: SubstitutionHash = {}
    unify(context.constraints, substitutions);

    const parameters = context.parameters.map(param => getVarType(substitutions, param));
    const columnTypes = queryTypes.types.map(param => getVarType(substitutions, param));



    const querySpecResult: TypeInferenceResult = {
        parameters: parameters,
        columns: columnTypes
    }
    return querySpecResult;
}

export function generateTypeInfo(namedNodes: TypeVar[], constraints: Constraint[]): InferType[] {

    const substitutions: SubstitutionHash = {}
    unify(constraints, substitutions);

    const parameters = namedNodes.map(param => getVarType(substitutions, param));
    return parameters;
}

function getVarType(substitutions: SubstitutionHash, typeVar: Type) {
    if (typeVar.kind == 'TypeVar') {
        const type = substitutions[typeVar.id];
        if (!type) {
            return typeVar.type as MySqlType;
        }
        const resultType = typeVar.list ? type.type + '[]' : type.type;
        return resultType as MySqlType;
    }
    return '?'

}


export function walkQuerySpecification(context: InferenceContext, querySpec: QuerySpecificationContext): TypeOperator {

    const listType: TypeVar[] = [];

    const fromClause = querySpec.fromClause();
    if (fromClause) {
        const subqueryColumns = getColumnsFrom(querySpec, context.dbSchema, context.withSchema);
        const newContext: InferenceContext = {
            ...context,
            fromColumns: subqueryColumns
        }
        walkFromClause(newContext, fromClause);
    }

    if (querySpec.selectItemList().MULT_OPERATOR()) {

        context.fromColumns.forEach(col => {
            const colType = freshVar(col.columnName, col.columnType);
            listType.push(colType);
        })
    }

    querySpec.selectItemList().selectItem().forEach(selectItem => {
        const tableWild = selectItem.tableWild(); //ex. t1.*
        if (tableWild) {
            tableWild.identifier().forEach(tabWild => {
                if (tableWild.MULT_OPERATOR()) {
                    const prefix = tabWild.text;
                    const columns = selectAllColumns(prefix, context.fromColumns);
                    columns.forEach(col => {
                        const colType = freshVar(col.columnName, col.columnType);
                        listType.push(colType);
                    })
                }
            });
        }
        else {
            const expr = selectItem.expr();
            if (expr) {
                const exprType = walkExpr(context, expr);
                if (exprType.kind == 'TypeOperator') {
                    const subqueryType = exprType.types[0] as TypeVar;
                    listType.push(subqueryType);
                }
                else {
                    listType.push(exprType);
                    const subQueryContext = getParentContext(expr, SubqueryContext);
                    const alias = selectItem.selectAlias()?.identifier()?.text || undefined;
                    if (alias && !subQueryContext) {
                        //IF NOT A SUBQUERY THIS ALIAS CAN BE USED IN THE HAVING CLAUSE
                        context.constraints.push({
                            expression: expr.text,
                            mostGeneralType: true,
                            aliasConstraint: true,
                            type1: exprType,
                            type2: freshVar(alias, exprType.type)
                        })
                    }
                }
            }
        }
    })

    const whereClause = querySpec.whereClause();
    //TODO - HAVING, BLAH
    if (whereClause) {
        const whereExpr = whereClause?.expr();
        walkExpr(context, whereExpr);
    }

    const havingClause = querySpec.havingClause();
    if (havingClause) {
        context.havingExpr = true;
        walkHavingClause(havingClause, context);
        context.havingExpr = false;
    }

    const typeOperator: TypeOperator = {
        kind: 'TypeOperator',
        selectItem: true,
        types: listType
    }

    return typeOperator;
}

function walkFromClause(context: InferenceContext, fromClause: FromClauseContext) {
    const tableReferences = fromClause.tableReferenceList()?.tableReference();
    tableReferences?.forEach(tabeRef => {
        tabeRef.joinedTable().forEach(joinedTable => {
            const onExpr = joinedTable.expr();
            if (onExpr) {
                walkExpr(context, onExpr);
            }
        })
    })
}

function walkHavingClause(havingClause: HavingClauseContext, context: InferenceContext) {
    const havingExpr = havingClause.expr();
    walkExpr(context, havingExpr);
}

function walkExpr(context: InferenceContext, expr: ExprContext): Type {

    if (expr instanceof ExprIsContext) {
        const boolPri = expr.boolPri();
        const boolPriType = walkBoolPri(context, boolPri);
        return boolPriType;
    }
    if (expr instanceof ExprNotContext) {
        return freshVar(expr.text, 'tinyint');;
    }
    if (expr instanceof ExprAndContext || expr instanceof ExprXorContext || expr instanceof ExprOrContext) {
        const exprLeft = expr.expr()[0];
        walkExpr(context, exprLeft);
        const exprRight = expr.expr()[1];
        walkExpr(context, exprRight);
        return freshVar(expr.text, 'tinyint');
    }
    throw Error('invalid type');

}

function walkBoolPri(context: InferenceContext, boolPri: BoolPriContext): Type {

    if (boolPri instanceof PrimaryExprPredicateContext) {
        const predicate = boolPri.predicate();
        const predicateType = walkPredicate(context, predicate);
        return predicateType;
    }
    if (boolPri instanceof PrimaryExprIsNullContext) {
        const boolPri2 = boolPri.boolPri();
        walkBoolPri(context, boolPri2);
        return freshVar(boolPri.text, '?');
    }

    if (boolPri instanceof PrimaryExprCompareContext) {

        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.predicate();
        const typeLeft = walkBoolPri(context, compareLeft);
        const typeRight = walkPredicate(context, compareRight);

        context.constraints.push({
            expression: boolPri.text,
            type1: typeLeft,
            type2: typeRight
        })
        return freshVar(boolPri.text, 'tinyint');
    }

    if (boolPri instanceof PrimaryExprAllAnyContext) {
        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.subquery();
        const typeLeft = walkBoolPri(context, compareLeft);
        const typeRight = walkSubquery(context, compareRight);
        context.constraints.push({
            expression: boolPri.text,
            type1: typeLeft,
            type2: typeRight
        })
        return freshVar(boolPri.text, 'tinyint');
    }
    throw Error('invalid sql');

}

function walkPredicate(context: InferenceContext, predicate: PredicateContext): Type {

    const bitExpr = predicate.bitExpr()[0];
    const bitExprType = walkBitExpr(context, bitExpr);

    const predicateOperations = predicate.predicateOperations();
    if (predicateOperations) {
        const rightType = walkpredicateOperations(context, bitExprType, predicateOperations);
        context.constraints.push({
            expression: predicateOperations.text,
            type1: bitExprType, // ? array of id+id
            type2: rightType,
            mostGeneralType: true
        })
        return rightType;

    }
    // return freshVar(predicateOperations.text, 'tinyint');
    return bitExprType;
}

function walkpredicateOperations(context: InferenceContext, parentType: Type, predicateOperations: PredicateOperationsContext): Type {
    if (predicateOperations instanceof PredicateExprInContext) {

        const subquery = predicateOperations.subquery();
        if (subquery) {
            const rightType = walkSubquery(context, subquery);
            return rightType;
        }
        const exprList = predicateOperations.exprList();
        if (exprList) {
            const rightType = walkExprList(context, exprList);
            return rightType;
        }

    }

    if (predicateOperations instanceof PredicateExprLikeContext) {
        const simpleExpr = predicateOperations.simpleExpr()[0];
        const rightType = walkSimpleExpr(context, simpleExpr);
        context.constraints.push({
            expression: simpleExpr.text,
            type1: parentType,
            type2: rightType
        })
        return rightType;

    }
    throw Error("Not expected");

}

function walkExprList(context: InferenceContext, exprList: ExprListContext): Type {

    const listType = exprList.expr().map(item => {
        const exprType = walkExpr(context, item);
        return exprType;

    })
    const type: TypeOperator = {
        kind: 'TypeOperator',
        types: listType
    }
    return type;
}

function walkBitExpr(context: InferenceContext, bitExpr: BitExprContext): Type {
    const simpleExpr = bitExpr.simpleExpr();
    if (simpleExpr) {
        return walkSimpleExpr(context, simpleExpr);
    }

    if (bitExpr.bitExpr().length == 2) {

        const bitExprType = freshVar(bitExpr.text, 'number');

        const bitExprLeft = bitExpr.bitExpr()[0];
        const typeLeftTemp = walkBitExpr(context, bitExprLeft);
        const typeLeft = typeLeftTemp.kind == 'TypeOperator' ? typeLeftTemp.types[0] as TypeVar : typeLeftTemp;
        //const newTypeLeft = typeLeft.name == '?'? freshVar('?', 'bigint') : typeLeft;

        const bitExprRight = bitExpr.bitExpr()[1]
        const typeRightTemp = walkBitExpr(context, bitExprRight);

        //In the expression 'id + (value + 2) + ?' the '(value+2)' is treated as a SimpleExprListContext and return a TypeOperator
        const typeRight = typeRightTemp.kind == 'TypeOperator' ? typeRightTemp.types[0] as TypeVar : typeRightTemp;
        //const newTypeRight = typeRight.name == '?'? freshVar('?', 'bigint') : typeRight;

        context.constraints.push({
            expression: bitExpr.text,
            type1: typeLeft,
            type2: typeRight,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        context.constraints.push({
            expression: bitExpr.text,
            type1: bitExprType,
            type2: typeLeft,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        context.constraints.push({
            expression: bitExpr.text,
            type1: bitExprType,
            type2: typeRight,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        return bitExprType;
    }

    if (bitExpr.INTERVAL_SYMBOL()) {
        const bitExpr2 = bitExpr.bitExpr()[0];
        const leftType = walkBitExpr(context, bitExpr2);
        const expr = bitExpr.expr()!; //expr interval
        walkExpr(context, expr);
        context.constraints.push({
            expression: bitExpr.text,
            type1: leftType,
            type2: freshVar('datetime', 'datetime')
        })
        return freshVar('datetime', 'datetime');

    }
    throw Error('Invalid sql');
}

function walkSimpleExpr(context: InferenceContext, simpleExpr: SimpleExprContext): Type {
    if (simpleExpr instanceof SimpleExprColumnRefContext) {
        const fieldName = splitName(simpleExpr.text);
        if (context.havingExpr) {
            let foundType: TypeVar | null = null;
            context.constraints.forEach(p => {
                if (p.type1.kind == 'TypeVar' && p.aliasConstraint && p.type1.name == simpleExpr.text) {
                    foundType = p.type1;
                }
                if (p.type2.kind == 'TypeVar' && p.aliasConstraint && p.type2.name == simpleExpr.text) {
                    foundType = p.type2;
                }
            })
            if (foundType) {
                return foundType;
            }
            const type = freshVar(simpleExpr.text, '?');
            return type;
        } else {

            const columnType = findColumn(fieldName, context.fromColumns).columnType;
            const type = freshVar(simpleExpr.text, columnType);
            return type;
        }
    }

    if (simpleExpr instanceof SimpleExprRuntimeFunctionContext) {
        const runtimeFunctionCall = simpleExpr.runtimeFunctionCall();
        if (runtimeFunctionCall.NOW_SYMBOL()) {
            return freshVar(simpleExpr.text, 'datetime');
        }
        if (runtimeFunctionCall.CURDATE_SYMBOL()) {
            return freshVar(simpleExpr.text, 'date');
        }
        if (runtimeFunctionCall.CURTIME_SYMBOL()) {
            return freshVar(simpleExpr.text, 'time');
        }
        if (runtimeFunctionCall.REPLACE_SYMBOL()) {
            const exprList = runtimeFunctionCall.expr();
            exprList.forEach(expr => {
                const exprType = walkExpr(context, expr);
                context.constraints.push({
                    expression: expr.text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
            })
            return freshVar('varchar', 'varchar');
        }
        if (runtimeFunctionCall.YEAR_SYMBOL() || runtimeFunctionCall.MONTH_SYMBOL() || runtimeFunctionCall.DAY_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if (expr) {
                const paramType = walkExpr(context, expr);
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime'
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date'
                }
                context.constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'date')
                })
            }
            const returnType = runtimeFunctionCall.YEAR_SYMBOL() ? 'year' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        if (runtimeFunctionCall.HOUR_SYMBOL() || runtimeFunctionCall.MINUTE_SYMBOL() || runtimeFunctionCall.SECOND_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if (expr) {
                const paramType = walkExpr(context, expr);
                if (paramType.kind == 'TypeVar' && isTimeLiteral(paramType.name)) {
                    paramType.type = 'time';
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date';
                }
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime';
                }

                context.constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'time')
                })
            }
            //HOUR can return values greater than 23. Ex.: SELECT HOUR('272:59:59');
            //https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html#function_hour
            const returnType = runtimeFunctionCall.HOUR_SYMBOL() ? 'int' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        const trimFunction = runtimeFunctionCall.trimFunction();
        if (trimFunction) {
            const exprList = trimFunction.expr();
            if (exprList.length == 1) {
                const exprType = walkExpr(context, exprList[0]);
                context.constraints.push({
                    expression: exprList[0].text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
            }
            if (exprList.length == 2) {
                const exprType = walkExpr(context, exprList[0]);
                const expr2Type = walkExpr(context, exprList[1]);
                context.constraints.push({
                    expression: exprList[0].text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
                context.constraints.push({
                    expression: exprList[1].text,
                    type1: expr2Type,
                    type2: freshVar('varchar', 'varchar')
                })
            }
            return freshVar('varchar', 'varchar');
        }
        const substringFunction = runtimeFunctionCall.substringFunction();
        if (substringFunction) {
            const exprList = substringFunction.expr();
            const varcharParam = freshVar('varchar', 'varchar');
            const intParam = freshVar('int', 'int');
            const params: FunctionParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, intParam, intParam]
            }
            walkExprListParameters(context, exprList, params);
            return varcharParam;
        }

        if (runtimeFunctionCall.ADDDATE_SYMBOL()
            || runtimeFunctionCall.DATE_ADD_SYMBOL()
            || runtimeFunctionCall.SUBDATE_SYMBOL()
            || runtimeFunctionCall.DATE_SUB_SYMBOL()) {

            //SELECT ADDDATE('2008-01-02', INTERVAL 31 DAY)
            //SELECT ADDDATE('2008-01-02', 31)
            const expr1 = runtimeFunctionCall.expr()[0];
            const expr2 = runtimeFunctionCall.expr()[1];
            const typeExpr1 = walkExpr(context, expr1);
            const typeExpr2 = walkExpr(context, expr2);

            if (typeExpr1.kind == 'TypeVar' && (isDateLiteral(typeExpr1.name) || isDateTimeLiteral(typeExpr1.name))) {
                typeExpr1.type = 'datetime';
            }

            context.constraints.push({
                expression: expr1.text,
                type1: typeExpr1,
                type2: freshVar('datetime', 'datetime')
            })

            context.constraints.push({
                expression: expr2.text,
                type1: typeExpr2,
                type2: freshVar('bigint', 'bigint')
            })

            return freshVar('datetime', 'datetime');
        }

        if (runtimeFunctionCall.COALESCE_SYMBOL()) {
            const exprList = runtimeFunctionCall.exprListWithParentheses()?.exprList().expr();
            if (exprList) {
                const paramType = freshVar('?', '?');
                const params: FunctionParams = {
                    kind: 'VariableLengthParams',
                    paramType: 'any'
                }
                const paramsTypeList = walkExprListParameters(context, exprList, params);
                paramsTypeList.forEach((typeVar, paramIndex) => {
                    context.constraints.push({
                        expression: runtimeFunctionCall.text + '_param' + (paramIndex + 1),
                        type1: paramType,
                        type2: typeVar,
                        mostGeneralType: true,
                        coercionType: 'Coalesce'
                    })
                })
                return paramType;
            }
        }
        //MOD (number, number): number
        if (runtimeFunctionCall.MOD_SYMBOL()) {
            const functionType = freshVar('number', 'number');
            const exprList = runtimeFunctionCall.expr();
            const param1 = walkExpr(context, exprList[0]);
            const param2 = walkExpr(context, exprList[1]);
            context.constraints.push({
                expression: simpleExpr.text,
                type1: freshVar('number', 'number'),
                type2: param1,
                mostGeneralType: true
            })
            context.constraints.push({
                expression: simpleExpr.text,
                type1: freshVar('number', 'number'),
                type2: param2,
                mostGeneralType: true
            })
            context.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: param1,
                mostGeneralType: true
            })
            context.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: param2,
                mostGeneralType: true
            })
            return functionType;
        }
        if (runtimeFunctionCall.IF_SYMBOL()) {
            const exprList = runtimeFunctionCall.expr();
            const expr1 = exprList[0];
            const expr2 = exprList[1];
            const expr3 = exprList[2];
            walkExpr(context, expr1);
            const expr2Type = walkExpr(context, expr2);
            const expr3Type = walkExpr(context, expr3);
            context.constraints.push({
                expression: runtimeFunctionCall.text,
                type1: expr2Type,
                type2: expr3Type,
                mostGeneralType: true
            })
            return expr2Type;
        }
        throw Error('Function not supported: ' + runtimeFunctionCall.text);
    }

    if (simpleExpr instanceof SimpleExprFunctionContext) {
        const functionIdentifier = getFunctionName(simpleExpr);

        if (functionIdentifier === 'concat_ws' || functionIdentifier?.toLowerCase() === 'concat') {
            const varcharType = freshVar(simpleExpr.text, 'varchar');
            const params: VariableLengthParams = {
                kind: 'VariableLengthParams',
                paramType: '?'
            }
            walkFunctionParameters(context, simpleExpr, params);
            return varcharType;
        }

        if (functionIdentifier === 'avg') {
            const functionType = freshVar(simpleExpr.text, '?');
            context.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: freshVar('decimal', 'decimal'),
                mostGeneralType: true
            })
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return functionType;
        }

        if (functionIdentifier === 'round') {
            const functionType = freshVar(simpleExpr.text, '?');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            const paramsType = walkFunctionParameters(context, simpleExpr, params);
            //The return value has the same type as the first argument
            context.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: paramsType[0], //type of the first parameter
                mostGeneralType: true
            })
            return functionType;
        }

        if (functionIdentifier === 'floor') {
            const doubleParam = freshVar('double', 'double');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [doubleParam, doubleParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return freshVar(simpleExpr.text, 'bigint');
        }

        if (functionIdentifier === 'str_to_date') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return freshVar(simpleExpr.text, 'date');
        }

        if (functionIdentifier === 'datediff') {
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                udfExprList.forEach((inExpr) => {
                    const expr = inExpr.expr();
                    const exprType = walkExpr(context, expr);
                    const newType = verifyDateTypesCoercion(exprType);

                    context.constraints.push({
                        expression: expr.text,
                        type1: newType,
                        type2: freshVar('date', 'date'),
                        mostGeneralType: true
                    })
                })
            }
            return freshVar(simpleExpr.text, 'bigint');
        }
        if (functionIdentifier === 'lpad' || functionIdentifier == 'rpad') {
            const varcharParam = freshVar('varchar', 'varchar');
            const intParam = freshVar('int', 'int');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, intParam, varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return varcharParam;
        }

        if (functionIdentifier === 'lower'
            || functionIdentifier === 'lcase'
            || functionIdentifier === 'upper'
            || functionIdentifier === 'ucase'
            || functionIdentifier === 'ltrim'
            || functionIdentifier === 'rtrim') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return varcharParam;
        }

        if (functionIdentifier === 'length' || functionIdentifier == 'char_length') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return freshVar('int', 'int');
        }
        if (functionIdentifier === 'abs') {
            const functionType = freshVar('number', 'number');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            udfExprList?.forEach(expr => {
                const param1 = walkExpr(context, expr.expr());
                context.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: param1,
                    mostGeneralType: true
                })
            })

            return functionType;
        }
        if (functionIdentifier == 'ceiling' || functionIdentifier == 'ceil') {
            const functionType = freshVar('number', 'number');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            udfExprList?.forEach(expr => {
                const param1 = walkExpr(context, expr.expr());
                context.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: param1,
                    mostGeneralType: true,
                    coercionType: 'Ceiling'
                })
            })

            return functionType;
        }
        if (functionIdentifier == 'timestampdiff') {

            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                const [first, ...rest] = udfExprList;
                const unit = first.text.trim().toLowerCase();
                rest.forEach((inExpr, paramIndex) => {
                    const expr = inExpr.expr();
                    const exprType = walkExpr(context, expr);
                    const newType = verifyDateTypesCoercion(exprType);

                    //const expectedType = ['hour', 'minute', 'second'].includes(unit)? 'time' : 'datetime'
                    context.constraints.push({
                        expression: expr.text,
                        type1: newType,
                        type2: freshVar('datetime', 'datetime'),
                        mostGeneralType: true
                    })
                })

            }
            return freshVar('int', 'int');
        }

        if (functionIdentifier == 'ifnull' || functionIdentifier == 'nullif') {
            const functionType = freshVar(simpleExpr.text, '?');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                const [expr1, expr2] = udfExprList;

                walkExpr(context, expr1.expr());

                const expr2Type = walkExpr(context, expr2.expr());
                context.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: expr2Type
                })

            }
            return functionType;
        }

        if (functionIdentifier == 'md5') {
            const functionType = freshVar(simpleExpr.text, 'char');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                const [expr1] = udfExprList;
                walkExpr(context, expr1.expr());
            }
            return functionType;
        }

        throw Error('Function not supported: ' + functionIdentifier);
    }

    if (simpleExpr instanceof SimpleExprParamMarkerContext) {
        const param = freshVar('?', '?');
        context.parameters.push(param);
        return param;
    }

    if (simpleExpr instanceof SimpleExprSumContext) {

        const sumExpr = simpleExpr.sumExpr();
        if (sumExpr.MAX_SYMBOL() || sumExpr.MIN_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                const inSumExprType = walkExpr(context, inSumExpr);
                context.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: inSumExprType,
                    mostGeneralType: true
                })
            }
            return functionType;
        }
        if (sumExpr.COUNT_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, 'bigint');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                walkExpr(context, inSumExpr);
            }
            return functionType;
        }

        if (sumExpr.SUM_SYMBOL() || sumExpr.AVG_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                const inSumExprType = walkExpr(context, inSumExpr);
                context.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: inSumExprType,
                    mostGeneralType: true,
                    coercionType: 'SumFunction'
                })
            }
            return functionType;
        }
        if (sumExpr.GROUP_CONCAT_SYMBOL()) {
            const exprList = sumExpr.exprList();
            if (exprList) {
                exprList.expr().map(item => {
                    const exprType = walkExpr(context, item);
                    return exprType;
                })
                /*
                The result type is TEXT or BLOB unless group_concat_max_len is less than or equal to 512, 
                in which case the result type is VARCHAR or VARBINARY.
                */
                //TODO - Infer TEXT/BLOB or VARCHAR/VARBINARY
                return freshVar(sumExpr.text, 'varchar');;
            }
        }
        throw Error('Expression not supported: ' + sumExpr.text);
    }

    if (simpleExpr instanceof SimpleExprLiteralContext) {
        const literal = simpleExpr.literal();

        if (literal.textLiteral()) {
            const text = literal.textLiteral()?.text.slice(1, -1) || ''; //remove quotes
            return freshVar(text, 'varchar');
        }
        const numLiteral = literal.numLiteral();
        if (numLiteral) {
            return freshVar(numLiteral.text, 'bigint');
            // addNamedNode(simpleExpr, freshVar('bigint', 'bigint'), namedNodes)
            // if(numLiteral.INT_NUMBER()) {
            //     const typeInt = freshVar('int', 'int');
            //     addNamedNode(simpleExpr, typeInt, namedNodes)
            // }
            // if(numLiteral.DECIMAL_NUMBER()) {
            //     const typeDecimal = freshVar('decimal', 'decimal');
            //     addNamedNode(simpleExpr, typeDecimal, namedNodes)
            // }
            // if(numLiteral.FLOAT_NUMBER()) {
            //     const typeFloat = freshVar('float', 'float');
            //     addNamedNode(simpleExpr, typeFloat, namedNodes)
            // }
            ;
        }
        const boolLiteral = literal.boolLiteral();
        if (boolLiteral) {
            return freshVar(boolLiteral.text, 'bit');
        }
        const nullLiteral = literal.nullLiteral();
        if (nullLiteral) {
            return freshVar(nullLiteral.text, '?');
        }
        throw Error('literal not supported:' + literal.text);
        //...
    }

    if (simpleExpr instanceof SimpleExprListContext) {
        const exprList = simpleExpr.exprList();

        const listType = exprList.expr().map(item => {
            const exprType = walkExpr(context, item);
            return exprType;
        })
        const resultType: TypeOperator = {
            kind: 'TypeOperator',
            types: listType
        }
        return resultType;

    }

    if (simpleExpr instanceof SimpleExprSubQueryContext) {
        const subquery = simpleExpr.subquery();
        const subqueryType = walkSubquery(context, subquery);
        return subqueryType;
    }

    if (simpleExpr instanceof SimpleExprCaseContext) {

        //case when expr then expr else expr
        const caseType = freshVar(simpleExpr.text, '?');

        simpleExpr.whenExpression().forEach(whenExprCont => {
            const whenExpr = whenExprCont.expr();
            const whenType = walkExpr(context, whenExpr);

            context.constraints.push({
                expression: whenExpr.text,
                type1: whenType.kind == 'TypeOperator' ? whenType.types[0] : whenType,
                type2: freshVar('tinyint', 'tinyint') //bool
            })
        })

        const thenTypes = simpleExpr.thenExpression().map(thenExprCtx => {
            const thenExpr = thenExprCtx.expr();
            const thenType = walkExpr(context, thenExpr);

            context.constraints.push({
                expression: thenExprCtx.text,
                type1: caseType,
                type2: thenType.kind == 'TypeOperator' ? thenType.types[0] : thenType,
                mostGeneralType: true,
            })
            return thenType;
        })


        const elseExpr = simpleExpr.elseExpression()?.expr();
        if (elseExpr) {
            const elseType = walkExpr(context, elseExpr);

            context.constraints.push({
                expression: simpleExpr.elseExpression()?.text!,
                type1: caseType,
                type2: elseType.kind == 'TypeOperator' ? elseType.types[0] : elseType,
                mostGeneralType: true
            })
            thenTypes.forEach(thenType => {
                context.constraints.push({
                    expression: simpleExpr.elseExpression()?.text!,
                    type1: thenType,
                    type2: elseType.kind == 'TypeOperator' ? elseType.types[0] : elseType,
                    mostGeneralType: true
                })

            })
        }
        return caseType;
    }
    if (simpleExpr instanceof SimpleExprIntervalContext) {
        const exprList = simpleExpr.expr();
        const exprLeft = exprList[0];
        const exprRight = exprList[1];
        const typeLeft = walkExpr(context, exprLeft);
        const typeRight = walkExpr(context, exprRight);
        context.constraints.push({
            expression: exprLeft.text,
            type1: typeLeft,
            type2: freshVar('bigint', 'bigint')
        })
        if (typeRight.kind == 'TypeVar' && (isDateLiteral(typeRight.name) || isDateTimeLiteral(typeRight.name))) {
            typeRight.type = 'datetime';
        }
        context.constraints.push({
            expression: exprRight.text,
            type1: typeRight,
            type2: freshVar('datetime', 'datetime')
        })
        return freshVar('datetime', 'datetime');

    }
    if (simpleExpr instanceof SimpleExprWindowingFunctionContext) {
        const windowFunctionCall = simpleExpr.windowFunctionCall();
        return walkWindowFunctionCall(windowFunctionCall, context);
    }
    if (simpleExpr instanceof SimpleExprCastContext) {
        const castType = simpleExpr.castType();
        if (castType.CHAR_SYMBOL()) {
            return freshVar(castType.text, 'char');
        }
    }
    throw Error('Invalid expression: ' + simpleExpr.text);
}

function walkWindowFunctionCall(windowFunctionCall: WindowFunctionCallContext, context: InferenceContext) {
    if (windowFunctionCall.ROW_NUMBER_SYMBOL()
        || windowFunctionCall.RANK_SYMBOL()
        || windowFunctionCall.DENSE_RANK_SYMBOL()
        || windowFunctionCall.CUME_DIST_SYMBOL()
        || windowFunctionCall.PERCENT_RANK_SYMBOL()) {
        return freshVar(windowFunctionCall.text, 'bigint');
    }
    const expr = windowFunctionCall.expr();
    if (expr) {
        return walkExpr(context, expr);
    }
    const exprWithParentheses = windowFunctionCall.exprWithParentheses();
    if (exprWithParentheses) {
        const expr = exprWithParentheses.expr();
        return walkExpr(context, expr);
    }
    throw Error('No support for expression' + windowFunctionCall.text);
}

function verifyDateTypesCoercion(type: Type) {

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

function isTimeLiteral(literal: string) {
    return moment(literal, 'HH:mm:ss', true).isValid() || moment(literal, 'HH:mm', true).isValid();
}

function isDateTimeLiteral(literal: string) {
    return moment(literal, 'YYYY-MM-DD HH:mm:ss', true).isValid()
}

function isDateLiteral(literal: string) {
    return moment(literal, "YYYY-MM-DD", true).isValid();
}

function getFunctionName(simpleExprFunction: SimpleExprFunctionContext) {
    return simpleExprFunction.functionCall().pureIdentifier()?.text.toLowerCase()
        || simpleExprFunction.functionCall().qualifiedIdentifier()?.text.toLowerCase();
}

type VariableLengthParams = {
    kind: 'VariableLengthParams';
    paramType: InferType;
}

type FixedLengthParams = {
    kind: 'FixedLengthParams';
    paramsType: TypeVar[];
}

type FunctionParams = VariableLengthParams | FixedLengthParams;

function walkExprListParameters(context: InferenceContext, exprList: ExprContext[], params: FunctionParams) {
    return exprList.map((expr, paramIndex) => {
        const exprType = walkExpr(context, expr);
        const paramType = params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType);
        context.constraints.push({
            expression: expr.text,
            type1: exprType,
            type2: paramType,
            mostGeneralType: true
        })
        return paramType;
    })
}

function walkFunctionParameters(context: InferenceContext, simpleExprFunction: SimpleExprFunctionContext, params: FunctionParams) {
    const functionName = getFunctionName(simpleExprFunction);
    const udfExprList = simpleExprFunction.functionCall().udfExprList()?.udfExpr();
    if (udfExprList) {
        const paramTypes = udfExprList
            .filter((undefined, paramIndex) => {
                return functionName == 'timestampdiff' ? paramIndex != 0 : true; //filter the first parameter of timestampdiff function
            })
            .map((inExpr, paramIndex) => {
                const expr = inExpr.expr();
                const exprType = walkExpr(context, expr);
                context.constraints.push({
                    expression: expr.text,
                    type1: exprType,
                    type2: params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType),
                    mostGeneralType: true
                })
                return exprType;
            })
        return paramTypes;
    }
    const exprList = simpleExprFunction.functionCall().exprList()?.expr();
    if (exprList) {
        const paramTypes = exprList.map((inExpr, paramIndex) => {
            const inSumExprType = walkExpr(context, inExpr);
            context.constraints.push({
                expression: inExpr.text,
                type1: params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType),
                type2: inSumExprType,
                mostGeneralType: true
            })
            return inSumExprType;
        })
        return paramTypes;
    }
    throw Error('Error in walkFunctionParameters')
}

export function walkSubquery(context: InferenceContext, queryExpressionParens: SubqueryContext): Type {

    const querySpec = getQuerySpecificationsFromQuery(queryExpressionParens);
    const subqueryColumns = getColumnsFrom(querySpec[0], context.dbSchema, context.withSchema);
    const newContext: InferenceContext = {
        ...context,
        fromColumns: context.fromColumns.concat(subqueryColumns)
    }
    const typeInferResult = walkQuerySpecification(newContext, querySpec[0]) as TypeOperator;

    for (let queryIndex = 1; queryIndex < querySpec.length; queryIndex++) { //union (if have any)
        const unionColumns = getColumnsFrom(querySpec[queryIndex], context.dbSchema, context.withSchema);
        const unionNewContext: InferenceContext = {
            ...context,
            fromColumns: context.fromColumns.concat(unionColumns)
        }
        const unionResult = walkQuerySpecification(unionNewContext, querySpec[queryIndex]);

        typeInferResult.types.forEach((field, fieldIndex) => {
            context.constraints.push({
                expression: querySpec[queryIndex].text,
                type1: typeInferResult.types[fieldIndex],
                type2: unionResult.types[fieldIndex],
                mostGeneralType: true
            })
        })
    }
    //Should retrun the union result type, not the first query from result
    return typeInferResult;

}