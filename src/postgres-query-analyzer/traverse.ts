import { A_expr_addContext, A_expr_andContext, A_expr_at_time_zoneContext, A_expr_betweenContext, A_expr_caretContext, A_expr_collateContext, A_expr_compareContext, A_expr_inContext, A_expr_is_notContext, A_expr_isnullContext, A_expr_lesslessContext, A_expr_likeContext, A_expr_mulContext, A_expr_orContext, A_expr_qual_opContext, A_expr_qualContext, A_expr_typecastContext, A_expr_unary_notContext, A_expr_unary_qualopContext, A_expr_unary_signContext, A_exprContext, C_expr_caseContext, C_expr_existsContext, C_expr_exprContext, C_exprContext, ColidContext, ColumnrefContext, Common_table_exprContext, DeletestmtContext, Expr_listContext, From_clauseContext, From_listContext, Func_applicationContext, Func_arg_exprContext, Func_expr_common_subexprContext, Func_exprContext, IdentifierContext, In_expr_listContext, In_expr_selectContext, In_exprContext, Insert_column_itemContext, InsertstmtContext, Join_qualContext, Qualified_nameContext, Relation_exprContext, Select_clauseContext, Select_no_parensContext, Select_with_parensContext, SelectstmtContext, Set_clauseContext, Simple_select_intersectContext, Simple_select_pramaryContext, StmtContext, Table_refContext, Target_elContext, Target_labelContext, Target_listContext, Unreserved_keywordContext, UpdatestmtContext, Values_clauseContext, When_clauseContext, Where_clauseContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { ParserRuleContext } from '@wsporto/typesql-parser';
import { PostgresColumnSchema } from '../drivers/types';
import { splitName } from '../mysql-query-analyzer/select-columns';
import { FieldName } from '../mysql-query-analyzer/types';
import { QueryType } from '../types';

type NotNullInfo = {
	table_schema: string;
	table_name: string;
	column_name: string;
	is_nullable: boolean;
}

type NotNullInfoResult = {
	column_name: string;
	is_nullable: boolean;
}

export type PostgresTraverseResult = {
	queryType: QueryType;
	multipleRowsResult: boolean;
	columnsNullability: boolean[];
	parametersNullability: boolean[];
	whereParamtersNullability?: boolean[];
	parameterList: boolean[];
	limit?: number;
	returning?: boolean;
}

type ParamInfo = {
	paramIndex: number;
	isNotNull: boolean;
}

type TraverseResult = {
	columnsNullability: boolean[],
	parameters: ParamInfo[],
	singleRow: boolean;
}

export function traverseSmt(stmt: StmtContext, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const traverseResult: TraverseResult = {
		columnsNullability: [],
		parameters: [],
		singleRow: false
	}
	const selectstmt = stmt.selectstmt();
	if (selectstmt) {
		const result = traverseSelectstmt(selectstmt, dbSchema, [], traverseResult);
		return result;
	}
	const insertstmt = stmt.insertstmt();
	if (insertstmt) {
		return traverseInsertstmt(insertstmt, dbSchema);
	}
	const updatestmt = stmt.updatestmt();
	if (updatestmt) {
		return traverseUpdatestmt(updatestmt, dbSchema, traverseResult);
	}
	const deletestmt = stmt.deletestmt();
	if (deletestmt) {
		return traverseDeletestmt(deletestmt, dbSchema, traverseResult);
	}
	throw Error('Stmt not supported: ' + stmt.getText());
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


function traverseSelectstmt(selectstmt: SelectstmtContext, dbSchema: PostgresColumnSchema[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): PostgresTraverseResult {

	const result = collectContextsOfType(selectstmt, C_expr_exprContext).filter(c_expr => (c_expr as any).PARAM());
	const paramIsListResult = result.map(param => paramIsList(param));


	const columns = traverse_selectstmt(selectstmt, dbSchema, fromColumns, traverseResult);
	//select parameters are collected after from paramters
	traverseResult.parameters.sort((param1, param2) => param1.paramIndex - param2.paramIndex);
	const columnsNullability = columns.map(col => !col.is_nullable);

	const multipleRowsResult = !isSingleRowResult(selectstmt, dbSchema);

	const limit = checkLimit(selectstmt);
	return {
		queryType: 'Select',
		multipleRowsResult,
		columnsNullability,
		parametersNullability: traverseResult.parameters.map(param => param.isNotNull),
		parameterList: paramIsListResult,
		limit
	};
}

function traverse_selectstmt(selectstmt: SelectstmtContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const select_no_parens = selectstmt.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, dbSchema, fromColumns, traverseResult);
	}
	return [];
}

function traverse_select_no_parens(select_no_parens: Select_no_parensContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	let withColumns: NotNullInfo[] = [];
	const with_clause = select_no_parens.with_clause()
	if (with_clause) {
		with_clause.cte_list().common_table_expr_list()
			.forEach(common_table_expr => {
				const withResult = traverse_common_table_expr(common_table_expr, dbSchema, withColumns.concat(fromColumns), traverseResult);
				withColumns.push(...withResult);
			});
	}
	const select_clause = select_no_parens.select_clause();
	if (select_clause) {
		return traverse_select_clause(select_clause, dbSchema, withColumns.concat(fromColumns), traverseResult);
	}
	return [];
}

function traverse_common_table_expr(common_table_expr: Common_table_exprContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult) {
	const tableName = common_table_expr.name().getText();
	const select_stmt = common_table_expr.preparablestmt().selectstmt();
	if (select_stmt) {
		const columns = traverse_selectstmt(select_stmt, dbSchema, fromColumns, traverseResult);
		const columnsWithTalbeName = columns.map(col => ({ ...col, table_name: tableName }));
		return columnsWithTalbeName;
	}
	return [];
}

function traverse_select_clause(select_clause: Select_clauseContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const simple_select_intersect_list = select_clause.simple_select_intersect_list();
	let selectColumns: NotNullInfo[] = [];
	if (simple_select_intersect_list) {
		selectColumns = traverse_simple_select_intersect(simple_select_intersect_list[0], dbSchema, fromColumns, traverseResult);
	}
	//union
	for (let index = 1; index < simple_select_intersect_list.length; index++) {
		const unionNotNull = traverse_simple_select_intersect(simple_select_intersect_list[index], dbSchema, fromColumns, traverseResult);
		selectColumns = selectColumns.map((value, columnIndex) => {
			const col: NotNullInfo = {
				...value,
				is_nullable: value.is_nullable || unionNotNull[columnIndex].is_nullable
			}
			return col;
		});
	}

	return selectColumns;
}

function traverse_simple_select_intersect(simple_select_intersect: Simple_select_intersectContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const simple_select_pramary = simple_select_intersect.simple_select_pramary_list()[0];
	if (simple_select_pramary) {
		return traverse_simple_select_pramary(simple_select_pramary, dbSchema, fromColumns, traverseResult);
	}
	return [];
}

function traverse_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, dbSchema: NotNullInfo[], parentFromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const fromColumns: NotNullInfo[] = [];

	const from_clause = simple_select_pramary.from_clause();
	if (from_clause) {
		const where_clause = simple_select_pramary.where_clause();
		const fields = traverse_from_clause(from_clause, dbSchema, parentFromColumns, traverseResult);
		const fieldsNotNull = where_clause != null ? fields.map(field => checkIsNullable(where_clause, field)) : fields;
		fromColumns.push(...fieldsNotNull);
	}
	const values_clause = simple_select_pramary.values_clause();
	if (values_clause) {
		const valuesColumns = traverse_values_clause(values_clause, dbSchema, parentFromColumns, traverseResult);
		return valuesColumns;
	}
	const where_a_expr = simple_select_pramary.where_clause()?.a_expr();
	if (where_a_expr) {
		traverse_a_expr(where_a_expr, dbSchema, parentFromColumns.concat(fromColumns), traverseResult);
	}
	const filteredColumns = filterColumns_simple_select_pramary(simple_select_pramary, dbSchema, parentFromColumns.concat(fromColumns), traverseResult);
	return filteredColumns;
}

function traverse_values_clause(values_clause: Values_clauseContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const expr_list_list = values_clause.expr_list_list();
	if (expr_list_list) {
		return expr_list_list.flatMap(expr_list => traverse_expr_list(expr_list, dbSchema, fromColumns, traverseResult));
	}
	return [];
}

function traverse_expr_list(expr_list: Expr_listContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const columns = expr_list.a_expr_list().map(a_expr => {
		const notNull = traverse_a_expr(a_expr, dbSchema, fromColumns, traverseResult);
		const result: NotNullInfo = {
			column_name: a_expr.getText(),
			is_nullable: !notNull,
			table_name: '',
			table_schema: ''
		}
		return result;
	});
	return columns;
}

function filterColumns_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const target_list_ = simple_select_pramary.target_list_();
	if (target_list_) {
		const target_list = target_list_.target_list();
		if (target_list) {
			return traverse_target_list(target_list, dbSchema, fromColumns, traverseResult);
		}
	}
	const target_list = simple_select_pramary.target_list();
	if (target_list) {
		return traverse_target_list(target_list, dbSchema, fromColumns, traverseResult);
	}
	return [];
}

function traverse_target_list(target_list: Target_listContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const columns = target_list.target_el_list().flatMap(target_el => {
		const fieldName = splitName(target_el.getText());
		if (fieldName.name == '*') {
			const columns = filterColumns(fromColumns, fieldName);
			return columns;
		}
		const column = isNotNull_target_el(target_el, dbSchema, fromColumns, traverseResult);
		return [column];
	})
	return columns;
}

function isNotNull_target_el(target_el: Target_elContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo {
	if (target_el instanceof Target_labelContext) {
		const a_expr = target_el.a_expr();
		const exprResult = traverse_a_expr(a_expr, dbSchema, fromColumns, traverseResult);
		const colLabel = target_el.colLabel();
		const alias = colLabel != null ? colLabel.getText() : '';
		const fieldName = splitName(a_expr.getText());
		return {
			column_name: alias || fieldName.name,
			is_nullable: exprResult.is_nullable,
			table_name: fieldName.prefix,
			table_schema: ''
		};
	}
	throw Error('Column not found');
}

function traverse_a_expr(a_expr: A_exprContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		const notNull = traverse_a_expr_qual(a_expr_qual, dbSchema, fromColumns, traverseResult);
		return notNull;
	}
	return {
		column_name: '',
		is_nullable: true
	};
}

function traverse_a_expr_qual(a_expr_qual: A_expr_qualContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return traverse_a_expr_lessless(a_expr_lessless, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_a_expr_qual -  Not expected:' + a_expr_qual.getText());
}

function traverse_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return traverse_expr_or(a_expr_or, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_a_expr_lessless -  Not expected:' + a_expr_lessless.getText());
}

function traverse_expr_or(a_expr_or: A_expr_orContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_and = a_expr_or.a_expr_and_list()[0];
	if (a_expr_and) {
		return traverse_expr_and(a_expr_and, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_or -  Not expected:' + a_expr_or.getText());
}

function traverse_expr_and(a_expr_and: A_expr_andContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const result = a_expr_and.a_expr_between_list().map(a_expr_between => traverse_expr_between(a_expr_between, dbSchema, fromColumns, traverseResult));

	return {
		column_name: a_expr_and.getText(),
		is_nullable: result.some(col => col.is_nullable)
	} satisfies NotNullInfoResult;
}

function traverse_expr_between(a_expr_between: A_expr_betweenContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (a_expr_in) {
		return traverse_expr_in(a_expr_in, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_between -  Not expected:' + a_expr_between.getText());
}

function traverse_expr_in(a_expr_in: A_expr_inContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_unary = a_expr_in.a_expr_unary_not();
	let leftExprResult = undefined;
	if (a_expr_unary) {
		leftExprResult = traverse_expr_unary(a_expr_unary, dbSchema, fromColumns, traverseResult);
	}
	const in_expr = a_expr_in.in_expr();
	if (in_expr) {
		traverse_in_expr(in_expr, dbSchema, fromColumns, traverseResult);
	}
	return {
		column_name: a_expr_in.getText(),
		//id in (...)  -> is_nullable: false
		// value -> is_nullable = leftExprResult.is_nullable
		is_nullable: in_expr != null ? false : leftExprResult!.is_nullable
	} satisfies NotNullInfoResult
}

function traverse_in_expr(in_expr: In_exprContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult) {
	if (in_expr instanceof In_expr_selectContext) {
		const select_with_parens = in_expr.select_with_parens();
		traverse_select_with_parens(select_with_parens, dbSchema, fromColumns, traverseResult);
	}
	if (in_expr instanceof In_expr_listContext) {
		in_expr.expr_list().a_expr_list().forEach(a_expr => {
			traverse_a_expr(a_expr, dbSchema, fromColumns, traverseResult);
		})
	}
}

function traverse_expr_unary(a_expr_unary: A_expr_unary_notContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_isnull = a_expr_unary.a_expr_isnull();
	if (a_expr_isnull) {
		return traverse_expr_isnull(a_expr_isnull, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_unary -  Not expected:' + a_expr_unary.getText());
}

function traverse_expr_isnull(a_expr_isnull: A_expr_isnullContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		return traverse_expr_is_not(a_expr_is_not, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_isnull -  Not expected:' + a_expr_isnull.getText());
}

function traverse_expr_is_not(a_expr_is_not: A_expr_is_notContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_compare = a_expr_is_not.a_expr_compare();
	if (a_expr_compare) {
		return traverse_expr_compare(a_expr_compare, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_is_not -  Not expected:' + a_expr_is_not.getText());
}

function traverse_expr_compare(a_expr_compare: A_expr_compareContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_like_list = a_expr_compare.a_expr_like_list();
	if (a_expr_like_list) {
		const result = a_expr_like_list.map(a_expr_like => traverse_expr_like(a_expr_like, dbSchema, fromColumns, traverseResult));
		return {
			column_name: a_expr_compare.getText(),
			is_nullable: result.some(col => col.is_nullable)
		}
	}
	throw Error('traverse_expr_compare -  Not expected:' + a_expr_compare.getText());
}

function traverse_expr_like(a_expr_like: A_expr_likeContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_qual_op_list = a_expr_like.a_expr_qual_op_list();
	if (a_expr_qual_op_list) {
		const result = a_expr_qual_op_list.map(a_expr_qual_op => traverse_expr_qual_op(a_expr_qual_op, dbSchema, fromColumns, traverseResult));
		return {
			column_name: a_expr_like.getText(),
			is_nullable: result.some(col => col.is_nullable)
		} satisfies NotNullInfoResult
	}
	throw Error('traverse_expr_like -  Not expected:' + a_expr_like.getText());
}

function traverse_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_unary_qualop = a_expr_qual_op.a_expr_unary_qualop_list()[0];
	if (a_expr_unary_qualop) {
		return traverse_expr_unary_qualop(a_expr_unary_qualop, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_qual_op -  Not expected:' + a_expr_qual_op.getText());
}

function traverse_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		const exprResult = a_expr_add.a_expr_mul_list().map(a_expr_mul => traverse_expr_mul(a_expr_mul, dbSchema, fromColumns, traverseResult));
		const result: NotNullInfoResult = {
			column_name: a_expr_unary_qualop.getText(),
			is_nullable: exprResult.some(col => col.is_nullable)
		}
		return result;
	}
	throw Error('traverse_expr_unary_qualop -  Not expected:' + a_expr_unary_qualop.getText());
}

function traverse_expr_mul(a_expr_mul: A_expr_mulContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_mul_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_mul_list) {
		const notNullInfo = a_expr_mul.a_expr_caret_list().map(a_expr_caret => traverse_expr_caret(a_expr_caret, dbSchema, fromColumns, traverseResult));
		const result: NotNullInfoResult = {
			column_name: a_expr_mul.getText(),
			is_nullable: notNullInfo.some(notNullInfo => notNullInfo.is_nullable)
		}
		return result;
	}
	throw Error('traverse_expr_mul -  Not expected:' + a_expr_mul.getText());
}

function traverse_expr_caret(a_expr_caret: A_expr_caretContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_unary_sign_list = a_expr_caret.a_expr_unary_sign_list();
	if (a_expr_unary_sign_list) {
		const notNullInfo = a_expr_caret.a_expr_unary_sign_list()
			.map(a_expr_unary_sign => traverse_expr_unary_sign(a_expr_unary_sign, dbSchema, fromColumns, traverseResult));
		const result: NotNullInfoResult = {
			column_name: a_expr_caret.getText(),
			is_nullable: notNullInfo.some(notNullInfo => notNullInfo.is_nullable)
		}
		return result;
	}
	throw Error('traverse_expr_caret -  Not expected:' + a_expr_caret.getText());
}

function traverse_expr_unary_sign(a_expr_unary_sign: A_expr_unary_signContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_at_time_zone = a_expr_unary_sign.a_expr_at_time_zone();
	if (a_expr_at_time_zone) {
		return traverse_expr_at_time_zone(a_expr_at_time_zone, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_unary_sign -  Not expected:' + a_expr_unary_sign.getText());
}

function traverse_expr_at_time_zone(a_expr_at_time_zone: A_expr_at_time_zoneContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_collate = a_expr_at_time_zone.a_expr_collate();
	if (a_expr_collate) {
		return traverse_expr_collate(a_expr_collate, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_at_time_zone -  Not expected:' + a_expr_at_time_zone.getText());
}

function traverse_expr_collate(a_expr_collate: A_expr_collateContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const a_expr_typecast = a_expr_collate.a_expr_typecast();
	if (a_expr_typecast) {
		return traverse_expr_typecast(a_expr_typecast, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_collate -  Not expected:' + a_expr_collate.getText());
}

function traverse_expr_typecast(a_expr_typecast: A_expr_typecastContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	const c_expr = a_expr_typecast.c_expr();
	if (c_expr) {
		return traversec_expr(c_expr, dbSchema, fromColumns, traverseResult);
	}
	throw Error('traverse_expr_typecast -  Not expected:' + a_expr_typecast.getText());
}

function traverseColumnRef(columnref: ColumnrefContext, fromColumns: NotNullInfo[]): NotNullInfo {
	const fieldName = splitName(columnref.getText());
	const col = findColumn(fieldName, fromColumns);
	return col;
}

function traversec_expr(c_expr: C_exprContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfoResult {
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const col = traverseColumnRef(columnref, fromColumns);
			return col;
		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			const is_nullable = aexprconst.NULL_P() != null;
			return {
				column_name: aexprconst.getText(),
				is_nullable
			}
		}
		if (c_expr.PARAM()) {
			traverseResult.parameters.push({
				paramIndex: c_expr.start.start,
				isNotNull: true
			});
			return {
				column_name: c_expr.PARAM().getText(),
				is_nullable: false
			}
		}
		const func_application = c_expr.func_expr()?.func_application();
		if (func_application) {
			const isNotNull = traversefunc_application(func_application, dbSchema, fromColumns, traverseResult);
			return {
				column_name: func_application.getText(),
				is_nullable: !isNotNull
			}
		}
		const func_expr_common_subexpr = c_expr.func_expr()?.func_expr_common_subexpr();
		if (func_expr_common_subexpr) {
			const isNotNull = traversefunc_expr_common_subexpr(func_expr_common_subexpr, dbSchema, fromColumns, traverseResult);
			return {
				column_name: func_expr_common_subexpr.getText(),
				is_nullable: !isNotNull
			}
		}
		const select_with_parens = c_expr.select_with_parens();
		if (select_with_parens) {
			traverse_select_with_parens(select_with_parens, dbSchema, fromColumns, traverseResult);
			return {
				column_name: select_with_parens.getText(),
				is_nullable: true
			}
		}
		const a_expr_in_parens = c_expr._a_expr_in_parens;
		if (a_expr_in_parens) {
			return traverse_a_expr(a_expr_in_parens, dbSchema, fromColumns, traverseResult);
		}
	}
	if (c_expr instanceof C_expr_caseContext) {
		const isNotNull = traversec_expr_case(c_expr, dbSchema, fromColumns, traverseResult);
		return {
			column_name: c_expr.getText(),
			is_nullable: !isNotNull
		}
	}
	if (c_expr instanceof C_expr_existsContext) {
		//todo - traverse
		return {
			column_name: c_expr.getText(),
			is_nullable: false
		}
	}
	throw Error('traversec_expr -  Not expected:' + c_expr.getText());
}

function filterColumns(fromColumns: NotNullInfo[], fieldName: FieldName) {
	return fromColumns.filter(col => (fieldName.prefix === '' || col.table_name === fieldName.prefix)
		&& (fieldName.name === '*' || col.column_name === fieldName.name));
}

function excludeColumns(fromColumns: NotNullInfo[], excludeList: FieldName[]) {
	return fromColumns.filter(col => {
		const found = excludeList.find(excluded => (excluded.prefix === '' || col.table_name === excluded.prefix)
			&& excluded.name == col.column_name);
		return !found;
	});
}

function traversec_expr_case(c_expr_case: C_expr_caseContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const case_expr = c_expr_case.case_expr();
	const whenResult = case_expr.when_clause_list().when_clause_list().map(when_clause => traversewhen_clause(when_clause, dbSchema, fromColumns, traverseResult));
	const whenIsNotNull = whenResult.every(when => when);
	const elseExpr = case_expr.case_default()?.a_expr();
	const elseIsNotNull = elseExpr ? !traverse_a_expr(elseExpr, dbSchema, fromColumns, traverseResult).is_nullable : false;
	return elseIsNotNull && whenIsNotNull;
}

function traversewhen_clause(when_clause: When_clauseContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_list = when_clause.a_expr_list();
	const [whenExprList, thenExprList] = partition(a_expr_list, (index) => index % 2 === 0);

	const whenExprResult = thenExprList.map((thenExpr, index) => {
		traverse_a_expr(whenExprList[index], dbSchema, fromColumns, traverseResult);
		const thenExprResult = traverse_a_expr(thenExpr, dbSchema, fromColumns, traverseResult);
		return thenExprResult;
	});
	return whenExprResult.every(res => res);
}

function partition<T>(array: T[], predicate: (index: number) => boolean): [T[], T[]] {
	return array.reduce(
		(acc, curr, index) => {
			if (predicate(index)) {
				acc[0].push(curr);
			} else {
				acc[1].push(curr);
			}
			return acc;
		},
		[[] as T[], [] as T[]]
	);
}

function traversefunc_application(func_application: Func_applicationContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const functionName = func_application.func_name().getText().toLowerCase();
	const func_arg_expr_list = func_application.func_arg_list()?.func_arg_expr_list() || [];
	const argsResult = func_arg_expr_list.map(func_arg_expr => traversefunc_arg_expr(func_arg_expr, dbSchema, fromColumns, traverseResult))
	if (functionName === 'count') {
		return true;
	}
	if (functionName === 'concat' || functionName === 'concat_ws') {
		if (func_arg_expr_list) {
			return argsResult.every(col => col);
		}
		return false;
	}
	if (functionName === 'to_date') {
		const firstArg = argsResult[0];
		return firstArg;
	}
	if (functionName === 'generate_series') {
		return true;
	}
	if (func_arg_expr_list) {
		func_arg_expr_list.forEach(func_arg_expr => traversefunc_arg_expr(func_arg_expr, dbSchema, fromColumns, traverseResult))
	}

	return false;
}

function traversefunc_expr_common_subexpr(func_expr_common_subexpr: Func_expr_common_subexprContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	if (func_expr_common_subexpr.COALESCE()) {
		const func_arg_list = func_expr_common_subexpr.expr_list().a_expr_list();
		const result = func_arg_list.map(func_arg_expr => {
			const paramResult = traverse_a_expr(func_arg_expr, dbSchema, fromColumns, traverseResult);
			if (isParameter(paramResult.column_name)) {
				traverseResult.parameters[traverseResult.parameters.length - 1].isNotNull = false;
				paramResult.is_nullable = true;
			}
			return paramResult;
		});
		return result.some(col => !col.is_nullable);
	}
	if (func_expr_common_subexpr.EXTRACT()) {
		const a_expr = func_expr_common_subexpr.extract_list().a_expr();
		const result = traverse_a_expr(a_expr, dbSchema, fromColumns, traverseResult)
		return !result.is_nullable;
	}
	return false;
}

function traversefunc_arg_expr(func_arg_expr: Func_arg_exprContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr = func_arg_expr.a_expr();
	return !traverse_a_expr(a_expr, dbSchema, fromColumns, traverseResult).is_nullable;
}


function findColumn(fieldName: FieldName, fromColumns: NotNullInfo[]) {
	const col = fromColumns.find(col => (fieldName.prefix === '' || col.table_name.toLowerCase() === fieldName.prefix.toLowerCase()) && col.column_name.toLowerCase() === fieldName.name.toLowerCase());
	if (col == null) {
		throw Error('Column not found: ' + fieldNameToString(fieldName));
	}
	return col;
}

function fieldNameToString(fieldName: FieldName): string {
	return fieldName.prefix !== '' ? `${fieldName.prefix}.${fieldName.name}` : fieldName.name;
}

function checkIsNullable(where_clause: Where_clauseContext, field: NotNullInfo): NotNullInfo {
	const isNotNullResult = !field.is_nullable || isNotNull(field, where_clause);
	const col: NotNullInfo = {
		...field,
		is_nullable: !isNotNullResult
	}
	return col;
}

function traverse_from_clause(from_clause: From_clauseContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult) {
	const from_list = from_clause.from_list();
	if (from_list) {
		return traverse_from_list(from_list, dbSchema, fromColumns, traverseResult);
	}
	return [];
}

function traverse_from_list(from_list: From_listContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult) {
	const newColumns = from_list.table_ref_list().flatMap(table_ref => traverse_table_ref(table_ref, dbSchema, fromColumns, traverseResult));
	return newColumns;
}

function traverse_table_ref(table_ref: Table_refContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const allColumns: NotNullInfo[] = [];
	const relation_expr = table_ref.relation_expr();
	const aliasClause = table_ref.alias_clause();
	const alias = aliasClause ? aliasClause.colid().getText() : undefined;
	if (relation_expr) {
		const tableName = traverse_relation_expr(relation_expr, dbSchema);
		const tableNameWithAlias = alias ? alias : tableName.name;
		const fromColumnsResult = fromColumns.concat(dbSchema).filter(col => col.table_name === tableName.name).map(col => ({ ...col, table_name: tableNameWithAlias }));
		allColumns.push(...fromColumnsResult);
	}
	const table_ref_list = table_ref.table_ref_list();
	const join_type_list = table_ref.join_type_list();
	const join_qual_list = table_ref.join_qual_list();
	if (table_ref_list) {
		const joinColumns = table_ref_list.flatMap((table_ref, joinIndex) => {
			const joinType = join_type_list[joinIndex]; //INNER, LEFT
			const joinQual = join_qual_list[joinIndex];
			const joinColumns = traverse_table_ref(table_ref, dbSchema, fromColumns, traverseResult);
			const isUsing = joinQual?.USING() ? true : false;
			const isLeftJoin = joinType?.LEFT();
			const filteredColumns = isUsing ? filterUsingColumns(joinColumns, joinQual) : joinColumns;
			const resultColumns = isLeftJoin ? filteredColumns.map(col => ({ ...col, is_nullable: true })) : filteredColumns;
			return resultColumns;
		});
		allColumns.push(...joinColumns);
	}
	const select_with_parens = table_ref.select_with_parens();
	if (select_with_parens) {
		const columns = traverse_select_with_parens(select_with_parens, dbSchema, fromColumns, traverseResult);
		const withAlias = columns.map(col => ({ ...col, table_name: alias || col.table_name }));
		return withAlias;
	}
	return allColumns;
}

function filterUsingColumns(fromColumns: NotNullInfo[], joinQual: Join_qualContext): NotNullInfo[] {
	const excludeList = joinQual.name_list().name_list().map(name => splitName(name.getText()));
	const filteredColumns = excludeColumns(fromColumns, excludeList);
	return filteredColumns;
}

function traverse_select_with_parens(select_with_parens: Select_with_parensContext, dbSchema: NotNullInfo[], fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const select_with_parens2 = select_with_parens.select_with_parens();
	if (select_with_parens2) {
		return traverse_select_with_parens(select_with_parens2, dbSchema, fromColumns, traverseResult);
	}
	const select_no_parens = select_with_parens.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, dbSchema, fromColumns, traverseResult);
	}
	return [];
}

function traverse_relation_expr(relation_expr: Relation_exprContext, dbSchema: NotNullInfo[]): TableName {
	const qualified_name = relation_expr.qualified_name();
	const name = traverse_qualified_name(qualified_name, dbSchema);
	return name;
}

function traverse_qualified_name(qualified_name: Qualified_nameContext, dbSchema: NotNullInfo[]): TableName {
	const colid_name = qualified_name.colid() ? traverse_colid(qualified_name.colid(), dbSchema) : '';

	const indirection_el_list = qualified_name.indirection()?.indirection_el_list();
	if (indirection_el_list && indirection_el_list.length === 1) {
		return {
			name: indirection_el_list[0].attr_name()?.getText() || '',
			alias: colid_name
		}
	}
	return {
		name: colid_name,
		alias: ''
	}
}

function traverse_colid(colid: ColidContext, dbSchema: NotNullInfo[]): string {
	const identifier = colid.identifier();
	if (identifier) {
		return traverse_identifier(identifier, dbSchema);
	}
	const unreserved_keyword = colid.unreserved_keyword();
	if (unreserved_keyword) {
		return traverse_unreserved_keyword(unreserved_keyword, dbSchema);
	}
	return '';
}

function traverse_identifier(identifier: IdentifierContext, dbSchema: NotNullInfo[]): string {
	const tableName = identifier.Identifier().getText();
	return tableName;
}

function traverse_unreserved_keyword(unreserved_keyword: Unreserved_keywordContext, dbSchema: NotNullInfo[]) {
	return unreserved_keyword.getText();
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
	const in_expr_list = expr_list?.parentCtx;
	return in_expr_list instanceof In_expr_listContext;
}


function traverseInsertstmt(insertstmt: InsertstmtContext, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const traverseResult: TraverseResult = {
		columnsNullability: [],
		parameters: [],
		singleRow: false
	}
	const insert_target = insertstmt.insert_target();
	const tableName = insert_target.getText();
	const insertColumns = dbSchema.filter(col => col.table_name === tableName);

	const insert_rest = insertstmt.insert_rest();
	const insertColumnsList = insert_rest.insert_column_list()
		.insert_column_item_list()
		.map(insert_column_item => traverse_insert_column_item(insert_column_item, insertColumns));

	const selectstmt = insert_rest.selectstmt();
	traverse_insert_select_stmt(selectstmt, dbSchema, insertColumnsList, traverseResult);

	const on_conflict = insertstmt.on_conflict_();
	if (on_conflict) {
		const set_clause_list = on_conflict.set_clause_list().set_clause_list() || [];
		set_clause_list.forEach(set_clause => traverse_set_clause(set_clause, dbSchema, insertColumns, traverseResult));
	}

	const returning_clause = insertstmt.returning_clause();
	const returninColumns = returning_clause ? traverse_target_list(returning_clause.target_list(), dbSchema, insertColumns, traverseResult) : [];

	const result: PostgresTraverseResult = {
		queryType: 'Insert',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.map(param => param.isNotNull),
		columnsNullability: returninColumns.map(col => !col.is_nullable),
		parameterList: []
	}
	if (returning_clause) {
		result.returning = true;
	}
	return result;
}

function traverse_insert_select_stmt(selectstmt: SelectstmtContext, dbSchema: NotNullInfo[], insertColumnlist: NotNullInfo[], traverseResult: TraverseResult): void {
	const simple_select = selectstmt.select_no_parens()?.select_clause()?.simple_select_intersect_list()?.[0];
	if (simple_select) {
		const simple_select_pramary = simple_select?.simple_select_pramary_list()?.[0];
		if (simple_select_pramary) {

			const values_clause = simple_select_pramary.values_clause();
			if (values_clause) {
				values_clause.expr_list_list()
					.forEach(expr_list => traverse_insert_a_expr_list(expr_list, dbSchema, insertColumnlist, traverseResult))
			}
			const target_list = simple_select_pramary.target_list_()?.target_list();
			if (target_list) {
				const from_clause = simple_select_pramary.from_clause();
				const fromColumns = from_clause ? traverse_from_clause(from_clause, dbSchema, [], traverseResult) : [];
				target_list.target_el_list().forEach((target_el, index) => {
					const targetResult = isNotNull_target_el(target_el, dbSchema, fromColumns, traverseResult);
					if (isParameter(targetResult.column_name)) {
						traverseResult.parameters.at(-1)!.isNotNull = !insertColumnlist[index].is_nullable;
					}
				});
			}
		}
	}
}

function traverse_insert_a_expr_list(expr_list: Expr_listContext, dbSchema: NotNullInfo[], insertColumns: NotNullInfo[], traverseResult: TraverseResult) {
	expr_list.a_expr_list().forEach((a_expr, index) => {
		const result = traverse_a_expr(a_expr, dbSchema, insertColumns, traverseResult);
		if (isParameter(result.column_name)) {
			traverseResult.parameters.at(-1)!.isNotNull = !insertColumns[index].is_nullable;
		}
	})
}

function traverseDeletestmt(deleteStmt: DeletestmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	return {
		queryType: 'Delete',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.map(param => param.isNotNull),
		columnsNullability: [],
		parameterList: []
	}
}

function traverseUpdatestmt(updatestmt: UpdatestmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	const relation_expr_opt_alias = updatestmt.relation_expr_opt_alias();
	const tableName = relation_expr_opt_alias.getText();
	const updateColumns = dbSchema.filter(col => col.table_name === tableName);

	updatestmt.set_clause_list().set_clause_list()
		.forEach(set_clause => traverse_set_clause(set_clause, dbSchema, updateColumns, traverseResult));

	const parametersBefore = traverseResult.parameters.length;
	const where_clause = updatestmt.where_or_current_clause();
	if (where_clause) {
		const a_expr = where_clause.a_expr();
		traverse_a_expr(a_expr, dbSchema, updateColumns, traverseResult);
	}
	const whereParameters = traverseResult.parameters.slice(parametersBefore);

	return {
		queryType: 'Update',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.slice(0, parametersBefore).map(param => param.isNotNull),
		columnsNullability: [],
		parameterList: [],
		whereParamtersNullability: whereParameters.map(param => param.isNotNull)
	}
}

function traverse_set_clause(set_clause: Set_clauseContext, dbSchema: NotNullInfo[], updateColumns: PostgresColumnSchema[], traverseResult: TraverseResult): void {
	const set_target = set_clause.set_target();
	const columnName = splitName(set_target.getText());
	const column = findColumn(columnName, updateColumns);
	const a_expr = set_clause.a_expr();
	const excludedColumns = updateColumns.map((col) => ({ ...col, table_name: 'excluded' }) satisfies PostgresColumnSchema);
	const a_exprResult = traverse_a_expr(a_expr, dbSchema, updateColumns.concat(excludedColumns), traverseResult);
	if (isParameter(a_exprResult.column_name)) {
		traverseResult.parameters[traverseResult.parameters.length - 1].isNotNull = !column.is_nullable;
	}
}

function traverse_insert_column_item(insert_column_item: Insert_column_itemContext, dbSchema: PostgresColumnSchema[]): NotNullInfo {
	const colid = insert_column_item.colid();
	return isNotNull_colid(colid, dbSchema);
}

function isNotNull_colid(colid: ColidContext, dbSchema: PostgresColumnSchema[]): NotNullInfo {
	const columnName = colid.getText();
	const fieldName = splitName(columnName);
	const column = findColumn(fieldName, dbSchema);
	return column;
}

function isNotNull(field: NotNullInfo, where_clause: Where_clauseContext): boolean {

	const a_expr = where_clause.a_expr();
	if (a_expr) {
		return isNotNull_a_expr(field, a_expr);
	}
	return false;
}

function isNotNull_a_expr(field: NotNullInfo, a_expr: A_exprContext): boolean {
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		return isNotNull_a_expr_qual(a_expr_qual, field);
	}
	return false;
}

function isNotNull_a_expr_qual(a_expr_qual: A_expr_qualContext, field: NotNullInfo): boolean {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return isNotNull_a_expr_lessless(a_expr_lessless, field);
	}
	return false;
}

function isNotNull_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, field: NotNullInfo): boolean {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return isNotNull_a_expr_or(a_expr_or, field);
	}
	return false;
}

//a_expr_or: "valueisnotnulland(id>0orvalueisnotnull)"
//a_expr_or: "valueisnotnullor(id>0orvalueisnotnull)"
function isNotNull_a_expr_or(a_expr_or: A_expr_orContext, field: NotNullInfo): boolean {
	const a_expr_and = a_expr_or.a_expr_and_list();
	if (a_expr_and) {
		//1. valueisnotnull
		//2. (id>0orvalueisnotnull)
		const result = a_expr_and.every(a_expr_and => isNotNull_a_expr_and(a_expr_and, field));
		return result;
	}
	return false;
}

function isNotNull_a_expr_and(a_expr_and: A_expr_andContext, field: NotNullInfo): boolean {
	const a_expr_between_list = a_expr_and.a_expr_between_list();
	if (a_expr_between_list) {
		return a_expr_between_list.some(a_expr_between => isNotNull_a_expr_between(a_expr_between, field));
	}
	return false;
}

function isNotNull_a_expr_between(a_expr_between: A_expr_betweenContext, field: NotNullInfo): boolean {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (a_expr_in) {
		return isNotNull_a_expr_in(a_expr_in, field);
	}
	return false;
}

function isNotNull_a_expr_in(a_expr_in: A_expr_inContext, field: NotNullInfo): boolean {
	const a_expr_unary_not = a_expr_in.a_expr_unary_not();
	if (a_expr_unary_not) {
		return isNotNull_a_expr_unary_not(a_expr_unary_not, field);
	}
	return false;
}

function isNotNull_a_expr_unary_not(a_expr_unary_not: A_expr_unary_notContext, field: NotNullInfo): boolean {
	const a_expr_isnull = a_expr_unary_not.a_expr_isnull();
	if (a_expr_isnull) {
		return isNotNull_a_expr_isnull(a_expr_isnull, field);
	}
	return false;
}

function isNotNull_a_expr_isnull(a_expr_isnull: A_expr_isnullContext, field: NotNullInfo): boolean {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		return isNotNull_a_expr_is_not(a_expr_is_not, field);
	}
	return false;
}

function isNotNull_a_expr_is_not(a_expr_is_not: A_expr_is_notContext, field: NotNullInfo): boolean {
	const a_expr_compare = a_expr_is_not.a_expr_compare();
	if (a_expr_compare) {
		if (a_expr_is_not.IS() !== null && a_expr_is_not.NOT() !== null && a_expr_is_not.NULL_P() !== null) {
			const isField = isNotNull_a_expr_compare(a_expr_compare, field);
			return isField;

		}
		//invalid split
		// const fieldName = splitName(a_expr_compare.getText());
		return isNotNull_a_expr_compare(a_expr_compare, field);
	}
	return false;
}

function isNotNull_a_expr_compare(a_expr_compare: A_expr_compareContext, field: NotNullInfo): boolean {
	const a_expr_like_list = a_expr_compare.a_expr_like_list()
	if (a_expr_like_list) {
		//a = b, b = a, id > 10, id = $1
		return a_expr_like_list.some(a_expr_like => isNotNull_a_expr_like(a_expr_like, field));
	}
	return false;
}

function isNotNull_a_expr_like(a_expr_like: A_expr_likeContext, field: NotNullInfo): boolean {
	const a_expr_qual_op_list = a_expr_like.a_expr_qual_op_list();
	if (a_expr_qual_op_list) {
		return a_expr_qual_op_list.every(a_expr_qual_op => isNotNull_a_expr_qual_op(a_expr_qual_op, field))
	}
	return false;
}

function isNotNull_a_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, field: NotNullInfo): boolean {
	const a_expr_unary_qualop_list = a_expr_qual_op.a_expr_unary_qualop_list();
	if (a_expr_unary_qualop_list) {
		return a_expr_unary_qualop_list.every(a_expr_unary_qualop => isNotNul_a_expr_unary_qualop(a_expr_unary_qualop, field))
	}
	return false;
}

function isNotNul_a_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, field: NotNullInfo): boolean {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		return isNotNull_a_expr_add(a_expr_add, field);
	}
	return false;
}

function isNotNull_a_expr_add(a_expr_add: A_expr_addContext, field: NotNullInfo): boolean {
	const a_expr_mul_list = a_expr_add.a_expr_mul_list();
	if (a_expr_mul_list) {
		return a_expr_mul_list.every(a_expr_mul => isNotNull_a_expr_mul(a_expr_mul, field))
	}
	return false;
}

function isNotNull_a_expr_mul(a_expr_mul: A_expr_mulContext, field: NotNullInfo): boolean {
	const a_expr_caret_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_caret_list) {
		return a_expr_caret_list.every(a_expr_caret => isNotNull_a_expr_caret(a_expr_caret, field));
	}
	return false;
}

function isNotNull_a_expr_caret(a_expr_caret: A_expr_caretContext, field: NotNullInfo): boolean {
	const a_expr_unary_sign_list = a_expr_caret.a_expr_unary_sign_list();
	if (a_expr_unary_sign_list) {
		return a_expr_unary_sign_list.every(a_expr_unary_sign => isNotNull_a_expr_unary_sign(a_expr_unary_sign, field))
	}
	return false;
}

function isNotNull_a_expr_unary_sign(a_expr_unary_sign: A_expr_unary_signContext, field: NotNullInfo): boolean {
	const a_expr_at_time_zone = a_expr_unary_sign.a_expr_at_time_zone();
	if (a_expr_at_time_zone) {
		return isNotNull_a_expr_at_time_zone(a_expr_at_time_zone, field);
	}
	return false;
}

function isNotNull_a_expr_at_time_zone(a_expr_at_time_zone: A_expr_at_time_zoneContext, field: NotNullInfo): boolean {
	const a_expr_collate = a_expr_at_time_zone.a_expr_collate();
	if (a_expr_collate) {
		return isNotNull_a_expr_collate(a_expr_collate, field);
	}
	return false;
}

function isNotNull_a_expr_collate(a_expr_collate: A_expr_collateContext, field: NotNullInfo): boolean {
	const a_expr_typecast = a_expr_collate.a_expr_typecast();
	if (a_expr_typecast) {
		return isNotNull_a_expr_typecast(a_expr_typecast, field);
	}
	return false;
}

function isNotNull_a_expr_typecast(a_expr_typecast: A_expr_typecastContext, field: NotNullInfo): boolean {
	const c_expr = a_expr_typecast.c_expr();
	if (c_expr) {
		return isNotNull_c_expr(c_expr, field);
	}
	return false;
}

function isNotNull_c_expr(c_expr: C_exprContext, field: NotNullInfo): boolean {
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const fieldName = splitName(columnref.getText());
			return (fieldName.name === field.column_name && (fieldName.prefix === '' || field.table_name === fieldName.prefix));
		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			return false;
		}
		const a_expr = c_expr.a_expr();
		if (a_expr) {
			return isNotNull_a_expr(field, a_expr);
		}
	}
	return false;
}

function checkLimit_select_no_parens(select_no_parens: Select_no_parensContext): number | undefined {
	const limitText = select_no_parens.select_limit()?.limit_clause()?.select_limit_value()?.getText();
	return limitText ? +limitText : undefined;
}

function checkLimit_select_with_parens(select_with_parens: Select_with_parensContext): number | undefined {
	return checkLimit(select_with_parens);
}

function isParameter(str: string): boolean {
	// Regular expression to match $1, $2, $123, etc. with optional casts (e.g. $1::int4)
	const paramPattern = /^\$[0-9]+(::[a-zA-Z_][a-zA-Z0-9_]*)?$/;
	return paramPattern.test(str);
}

function isSingleRowResult(selectstmt: SelectstmtContext, dbSchema: PostgresColumnSchema[]): boolean {

	const limit = checkLimit(selectstmt);
	if (limit === 1) {
		return true;
	}

	const select_no_parens = selectstmt.select_no_parens();
	const simple_select_pramary_list = select_no_parens.select_clause()
		.simple_select_intersect_list()?.[0]
		.simple_select_pramary_list();

	if (simple_select_pramary_list.length > 1) {
		return false;
	}
	const simple_select_pramary = simple_select_pramary_list[0];
	const from_clause = simple_select_pramary.from_clause();
	if (!from_clause) {
		const hasSetReturningFunction = simple_select_pramary.target_list_().target_list().target_el_list().some(target_el => isSetReturningFunction_target_el(target_el));
		return !hasSetReturningFunction;
	}
	if (!simple_select_pramary.group_clause()) {
		const agreegateFunction = hasAggregateFunction(simple_select_pramary);
		if (agreegateFunction) {
			return true;
		}
	}
	const table_ref_list = from_clause.from_list().table_ref_list();
	if (table_ref_list.length > 1) {
		return false;
	}
	if (table_ref_list[0].JOIN_list().length > 0 || table_ref_list[0].select_with_parens() != null) {
		return false;
	}

	const tableName = getTableName(table_ref_list[0]);
	const uniqueKeys = dbSchema.filter(col => col.table_name.toLowerCase() === tableName.name.toLowerCase()
		&& (col.column_key === 'PRI' || col.column_key === 'UNI'))
		.map(col => col.column_name);

	const where_clause = simple_select_pramary.where_clause();
	if (where_clause) {
		return isSingleRowResult_where(where_clause.a_expr(), uniqueKeys)
	}
	return false;
}

function hasAggregateFunction(simple_select_pramary: Simple_select_pramaryContext): boolean {
	const target_list_ = simple_select_pramary.target_list_();
	if (target_list_) {
		return target_list_.target_list().target_el_list().some(target_el => isAggregateFunction_target_el(target_el));
	}
	const target_list = simple_select_pramary.target_list();
	return target_list.target_el_list().some(target_el => isAggregateFunction_target_el(target_el));
}

type TableName = {
	name: string;
	alias: string;
}

function getTableName(table_ref: Table_refContext): TableName {
	const relation_expr = table_ref.relation_expr();
	const tableName = relation_expr.qualified_name().getText();
	const aliasClause = table_ref.alias_clause();
	const tableAlias = aliasClause ? aliasClause.colid().getText() : '';
	return {
		name: tableName,
		alias: tableAlias
	}
}

function isAggregateFunction_target_el(target_el: Target_elContext): boolean {
	if (target_el instanceof Target_labelContext) {
		const c_expr_list = collectContextsOfType(target_el, Func_exprContext);
		const aggrFunction = c_expr_list.some(func_expr => isAggregateFunction_c_expr(<Func_exprContext>func_expr));
		return aggrFunction;
	}
	return false;
}

// SELECT distinct '''' ||  p.proname || '''' || ',' as aggregate_function
// FROM pg_catalog.pg_proc p
// JOIN pg_catalog.pg_aggregate a ON a.aggfnoid = p.oid
// ORDER BY  aggregate_function;
const aggregateFunctions = new Set([
	'array_agg',
	'avg',
	'bit_and',
	'bit_or',
	'bool_and',
	'bool_or',
	'corr',
	'count',
	'covar_pop',
	'covar_samp',
	'cume_dist',
	'dense_rank',
	'every',
	'json_agg',
	'json_object_agg',
	'jsonb_agg',
	'jsonb_object_agg',
	'max',
	'min',
	'mode',
	'percent_rank',
	'percentile_cont',
	'percentile_disc',
	'rank',
	'regr_avgx',
	'regr_avgy',
	'regr_count',
	'regr_intercept',
	'regr_r2',
	'regr_slope',
	'regr_sxx',
	'regr_sxy',
	'regr_syy',
	'stddev',
	'stddev_pop',
	'stddev_samp',
	'string_agg',
	'sum',
	'var_pop',
	'var_samp',
	'variance',
	'xmlagg'
]);

function isAggregateFunction_c_expr(func_expr: Func_exprContext): boolean {
	const funcName = func_expr?.func_application()?.func_name()?.getText()?.toLowerCase();
	return aggregateFunctions.has(funcName);
}

function isSetReturningFunction_target_el(target_el: Target_elContext): boolean {
	if (target_el instanceof Target_labelContext) {
		const c_expr_list = collectContextsOfType(target_el, Func_exprContext);
		const setReturningFunction = c_expr_list.some(func_expr => isSetReturningFunction_c_expr(<Func_exprContext>func_expr));
		return setReturningFunction;
	}
	return false;
}

function isSetReturningFunction_c_expr(func_expr: Func_exprContext) {
	const funcName = func_expr?.func_application()?.func_name()?.getText()?.toLowerCase();
	return funcName === 'generate_series';
}

function isSingleRowResult_where(a_expr: A_exprContext, uniqueKeys: string[]): boolean {

	const a_expr_or_list = a_expr.a_expr_qual()?.a_expr_lessless()?.a_expr_or_list() || [];
	if (a_expr_or_list.length > 1 || a_expr_or_list[0].OR_list().length > 0) {
		return false;
	}
	const someInSingleRow = a_expr_or_list[0].a_expr_and_list().some(a_expr_and => {
		const a = isSingleRowResult_a_expr_and(a_expr_and, uniqueKeys);
		return a;
	});
	return someInSingleRow;
}

function isSingleRowResult_a_expr_and(a_expr_and: A_expr_andContext, uniqueKeys: string[]): boolean {
	const a_expr_between_list = a_expr_and.a_expr_between_list();
	if (a_expr_between_list && a_expr_between_list.length > 0) {
		return a_expr_between_list.some(a_expr_between => isSingleRowResult_a_expr_between(a_expr_between, uniqueKeys));
	}
	return false;
}
function isSingleRowResult_a_expr_between(a_expr_between: A_expr_betweenContext, uniqueKeys: string[]): boolean {
	const isSingleRow = a_expr_between.a_expr_in_list().every(a_expr_in => isSingleRowResult_a_expr_in(a_expr_in, uniqueKeys));
	return isSingleRow;
}

function isSingleRowResult_a_expr_in(a_expr_in: A_expr_inContext, uniqueKeys: string[]): boolean {
	const a_expr_compare = a_expr_in.a_expr_unary_not()?.a_expr_isnull()?.a_expr_is_not()?.a_expr_compare();
	if (a_expr_compare) {
		if (a_expr_compare.EQUAL() != null) {
			const a_expr_like_list = a_expr_compare.a_expr_like_list();
			if (a_expr_like_list && a_expr_like_list.length == 2) {
				const left = a_expr_like_list[0];
				const right = a_expr_like_list[1];
				const result = (isUniqueColumn(left, uniqueKeys) + isUniqueColumn(right, uniqueKeys));
				return result == 1;
			}
		};
	}
	return false;
}

//1 = yes
//0 = no
function isUniqueColumn(a_expr_like: A_expr_likeContext, uniqueKeys: string[]): number {
	const c_expr = a_expr_like.a_expr_qual_op_list()?.[0].a_expr_unary_qualop_list()?.[0].a_expr_add()
		.a_expr_mul_list()[0].a_expr_caret_list()[0].a_expr_unary_sign_list()[0].a_expr_at_time_zone()
		.a_expr_collate().a_expr_typecast().c_expr();
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const fieldName = splitName(columnref.getText());
			// const col = traverseColumnRef(columnref, dbSchema);
			return uniqueKeys.includes(fieldName.name) ? 1 : 0;
		}
	}
	return 0;
}

function checkLimit(selectstmt: SelectstmtContext): number | undefined {
	const select_no_parens = selectstmt.select_no_parens();
	if (select_no_parens) {
		return checkLimit_select_no_parens(select_no_parens);
	}
	const select_with_parens = selectstmt.select_with_parens();
	if (select_with_parens) {
		return checkLimit_select_with_parens(select_with_parens);
	}
	return undefined;
}
