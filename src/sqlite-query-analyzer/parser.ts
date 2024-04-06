import { SQLiteLexer } from "@wsporto/ts-mysql-parser/sqlite/SQLiteLexer";
import { Either, right } from "fp-ts/lib/Either";
import { SchemaDef, TypeSqlError } from "../types";
import { SQLiteParser, Sql_stmtContext } from "@wsporto/ts-mysql-parser/sqlite/SQLiteParser";
import { CharStreams, CommonTokenStream } from "antlr4ts";
import { traverse_Sql_stmtContext } from "./traverse";
import { ColumnInfo, ColumnSchema, SubstitutionHash, TraverseContext } from "../mysql-query-analyzer/types";
import { getVarType } from "../mysql-query-analyzer/collect-constraints";
import { unify } from "../mysql-query-analyzer/unify";
import { verifyNotInferred } from "../describe-query";

export function parseSql(sql: string, dbSchema: ColumnSchema[]): Either<TypeSqlError, SchemaDef> {

    const input = CharStreams.fromString(sql.toUpperCase());
    const lexer = new SQLiteLexer(input);
    const parser = new SQLiteParser(new CommonTokenStream(lexer));
    const sql_stmt = parser.sql_stmt();

    return describeSQL(sql, sql_stmt, dbSchema);

}

function describeSQL(sql: string, sql_stmtContext: Sql_stmtContext, dbSchema: ColumnSchema[]): Either<TypeSqlError, SchemaDef> {

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

    const schemaDef: SchemaDef = {
        sql,
        queryType: "Select",
        multipleRowsResult: true,
        columns: columnResult,
        parameters: []
    }
    return right(schemaDef);
}