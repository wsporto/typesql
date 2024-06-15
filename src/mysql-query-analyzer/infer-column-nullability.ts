import {
    QuerySpecificationContext, SelectItemContext, ExprContext, ExprIsContext, BoolPriContext, PrimaryExprPredicateContext,
    PredicateContext, BitExprContext, SimpleExprContext, FunctionCallContext, SimpleExprFunctionContext, SimpleExprColumnRefContext,
    WhereClauseContext, SimpleExprListContext, PrimaryExprIsNullContext, PrimaryExprCompareContext, ExprNotContext, ExprAndContext,
    ExprXorContext, ExprOrContext, SimpleExprParamMarkerContext, SimpleExprLiteralContext, SimpleExprCaseContext, SimpleExprSumContext,
    SimpleExprSubQueryContext, SimpleExprRuntimeFunctionContext, SimpleExprIntervalContext, SimpleExprWindowingFunctionContext, WindowFunctionCallContext, SimpleExprCastContext, SubqueryContext, QueryExpressionOrParensContext, QueryExpressionContext, QueryExpressionBodyContext
} from '@wsporto/ts-mysql-parser';
import { ColumnSchema, FieldName, ColumnDef } from "./types";
import { findColumn, splitName, selectAllColumns } from "./select-columns";
import { getParentContext, inferParameterNotNull } from "./infer-param-nullability";
import { traverseQueryContext } from "./traverse";
import { parse } from "./parse";
import { preprocessSql } from "../describe-query";

//TODO - COLUMN SCHEMA DEFAULT = []
//utility for tests
export function parseAndInferNotNull(sql: string, dbSchema: ColumnSchema[]) {
    const { sql: processedSql, namedParameters } = preprocessSql(sql);
    const tree = parse(processedSql);
    const result = traverseQueryContext(tree, dbSchema, namedParameters);
    if (result.type == 'Select') {
        return result.columns.map(col => col.notNull);
    }
    return [];

}

export function inferNotNull(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) {

    const notNullInference: boolean[] = [];
    const whereClause = querySpec.whereClause();

    if (querySpec.selectItemList().MULT_OPERATOR()) {
        fromColumns.forEach(col => {
            const field = splitName(col.columnName);
            const notNull = col.notNull || (whereClause && !possibleNullWhere(field, whereClause)) || false;
            notNullInference.push(notNull); //TODO infernot null in where?
        })
    }

    querySpec.selectItemList().selectItem_list().forEach(selectItem => {
        notNullInference.push(...inferNotNullSelectItem(selectItem, dbSchema, fromColumns, whereClause));
    })
    return notNullInference;
}

function inferNotNullSelectItem(selectItem: SelectItemContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[], whereClause: WhereClauseContext | undefined): boolean[] {
    const notNullItems: boolean[] = [];
    const tableWild = selectItem.tableWild();
    if (tableWild?.MULT_OPERATOR()) {
        tableWild.identifier_list().forEach(tabWild => {
            const prefix = tabWild.getText();
            const columns = selectAllColumns(prefix, fromColumns);
            columns.forEach(col => {
                const field = splitName(col.columnName);
                const notNull = col.notNull || (whereClause && !possibleNullWhere(field, whereClause)) || false
                notNullItems.push(notNull);
            })
        });
        return notNullItems;

    }
    const expr = selectItem.expr();
    if (expr) {
        const notNull = inferNotNullExpr(expr, dbSchema, fromColumns);
        return [notNull];
    }
    throw Error('Error during column null inference');
}

function inferNotNullExpr(expr: ExprContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    if (expr instanceof ExprIsContext) {
        return inferNotNullExprIs(expr, dbSchema, fromColumns);
    }
    throw Error('Error during column null inference');
}

function inferNotNullExprIs(exprIs: ExprIsContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    const boolPri = exprIs.boolPri();
    return inferNotNullBoolPri(boolPri, dbSchema, fromColumns)
}

function inferNotNullBoolPri(boolPri: BoolPriContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    if (boolPri instanceof PrimaryExprPredicateContext) {
        const predicate = boolPri.predicate();
        return inferNotNullPredicate(predicate, dbSchema, fromColumns);
    }
    if (boolPri instanceof PrimaryExprCompareContext) {
        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.predicate();
        const notNullLeft = inferNotNullBoolPri(compareLeft, dbSchema, fromColumns);
        const notNullRight = inferNotNullPredicate(compareRight, dbSchema, fromColumns);
        return notNullLeft && notNullRight;
    }
    if (boolPri instanceof PrimaryExprIsNullContext) {
        return true;
    }
    throw Error('Error during column null inference');
}

function inferNotNullPredicate(predicate: PredicateContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    const bitExpr = predicate.bitExpr_list();
    if (bitExpr.length == 1) {
        return inferNotNullBitExpr(bitExpr[0], dbSchema, fromColumns);
    }
    throw Error('Error during column null inference');
}

function inferNotNullBitExpr(bitExpr: BitExprContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    const simpleExpr = bitExpr.simpleExpr();
    if (simpleExpr) {
        return inferNotNullSimpleExpr(simpleExpr, dbSchema, fromColumns);
    }
    const bitExpr2 = bitExpr.bitExpr_list();
    const notNull = bitExpr2.every(bitExprItem => inferNotNullBitExpr(bitExprItem, dbSchema, fromColumns))
    return notNull;
}

function inferNotNullSimpleExpr(simpleExpr: SimpleExprContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {

    const querySpec = <QuerySpecificationContext>getParentContext(simpleExpr, QuerySpecificationContext);
    const whereClause = querySpec.whereClause();

    if (simpleExpr instanceof SimpleExprColumnRefContext) {
        const columnName = simpleExpr.columnRef().fieldIdentifier().getText();
        const fieldName = splitName(columnName);
        const column = findColumn(fieldName, fromColumns);
        if (column.notNull) {
            return true;
        }
        if (whereClause && !possibleNullWhere(fieldName, whereClause)) {
            return true;
        };
        return false;
    }
    if (simpleExpr instanceof SimpleExprRuntimeFunctionContext) {
        return inferNotNullRuntimeFunctionCall(simpleExpr, dbSchema, fromColumns);
    }
    if (simpleExpr instanceof SimpleExprFunctionContext) {
        const functionCall = simpleExpr.functionCall();
        return inferNotNullFunctionCall(functionCall, dbSchema, fromColumns);
    }

    if (simpleExpr instanceof SimpleExprLiteralContext) {
        const nullLiteral = simpleExpr.literal().nullLiteral();
        if (nullLiteral) {
            return false;
        }
        return true;
    }

    if (simpleExpr instanceof SimpleExprParamMarkerContext) {
        const inferParam = inferParameterNotNull(simpleExpr);
        return inferParam;
    }

    if (simpleExpr instanceof SimpleExprSumContext) {
        const sumExpr = simpleExpr.sumExpr();
        if (sumExpr.COUNT_SYMBOL()) {
            return true;
        }
        if (sumExpr.GROUP_CONCAT_SYMBOL()) {
            const exprList = sumExpr.exprList()?.expr_list();
            if (exprList) {
                return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
            }
            //IF has not exprList, GROUP_CONCAT will concat all the fields from select
            return false; //TODO - INFER NULLABILITY
        }
        const inSumExpr = sumExpr.inSumExpr();
        if (inSumExpr) {
            return false;
        }

    }

    if (simpleExpr instanceof SimpleExprListContext) {
        const exprList = simpleExpr.exprList().expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }

    if (simpleExpr instanceof SimpleExprSubQueryContext) {
        if (simpleExpr.EXISTS_SYMBOL()) {
            return true;
        }
        return false;
    }

    if (simpleExpr instanceof SimpleExprCaseContext) {
        const thenExprList = simpleExpr.thenExpression_list();
        const elseExpr = simpleExpr.elseExpression();
        if (elseExpr) {
            let caseNotNull = thenExprList.every(thenExpr => inferNotNullExpr(thenExpr.expr(), dbSchema, fromColumns));
            return caseNotNull && inferNotNullExpr(elseExpr.expr(), dbSchema, fromColumns);
        }
        else {
            return false; //if doesn't have else, the not null can't be inferred
        }
    }
    if (simpleExpr instanceof SimpleExprIntervalContext) {
        const exprList = simpleExpr.expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));

    }
    if (simpleExpr instanceof SimpleExprWindowingFunctionContext) {
        return inferNotNullWindowFunctionCall(simpleExpr.windowFunctionCall(), dbSchema, fromColumns);
    }
    if (simpleExpr instanceof SimpleExprCastContext) {
        const expr = simpleExpr.expr();
        return inferNotNullExpr(expr, dbSchema, fromColumns);
    }
    throw Error('Error during column null inference. Expr: ' + simpleExpr.getText());
}

function inferNotNullWindowFunctionCall(windowFunctionCall: WindowFunctionCallContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) {
    if (windowFunctionCall.ROW_NUMBER_SYMBOL()
        || windowFunctionCall.RANK_SYMBOL()
        || windowFunctionCall.DENSE_RANK_SYMBOL()
        || windowFunctionCall.CUME_DIST_SYMBOL()
        || windowFunctionCall.PERCENT_RANK_SYMBOL()) {
        return true;
    }
    if (windowFunctionCall.LEAD_SYMBOL()
        || windowFunctionCall.LAG_SYMBOL()) {
        return false;
    }
    const exprWithParentheses = windowFunctionCall.exprWithParentheses()
    if (exprWithParentheses) {
        const expr = exprWithParentheses.expr();
        return inferNotNullExpr(expr, dbSchema, fromColumns);
    }
    throw Error('Error during column null inference in WindowFunctionCallContext');
}

function inferNotNullRuntimeFunctionCall(simpleExprRuntimeFunction: SimpleExprRuntimeFunctionContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) {
    const functionCall = simpleExprRuntimeFunction.runtimeFunctionCall();
    if (functionCall.NOW_SYMBOL() || functionCall.CURDATE_SYMBOL() || functionCall.CURTIME_SYMBOL()) {
        return true;
    }
    if (functionCall.MOD_SYMBOL()) {
        return false; //MOD(N,0) returns NULL.
    }
    if (functionCall.REPLACE_SYMBOL()) {
        const exprList = functionCall.expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    const trimFunction = functionCall.trimFunction();
    if (trimFunction) {
        const exprList = trimFunction.expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    const substringFunction = functionCall.substringFunction();
    if (substringFunction) {
        const exprList = substringFunction.expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    if (functionCall.YEAR_SYMBOL() || functionCall.MONTH_SYMBOL() || functionCall.DAY_SYMBOL()
        || functionCall.HOUR_SYMBOL() || functionCall.MINUTE_SYMBOL() || functionCall.SECOND_SYMBOL()) {
        const expr = functionCall.exprWithParentheses()?.expr()!;
        return inferNotNullExpr(expr, dbSchema, fromColumns);
    }
    if (functionCall.ADDDATE_SYMBOL()
        || functionCall.SUBDATE_SYMBOL()
        || functionCall.DATE_ADD_SYMBOL()
        || functionCall.DATE_SUB_SYMBOL()) {
        const exprList = functionCall.expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    if (functionCall.COALESCE_SYMBOL()) {
        const exprList = functionCall.exprListWithParentheses()?.exprList().expr_list()!;
        //COALEST: Return the first non-null value in a list
        return exprList.some(expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    if (functionCall.IF_SYMBOL()) {
        const exprList = functionCall.expr_list();
        return exprList.every(expr => inferNotNullExpr(expr, dbSchema, fromColumns));;
    }
    throw Error('Function not supported: ' + functionCall.getText());

}

function inferNotNullFunctionCall(functionCall: FunctionCallContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    const functionName = functionCall.pureIdentifier()?.getText().toLowerCase() || functionCall.qualifiedIdentifier()?.getText().toLowerCase();
    const udfExprList = functionCall.udfExprList()?.udfExpr_list();
    if (functionName == 'ifnull') {
        if (udfExprList) {
            const [expr1, expr2] = udfExprList;
            const notNull = inferNotNullExpr(expr1.expr(), dbSchema, fromColumns) || inferNotNullExpr(expr2.expr(), dbSchema, fromColumns);
            return notNull;
        }

        return false;
    }
    if (functionName == 'avg') {
        return false;
    }
    if (functionName == 'str_to_date') {
        return false; //invalid date
    }

    if (udfExprList) {
        return udfExprList.filter((expr, paramIndex) => {
            return functionName == 'timestampdiff' ? paramIndex != 0 : true //filter the first parameter of timestampdiff function
        }).every((udfExpr) => {
            const expr = udfExpr.expr();
            return inferNotNullExpr(expr, dbSchema, fromColumns);
        });
    }
    const exprList = functionCall.exprList()?.expr_list();
    if (exprList) {
        return exprList.every(expr => {
            return inferNotNullExpr(expr, dbSchema, fromColumns);
        });
    }

    return true;
}


function possibleNullWhere(field: FieldName, whereClause: WhereClauseContext): boolean {
    const expr = whereClause.expr();
    return possibleNull(field, expr);
}

export function possibleNull(field: FieldName, exprContext: ExprContext): boolean {
    if (exprContext instanceof ExprIsContext) {

        const boolPri = exprContext.boolPri();
        if (boolPri instanceof PrimaryExprPredicateContext) {
            const res = boolPri.predicate().bitExpr(0).simpleExpr();
            if (res instanceof SimpleExprListContext) {
                const expr = res.exprList().expr(0);
                return possibleNull(field, expr);
            }
            if (res instanceof SimpleExprSubQueryContext) { //exists, not exists
                return true; //possibleNull
            }
        }
        if (boolPri instanceof PrimaryExprIsNullContext) {
            const compare = boolPri.boolPri();
            if (boolPri.notRule() && areEquals(field, compare.getText())) {
                return false; //possibleNull
            }
        }
        if (boolPri instanceof PrimaryExprCompareContext) {
            let compare = boolPri.boolPri().getText(); //value > 10;
            let compare2 = boolPri.predicate().getText(); //10 < value
            //TODO - more complex expressions. ex. (value + value2) > 10; 
            if (areEquals(field, compare) || areEquals(field, compare2)) {
                return false;  //possibleNull
            }
        }
        return true; //possibleNull

    }
    if (exprContext instanceof ExprNotContext) {
        const expr = exprContext.expr();
        return possibleNull(field, expr);
    }
    if (exprContext instanceof ExprAndContext) {
        const [first, ...rest] = exprContext.expr_list();
        let possibleNullVar = possibleNull(field, first);
        rest.forEach(expr => {
            possibleNullVar = possibleNullVar && possibleNull(field, expr);
        })
        return possibleNullVar;
    }
    if (exprContext instanceof ExprXorContext) {
        const expressions = exprContext.expr_list();

    }
    if (exprContext instanceof ExprOrContext) {

        const [first, ...rest] = exprContext.expr_list();
        let possibleNullVar = possibleNull(field, first);
        rest.forEach(expr => {
            possibleNullVar = possibleNullVar || possibleNull(field, expr);
        })
        return possibleNullVar;
    }

    throw Error('Unknow type:' + exprContext.constructor.name);
}

function areEquals(field: FieldName, expressionField: string) {
    const compare = splitName(expressionField); //t1.name
    /*
    t1.name == t1.name
    t1.name == name
    name    == t1.name
    */
    return field.name == compare.name &&
        ((field.prefix == compare.prefix) || (field.prefix == '' || compare.prefix == ''))
}




