import { Select_stmtContext, Sql_stmtContext, ExprContext } from "@wsporto/ts-mysql-parser/sqlite/SQLiteParser";
import { ColumnDef, TraverseContext, Type, TypeAndNullInfer, TypeVar } from "../mysql-query-analyzer/types";
import { filterColumns, findColumn, splitName } from "../mysql-query-analyzer/select-columns";
import { freshVar } from "../mysql-query-analyzer/collect-constraints";
import { QuerySpecificationResult } from "../mysql-query-analyzer/traverse";

export function traverse_Sql_stmtContext(sql_stmt: Sql_stmtContext, traverseContext: TraverseContext): QuerySpecificationResult {

    const select_stmt = sql_stmt.select_stmt();
    if (select_stmt) {
        const queryResult = traverse_select_stmt(select_stmt, traverseContext);
        return queryResult;
    }
    throw Error("traverse_Sql_stmtContext");
}

function traverse_select_stmt(select_stmt: Select_stmtContext, traverseContext: TraverseContext): QuerySpecificationResult {
    const common_table_stmt = select_stmt.common_table_stmt();

    const select_coreList = select_stmt.select_core();

    const columnsResult: ColumnDef[] = [];
    const listType: TypeVar[] = [];

    select_coreList.forEach(select_core => {
        const table_or_subquery = select_core.table_or_subquery();
        if (table_or_subquery) {
            console.log("table_or_subquery=", table_or_subquery[0].text);
            table_or_subquery.forEach(table_or_subquery => {
                const table_name = table_or_subquery.table_name();
                if (table_name) {
                    const tableName = splitName(table_name.any_name().text);
                    const fields = filterColumns(traverseContext.dbSchema, [], '', tableName);
                    columnsResult.push(...fields);
                    console.log("columnResult=", columnsResult);
                }
            })
        }

        const result_column = select_core.result_column();

        result_column.forEach(col => {
            const expr = col.expr();
            if (expr) {
                const exprType = traverse_expr(expr, { ...traverseContext, fromColumns: columnsResult });
                if (exprType.kind == 'TypeVar') {
                    listType.push(exprType);
                }
            }
        })
    })
    //const columnNullability = inferNotNull(querySpec, traverseContext.dbSchema, allColumns);

    const columns = listType.map(t => {
        const resultType: TypeAndNullInfer = {
            name: t.name,
            type: t,
            notNull: true,
            table: t.table || ''
        }
        return resultType;
    })
    const querySpecification: QuerySpecificationResult = {
        columns,
        fromColumns: columnsResult
    }
    return querySpecification;
}

function traverse_expr(expr: ExprContext, traverseContext: TraverseContext): Type {
    const column_name = expr.column_name();
    if (column_name) {
        const fieldName = splitName(column_name.text);
        const column = findColumn(fieldName, traverseContext.fromColumns);
        const typeVar = freshVar(column.columnName, column.columnType.type, column.tableAlias || column.table);
        return typeVar;
    }
    throw Error('traverse_expr not supported:' + expr.text);
}