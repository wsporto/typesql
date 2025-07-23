import { A_expr_andContext, A_expr_betweenContext, A_expr_inContext, A_expr_isnullContext, A_expr_lesslessContext, A_expr_orContext, A_expr_qualContext, A_expr_unary_notContext, A_exprContext, Case_defaultContext, ColumnrefContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { FieldName } from '../mysql-query-analyzer/types';
import { splitName } from '../mysql-query-analyzer/select-columns';
import { ParserRuleContext } from '@wsporto/typesql-parser';

function getSingleColumnRefOrNull(elseExpr: ParserRuleContext) {
	if (elseExpr.children?.length != 1) {
		return null;
	}
	const child = elseExpr.children[0];
	if (child instanceof ColumnrefContext) {
		return child;
	}
	if (child instanceof ParserRuleContext) { //composite
		return getSingleColumnRefOrNull(child);
	}
	return null;
}

export function evaluatesTrueIfNull(elseExpr: Case_defaultContext, a_expr: A_exprContext): boolean {
	// Can only infer if the elseExpr is a single column;
	const columnRef = getSingleColumnRefOrNull(elseExpr.a_expr());
	if (!columnRef) {
		return false;
	}
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		return evaluatesTrueIfNull_a_expr_qual(a_expr_qual, splitName(columnRef.getText()));
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_qual(a_expr_qual: A_expr_qualContext, field: FieldName): boolean {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return evaluatesTrueIfNull_a_expr_lessless(a_expr_lessless, field);
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, field: FieldName): boolean {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return evaluatesTrueIfNull_a_expr_or(a_expr_or, field);
	}
	return false;
}

//a_expr_or: "valueisnotnulland(id>0orvalueisnotnull)"
//a_expr_or: "valueisnotnullor(id>0orvalueisnotnull)"
function evaluatesTrueIfNull_a_expr_or(a_expr_or: A_expr_orContext, field: FieldName): boolean {
	const a_expr_and = a_expr_or.a_expr_and_list();
	if (a_expr_and) {
		//1. valueisnotnull
		//2. (id>0orvalueisnotnull)
		const result = a_expr_and.some(a_expr_and => evaluatesTrueIfNull_a_expr_and(a_expr_and, field));
		return result;
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_and(a_expr_and: A_expr_andContext, field: FieldName): boolean {
	const a_expr_between_list = a_expr_and.a_expr_between_list();
	if (a_expr_between_list) {
		return a_expr_between_list.every(a_expr_between => evaluatesTrueIfNull_a_expr_between(a_expr_between, field));
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_between(a_expr_between: A_expr_betweenContext, field: FieldName): boolean {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (a_expr_in) {
		return evaluatesTrueIfNull_a_expr_in(a_expr_in, field);
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_in(a_expr_in: A_expr_inContext, field: FieldName): boolean {
	const a_expr_unary_not = a_expr_in.a_expr_unary_not();
	if (a_expr_unary_not) {
		return evaluatesTrueIfNull_a_expr_unary_not(a_expr_unary_not, field);
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_unary_not(a_expr_unary_not: A_expr_unary_notContext, field: FieldName): boolean {
	const a_expr_isnull = a_expr_unary_not.a_expr_isnull();
	if (a_expr_isnull) {
		return evaluatesTrueIfNull_a_expr_isnull(a_expr_isnull, field);
	}
	return false;
}

function evaluatesTrueIfNull_a_expr_isnull(a_expr_isnull: A_expr_isnullContext, field: FieldName): boolean {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		const a_expr_compare = a_expr_is_not.a_expr_compare();
		if (!a_expr_compare) {
			return false;
		}
		const columnRef = getSingleColumnRefOrNull(a_expr_compare);
		if (!columnRef) {
			return false;
		}
		const fieldName = splitName(columnRef.getText());
		if (fieldName.name === field.name && (field.prefix === fieldName.prefix || fieldName.prefix === '' || field.prefix === '')
			&& a_expr_is_not.IS() && a_expr_is_not.NULL_P()) {
			if (a_expr_is_not.NOT()) {
				return false;
			}
			return true;
		}
		return false;
	}
	return false;
}
