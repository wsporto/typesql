import { C_expr_exprContext, Expr_listContext, InsertstmtContext, SelectstmtContext, StmtContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { PostgresTraverseResult } from './parser';
import { ParserRuleContext } from '@wsporto/typesql-parser';

export function traverseSmt(stmt: StmtContext): PostgresTraverseResult {
	const selectstmt = stmt.selectstmt();
	if (selectstmt) {
		const result = traverseSelectstmt(selectstmt);
		return result;
	}
	const insertstmt = stmt.insertstmt();
	if (insertstmt) {
		return traverseInsertstmt(insertstmt);
	}
	return {
		queryType: 'Select',
		columnsNullability: [],
		parameterList: []
	}

}

function collectContextsOfType(ctx: ParserRuleContext, targetType: any): ParserRuleContext[] {
	const results: ParserRuleContext[] = [];

	if (ctx instanceof targetType) {
		results.push(ctx);
	}

	ctx.children?.forEach(child => {
		if (child instanceof ParserRuleContext) {
			results.push(...collectContextsOfType(child, targetType));
		}
	});

	return results;
}


function traverseSelectstmt(selectstmt: SelectstmtContext): PostgresTraverseResult {

	const result = collectContextsOfType(selectstmt, C_expr_exprContext).filter(c_expr => (c_expr as any).PARAM());
	const paramIsListResult = result.map(param => paramIsList(param));

	return {
		queryType: 'Select',
		columnsNullability: [],
		parameterList: paramIsListResult
	};
}

function paramIsList(c_expr: ParserRuleContext) {
	// Traverse up the parent chain until we find an IN clause
	// This guarentee the param is a direct child of the in clause. Ex. id IN ($1);
	// Must return false for nested expressions. Ex. id IN (1, 2, CASE WHEN id = 1 THEN $1 ELSE $2);
	const a_expr_typecast = c_expr.parentCtx;
	const a_expr_collate = a_expr_typecast?.parentCtx;
	const a_expr_at_time_zone = a_expr_collate?.parentCtx;
	const a_expr_unary_sign = a_expr_at_time_zone?.parentCtx;
	const a_expr_caret = a_expr_unary_sign?.parentCtx;
	const a_expr_mul = a_expr_caret?.parentCtx;
	const a_expr_add = a_expr_mul?.parentCtx;
	const a_expr_unary_qualop = a_expr_add?.parentCtx;
	const a_expr_qual_op = a_expr_unary_qualop?.parentCtx;
	const a_expr_like = a_expr_qual_op?.parentCtx;
	const a_expr_compare = a_expr_like?.parentCtx;
	const a_expr_is_not = a_expr_compare?.parentCtx;
	const a_expr_isnull = a_expr_is_not?.parentCtx;
	const a_expr_unary_not = a_expr_isnull?.parentCtx;
	const a_expr_in = a_expr_unary_not?.parentCtx;
	const a_expr_between = a_expr_in?.parentCtx;
	const a_expr_and = a_expr_between?.parentCtx;
	const a_epxr_or = a_expr_and?.parentCtx;
	const a_expr_lessless = a_epxr_or?.parentCtx;
	const a_expr_qual = a_expr_lessless?.parentCtx;
	const a_expr = a_expr_qual?.parentCtx;
	const expr_list = a_expr?.parentCtx;
	return expr_list instanceof Expr_listContext;
}


function traverseInsertstmt(insertstmt: InsertstmtContext): PostgresTraverseResult {
	return {
		queryType: 'Insert',
		columnsNullability: [],
		parameterList: []
	}
}
