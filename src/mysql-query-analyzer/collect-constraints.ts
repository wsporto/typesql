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
    FromClauseContext, SimpleExprIntervalContext } from "ts-mysql-parser";

import { ColumnSchema, ColumnDef, TypeInferenceResult, InsertInfoResult, UpdateInfoResult, DeleteInfoResult } from "./types";
import { getColumnsFrom, findColumn, splitName, selectAllColumns, findColumn2 } from "./select-columns";
import {
    SubstitutionHash, getQuerySpecificationsFromSelectStatement as getQuerySpecificationsFromQuery,
    getQuerySpecificationsFromSelectStatement
} from "./parse";
import { MySqlType, InferType } from "../mysql-mapping";
import { ParameterDef } from "../types";
import { unify } from "./unify";
import { inferParamNullability } from "./infer-param-nullability";
import { verifyNotInferred } from "../describe-query";
import { TerminalNode } from "antlr4ts/tree";

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
    mostGeneralType?: true;
    coercionType?: 'Sum' | 'Irrestrict' | 'SumFunction'
    list?: true;
}

export type InferenceContext = {
    dbSchema: ColumnSchema[];
    parameters: TypeVar[];
    constraints: Constraint[];
    fromColumns: ColumnDef[];
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

export function analiseTree(tree: RuleContext, dbSchema: ColumnSchema[]): TypeInferenceResult {

    if (tree instanceof QueryContext) {

        const selectStatement = tree.simpleStatement()?.selectStatement();
        if (selectStatement) {
            return analiseSelectStatement(selectStatement, dbSchema);
        }
        const insertStatement = tree.simpleStatement()?.insertStatement();
        if (insertStatement) {
            const insertStmt = analiseInsertStatement(insertStatement, dbSchema);
            const TypeInfer: TypeInferenceResult = {
                columns: [],
                parameters: insertStmt.parameters.map(param => param.columnType)
            }
            return TypeInfer;
        }
        const updateStatement = tree.simpleStatement()?.updateStatement();
        if (updateStatement) {
            const updateStmt = analiseUpdateStatement(updateStatement, dbSchema);
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

export function analiseInsertStatement(insertStatement: InsertStatementContext, dbSchema: ColumnSchema[]): InsertInfoResult {

    const valuesContext = insertStatement.insertFromConstructor()!.insertValues().valueList().values()[0];
    const insertColumns = getInsertColumns(insertStatement, dbSchema);
    const allParameters: ParameterDef[] = [];

    const exprOrDefaultList : ExprOrDefault[] = [];
    valuesContext.DEFAULT_SYMBOL().forEach( terminalNode => {
        exprOrDefaultList.push(terminalNode);
    })
    valuesContext.expr().forEach( expr => {
        exprOrDefaultList.push(expr);
    })

    //order the tokens based on sql position
    exprOrDefaultList.sort( (token1, token2) => token1.sourceInterval.a - token2.sourceInterval.a)

    exprOrDefaultList.forEach((expr, index) => {
        const context: InferenceContext = {
            dbSchema,
            constraints: [],
            parameters: [],
            fromColumns: []
        }

        const column = insertColumns[index];

        if(expr instanceof ExprContext) {
            const exprType = walkExpr(context, expr);
            context.constraints.push({
                expression: expr.text,
                type1: freshVar(column.column, column.column_type),
                type2: exprType.kind == 'TypeOperator'? exprType.types[0] : exprType
            })
        }

        const typeInfo = generateTypeInfo(context.parameters, context.constraints);
        typeInfo.forEach(param => {
            allParameters.push({
                name: 'param' + (allParameters.length + 1),
                columnType: verifyNotInferred(param),
                notNull: column.notNull
            })
        })

    })


    const typeInferenceResult: InsertInfoResult = {
        kind: 'Insert',
        parameters: allParameters
    }
    return typeInferenceResult;
}

export function analiseDeleteStatement(deleteStatement: DeleteStatementContext, dbSchema: ColumnSchema[]): DeleteInfoResult {

    const whereExpr = deleteStatement.whereClause()?.expr();
    const deleteColumns = getDeleteColumns(deleteStatement, dbSchema);
    const allParameters: ParameterDef[] = [];

    if (whereExpr) {
        const context: InferenceContext = {
            fromColumns: deleteColumns,
            parameters: [],
            constraints: [],
            dbSchema
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

export function analiseUpdateStatement(updateStatement: UpdateStatementContext, dbSchema: ColumnSchema[]): UpdateInfoResult {

    const updateElement = updateStatement.updateList().updateElement();
    const updateColumns = getUpdateColumns(updateStatement, dbSchema);
    const dataParameters: ParameterDef[] = [];
    const whereParameters: ParameterDef[] = [];

    updateElement.forEach(updateElement => {
        const expr = updateElement.expr();
        if (expr) {
            const context: InferenceContext = {
                dbSchema,
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

export function getInsertColumns(insertStatement: InsertStatementContext, dbSchema: ColumnSchema[]) {
    const insertIntoTable = splitName(insertStatement.tableRef().text).name;

    const fields = insertStatement.insertFromConstructor()?.fields()?.insertIdentifier().map(insertIdentifier => {
        const colRef = insertIdentifier.columnRef();
        if (colRef) {
            const fieldName = splitName(colRef.text);
            const column = findColumn2(fieldName, insertIntoTable, dbSchema);
            return column;

        }
        throw Error('Invalid sql');

    });

    //check insert stmt without fields (only values). Ex.: insert into mytable values()
    if(!fields) {
        return dbSchema.filter( column => column.table == insertIntoTable);
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


function analiseSelectStatement(selectStatement: SelectStatementContext, dbSchema: ColumnSchema[]): TypeInferenceResult {
    const querySpec = getQuerySpecificationsFromSelectStatement(selectStatement);
    const fromColumns = getColumnsFrom(querySpec[0], dbSchema);
    let result = analiseQuerySpecification(querySpec[0], dbSchema, fromColumns);
    for (let index = 1; index < querySpec.length; index++) {
        const unionQuery = querySpec[index];
        const fromColumns2 = getColumnsFrom(unionQuery, dbSchema);
        const result2 = analiseQuerySpecification(unionQuery, dbSchema, fromColumns2);
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
    const typeOrder: InferType[] = ['tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'float', 'double', 'varchar'];
    const indexType1 = typeOrder.indexOf(type1);
    const indexType2 = typeOrder.indexOf(type2);
    const max = Math.max(indexType1, indexType2);
    return typeOrder[max];
}

export function analiseQuerySpecification(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): TypeInferenceResult {

    const context : InferenceContext = {
        dbSchema,
        parameters: [],
        constraints: [],
        fromColumns: fromColumns
    }

    const queryTypes = walkQuerySpecification(context, querySpec) as TypeOperator;
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


function walkQuerySpecification(context: InferenceContext, querySpec: QuerySpecificationContext): TypeOperator {

    const listType: TypeVar[] = [];

    if (querySpec.selectItemList().MULT_OPERATOR()) {

        context.fromColumns.forEach(col => {
            const colType = freshVar(col.columnName, col.columnType);
            listType.push(colType);
        })
    }

    querySpec.selectItemList().selectItem().forEach(selectItem => {
        const tableWild = selectItem.tableWild(); //ex. t1.*
        if (tableWild?.MULT_OPERATOR()) {
            tableWild.identifier().forEach(tabWild => {
                const prefix = tabWild.text;
                const columns = selectAllColumns(prefix, context.fromColumns);
                columns.forEach(col => {
                    const colType = freshVar(col.columnName, col.columnType);
                    listType.push(colType);
                })
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
                }

            }
        }

    })
    const typeOperator: TypeOperator = {
        kind: 'TypeOperator',
        selectItem: true,
        types: listType
    }

    const fromClause = querySpec.fromClause();
    if(fromClause) {
        walkFromClause(context, fromClause);
    }

    const whereClause = querySpec.whereClause();
    //TODO - HAVING, BLAH
    if (whereClause) {
        const whereExpr = whereClause?.expr();
        walkExpr(context, whereExpr);
    }
    return typeOperator;
}

function walkFromClause(context: InferenceContext, fromClause: FromClauseContext) {
    const tableReferences = fromClause.tableReferenceList()?.tableReference();
    tableReferences?.forEach(tabeRef => {
        tabeRef.joinedTable().forEach( joinedTable => {
            const onExpr = joinedTable.expr();
            if(onExpr) {
                walkExpr(context, onExpr);
            }
        })
    })
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

    if(boolPri instanceof PrimaryExprAllAnyContext) {
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

function walkExprList(context:InferenceContext, exprList: ExprListContext): Type {

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
        const columnType = findColumn(fieldName, context.fromColumns).columnType;
        const type = freshVar(simpleExpr.text, columnType);
        return type;
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
        if (runtimeFunctionCall.YEAR_SYMBOL() || runtimeFunctionCall.MONTH_SYMBOL() || runtimeFunctionCall.DAY_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if(expr) {
                const paramType = walkExpr(context, expr);
                if(paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime'
                }
                if(paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date'
                }
                context.constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'date')
                })
            }
            const returnType = runtimeFunctionCall.YEAR_SYMBOL()? 'year' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        if(runtimeFunctionCall.HOUR_SYMBOL() || runtimeFunctionCall.MINUTE_SYMBOL() || runtimeFunctionCall.SECOND_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if(expr) {
                const paramType = walkExpr(context, expr);
                if(paramType.kind == 'TypeVar' && isTimeLiteral(paramType.name)) {
                    paramType.type = 'time';
                }
                if(paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date';
                }
                if(paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
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
            const returnType = runtimeFunctionCall.HOUR_SYMBOL()? 'int' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        const trimFunction = runtimeFunctionCall.trimFunction();
        if(trimFunction) {
            const exprList = trimFunction.expr();
                if(exprList.length == 1) {
                    const exprType = walkExpr(context, exprList[0]);
                    context.constraints.push({
                        expression: exprList[0].text,
                        type1: exprType,
                        type2: freshVar('varchar', 'varchar')
                    })
                }
                if(exprList.length == 2) {
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
        if(substringFunction) {
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

        if(runtimeFunctionCall.ADDDATE_SYMBOL()) {

            //SELECT ADDDATE('2008-01-02', INTERVAL 31 DAY)
            //SELECT ADDDATE('2008-01-02', 31)
            const expr1 = runtimeFunctionCall.expr()[0];
            const expr2 = runtimeFunctionCall.expr()[1];
            const typeExpr1 = walkExpr(context, expr1);
            const typeExpr2 = walkExpr(context, expr2);

            if(typeExpr1.kind == 'TypeVar' && (isDateLiteral(typeExpr1.name) || isDateTimeLiteral(typeExpr1.name))) {
                typeExpr1.type = 'datetime';
            }
            
            context.constraints.push( {
                expression: expr1.text,
                type1: typeExpr1,
                type2: freshVar('datetime', 'datetime')
            })

            context.constraints.push( {
                expression: expr2.text,
                type1: typeExpr2,
                type2: freshVar('bigint', 'bigint')
            })

            return freshVar('datetime', 'datetime');
        }

        if(runtimeFunctionCall.COALESCE_SYMBOL()) {
            const exprList = runtimeFunctionCall.exprListWithParentheses()?.exprList().expr();
            if(exprList) {
                const paramType = freshVar('?', '?');
                const params: FunctionParams = {
                    kind: 'VariableLengthParams',
                    paramType: 'any'
                }
                const paramsTypeList = walkExprListParameters(context, exprList, params);
                paramsTypeList.forEach( (typeVar, paramIndex) => {
                    context.constraints.push({
                        expression: runtimeFunctionCall.text + '_param' + (paramIndex+1),
                        type1: paramType,
                        type2: typeVar,
                        mostGeneralType: true,
                        coercionType: 'Irrestrict'
                    })
                })
                return paramType;
            }
            
        }
        throw Error('Function not supported: ' + runtimeFunctionCall.text);
    }

    if (simpleExpr instanceof SimpleExprFunctionContext) {
        const functionIdentifier = getFunctionName(simpleExpr);

        if (functionIdentifier === 'concat_ws' || functionIdentifier?.toLowerCase() === 'concat') {
            const varcharType = freshVar(simpleExpr.text, 'varchar');
            const params : VariableLengthParams = {
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
            const params : FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return functionType;
        }

        if (functionIdentifier === 'round') {
            const functionType = freshVar(simpleExpr.text, '?');
            const params : FixedLengthParams = {
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
            const params : FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [doubleParam, doubleParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return freshVar(simpleExpr.text, 'bigint');
        }

        if (functionIdentifier === 'str_to_date') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params : FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return freshVar(simpleExpr.text, 'date');
        }

        if (functionIdentifier === 'datediff') {
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if(udfExprList) {
                udfExprList.forEach( (inExpr) => {
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
            const params : FixedLengthParams = {
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
            const params : FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return varcharParam;
        }

        if (functionIdentifier === 'length') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params : FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(context, simpleExpr, params);
            return freshVar('int', 'int');
        }
        if(functionIdentifier == 'timestampdiff') {
           
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if(udfExprList) {
                const [first, ...rest] = udfExprList;
                const unit = first.text.trim().toLowerCase();
                rest.forEach( (inExpr, paramIndex) => {
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

        throw Error('Function not supported: ' + functionIdentifier);
    }

    if (simpleExpr instanceof SimpleExprParamMarkerContext) {
        const param = freshVar('?', '?');
        context.parameters.push(param);
        return param;
    }

    if (simpleExpr instanceof SimpleExprSumContext) {

        if (simpleExpr.sumExpr().MAX_SYMBOL() || simpleExpr.sumExpr().MIN_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = simpleExpr.sumExpr().inSumExpr()?.expr();
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
        if (simpleExpr.sumExpr().COUNT_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, 'bigint');
            const inSumExpr = simpleExpr.sumExpr().inSumExpr()?.expr();
            if (inSumExpr) {
                walkExpr(context, inSumExpr);
            }
            return functionType;
        }

        if (simpleExpr.sumExpr().SUM_SYMBOL() || simpleExpr.sumExpr().AVG_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = simpleExpr.sumExpr().inSumExpr()?.expr();
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
        throw Error('SimpleExprLiteralContext');
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
                type2: thenType.kind == 'TypeOperator'? thenType.types[0] : thenType,
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
                type2: elseType.kind == 'TypeOperator'? elseType.types[0] : elseType,
                mostGeneralType: true
            })
            thenTypes.forEach(thenType => {
                context.constraints.push({
                    expression: simpleExpr.elseExpression()?.text!,
                    type1: thenType,
                    type2: elseType.kind == 'TypeOperator'? elseType.types[0] : elseType,
                    mostGeneralType: true
                })

            })
        }
        return caseType;
    }
    if( simpleExpr instanceof SimpleExprIntervalContext ) {
        const exprList = simpleExpr.expr();
        const exprLeft = exprList[0];
        const exprRight =  exprList[1];
        const typeLeft = walkExpr(context, exprLeft);
        const typeRight = walkExpr(context, exprRight);
        context.constraints.push({
            expression: exprLeft.text,
            type1: typeLeft,
            type2: freshVar('bigint', 'bigint')
        })
        if(typeRight.kind == 'TypeVar' && (isDateLiteral(typeRight.name) || isDateTimeLiteral(typeRight.name))) {
            typeRight.type = 'datetime';
        }
        context.constraints.push({
            expression: exprRight.text,
            type1: typeRight,
            type2: freshVar('datetime', 'datetime')
        })
        return freshVar('datetime', 'datetime');

    }
    throw Error('Invalid expression');
}

function verifyDateTypesCoercion(type: Type) {

    if(type.kind == 'TypeVar' && isDateTimeLiteral(type.name)) {
        type.type = 'datetime';
    }
    if(type.kind == 'TypeVar' && isDateLiteral(type.name)) {
        type.type = 'date';
    }
    if(type.kind == 'TypeVar' && isTimeLiteral(type.name)) {
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
    return moment(literal,"YYYY-MM-DD", true).isValid();
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
    return exprList.map( (expr, paramIndex) => {
        const exprType = walkExpr(context, expr);
        const paramType = params.kind == 'FixedLengthParams'? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType);
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
    if(udfExprList) {
        const paramTypes = udfExprList
        .filter( (undefined, paramIndex) => {
            return functionName == 'timestampdiff'? paramIndex != 0 : true; //filter the first parameter of timestampdiff function
        })
        .map( (inExpr, paramIndex) => {
            const expr = inExpr.expr();
            const exprType = walkExpr(context, expr);
            context.constraints.push({
                expression: expr.text,
                type1: exprType,
                type2: params.kind == 'FixedLengthParams'? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType),
                mostGeneralType: true
            })
            return exprType;
        })
        return paramTypes;
    }
    const exprList = simpleExprFunction.functionCall().exprList()?.expr();
    if(exprList) {
        const paramTypes = exprList.map( (inExpr, paramIndex) => {
            const inSumExprType = walkExpr(context, inExpr);
            context.constraints.push({
                expression: inExpr.text,
                type1: params.kind == 'FixedLengthParams'? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType),
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
    const subqueryColumns = getColumnsFrom(querySpec[0], context.dbSchema);
    const newContext : InferenceContext = {
        ...context,
        fromColumns: context.fromColumns.concat(subqueryColumns)
    }
    const typeInferResult = walkQuerySpecification(newContext, querySpec[0]) as TypeOperator;
    
    for (let queryIndex = 1; queryIndex < querySpec.length; queryIndex++) { //union (if have any)
        const unionColumns = getColumnsFrom(querySpec[queryIndex], context.dbSchema);
        const unionNewContext : InferenceContext = {
            ...context,
            fromColumns: context.fromColumns.concat(unionColumns)
        }
        const unionResult = walkQuerySpecification(unionNewContext, querySpec[queryIndex]);

        typeInferResult.types.forEach( (field, fieldIndex) => {
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