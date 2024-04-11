import { Select_stmtContext, Sql_stmtContext, ExprContext, Table_or_subqueryContext } from "@wsporto/ts-mysql-parser/dist/sqlite";
import { ColumnDef, TraverseContext, Type, TypeAndNullInfer, TypeVar } from "../mysql-query-analyzer/types";
import { filterColumns, findColumn, includeColumn, splitName } from "../mysql-query-analyzer/select-columns";
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
    if (common_table_stmt) {
        const common_table_expression = common_table_stmt.common_table_expression();
        common_table_expression.forEach(common_table_expression => {
            const table_name = common_table_expression.table_name();
            const select_stmt = common_table_expression.select_stmt();
            const select_stmt_result = traverse_select_stmt(select_stmt, traverseContext);
            select_stmt_result.columns.forEach(col => {
                traverseContext.withSchema.push({
                    table: table_name.text,
                    columnName: col.name,
                    columnType: col.type,
                    columnKey: '',
                    notNull: col.notNull
                });
            })
        })
    }

    const select_coreList = select_stmt.select_core();

    const querySpecResult = select_coreList.map(select_core => {
        const columnsResult: ColumnDef[] = [];
        const listType: TypeVar[] = [];
        const columnNullability: boolean[] = [];

        const table_or_subquery = select_core.table_or_subquery();
        if (table_or_subquery) {
            const fields = traverse_table_or_subquery(table_or_subquery, traverseContext);
            columnsResult.push(...fields);
        }
        const join_clause = select_core.join_clause();
        if (join_clause) {
            const join_table_or_subquery = join_clause.table_or_subquery();
            const fields = traverse_table_or_subquery(join_table_or_subquery, traverseContext);
            columnsResult.push(...fields);
        }

        const result_column = select_core.result_column();

        result_column.forEach(result_column => {
            if (result_column.STAR()) {
                const tableName = result_column.table_name()?.text;
                columnsResult.forEach(col => {
                    if (!tableName || includeColumn(col, tableName)) {
                        const columnType = createColumnType(col);
                        listType.push(columnType);
                        columnNullability.push(col.notNull);
                    }

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
                    columnNullability.push(inferNotNull_expr(expr, columnsResult));
                }
            }
        })

        const whereList = select_core.expr();
        whereList.forEach(where => {
            traverse_expr(where, { ...traverseContext, fromColumns: columnsResult });
        })

        const columns = listType.map((t, index) => {
            const resultType: TypeAndNullInfer = {
                name: t.name,
                type: t,
                notNull: columnNullability[index],
                table: t.table || ''
            }
            return resultType;
        })
        const querySpecification: QuerySpecificationResult = {
            columns,
            fromColumns: []
        }
        return querySpecification;
    });

    const mainQuery = querySpecResult[0];
    for (let queryIndex = 1; queryIndex < querySpecResult.length; queryIndex++) {//UNION
        const unionQuery = querySpecResult[queryIndex];
        unionQuery.columns.forEach((col, colIndex) => {
            mainQuery.columns[colIndex].table = '';
            traverseContext.constraints.push({
                expression: 'UNION',
                type1: mainQuery.columns[colIndex].type,
                type2: col.type
            })
        })
    }

    return mainQuery;
}

function traverse_table_or_subquery(table_or_subquery: Table_or_subqueryContext[], traverseContext: TraverseContext): ColumnDef[] {
    const allFields: ColumnDef[] = [];
    table_or_subquery.forEach(table_or_subquery => {
        const table_name = table_or_subquery.table_name();
        const table_alias = table_or_subquery.table_alias()?.text;
        if (table_name) {
            const tableName = splitName(table_name.any_name().text);
            const fields = filterColumns(traverseContext.dbSchema, traverseContext.withSchema, table_alias, tableName);
            allFields.push(...fields);
        }
        const select_stmt = table_or_subquery.select_stmt();
        if (select_stmt) {
            const subQueryResult = traverse_select_stmt(select_stmt, traverseContext);
            const tableAlias = table_or_subquery.table_alias()?.text;
            subQueryResult.columns.forEach(t => {
                const colDef: ColumnDef = {
                    table: t.table ? tableAlias || '' : '',
                    columnName: t.name,
                    columnType: t.type,
                    columnKey: "",
                    notNull: t.notNull,
                    tableAlias: tableAlias
                }
                allFields.push(colDef);
            })
        }
    })
    return allFields;
}

function traverse_expr(expr: ExprContext, traverseContext: TraverseContext): Type {
    const function_name = expr.function_name()?.text.toLowerCase();
    if (function_name == 'sum') {
        const functionType = freshVar(expr.text, 'NUMERIC');
        const sumParamExpr = expr.expr()[0];
        const paramType = traverse_expr(sumParamExpr, traverseContext);
        if (paramType.kind == 'TypeVar') {
            functionType.table = paramType.table
        }
        return functionType;
    }
    if (function_name == 'count') {
        const functionType = freshVar(expr.text, 'INTEGER');
        if (expr.expr().length == 1) {
            const sumParamExpr = expr.expr()[0];
            const paramType = traverse_expr(sumParamExpr, traverseContext);
            if (paramType.kind == 'TypeVar') {
                functionType.table = paramType.table
            }
        }

        return functionType;
    }

    const column_name = expr.column_name();
    if (column_name) {
        const fieldName = splitName(column_name.text);
        const column = findColumn(fieldName, traverseContext.fromColumns);
        const typeVar = freshVar(column.columnName, column.columnType.type, column.tableAlias || column.table);
        return typeVar;
    }
    const literal = expr.literal_value();
    if (literal) {
        if (literal.STRING_LITERAL()) {
            return freshVar(literal.text, 'TEXT')
        }
        if (literal.NUMERIC_LITERAL()) {
            return freshVar(literal.text, 'INTEGER');
        }
        return freshVar(literal.text, '?');
    }
    const parameter = expr.BIND_PARAMETER();
    if (parameter) {
        const param = freshVar('?', '?');
        traverseContext.parameters.push(param);
        return param;
    }
    if (expr.STAR() || expr.DIV() || expr.MOD()) {
        const exprLeft = expr.expr()[0];
        const exprRight = expr.expr()[1];
        const typeLeft = traverse_expr(exprLeft, traverseContext);
        return freshVar(expr.text, 'tinyint');
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
    if (expr.IN_()) {
        const inExprLeft = expr.expr()[0];
        const inExprRight = expr.expr()[1];
        const typeLeft = traverse_expr(inExprLeft, traverseContext);
        inExprRight.children?.forEach(exprRight => {
            if (exprRight instanceof ExprContext) {
                const typeRight = traverse_expr(exprRight, traverseContext);
                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: typeLeft,
                    type2: typeRight
                })
            }
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
    const select_stmt = expr.select_stmt();
    if (select_stmt) {
        const subQueryType = traverse_select_stmt(select_stmt, traverseContext);
        return { ...subQueryType.columns[0].type, table: '' };
    }
    if (expr.CASE_()) {
        const resultTypes: Type[] = []; //then and else
        const whenTypes: Type[] = [];
        expr.expr().forEach((expr_, index) => {
            const type = traverse_expr(expr_, traverseContext);
            if (expr_.WHEN_() || expr_.THEN_()) {
                if (index % 2 == 0) {
                    whenTypes.push(type);
                }
                else {
                    resultTypes.push(type);
                }
            }
            if (expr_.ELSE_()) {
                resultTypes.push(type);
            }
        });
        resultTypes.forEach((resultType, index) => {
            if (index > 0) {
                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: resultTypes[0],
                    type2: resultType
                })
            }
        });
        return resultTypes[0];
    }
    throw Error('traverse_expr not supported:' + expr.text);
}

function inferNotNull_expr(expr: ExprContext, fromColumns: ColumnDef[]): boolean {
    const column_name = expr.column_name();
    if (column_name) {
        const fieldName = splitName(column_name.text);
        const column = findColumn(fieldName, fromColumns);
        return column.notNull;
    }
    const function_name = expr.function_name()?.text.toLowerCase();
    if (function_name == 'count') {
        return true;
    }
    return false;
}

