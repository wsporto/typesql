import {
	SimpleExprParamMarkerContext,
	PrimaryExprIsNullContext,
	FunctionCallContext,
	type ExprContext,
	type InsertQueryExpressionContext,
	type SelectStatementContext,
	type QueryExpressionContext,
	ParserRuleContext
} from '@wsporto/ts-mysql-parser';
import type { RuleContext } from '@wsporto/ts-mysql-parser';
import { getAllQuerySpecificationsFromSelectStatement } from './parse';

export function inferParamNullabilityQuery(
	queryContext: SelectStatementContext | InsertQueryExpressionContext
): boolean[] {
	const queriesSpecification =
		getAllQuerySpecificationsFromSelectStatement(queryContext);
	const parameters = queriesSpecification.flatMap((querySpec) =>
		getAllParameters(querySpec)
	);
	return parameters.map((param) => inferParameterNotNull(param));
}

export function inferParamNullabilityQueryExpression(
	queryExpression: QueryExpressionContext
) {
	const parameters = getAllParameters(queryExpression);
	return parameters.map((param) => inferParameterNotNull(param));
}

export function inferParamNullability(exprContext: ExprContext): boolean[] {
	const parameters = getAllParameters(exprContext);
	return parameters.map((param) => inferParameterNotNull(param));
}

export function inferParameterNotNull(
	param: SimpleExprParamMarkerContext
): boolean {
	return inferParameterNotNullRule(param);
}

function inferParameterNotNullRule(rule: RuleContext): boolean {
	const isNullContext = <PrimaryExprIsNullContext>(
		getParentContext(rule, PrimaryExprIsNullContext)
	);
	if (isNullContext) {
		if (isNullContext.notRule()) {
			return true;
		}
		return false;
	}

	const nullIfFunction = <FunctionCallContext>(
		getParentContext(rule, FunctionCallContext)
	);
	const functionIdentifier = nullIfFunction
		?.pureIdentifier()
		?.getText()
		.toLowerCase();
	if (functionIdentifier === 'nullif') {
		const expressionList = nullIfFunction.udfExprList()?.udfExpr_list();
		if (expressionList && expressionList.length === 2) {
			const firstArg = expressionList[0];
			const secondArg = expressionList[1];
			if (
				firstArg.getText() === '?' &&
				secondArg.getText().toLowerCase() === 'null'
			) {
				return false;
			}
		}
		return true;
	}
	if (functionIdentifier === 'ifnull') {
		return false;
	}

	const parent = rule.parentCtx;
	if (parent) {
		return inferParameterNotNullRule(parent);
	}

	return true;
}

function getAllParameters(
	tree: ParserRuleContext
): SimpleExprParamMarkerContext[] {
	const result: SimpleExprParamMarkerContext[] = [];
	collectSimpleExprParamMarker(tree, result);
	return result;
}

function collectSimpleExprParamMarker(
	tree: ParserRuleContext,
	result: SimpleExprParamMarkerContext[]
) {
	for (let i = 0; i < tree.getChildCount(); i++) {
		const child = tree.getChild(i);
		if (child instanceof SimpleExprParamMarkerContext) {
			result.push(child);
		} else if (child instanceof ParserRuleContext) {
			collectSimpleExprParamMarker(child, result);
		}
	}
}

export function getParentContext(
	ctx: RuleContext | undefined,
	parentContext: any
): RuleContext | undefined {
	if (ctx instanceof parentContext) {
		return ctx;
	}
	if (ctx) {
		return getParentContext(ctx.parentCtx, parentContext);
	}
	return undefined;
}
