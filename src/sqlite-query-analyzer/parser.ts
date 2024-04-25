import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ParameterDef, SchemaDef, TypeSqlError } from "../types";
import { Sql_stmtContext, parseSql as parseSqlite } from "@wsporto/ts-mysql-parser/dist/sqlite";
import { traverse_Sql_stmtContext } from "./traverse";
import { ColumnInfo, ColumnSchema, SubstitutionHash, TraverseContext } from "../mysql-query-analyzer/types";
import { getVarType } from "../mysql-query-analyzer/collect-constraints";
import { unify } from "../mysql-query-analyzer/unify";
import { hasAnnotation, preprocessSql, verifyNotInferred } from "../describe-query";
import { explainSql } from "./query-executor";
import { Database } from "better-sqlite3";
import { describeNestedQuery } from "./sqlite-describe-nested-query";

export function prepareAndParse(db: Database, sql: string, dbSchema: ColumnSchema[]) {
    const { sql: processedSql } = preprocessSql(sql);
    const explainSqlResult = explainSql(db, processedSql);
    if (isLeft(explainSqlResult)) {
        return left({
            name: 'Invalid sql',
            description: explainSqlResult.left.description
        })
    }
    return parseSql(sql, dbSchema);
}

export function parseSql(sql: string, dbSchema: ColumnSchema[]): Either<TypeSqlError, SchemaDef> {

    const { sql: processedSql, namedParameters } = preprocessSql(sql);
    const nested = hasAnnotation(sql, '@nested');
    const parser = parseSqlite(processedSql);
    const sql_stmt = parser.sql_stmt();
    return createSchemaDefinition(processedSql, sql_stmt, dbSchema, namedParameters, nested);
}

function createSchemaDefinition(sql: string, sql_stmtContext: Sql_stmtContext, dbSchema: ColumnSchema[], namedParameters: string[], nestedQuery: boolean): Either<TypeSqlError, SchemaDef> {

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
        relations: []
    }

    const queryResult = traverse_Sql_stmtContext(sql_stmtContext, traverseContext);

    const substitutions: SubstitutionHash = {} //TODO - DUPLICADO
    unify(traverseContext.constraints, substitutions);
    if (queryResult.queryType == 'Select') {
        const columnResult = queryResult.columns.map((col) => {
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
        const paramsResult = traverseContext.parameters.map((param, index) => {
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

        return right(schemaDef);
    }
    if (queryResult.queryType == 'Insert') {

        const insertColumnResult: ColumnInfo[] = [
            {
                columnName: 'changes',
                type: 'INTEGER',
                notNull: true
            },
            {
                columnName: 'lastInsertRowid',
                type: 'INTEGER',
                notNull: true
            }
        ]

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

        const schemaDef: SchemaDef = {
            sql,
            queryType: queryResult.queryType,
            multipleRowsResult: false,
            columns: insertColumnResult,
            parameters: paramsResult
        }

        return right(schemaDef);
    }
    if (queryResult.queryType == 'Update') {

        const updateColumnResult: ColumnInfo[] = [
            {
                columnName: 'changes',
                type: 'INTEGER',
                notNull: true
            },
            {
                columnName: 'lastInsertRowid',
                type: 'INTEGER',
                notNull: true
            }
        ]

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
        const whereParams = queryResult.params.map((param, index) => {
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
            columns: updateColumnResult,
            data: paramsResult,
            parameters: whereParams
        }

        return right(schemaDef);
    }
    if (queryResult.queryType == 'Delete') {
        const deleteColumnResult: ColumnInfo[] = [
            {
                columnName: 'changes',
                type: 'INTEGER',
                notNull: true
            },
            {
                columnName: 'lastInsertRowid',
                type: 'INTEGER',
                notNull: true
            }
        ]

        const whereParams = queryResult.params.map((param, index) => {
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
            columns: deleteColumnResult,
            parameters: whereParams
        }

        return right(schemaDef);
    }
    throw Error('query not supported: ' + sql_stmtContext.getText());
}