import { QuerySpecificationContext, SimpleExprParamMarkerContext, QueryContext, PrimaryExprIsNullContext, FunctionCallContext, ExprContext } from "ts-mysql-parser";
import { RuleContext } from "antlr4ts";
import { ParseTree } from "antlr4ts/tree";
import { getQuerySpecificationsFromSelectStatement } from "./parse";

export function inferParamNullabilityQuery(queryContext: QueryContext) : boolean[] {

    const selectStatement = queryContext.simpleStatement()?.selectStatement();
    if (selectStatement) {
        const queriesSpecification = getQuerySpecificationsFromSelectStatement(selectStatement);
        const parameters = getAllParameters(queriesSpecification[0]);
        return parameters.map(param => inferParameterNotNull(param));
    }
    throw Error('invalid tree');
}

export function inferParamNullability(exprContext: ExprContext) : boolean[] {
    const parameters = getAllParameters(exprContext);
    return parameters.map(param => inferParameterNotNull(param));
}

export function inferParameterNotNull(param: SimpleExprParamMarkerContext): boolean {
    return inferParameterNotNullRule(param);
}

function inferParameterNotNullRule(rule: RuleContext) : boolean {
    const isNullContext = <PrimaryExprIsNullContext>getParentContext(rule, PrimaryExprIsNullContext);
    if (isNullContext) {
        if (isNullContext.notRule()) {
            return true;
        }
        return false;
    }

    const nullIfFunction = <FunctionCallContext>getParentContext(rule, FunctionCallContext);
    if (nullIfFunction) {
        const expressionList = nullIfFunction.udfExprList()?.udfExpr();
        if (expressionList && expressionList.length == 2) {
            const firstArg = expressionList[0];
            const secondArg = expressionList[1];
            if (firstArg.text == '?' && secondArg.text.toLowerCase() == 'null') {
                return false;
            }
        }
        return true;

    }

    const parent = rule.parent;
    if (parent) {
        return inferParameterNotNullRule(parent);
    }

    return true;
}

function getAllParameters(tree: ParseTree): SimpleExprParamMarkerContext[] {
    const result: SimpleExprParamMarkerContext[] = [];
    collectSimpleExprParamMarker(tree, result);
    return result;
}

function collectSimpleExprParamMarker(tree: ParseTree, result: SimpleExprParamMarkerContext[]) {
    for (let i = 0; i < tree.childCount; i++) {
        const child = tree.getChild(i);
        if (child instanceof SimpleExprParamMarkerContext) {
            result.push(child);
        }
        else {
            collectSimpleExprParamMarker(child, result);
        }
    }
}

export function getParentContext(ctx: RuleContext | undefined, parentContext: any): RuleContext | undefined {
    if (ctx instanceof parentContext) {
        return ctx;
    }
    if (ctx) {
        return getParentContext(ctx.parent, parentContext);
    }
    return undefined;

}