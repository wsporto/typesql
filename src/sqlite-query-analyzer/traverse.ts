import { Select_stmtContext, Sql_stmtContext, ExprContext, Table_or_subqueryContext } from "@wsporto/ts-mysql-parser/sqlite/SQLiteParser";
import { ColumnDef, ColumnSchema, TraverseContext, Type, TypeAndNullInfer, TypeVar } from "../mysql-query-analyzer/types";
import { filterColumns, findColumn, splitName } from "../mysql-query-analyzer/select-columns";
import { createColumnType, freshVar } from "../mysql-query-analyzer/collect-constraints";
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
            const fields = traverse_table_or_subquery(table_or_subquery, traverseContext.dbSchema);
            columnsResult.push(...fields);
        }
        const join_clause = select_core.join_clause();
        if (join_clause) {
            const join_table_or_subquery = join_clause.table_or_subquery();
            const fields = traverse_table_or_subquery(join_table_or_subquery, traverseContext.dbSchema);
            columnsResult.push(...fields);
        }

        const result_column = select_core.result_column();

        result_column.forEach(result_column => {
            if (result_column.STAR()) {
                columnsResult.forEach(col => {
                    const columnType = createColumnType(col);
                    listType.push(columnType);
                })
            }

            const expr = result_column.expr();
            const alias = result_column.column_alias()?.text;
            if (expr) {
                const exprType = traverse_expr(expr, { ...traverseContext, fromColumns: columnsResult });
                if (exprType.kind == 'TypeVar') {
                    if (alias) {
                        exprType.name = alias;
                    }
                    listType.push(exprType);
                }
            }
        })

        const whereList = select_core.expr();
        whereList.forEach(where => {
            traverse_expr(where, { ...traverseContext, fromColumns: columnsResult });
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

function traverse_table_or_subquery(table_or_subquery: Table_or_subqueryContext[], dbSchema: ColumnSchema[]) {
    const allFields: ColumnDef[] = [];
    table_or_subquery.forEach(table_or_subquery => {
        const table_name = table_or_subquery.table_name();
        const table_alias = table_or_subquery.table_alias()?.text;
        if (table_name) {
            const tableName = splitName(table_name.any_name().text);
            const fields = filterColumns(dbSchema, [], table_alias, tableName);
            allFields.push(...fields);
        }
    })
    return allFields;
}

function traverse_expr(expr: ExprContext, traverseContext: TraverseContext): Type {
    const column_name = expr.column_name();
    if (column_name) {
        const fieldName = splitName(column_name.text);
        const column = findColumn(fieldName, traverseContext.fromColumns);
        const typeVar = freshVar(column.columnName, column.columnType.type, column.tableAlias || column.table);
        return typeVar;
    }
    const parameter = expr.BIND_PARAMETER();
    if (parameter) {
        const param = freshVar('?', '?');
        traverseContext.parameters.push(param);
        return param;
    }
    if (expr.LT2() || expr.GT2() || expr.AMP() || expr.PIPE() || expr.LT() || expr.LT_EQ() || expr.GT() || expr.GT_EQ()) {
        const exprLeft = expr.expr()[0];
        const exprRight = expr.expr()[1];
        const typeLeft = traverse_expr(exprLeft, traverseContext);
        const typeRight = traverse_expr(exprRight, traverseContext);
        traverseContext.constraints.push({
            expression: expr.text,
            type1: typeLeft,
            type2: typeRight
        })
        return freshVar(expr.text, 'tinyint');
    }
    if (expr.ASSIGN()) { //=
        const exprLeft = expr.expr()[0];
        const exprRight = expr.expr()[1];
        const typeLeft = traverse_expr(exprLeft, traverseContext);
        const typeRight = traverse_expr(exprRight, traverseContext);
        traverseContext.constraints.push({
            expression: expr.text,
            type1: typeLeft,
            type2: typeRight
        })
        return freshVar(expr.text, 'tinyint');
    }
    if (expr.OR_() || expr.AND_()) {
        const expr1 = expr.expr()[0];
        const expr2 = expr.expr()[1];
        traverse_expr(expr1, traverseContext);
        traverse_expr(expr2, traverseContext);
        return freshVar(expr.text, 'tinyint');
    }
    throw Error('traverse_expr not supported:' + expr.text);
}