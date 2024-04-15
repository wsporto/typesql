import { Either, right } from "fp-ts/lib/Either";
import { ParameterDef, SchemaDef, TypeSqlError } from "../types";
import { Sql_stmtContext, parseSql as parseSqlite } from "@wsporto/ts-mysql-parser/dist/sqlite";
import { isMultipleRowResult, traverse_Sql_stmtContext } from "./traverse";
import { ColumnInfo, ColumnSchema, SubstitutionHash, TraverseContext } from "../mysql-query-analyzer/types";
import { getVarType } from "../mysql-query-analyzer/collect-constraints";
import { unify } from "../mysql-query-analyzer/unify";
import { preprocessSql, verifyNotInferred } from "../describe-query";

export function parseSql(sql: string, dbSchema: ColumnSchema[]): Either<TypeSqlError, SchemaDef> {

    const { sql: processedSql, namedParameters } = preprocessSql(sql);

    const parser = parseSqlite(processedSql);

    const sql_stmt = parser.sql_stmt();

    return describeSQL(processedSql, sql_stmt, dbSchema, namedParameters);

}

function describeSQL(sql: string, sql_stmtContext: Sql_stmtContext, dbSchema: ColumnSchema[], namedParameters: string[]): Either<TypeSqlError, SchemaDef> {

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
        }
    }

    const queryResult = traverse_Sql_stmtContext(sql_stmtContext, traverseContext);

    const substitutions: SubstitutionHash = {} //TODO - DUPLICADO
    unify(traverseContext.constraints, substitutions);
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
        const columnType = getVarType(substitutions, param);
        const columnNotNull = true;// param.notNull;
        const colInfo: ParameterDef = {
            name: namedParameters && namedParameters[index] ? namedParameters[index] : 'param' + (index + 1),
            columnType: verifyNotInferred(columnType),
            notNull: columnNotNull
        }
        return colInfo;
    })

    const schemaDef: SchemaDef = {
        sql,
        queryType: "Select",
        multipleRowsResult: isMultipleRowResult(sql_stmtContext, queryResult.fromColumns),
        columns: columnResult,
        parameters: paramsResult
    }
    return right(schemaDef);
}