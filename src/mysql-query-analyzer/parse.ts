import MySQLParser, { SqlMode, QueryContext, QuerySpecificationContext, SelectStatementContext, SubqueryContext, QueryExpressionParensContext, QueryExpressionBodyContext, InsertQueryExpressionContext, SelectItemContext, SumExprContext, SimpleExprWindowingFunctionContext, WindowingClauseContext, FunctionCallContext } from 'ts-mysql-parser';
import { ParseTree, TerminalNode } from "antlr4ts/tree";
import { getVarType } from './collect-constraints';
import {
    ColumnSchema, TypeInferenceResult, QueryInfoResult, InsertInfoResult, UpdateInfoResult, DeleteInfoResult,
    ParameterInfo, ColumnInfo, ColumnDef, SubstitutionHash, DynamicSqlInfo
} from './types';
import { inferParamNullabilityQuery } from './infer-param-nullability';
import { generateNestedQueryResult, preprocessSql, verifyNotInferred } from '../describe-query';
import { verifyMultipleResult } from './verify-multiple-result';
import { unify } from './unify';
import { SelectStatementResult, traverseQueryContext } from './traverse';
import { ParameterDef } from '../types';
import { generateNestedInfo } from '../describe-nested-query';
import { describeDynamicQuery } from '../describe-dynamic-query';

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

//TODO - withSchema DEFAULT VALUE []
export function parseAndInfer(sql: string, dbSchema: ColumnSchema[]): TypeInferenceResult {
    const result = extractQueryInfo(sql, dbSchema);
    if (result.kind == 'Select') {
        return {
            columns: result.columns.map(p => p.type),
            parameters: result.parameters.map(p => p.type)
        }
    }
    if (result.kind == 'Insert') {
        return {
            columns: [],
            parameters: result.parameters.map(p => p.columnType)
        }
    }
    if (result.kind == 'Update') {
        return {
            columns: [],
            parameters: result.data.map(p => p.columnType)
        }
    }
    throw Error("parseAndInfer: " + sql);

}

export function parseAndInferParamNullability(sql: string): boolean[] {
    const queryContext = parse(sql);
    const selectStatement = queryContext.simpleStatement()?.selectStatement()!;
    return inferParamNullabilityQuery(selectStatement);
}

export function extractOrderByParameters(selectStatement: SelectStatementContext) {
    return selectStatement.queryExpression()
        ?.orderClause()
        ?.orderList()
        .orderExpression()
        .filter(orderExpr => orderExpr.text == '?')
        .map(orderExpr => orderExpr.text) || [];
}

export function extractLimitParameters(selectStatement: SelectStatementContext): ParameterInfo[] {
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

export function isMultipleRowResult(selectStatement: SelectStatementContext, fromColumns: ColumnDef[]) {
    const querySpecs = getAllQuerySpecificationsFromSelectStatement(selectStatement);
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

export function isSumExpressContext(selectItem: ParseTree) {
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

export function getLimitOptions(selectStatement: SelectStatementContext) {
    return selectStatement.queryExpression()
        ?.limitClause()
        ?.limitOptions()
        .limitOption() || []
}

export function extractQueryInfo(sql: string, dbSchema: ColumnSchema[]): QueryInfoResult | InsertInfoResult | UpdateInfoResult | DeleteInfoResult {
    const { sql: processedSql, namedParameters } = preprocessSql(sql);
    const gererateNested = generateNestedQueryResult(sql);
    const genereteDynamicQuery = false;
    const tree = parse(processedSql);

    const traverseResult = traverseQueryContext(tree, dbSchema, namedParameters);
    if (traverseResult.type == 'Select') {
        const queryInfoResult = extractSelectQueryInfo(traverseResult);
        if (gererateNested) {
            const nestedInfo = generateNestedInfo(tree, dbSchema, queryInfoResult.columns)
            queryInfoResult.nestedResultInfo = nestedInfo;
        }
        if (genereteDynamicQuery) {
            const dynamicQuery = describeDynamicQuery(traverseResult.dynamicSqlInfo, namedParameters);
            queryInfoResult.dynamicQuery = dynamicQuery;
        }

        return queryInfoResult;
    }
    if (traverseResult.type == 'Insert') {
        const newResult: InsertInfoResult = {
            kind: 'Insert',
            parameters: traverseResult.parameters
        }
        return newResult;
    }
    if (traverseResult.type == 'Update') {
        const substitutions: SubstitutionHash = {} //TODO - DUPLICADO
        unify(traverseResult.constraints, substitutions);
        const columnResult = traverseResult.data.map((col) => {
            const columnType = getVarType(substitutions, col.type);
            const columnNotNull = col.notNull;
            const colInfo: ParameterDef = {
                name: col.name,
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })

        const paramResult = traverseResult.parameters.map((col) => {
            const columnType = getVarType(substitutions, col.type);
            const columnNotNull = col.notNull;
            const colInfo: ParameterDef = {
                name: col.name,
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })

        const newResult: UpdateInfoResult = {
            kind: 'Update',
            data: columnResult,
            parameters: paramResult
        }
        return newResult;
    }
    if (traverseResult.type == 'Delete') {
        const newResult: DeleteInfoResult = {
            kind: 'Delete',
            parameters: traverseResult.parameters
        }
        return newResult;
    }
    throw Error('Not supported');
}

function extractSelectQueryInfo(traverseResult: SelectStatementResult): QueryInfoResult {

    const substitutions: SubstitutionHash = {} //TODO - DUPLICADO
    unify(traverseResult.constraints, substitutions);

    const columnResult = traverseResult.columns.map((col) => {
        const columnType = getVarType(substitutions, col.type);
        const columnNotNull = col.notNull;
        const colInfo: ColumnInfo = {
            columnName: col.name,
            type: verifyNotInferred(columnType),
            notNull: columnNotNull,
            table: col.table
        }
        return colInfo;
    })

    const paramsResult = traverseResult.parameters.map((param) => {
        const columnType = getVarType(substitutions, param.type);
        const columnNotNull = param.notNull;
        const colInfo: ParameterInfo = {
            // columnName: param.name,
            type: verifyNotInferred(columnType),
            notNull: columnNotNull
        }
        return colInfo;
    }).concat(traverseResult.limitParameters)

    const resultWithoutOrderBy: QueryInfoResult = {
        kind: 'Select',
        multipleRowsResult: traverseResult.isMultiRow,
        columns: columnResult,
        parameters: paramsResult,
    }
    if (traverseResult.orderByColumns) {
        resultWithoutOrderBy.orderByColumns = traverseResult.orderByColumns;
    }

    return resultWithoutOrderBy;

}

export function getAllQuerySpecificationsFromSelectStatement(
    selectStatement: SelectStatementContext
        | QueryExpressionBodyContext
        | InsertQueryExpressionContext
        | SubqueryContext) {
    const result: QuerySpecificationContext[] = [];

    collectAllQuerySpecifications(selectStatement, result);
    return result;
}

function collectAllQuerySpecifications(tree: ParseTree, result: QuerySpecificationContext[]) {
    for (let i = 0; i < tree.childCount; i++) {
        const child = tree.getChild(i);
        if (child instanceof QuerySpecificationContext) {
            result.push(child);
        }
        else {
            collectAllQuerySpecifications(child, result);
        }
    }
}

function printQuery(dynamicSqlInfo: DynamicSqlInfo) {
    console.dir(dynamicSqlInfo, { depth: null });
    let sql = `let sql = 'SELECT';\n`;
    dynamicSqlInfo.select.forEach(selectItem => {
        if (selectItem.fields.length > 0) {
            sql += `if (${selectItem.fields.map(f => 'select.' + f.name)}) {\n`
            sql += `    sql += ${selectItem.fragment};\n`;
            sql += '}\n';
        }
        else {
            sql += `sql += ${selectItem.fragment};\n`;
        }
    })
    sql += 'FROM '
    dynamicSqlInfo.from.forEach(from => {
        if (from.dependOnFields.length > 0) {
            sql += `if (${from.dependOnFields.map(f => 'select.' + f.name).concat(from.dependOnParams.map(p => 'params.' + p)).join(' || ')}) {\n`
            sql += `    sql += ${from.fragment};\n`;
            sql += '}\n';
        }
        else {
            sql += `sql += ${from.fragment};\n`;
        }
    })
    sql += `sql += 'WHERE 1 = 1'\n`;
    dynamicSqlInfo.where.forEach(where => {
        if (where.dependOnFields.length > 0 || where.dependOnParams.length > 0) {
            sql += `if (${where.dependOnFields.map(f => 'select.' + f.name).concat(where.dependOnParams.map(param => 'param.' + param)).join(' || ')})) {\n`
            sql += `    sql += '${where.fragment}';\n`;
            sql += '}\n';
        }
        else {
            sql += `sql += ${where.fragment};\n`;
        }
    })
    console.log(sql);

}