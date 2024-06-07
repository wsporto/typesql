import { ParserRuleContext, RuleContext } from "antlr4ts";
import { ParseTree, TerminalNode } from "antlr4ts/tree";
import { Interval } from "antlr4ts/misc/Interval";

import {
    JoinedTableContext, SimpleExprLiteralContext, SimpleExprColumnRefContext, SimpleExprListContext, SimpleExprVariableContext,
    SimpleExprRuntimeFunctionContext, SimpleExprFunctionContext, SimpleExprCollateContext, SimpleExprParamMarkerContext, SimpleExprSumContext,
    SimpleExprGroupingOperationContext, SimpleExprWindowingFunctionContext, SimpleExprConcatContext, SimpleExprUnaryContext, SimpleExprNotContext,
    SimpleExprSubQueryContext, SimpleExprOdbcContext, SimpleExprMatchContext, SimpleExprBinaryContext, SimpleExprCastContext, SimpleExprCaseContext,
    SimpleExprConvertContext, SimpleExprConvertUsingContext, SimpleExprDefaultContext, SimpleExprValuesContext, SimpleExprIntervalContext, SelectItemContext, ExprContext, ExprAndContext, ExprXorContext, ExprOrContext
} from '@wsporto/ts-mysql-parser';

import { ColumnDef, ColumnSchema, FieldName } from "./types";
import { createColumnTypeFomColumnSchema } from "./collect-constraints";

export function includeColumn(column: ColumnDef, table: string) {
    return column.table.toLowerCase() == table.toLowerCase() || column.tableAlias?.toLowerCase() == table.toLowerCase();
}

export function filterColumns(dbSchema: ColumnSchema[], withSchema: ColumnDef[], tableAlias: string | undefined, table: FieldName): ColumnDef[] {
    const tableColumns1 = dbSchema
        .filter(schema => schema.table.toLowerCase() == table.name.toLowerCase() && (schema.schema == table.prefix || table.prefix == ''))
        .map(tableColumn => {

            //name and colum are the same on the leaf table
            const r: ColumnDef = {
                columnName: tableColumn.column, columnType: createColumnTypeFomColumnSchema(tableColumn),
                notNull: tableColumn.notNull, table: table.name, tableAlias: tableAlias || '', columnKey: tableColumn.columnKey
            }
            return r;
        });
    const result = tableColumns1.concat(withSchema.filter(schema => schema.table.toLowerCase() == table.name.toLowerCase())).
        map(col => {
            const r: ColumnDef = {
                ...col,
                table: table.name,
                tableAlias: tableAlias
            }
            return r;
        })
    return result;

}

export function selectAllColumns(tablePrefix: string, fromColumns: ColumnDef[]) {
    const allColumns: ColumnDef[] = []; //TODO - FILTER
    fromColumns.forEach(column => {
        if (tablePrefix == '' || tablePrefix == column.tableAlias || tablePrefix == column.table) {
            allColumns.push(column);
        }
    });
    return allColumns;
}

export function getColumnName(selectItem: SelectItemContext) {
    const alias = selectItem.selectAlias()?.identifier()?.text;
    if (alias) {
        return alias;
    }
    const tokens = getSimpleExpressions(selectItem);
    let columnName = extractOriginalSql(selectItem.expr()!)!; //TODO VERIFICAR NULL
    if (tokens.length == 1 && tokens[0] instanceof SimpleExprColumnRefContext) {
        return splitName(tokens[0].text).name;
    }
    return columnName;
}

export function extractFieldsFromUsingClause(joinedTableContext: JoinedTableContext): string[] {
    const usingFieldsClause = joinedTableContext.identifierListWithParentheses()?.identifierList();
    if (usingFieldsClause) {
        return usingFieldsClause.text.split(',').map(field => field.trim());
    }
    return [];
}


export function splitName(fieldName: string): FieldName {
    const fieldNameSplit = fieldName.split('.');
    const result: FieldName = {
        name: fieldNameSplit.length == 2 ? fieldNameSplit[1] : fieldNameSplit[0],
        prefix: fieldNameSplit.length == 2 ? fieldNameSplit[0] : ''
    }
    const withoutStick: FieldName = {
        name: removeBackStick(result.name),
        prefix: result.prefix
    }
    return withoutStick;
}

function removeBackStick(name: string) {
    const withoutBackStick = name.startsWith("`") && name.endsWith("`") ? name.slice(1, -1) : name;
    return withoutBackStick;
}

export const functionAlias: ColumnSchema[] = [
    {
        column: 'CURRENT_DATE',
        column_type: 'date',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'CURRENT_TIME',
        column_type: 'time',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'CURRENT_TIMESTAMP',
        column_type: 'timestamp',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'LOCALTIME',
        column_type: 'datetime',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'LOCALTIMESTAMP',
        column_type: 'datetime',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'MICROSECOND',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'SECOND',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'MINUTE',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'HOUR',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'DAY',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'WEEK',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'MONTH',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'QUARTER',
        column_type: 'bigint',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'YEAR',
        column_type: 'year',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
]

export function findColumnSchema(tableName: string, columnName: string, dbSchema: ColumnSchema[]) {
    const found = dbSchema.find(col => col.table.toLowerCase() == tableName.toLowerCase()
        && col.column.toLowerCase() == columnName.toLowerCase());
    return found;
}

export function findColumn(fieldName: FieldName, columns: ColumnDef[]): ColumnDef {
    const found = findColumnOrNull(fieldName, columns);

    if (!found) {
        throw Error('column not found:' + JSON.stringify(fieldName));
    }
    return found;
}

export function findColumnOrNull(fieldName: FieldName, columns: ColumnDef[]): ColumnDef | undefined {

    const found = columns.find(col => col.columnName.toLowerCase() == fieldName.name.toLowerCase() &&
        (fieldName.prefix == '' || fieldName.prefix == col.tableAlias || fieldName.prefix == col.table));
    if (found) {
        return found;
    }

    const functionType = functionAlias.find(col => col.column.toLowerCase() == fieldName.name.toLowerCase());
    if (functionType) {
        const colDef: ColumnDef = {
            columnName: functionType.column,
            columnType: createColumnTypeFomColumnSchema(functionType),
            columnKey: functionType.columnKey,
            notNull: functionType.notNull,
            table: ''
        }
        return colDef;
    }

    return found;
}

export function extractOriginalSql(rule: ParserRuleContext) {

    const startIndex = rule.start.startIndex;
    const stopIndex = rule.stop?.stopIndex || startIndex;
    const interval = new Interval(startIndex, stopIndex);
    const result = rule.start.inputStream?.getText(interval);
    return result;
}

type Expr = {
    expr: ParseTree;
    isSubQuery: boolean;
}

export function getExpressions(ctx: RuleContext, exprType: any): Expr[] {

    const tokens: Expr[] = [];
    collectExpr(tokens, ctx, exprType);
    return tokens;
}

function collectExpr(tokens: Expr[], parent: ParseTree, exprType: any, isSubQuery = false) {

    if (parent instanceof exprType) {
        tokens.push({
            expr: parent,
            isSubQuery
        });
    }

    for (let i = 0; i < parent.childCount; i++) {
        const child = parent.getChild(i);
        if (!(child instanceof TerminalNode)) {
            collectExpr(tokens, child, exprType, (isSubQuery || child instanceof SimpleExprSubQueryContext));
        }
    }
}

export type ExpressionAndOperator = {
    operator: string;
    expr: ExprContext;
}

export function getTopLevelAndExpr(expr: ExprContext, all: ExpressionAndOperator[]) {

    if (expr instanceof ExprAndContext || expr instanceof ExprXorContext || expr instanceof ExprOrContext) {
        const exprLeft = expr.expr()[0];
        getTopLevelAndExpr(exprLeft, all);
        const exprRight = expr.expr()[1];
        all.push({
            operator: 'AND',
            expr: exprRight
        });
    } else {
        all.push({
            operator: 'AND',
            expr
        });
    }
}

export function getSimpleExpressions(ctx: RuleContext): ParseTree[] {

    const tokens: ParseTree[] = [];
    collectSimpleExpr(tokens, ctx);
    return tokens;
}

function collectSimpleExpr(tokens: ParseTree[], parent: ParseTree) {

    if (isSimpleExpression(parent)) {
        tokens.push(parent);
    }

    for (let i = 0; i < parent.childCount; i++) {
        const child = parent.getChild(i);
        if (!(child instanceof TerminalNode)) {
            collectSimpleExpr(tokens, child);
        }
    }
}

function isSimpleExpression(ctx: ParseTree) {
    return ctx instanceof SimpleExprVariableContext
        || ctx instanceof SimpleExprColumnRefContext
        || ctx instanceof SimpleExprRuntimeFunctionContext
        || ctx instanceof SimpleExprFunctionContext
        || ctx instanceof SimpleExprCollateContext
        || ctx instanceof SimpleExprLiteralContext
        || ctx instanceof SimpleExprParamMarkerContext
        || ctx instanceof SimpleExprSumContext
        || ctx instanceof SimpleExprGroupingOperationContext
        || ctx instanceof SimpleExprWindowingFunctionContext
        || ctx instanceof SimpleExprConcatContext
        || ctx instanceof SimpleExprUnaryContext
        || ctx instanceof SimpleExprNotContext
        || ctx instanceof SimpleExprListContext
        || ctx instanceof SimpleExprSubQueryContext
        || ctx instanceof SimpleExprOdbcContext
        || ctx instanceof SimpleExprMatchContext
        || ctx instanceof SimpleExprBinaryContext
        || ctx instanceof SimpleExprCastContext
        || ctx instanceof SimpleExprCaseContext
        || ctx instanceof SimpleExprConvertContext
        || ctx instanceof SimpleExprConvertUsingContext
        || ctx instanceof SimpleExprDefaultContext
        || ctx instanceof SimpleExprValuesContext
        || ctx instanceof SimpleExprIntervalContext;
}