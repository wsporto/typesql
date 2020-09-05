import MySQLParser, { SqlMode, QueryContext, QuerySpecificationContext, SelectStatementContext, SubqueryContext, WhereClauseContext } from 'ts-mysql-parser';
import { ParseTree } from "antlr4ts/tree";
import { analiseTree, TypeVar, analiseQuerySpecification, unionTypeResult, getInsertColumns, analiseInsertStatement, 
    analiseUpdateStatement, analiseDeleteStatement } from './collect-constraints';
import { ColumnSchema, TypeInferenceResult, QueryInfoResult, ColumnDef, InsertInfoResult, UpdateInfoResult, DeleteInfoResult, 
    TypeAndNullInferResult, TypeAndNullInfer, ParameterInfo } from './types';
import { getColumnsFrom, getColumnNames } from './select-columns';
import { inferParamNullability, inferParamNullabilityQuery } from './infer-param-nullability';
import { inferNotNull } from './infer-column-nullability';
import { verifyNotInferred } from '../describe-query';
import { verifyMultipleResult } from './verify-multiple-result';


const parser = new MySQLParser({
  version: '8.0.17',
  mode: SqlMode.NoMode
})

export function parse(sql: string) : QueryContext {
    const parseResult = parser.parse(sql);
    if(parseResult.parserError) {
        throw new Error('Parser error' + parseResult.parserError)
    }

    return parseResult.tree as QueryContext;
}

export type SubstitutionHash = {
    [index: number]: TypeVar
}



export function infer(queryContext: QueryContext, dbSchema: ColumnSchema[]) : TypeInferenceResult {
    const typeInferenceResult =  analiseTree(queryContext, dbSchema);
    // const newTypeInference : TypeInferenceResult = {
    //     columns: typeInferenceResult.columns.map( col => verifyNotInferred(col)),
    //     parameters: typeInferenceResult.parameters.map(paramType => verifyNotInferred(paramType))
    // }
    return typeInferenceResult;
}

export function parseAndInfer(sql: string, dbSchema: ColumnSchema[]) : TypeInferenceResult {
    return infer(parse(sql), dbSchema); 
}

export function parseAndInferParamNullability(sql: string) : boolean[] {
    const queryContext = parse(sql);
    return inferParamNullabilityQuery(queryContext); 
}

export function extractQueryInfoFromQuerySpecification(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], parentFromColumns: ColumnDef[]) : TypeAndNullInferResult {
    const fromColumns = getColumnsFrom(querySpec, dbSchema).concat(parentFromColumns);
    const inferResult = analiseQuerySpecification(querySpec, dbSchema, fromColumns);
    // console.log("inferResult=", inferResult);
    const columnNullability = inferNotNull(querySpec, dbSchema);
    const selectedColumns = getColumnNames(querySpec, fromColumns);
    const columnResult = selectedColumns.map( (col, index)=> {
        const columnType = inferResult.columns[index];
        const columnNotNull = columnNullability[index];
        const colInfo: TypeAndNullInfer = {
            name: col,
            type: columnType,
            notNull: columnNotNull
        }
        return colInfo;
    })

    const paramInference = inferParamNullability(querySpec);
    const parametersResult = inferResult.parameters.map( (param, index) => {
        const paramInfo : TypeAndNullInfer = {
            name: '?',
            type: param,
            notNull: paramInference[index]
        }
        return paramInfo;
    });

    const queryResult : TypeAndNullInferResult = {
        columns: columnResult,
        parameters: parametersResult
    }
    return queryResult;
}

function extractOrderByParameters(selectStatement: SelectStatementContext) {
    return selectStatement.queryExpression()
        ?.orderClause()
        ?.orderList()
        .orderExpression()
        .filter( orderExpr => orderExpr.text == '?')
        .map( orderExpr => orderExpr.text) || [];
}

function extractLimitParameters(selectStatement: SelectStatementContext) : ParameterInfo[] {
    return getLimitOptions(selectStatement)
        .filter( limit => limit.PARAM_MARKER())
        .map( () => {
            const paramInfo: ParameterInfo = {
                type: 'bigint',
                notNull: true
            }
            return paramInfo;
        }) || [];
}

function isMultipleRowResult(selectStatement: SelectStatementContext) {
    const limitOptions = getLimitOptions(selectStatement);
    if(limitOptions.length == 1 && limitOptions[0].text == '1') {
        return false;
    }
    if(limitOptions.length == 2 && limitOptions[1].text == '1') {
        return false;
    }

    return true;
}

function getLimitOptions(selectStatement: SelectStatementContext) {
    return selectStatement.queryExpression()
    ?.limitClause()
    ?.limitOptions()
    .limitOption() || []
}

export function extractQueryInfo(sql: string, dbSchema: ColumnSchema[]): QueryInfoResult | InsertInfoResult | UpdateInfoResult | DeleteInfoResult {

    const tree = parse(sql);
    if (tree instanceof QueryContext) {
        const selectStatement = tree.simpleStatement()?.selectStatement();
        if(selectStatement) {
            
            const querySpec = getQuerySpecificationsFromSelectStatement(selectStatement);
            const mainQueryResult = analiseQuery(querySpec, dbSchema, []);
            
            const orderByParameters = extractOrderByParameters(selectStatement);
            const limitParameters = extractLimitParameters(selectStatement);

            const allParameters = mainQueryResult.parameters
                .map( param => ({type: verifyNotInferred(param.type),  notNull: param.notNull}))
                .concat(limitParameters);

            const multipleRowsResult = isMultipleRowResult(selectStatement);
            
            const resultWithoutOrderBy: QueryInfoResult = {
                kind: 'Select',
                multipleRowsResult: multipleRowsResult,
                columns: mainQueryResult.columns.map( col => ({columnName: col.name, type: verifyNotInferred(col.type),  notNull: col.notNull})),
                parameters: allParameters,
            }
            
            const orderByColumns = orderByParameters.length > 0? getOrderByColumns(querySpec[0], dbSchema, mainQueryResult.columns) : undefined;
            if(orderByColumns) {
                resultWithoutOrderBy.orderByColumns = orderByColumns;
            }

            return resultWithoutOrderBy;
        }
        const insertStatement = tree.simpleStatement()?.insertStatement();
        if(insertStatement) {
            const insertColumns = getInsertColumns(insertStatement, dbSchema);
            const typeInfer = analiseInsertStatement(insertStatement, insertColumns);
            return typeInfer;
        }
        const updateStatement = tree.simpleStatement()?.updateStatement();
        if(updateStatement) {
            const typeInfer = analiseUpdateStatement(updateStatement, dbSchema);
            return typeInfer;
        }
        const deleteStatement = tree.simpleStatement()?.deleteStatement();
        if(deleteStatement) {
            const typeInfer = analiseDeleteStatement(deleteStatement, dbSchema);
            return typeInfer;
        }
        
    }
    throw Error('Not supported');
}

function getOrderByColumns(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], selectColumns: TypeAndNullInfer[]) {
    const fromColumns = getColumnsFrom(querySpec, dbSchema).map( col => col.columnName); //TODO - loading twice
    const selectColumnsNames = selectColumns.map( col => col.name);
    const allOrderByColumns = Array.from(new Set(fromColumns.concat(selectColumnsNames)));
    return allOrderByColumns;
}

export function analiseQuery(querySpec: QuerySpecificationContext[], dbSchema: ColumnSchema[], parentFromColumns: ColumnDef[]) : TypeAndNullInferResult {

    const mainQueryResult = extractQueryInfoFromQuerySpecification(querySpec[0], dbSchema, parentFromColumns);
            
    for (let queryIndex = 1; queryIndex < querySpec.length; queryIndex++) { //union (if have any)
        const unionResult = extractQueryInfoFromQuerySpecification(querySpec[queryIndex], dbSchema, parentFromColumns);

        mainQueryResult.columns.forEach( (field, fieldIndex) => {
            const unionField = unionResult.columns[fieldIndex];
            field.notNull = field.notNull && unionField.notNull; //if all the fields at the fieldIndex is null
            field.type = unionTypeResult(field.type, unionField.type);
        }) 
        mainQueryResult.parameters.push(...unionResult.parameters);
    }
    return mainQueryResult;
}

export function getQuerySpecificationsFromSelectStatement(selectStatement: SelectStatementContext | SubqueryContext ) : QuerySpecificationContext[] {
    const result : QuerySpecificationContext[] = [];
    collectQuerySpecifications(selectStatement, result);
    return result;
}

function collectQuerySpecifications(tree: ParseTree, result: QuerySpecificationContext[]) {
    for (let i = 0; i < tree.childCount; i++) {
        const child = tree.getChild(i);
        if(child instanceof QuerySpecificationContext) {
            result.push(child);
        }
        else {
            collectQuerySpecifications(child, result);
        }
    }
}

