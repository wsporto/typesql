import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ParameterNameAndPosition, ParameterDef, SchemaDef, TypeSqlError } from "../types";
import { Sql_stmtContext, parseSql as parseSqlite } from "@wsporto/ts-mysql-parser/dist/sqlite";
import { tryTraverse_Sql_stmtContext } from "./traverse";
import { ColumnInfo, ColumnSchema, SubstitutionHash, TraverseContext, TypeAndNullInfer, TypeAndNullInferParam } from "../mysql-query-analyzer/types";
import { getVarType } from "../mysql-query-analyzer/collect-constraints";
import { unify } from "../mysql-query-analyzer/unify";
import { hasAnnotation, preprocessSql, verifyNotInferred } from "../describe-query";
import { describeNestedQuery } from "./sqlite-describe-nested-query";
import { indexGroupBy } from "../util";
import { replaceListParams } from "./replace-list-params";
import { TraverseResult2 } from '../mysql-query-analyzer/traverse';
import { describeDynamicQuery2 } from '../describe-dynamic-query';

type ParseAndTraverseResult = {
    traverseResult: TraverseResult2;
    namedParameters: string[];
    nested: boolean;
    dynamicQuery: boolean;
    processedSql: string;
}

export function traverseSql(sql: string, dbSchema: ColumnSchema[]): Either<TypeSqlError, ParseAndTraverseResult> {
    const { sql: processedSql, namedParameters } = preprocessSql(sql);
    const nested = hasAnnotation(sql, '@nested');
    const dynamicQuery = hasAnnotation(sql, '@dynamicQuery');
    const parser = parseSqlite(processedSql);
    const sql_stmt = parser.sql_stmt();
    const traverseResult = traverseQuery(sql_stmt, dbSchema, namedParameters);
    if (isLeft(traverseResult)) {
        return traverseResult;
    }
    const result: ParseAndTraverseResult = {
        traverseResult: traverseResult.right,
        namedParameters,
        nested,
        processedSql,
        dynamicQuery
    }
    return right(result);
}

export function parseSql(sql: string, dbSchema: ColumnSchema[]): Either<TypeSqlError, SchemaDef> {

    const parseAndTraverseResult = traverseSql(sql, dbSchema);
    if (isLeft(parseAndTraverseResult)) {
        return parseAndTraverseResult;
    }
    const { traverseResult, processedSql, namedParameters, nested, dynamicQuery } = parseAndTraverseResult.right;
    return createSchemaDefinition(processedSql, traverseResult, namedParameters, nested, dynamicQuery);
}

function traverseQuery(sql_stmtContext: Sql_stmtContext, dbSchema: ColumnSchema[], namedParameters: string[]) {
    const traverseContext: TraverseContext = {
        dbSchema,
        withSchema: [],
        constraints: [],
        parameters: [],
        fromColumns: [],
        subQueryColumns: [],
        subQuery: false,
        where: false,
        dynamicSqlInfo: {
            with: [],
            select: [],
            from: [],
            where: []
        },
        dynamicSqlInfo2: {
            with: [],
            select: [],
            from: [],
            where: []
        },
        relations: []
    }

    const queryResultResult = tryTraverse_Sql_stmtContext(sql_stmtContext, traverseContext);
    return queryResultResult;
}

function createSchemaDefinition(sql: string, queryResult: TraverseResult2, namedParameters: string[], nestedQuery: boolean, dynamicQuery: boolean): Either<TypeSqlError, SchemaDef> {

    const groupedByName = indexGroupBy(namedParameters, p => p);
    const paramsById = new Map<string, TypeAndNullInfer>();
    queryResult.parameters.forEach(param => {
        paramsById.set(param.type.id, param);
    })

    groupedByName.forEach(sameNameList => {
        let notNull = queryResult.parameters[0].notNull; //param is not null if any param with same name is not null
        for (let index = 1; index < sameNameList.length; index++) {
            notNull = notNull || queryResult.parameters[index].notNull;
            queryResult.constraints.push({
                expression: queryResult.parameters[0].name,
                type1: queryResult.parameters[0].type,
                type2: queryResult.parameters[index].type
            })
        }
        for (let index = 0; index < sameNameList.length; index++) {
            queryResult.parameters[index].notNull = notNull || queryResult.parameters[index].notNull;
        }
    })
    const substitutions: SubstitutionHash = {} //TODO - DUPLICADO
    unify(queryResult.constraints, substitutions);
    if (queryResult.queryType == 'Select') {
        const columnResult = queryResult.columns.map((col) => {
            const columnType = getVarType(substitutions, col.type);
            const columnNotNull = paramsById.get(col.type.id) != null ? paramsById.get(col.type.id)?.notNull! : col.notNull;
            const colInfo: ColumnInfo = {
                columnName: col.name,
                type: verifyNotInferred(columnType),
                notNull: columnNotNull,
                table: col.table
            }
            return colInfo;
        })
        const paramsResult = queryResult.parameters.map((param, index) => {
            const columnType = getVarType(substitutions, param.type);
            const columnNotNull = param.notNull;
            const colInfo: ParameterDef = {
                name: namedParameters && namedParameters[index] ? namedParameters[index] : 'param' + (index + 1),
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })

        const nameAndParamPosition = paramsResult
            .filter(param => param.columnType?.endsWith("[]"))
            .map((param, index) => {
                const nameAndPosition: ParameterNameAndPosition = {
                    name: param.name,
                    paramPosition: queryResult.parameters[index].paramIndex
                }
                return nameAndPosition;
            })

        const newSql = replaceListParams(sql, nameAndParamPosition);

        const schemaDef: SchemaDef = {
            sql: newSql,
            queryType: queryResult.queryType,
            multipleRowsResult: queryResult.multipleRowsResult,
            columns: columnResult,
            parameters: paramsResult,
        }
        if (queryResult.orderByColumns) {
            schemaDef.orderByColumns = queryResult.orderByColumns;
        }
        if (nestedQuery) {
            const nestedResult = describeNestedQuery(columnResult, queryResult.relations);
            schemaDef.nestedInfo = nestedResult;
        }
        if (dynamicQuery) {
            const dynamicSqlInfo = describeDynamicQuery2(columnResult, queryResult.dynamicQueryInfo, namedParameters);
            schemaDef.dynamicSqlQuery2 = dynamicSqlInfo;
        }

        return right(schemaDef);
    }
    if (queryResult.queryType == 'Insert') {



        const paramsResult = queryResult.parameters.map((param, index) => {
            const columnType = getVarType(substitutions, param.type);
            const columnNotNull = param.notNull;
            const colInfo: ParameterDef = {
                name: namedParameters && namedParameters[index] ? namedParameters[index] : 'param' + (index + 1),
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })

        const columns = queryResult.columns.map(col => {
            const columnType = getVarType(substitutions, col.type);
            const colInfo: ColumnInfo = {
                columnName: col.name,
                type: verifyNotInferred(columnType),
                notNull: col.notNull
            }
            return colInfo;
        })

        const schemaDef: SchemaDef = {
            sql,
            queryType: queryResult.queryType,
            multipleRowsResult: false,
            columns,
            parameters: paramsResult
        }
        if (queryResult.returing) {
            schemaDef.returning = true;
        }

        return right(schemaDef);
    }
    if (queryResult.queryType == 'Update') {

        const paramsResult = queryResult.columns.map((param, index) => {
            const columnType = getVarType(substitutions, param.type);
            const columnNotNull = param.notNull;
            const colInfo: ParameterDef = {
                name: namedParameters && namedParameters[index] ? namedParameters[index] : 'param' + (index + 1),
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })
        const whereParams = queryResult.whereParams.map((param, index) => {
            const columnType = getVarType(substitutions, param.type);
            const columnNotNull = param.notNull;
            const paramIndex = index + queryResult.columns.length;
            const colInfo: ParameterDef = {
                name: namedParameters && namedParameters[paramIndex] ? namedParameters[paramIndex] : 'param' + (index + 1),
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })

        const schemaDef: SchemaDef = {
            sql,
            queryType: queryResult.queryType,
            multipleRowsResult: false,
            columns: [],
            data: paramsResult,
            parameters: whereParams
        }

        return right(schemaDef);
    }
    if (queryResult.queryType == 'Delete') {

        const whereParams = queryResult.parameters.map((param, index) => {
            const columnType = getVarType(substitutions, param.type);
            const columnNotNull = param.notNull;
            const colInfo: ParameterDef = {
                name: namedParameters && namedParameters[index] ? namedParameters[index] : 'param' + (index + 1),
                columnType: verifyNotInferred(columnType),
                notNull: columnNotNull
            }
            return colInfo;
        })

        const schemaDef: SchemaDef = {
            sql,
            queryType: queryResult.queryType,
            multipleRowsResult: false,
            columns: [],
            parameters: whereParams
        }

        return right(schemaDef);
    }
    return left({
        name: 'parse error',
        description: 'query not supported'
    });
}