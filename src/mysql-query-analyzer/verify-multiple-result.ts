import {
    ExprContext, ExprIsContext, PrimaryExprCompareContext,
    ExprAndContext, SimpleExprColumnRefContext, ExprNotContext, ExprOrContext, BoolPriContext, PredicateContext
} from '@wsporto/ts-mysql-parser';
import { getSimpleExpressions, splitName, findColumn } from "./select-columns";
import { ColumnDef } from "./types";

export function verifyMultipleResult(exprContext: ExprContext, fromColumns: ColumnDef[]): boolean {
    if (exprContext instanceof ExprIsContext) {

        const boolPri = exprContext.boolPri();

        if (boolPri instanceof PrimaryExprCompareContext) {
            if (boolPri.compOp().EQUAL_OPERATOR()) {
                let compareLeft = boolPri.boolPri();
                let compareRight = boolPri.predicate();
                if (isUniqueKeyComparation(compareLeft, fromColumns) || isUniqueKeyComparation(compareRight, fromColumns)) {
                    return false; //multipleRow = false
                }
            }
            return true; //multipleRow = true

        }
        return true; //multipleRow

    }
    if (exprContext instanceof ExprNotContext) {
        return true;
    }
    if (exprContext instanceof ExprAndContext) {
        const oneIsSingleResult = exprContext.expr().some(expr => verifyMultipleResult(expr, fromColumns) == false)
        return oneIsSingleResult == false;
    }
    // if (exprContext instanceof ExprXorContext) {
    //     const expressions = exprContext.expr();
    // }
    if (exprContext instanceof ExprOrContext) {
        return true; //multipleRow = true
    }

    throw Error('Unknow type:' + exprContext.constructor.name);
}

function isUniqueKeyComparation(compare: BoolPriContext | PredicateContext, fromColumns: ColumnDef[]) {
    const tokens = getSimpleExpressions(compare);
    if (tokens.length == 1 && tokens[0] instanceof SimpleExprColumnRefContext) {
        const fieldName = splitName(tokens[0].text);
        const col = findColumn(fieldName, fromColumns);
        if (col.columnKey == 'PRI' || col.columnKey == 'UNI') { //TODO - UNIQUE
            return true; //isUniqueKeyComparation = true
        }
    }
    return false; //isUniqueKeyComparation = false
}