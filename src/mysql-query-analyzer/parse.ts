import MySQLParser, { SqlMode, QueryContext, QuerySpecificationContext, SelectStatementContext, SubqueryContext, WithClauseContext, QueryExpressionParensContext, QueryExpressionBodyContext, InsertQueryExpressionContext, SelectItemContext, SumExprContext, SimpleExprWindowingFunctionContext, WindowClauseContext, WindowingClauseContext, FunctionCallContext } from 'ts-mysql-parser';
import { ParseTree, TerminalNode } from "antlr4ts/tree";
import {
    analiseTree, TypeVar, analiseQuerySpecification, unionTypeResult, analiseInsertStatement,
    analiseUpdateStatement, analiseDeleteStatement, InferenceContext
} from './collect-constraints';
import {
    ColumnSchema, TypeInferenceResult, QueryInfoResult, ColumnDef, InsertInfoResult, UpdateInfoResult, DeleteInfoResult,
    TypeAndNullInferResult, TypeAndNullInfer, ParameterInfo, TypeAndNullInferResultWithIdentifier
} from './types';
import { getColumnsFrom, getColumnNames, analyzeSubQuery } from './select-columns';
import { inferParamNullability, inferParamNullabilityQuery } from './infer-param-nullability';
import { inferNotNull } from './infer-column-nullability';
import { preprocessSql, verifyNotInferred } from '../describe-query';
import { verifyMultipleResult } from './verify-multiple-result';


const parser = new MySQLParser({
    version: '8.0.17',
    mode: SqlMode.NoMode
})

export function parse(sql: string): QueryContext {
    const parseResult = parser.parse(sql);
    if (parseResult.parserError) {
        throw new Error('Parser error' + parseResult.parserError)
    }

    return parseResult.tree as QueryContext;
}

export type SubstitutionHash = {
    [index: number]: TypeVar
}



export function infer(queryContext: QueryContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[], namedParameters: string[]): TypeInferenceResult {

    const context: InferenceContext = {
        dbSchema,
        withSchema,
        constraints: [],
        parameters: [],
        fromColumns: []
    }

    const typeInferenceResult = analiseTree(queryContext, context, namedParameters);
    // const newTypeInference : TypeInferenceResult = {
    //     columns: typeInferenceResult.columns.map( col => verifyNotInferred(col)),
    //     parameters: typeInferenceResult.parameters.map(paramType => verifyNotInferred(paramType))
    // }
    return typeInferenceResult;
}

//TODO - withSchema DEFAULT VALUE []
export function parseAndInfer(sql: string, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[] = []): TypeInferenceResult {
    const { sql: processedSql, namedParameters } = preprocessSql(sql);
    return infer(parse(processedSql), dbSchema, withSchema, namedParameters);
}

export function parseAndInferParamNullability(sql: string): boolean[] {
    const queryContext = parse(sql);
    const selectStatement = queryContext.simpleStatement()?.selectStatement()!;
    return inferParamNullabilityQuery(selectStatement);
}

export function extractQueryInfoFromQuerySpecification(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[], namedParameters: string[]): TypeAndNullInferResult {
    const fromColumns = getColumnsFrom(querySpec, dbSchema, withSchema);
    const inferResult = analiseQuerySpecification(querySpec, dbSchema, withSchema, fromColumns, namedParameters);
    // console.log("inferResult=", inferResult);
    const columnNullability = inferNotNull(querySpec, dbSchema, withSchema);
    const selectedColumns = getColumnNames(querySpec, fromColumns);
    const columnResult = selectedColumns.map((col, index) => {
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
    const parametersResult = inferResult.parameters.map((param, index) => {
        const paramInfo: TypeAndNullInfer = {
            name: '?',
            type: param,
            notNull: paramInference[index]
        }
        return paramInfo;
    });

    const queryResult: TypeAndNullInferResult = {
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
        .filter(orderExpr => orderExpr.text == '?')
        .map(orderExpr => orderExpr.text) || [];
}

function extractLimitParameters(selectStatement: SelectStatementContext): ParameterInfo[] {
    return getLimitOptions(selectStatement)
        .filter(limit => limit.PARAM_MARKER())
        .map(() => {
            const paramInfo: ParameterInfo = {
                type: 'bigint',
                notNull: true
            }
            return paramInfo;
        }) || [];
}

function isMultipleRowResult(selectStatement: SelectStatementContext, fromColumns: ColumnDef[]) {
    const querySpecs = getQuerySpecificationsFromSelectStatement(selectStatement);
    if (querySpecs.length == 1) { //UNION queries are multipleRowsResult = true
        const fromClause = querySpecs[0].fromClause();
        if (!fromClause) {
            return false;
        }
        if (querySpecs[0].selectItemList().childCount == 1) {
            const selectItem = <SelectItemContext>querySpecs[0].selectItemList().getChild(0);
            //if selectItem = * (TerminalNode) childCount = 0; selectItem.expr() throws exception
            const expr = selectItem.childCount > 0 ? selectItem.expr() : null;
            if (expr) {
                //SUM, MAX... WITHOUT GROUP BY are multipleRowsResult = false
                const groupBy = querySpecs[0].groupByClause();
                if (!groupBy && isSumExpressContext(expr)) {
                    return false;
                }
            }
        }
        const joinedTable = fromClause.tableReferenceList()?.tableReference()[0].joinedTable();
        if (joinedTable && joinedTable.length > 0) {
            return true;
        }

        const whereClauseExpr = querySpecs[0].whereClause()?.expr();
        const isMultipleRowResult = whereClauseExpr && verifyMultipleResult(whereClauseExpr, fromColumns);
        if (isMultipleRowResult == false) {
            return false;
        }
    }

    const limitOptions = getLimitOptions(selectStatement);
    if (limitOptions.length == 1 && limitOptions[0].text == '1') {
        return false;
    }
    if (limitOptions.length == 2 && limitOptions[1].text == '1') {
        return false;
    }

    return true;
}

function isSumExpressContext(selectItem: ParseTree) {
    if (selectItem instanceof SimpleExprWindowingFunctionContext
        || selectItem instanceof TerminalNode) {
        return false;
    }

    if (selectItem instanceof SumExprContext) {
        if (selectItem.children) {
            //any of the children is WindowingClauseContext OVER()
            for (const child of selectItem.children) {
                if (child instanceof WindowingClauseContext) {
                    return false;
                }
            }
        }
        return true;
    }
    //https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html
    if (selectItem instanceof FunctionCallContext) {
        if (selectItem.qualifiedIdentifier()?.text.toLowerCase() == 'avg') {
            return true;
        }
    }
    if (selectItem.childCount == 1) {
        return isSumExpressContext(selectItem.getChild(0));
    }
    return false;
}

function getLimitOptions(selectStatement: SelectStatementContext) {
    return selectStatement.queryExpression()
        ?.limitClause()
        ?.limitOptions()
        .limitOption() || []
}

//TODO - withSchema: ColumnSchema[] DEFAULT VALUE
export function extractQueryInfo(sql: string, dbSchema: ColumnSchema[]): QueryInfoResult | InsertInfoResult | UpdateInfoResult | DeleteInfoResult {

    const { sql: processedSql, namedParameters } = preprocessSql(sql);

    const tree = parse(processedSql);

    const context: InferenceContext = {
        dbSchema,
        withSchema: [],
        parameters: [],
        constraints: [],
        fromColumns: []
    }

    if (tree instanceof QueryContext) {
        const selectStatement = tree.simpleStatement()?.selectStatement();
        if (selectStatement) {

            // selectStatement:
            //     queryExpression
            //     | queryExpressionParens
            const queryExpression = selectStatement.queryExpression();
            if (queryExpression) {
                //queryExpression
                const withClause = queryExpression.withClause();
                const allWithSchema: TypeAndNullInfer[] = [];
                const withClauseParameters: TypeAndNullInfer[] = [];
                if (withClause) {
                    const withClauseResults = analyseWithClause(withClause, dbSchema, []);
                    withClauseResults.forEach(withClauseResult => {
                        allWithSchema.push(...withClauseResult.queryResult.columns);
                        withClauseParameters.push(...withClauseResult.queryResult.parameters);
                    })
                }
                context.withSchema = allWithSchema;

                const queryExpressionBody = queryExpression.queryExpressionBody() || queryExpression.queryExpressionParens();
                if (queryExpressionBody) {
                    const querySpec = getQuerySpecificationsFromSelectStatement(queryExpressionBody);
                    const mainQueryResult = analiseQuery(querySpec, context.dbSchema, context.withSchema, namedParameters);

                    const orderByParameters = extractOrderByParameters(selectStatement);
                    const limitParameters = extractLimitParameters(selectStatement);

                    const allParameters = mainQueryResult.parameters
                        .concat(withClauseParameters)
                        .map(param => ({ type: verifyNotInferred(param.type), notNull: param.notNull }))
                        .concat(limitParameters);

                    const fromColumns = getColumnsFrom(querySpec[0], context.dbSchema, context.withSchema);
                    const multipleRowsResult = isMultipleRowResult(selectStatement, fromColumns);

                    const resultWithoutOrderBy: QueryInfoResult = {
                        kind: 'Select',
                        multipleRowsResult: multipleRowsResult,
                        columns: mainQueryResult.columns.map(col => ({ columnName: col.name, type: verifyNotInferred(col.type), notNull: col.notNull })),
                        parameters: allParameters,
                    }

                    const orderByColumns = orderByParameters.length > 0 ? getOrderByColumns(fromColumns, mainQueryResult.columns) : undefined;
                    if (orderByColumns) {
                        resultWithoutOrderBy.orderByColumns = orderByColumns;
                    }

                    return resultWithoutOrderBy;
                }


            }
        }
        const insertStatement = tree.simpleStatement()?.insertStatement();
        if (insertStatement) {
            const typeInfer = analiseInsertStatement(insertStatement, context);
            return typeInfer;
        }
        const updateStatement = tree.simpleStatement()?.updateStatement();
        if (updateStatement) {
            const typeInfer = analiseUpdateStatement(updateStatement, context.dbSchema, context.withSchema);
            return typeInfer;
        }
        const deleteStatement = tree.simpleStatement()?.deleteStatement();
        if (deleteStatement) {
            const typeInfer = analiseDeleteStatement(deleteStatement, context.dbSchema, context.withSchema);
            return typeInfer;
        }

    }
    throw Error('Not supported');
}

function getOrderByColumns(fromColumns: ColumnDef[], selectColumns: TypeAndNullInfer[]) {
    const fromColumnsNames = fromColumns.map(col => col.columnName); //TODO - loading twice
    const selectColumnsNames = selectColumns.map(col => col.name);
    const allOrderByColumns = Array.from(new Set(fromColumnsNames.concat(selectColumnsNames)));
    return allOrderByColumns;
}

export function analiseQuery(querySpec: QuerySpecificationContext[], dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[], namedParameters: string[], recursive = false): TypeAndNullInferResult {

    const mainQueryResult = extractQueryInfoFromQuerySpecification(querySpec[0], dbSchema, withSchema, namedParameters);

    for (let queryIndex = 1; queryIndex < querySpec.length; queryIndex++) { //union (if have any)

        if (recursive) {
            withSchema.push(...mainQueryResult.columns);
        }
        const unionResult = extractQueryInfoFromQuerySpecification(querySpec[queryIndex], dbSchema, withSchema, namedParameters);

        mainQueryResult.columns.forEach((field, fieldIndex) => {
            const unionField = unionResult.columns[fieldIndex];
            field.notNull = field.notNull && unionField.notNull; //if all the fields at the fieldIndex is null
            field.type = unionTypeResult(field.type, unionField.type);
        })
        mainQueryResult.parameters.push(...unionResult.parameters);
    }
    return mainQueryResult;
}

export function getQuerySpecificationsFromSelectStatement(
    selectStatement: SelectStatementContext
        | InsertQueryExpressionContext
        | QueryExpressionBodyContext //TODO - REMOVE
        | QueryExpressionParensContext //TODO - REMOVE
        | SubqueryContext): QuerySpecificationContext[] {
    const result: QuerySpecificationContext[] = [];

    collectQuerySpecifications(selectStatement, result);
    return result;
}

//querySpecification
function collectQuerySpecifications(tree: ParseTree, result: QuerySpecificationContext[]) {
    for (let i = 0; i < tree.childCount; i++) {
        const child = tree.getChild(i);
        if (child instanceof QuerySpecificationContext) {
            result.push(child);
        }
        else {
            collectQuerySpecifications(child, result);
        }
    }
}

function analyseWithClause(withClause: WithClauseContext, dbSchema: ColumnSchema[], withSchema: TypeAndNullInfer[]): TypeAndNullInferResultWithIdentifier[] {
    const result = withClause.commonTableExpression().map(commonTableExpression => {
        const identifier = commonTableExpression.identifier().text;
        const columnInternalRefList = commonTableExpression.columnInternalRefList()?.columnInternalRef() || [];
        columnInternalRefList.forEach(colRef => {
            const identifier = colRef.identifier().text;
            withSchema.push({
                name: identifier,
                notNull: true,
                type: '?'
            })
        })

        const subQuery = commonTableExpression.subquery();
        const recursive = withClause.RECURSIVE_SYMBOL() ? true : false;
        const queryResult = analyzeSubQuery(subQuery, dbSchema, withSchema, recursive);
        if (recursive) {
            const newColumnNames = queryResult.columns.map((col, index) => {
                const newR: TypeAndNullInfer = {
                    ...col,
                    name: withSchema[index].name,
                }
                return newR;
            })
            const newQueryResult: TypeAndNullInferResult = {
                columns: newColumnNames,
                parameters: queryResult.parameters
            }
            return {
                identifier,
                queryResult: newQueryResult
            }
        }
        return {
            identifier,
            queryResult
        };
    });
    return result;
}

