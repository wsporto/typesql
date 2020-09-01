import { parse, getQuerySpecificationsFromSelectStatement } from "./parse";
import { QuerySpecificationContext, SelectItemContext, ExprContext, ExprIsContext, BoolPriContext, PrimaryExprPredicateContext, 
    PredicateContext, BitExprContext, SimpleExprContext, FunctionCallContext, SimpleExprFunctionContext, SimpleExprColumnRefContext, 
    WhereClauseContext, SimpleExprListContext, PrimaryExprIsNullContext, PrimaryExprCompareContext, ExprNotContext, ExprAndContext, 
    ExprXorContext, ExprOrContext, SimpleExprParamMarkerContext, SimpleExprLiteralContext, SimpleExprCaseContext, SimpleExprSumContext, 
    SimpleExprSubQueryContext, 
    SimpleExprRuntimeFunctionContext} from "ts-mysql-parser";
import { ColumnSchema, ColumnDef, FieldName } from "./types";
import { getColumnsFrom, findColumn, splitName, selectAllColumns } from "./select-columns";
import { getParentContext, inferParameterNotNull } from "./infer-param-nullability";

export function parseAndInferNotNull(sql: string, dbSchema: ColumnSchema[]) {
    const queryTree = parse(sql);
    const selectStatement = queryTree.simpleStatement()?.selectStatement();
    if(selectStatement) {
        const queries = getQuerySpecificationsFromSelectStatement(selectStatement);
        const notNullAllQueries = queries.map( query => inferNotNull(query, dbSchema)); //TODO - UNION
        const result = zip(notNullAllQueries).map( notNullColumn => notNullColumn.every(notNull => notNull == true));
        return result;

    }
}

function zip(arrays: boolean[][]): boolean[][] {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}

export function inferNotNull(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[]) {
    const fromColumns = getColumnsFrom(querySpec, dbSchema); //TODO - called twice

    const notNullInference : boolean[] = [];
    const whereClause = querySpec.whereClause();

    if(querySpec.selectItemList().MULT_OPERATOR()) {
        fromColumns.forEach( col => {
            const field = splitName(col.columnName);
            const notNull = col.notNull || (whereClause && !possibleNullWhere(field, whereClause)) || false;
            notNullInference.push(notNull); //TODO infernot null in where?
        })
    }

    querySpec.selectItemList().selectItem().forEach( selectItem => {
        notNullInference.push(...inferNotNullSelectItem(selectItem, dbSchema, fromColumns, whereClause));
    })
    return notNullInference;
}

function inferNotNullSelectItem(selectItem: SelectItemContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[], whereClause: WhereClauseContext | undefined) : boolean[] {
    const notNullItems : boolean[] = [];
    const tableWild = selectItem.tableWild();
    if (tableWild?.MULT_OPERATOR()) { //TODO: DUPLICATED CODE FROM WALKER
        tableWild.identifier().forEach(tabWild => {
            const prefix = tabWild.text;
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
    if(expr) {
        const notNull = inferNotNullExpr(expr, dbSchema, fromColumns);
        return [notNull];
    }
    throw Error('Error during column null inference');
}

function inferNotNullExpr(expr: ExprContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    if(expr instanceof ExprIsContext) {
        return inferNotNullExprIs(expr, dbSchema, fromColumns);
    }
    throw Error('Error during column null inference');
}

function inferNotNullExprIs(exprIs: ExprIsContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) : boolean {
    const boolPri = exprIs.boolPri();
    return inferNotNullBoolPri(boolPri, dbSchema, fromColumns)
}

function inferNotNullBoolPri(boolPri: BoolPriContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) : boolean {
    if(boolPri instanceof PrimaryExprPredicateContext) {
        const predicate = boolPri.predicate();
        return inferNotNullPredicate(predicate, dbSchema, fromColumns);
    }
    if(boolPri instanceof PrimaryExprCompareContext) {
        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.predicate();
        const notNullLeft = inferNotNullBoolPri(compareLeft, dbSchema, fromColumns);
        const notNullRight = inferNotNullPredicate(compareRight, dbSchema, fromColumns);
        return notNullLeft && notNullRight;
    }
    throw Error('Error during column null inference');
}

function inferNotNullPredicate(predicate: PredicateContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) : boolean {
    const bitExpr = predicate.bitExpr();
    if(bitExpr.length == 1) {
        return inferNotNullBitExpr(bitExpr[0], dbSchema, fromColumns);
    }
    throw Error('Error during column null inference');
}

function inferNotNullBitExpr(bitExpr: BitExprContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) : boolean {
    const simpleExpr = bitExpr.simpleExpr();
    if(simpleExpr) {
        return inferNotNullSimpleExpr(simpleExpr, dbSchema, fromColumns);
    }
    const bitExpr2 = bitExpr.bitExpr();
    if(bitExpr2.length == 2) {
        return inferNotNullBitExpr(bitExpr2[0], dbSchema, fromColumns) && inferNotNullBitExpr(bitExpr2[1], dbSchema, fromColumns);
    }
    throw Error('Error during column null inference');
}

function inferNotNullSimpleExpr(simpleExpr: SimpleExprContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) : boolean {

    const querySpec = <QuerySpecificationContext>getParentContext(simpleExpr, QuerySpecificationContext);
    const whereClause = querySpec.whereClause();

    if(simpleExpr instanceof SimpleExprColumnRefContext) {
        const columnName = simpleExpr.columnRef().fieldIdentifier().text;
        const fieldName = splitName(columnName);
        const column = findColumn(fieldName, fromColumns);
        return column.notNull || (whereClause && !possibleNullWhere(fieldName, whereClause) || false);
    }
    if(simpleExpr instanceof SimpleExprRuntimeFunctionContext) {
        return inferNotNullRuntimeFunctionCall(simpleExpr, dbSchema, fromColumns);
    }
    if(simpleExpr instanceof SimpleExprFunctionContext) {
        const functionCall = simpleExpr.functionCall();
        return inferNotNullFunctionCall(functionCall, dbSchema, fromColumns);
    }

    if(simpleExpr instanceof SimpleExprLiteralContext) {
        const nullLiteral = simpleExpr.literal().nullLiteral();
        if (nullLiteral) {
            return false;
        }
        return true;
    }

    if(simpleExpr instanceof SimpleExprParamMarkerContext) {
        const inferParam = inferParameterNotNull(simpleExpr);
        return inferParam;
    }

    if(simpleExpr instanceof SimpleExprSumContext) {
        const sumExpr = simpleExpr.sumExpr();
        if(sumExpr.COUNT_SYMBOL()) {
            return true;
        }
        const inSumExpr = sumExpr.inSumExpr();
        if(inSumExpr) {
            return false;
        }
        

    }

    if(simpleExpr instanceof SimpleExprSubQueryContext) {
        return false;
    }

    if(simpleExpr instanceof SimpleExprCaseContext) {
        const thenExprList = simpleExpr.thenExpression();
        const elseExpr = simpleExpr.elseExpression();
        if(elseExpr) {
            let caseNotNull = thenExprList.every( thenExpr => inferNotNullExpr(thenExpr.expr(), dbSchema, fromColumns ));
            return caseNotNull && inferNotNullExpr(elseExpr.expr(), dbSchema, fromColumns);
        }
        else {
            return false; //if doesn't have else, the not null can't be inferred
        }
    }
    throw Error('Error during column null inference');
}

function inferNotNullRuntimeFunctionCall(simpleExprRuntimeFunction: SimpleExprRuntimeFunctionContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]) {
    const functionCall = simpleExprRuntimeFunction.runtimeFunctionCall();
    if(functionCall.NOW_SYMBOL() || functionCall.CURDATE_SYMBOL() || functionCall.CURTIME_SYMBOL()) {
        return true;
    }
    const trimFunction = functionCall.trimFunction();
    if(trimFunction) {
        const exprList = trimFunction.expr();
        return exprList.every( expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    const substringFunction = functionCall.substringFunction();
    if(substringFunction) {
        const exprList = substringFunction.expr();
        return exprList.every( expr => inferNotNullExpr(expr, dbSchema, fromColumns));
    }
    throw Error ('Function not supported: ' + functionCall.text);

}

function inferNotNullFunctionCall(functionCall: FunctionCallContext, dbSchema: ColumnSchema[], fromColumns: ColumnDef[]): boolean {
    const functionName = functionCall.pureIdentifier()?.text.toLowerCase() || functionCall.qualifiedIdentifier()?.text.toLowerCase();
    if(functionName == 'ifnull') {
        return false;
    }
    if(functionName == 'avg') {
        return false;
    }
    if(functionName == 'str_to_date') {
        return false; //invalid date
    }
    const udfExprList = functionCall.udfExprList()?.udfExpr();
    if(udfExprList) {
        return udfExprList.every( udfExpr => {
            const expr = udfExpr.expr();
            return inferNotNullExpr(expr, dbSchema, fromColumns);
        });
    }
    const exprList = functionCall.exprList()?.expr();
    if(exprList) {
        return exprList.every( expr => {
            return inferNotNullExpr(expr, dbSchema, fromColumns);
        });
    }

    return true;
}


function possibleNullWhere(field: FieldName, whereClause: WhereClauseContext) : boolean {
    const expr = whereClause.expr();
    return possibleNull(field, expr);
}

function possibleNull(field: FieldName, exprContext: ExprContext) : boolean {
    if (exprContext instanceof ExprIsContext) {

        const boolPri = exprContext.boolPri();
        if (boolPri instanceof PrimaryExprPredicateContext) {
            const res = boolPri.predicate().bitExpr()[0].simpleExpr();
            if (res instanceof SimpleExprListContext) {
                const expr = res.exprList().expr()[0];
                return possibleNull(field, expr);
            }
        }
        if (boolPri instanceof PrimaryExprIsNullContext) {
            const compare = boolPri.boolPri();
            if (boolPri.notRule() && areEquals(field, compare.text)) {
                return false; //possibleNull
            }
        }
        if (boolPri instanceof PrimaryExprCompareContext) {
            let compare = boolPri.boolPri().text; //value > 10;
            let compare2 = boolPri.predicate().text; //10 < value
            //TODO - more complex expressions. ex. (value + value2) > 10; 
            if (areEquals(field, compare) || areEquals(field, compare2)) {
                return false;  //possibleNull
            }
        }
        return true; //possibleNull

    }
    if (exprContext instanceof ExprNotContext) {
        const expr = exprContext.expr();
        return !possibleNull(field, expr);
    }
    if (exprContext instanceof ExprAndContext) {
        const [first, ...rest] = exprContext.expr();
        let possibleNullVar = possibleNull(field, first);
        rest.forEach(expr => {
            possibleNullVar = possibleNullVar && possibleNull(field, expr);
        })
        return possibleNullVar;
    }
    if (exprContext instanceof ExprXorContext) {
        const expressions = exprContext.expr();

    }
    if (exprContext instanceof ExprOrContext) {

        const [first, ...rest] = exprContext.expr();
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




