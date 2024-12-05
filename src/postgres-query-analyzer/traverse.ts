import { A_expr_addContext, A_expr_andContext, A_expr_at_time_zoneContext, A_expr_betweenContext, A_expr_caretContext, A_expr_collateContext, A_expr_compareContext, A_expr_inContext, A_expr_is_notContext, A_expr_isnullContext, A_expr_lesslessContext, A_expr_likeContext, A_expr_mulContext, A_expr_orContext, A_expr_qual_opContext, A_expr_qualContext, A_expr_typecastContext, A_expr_unary_notContext, A_expr_unary_qualopContext, A_expr_unary_signContext, A_exprContext, C_expr_caseContext, C_expr_exprContext, C_exprContext, ColidContext, Expr_listContext, From_clauseContext, From_listContext, Func_applicationContext, Func_arg_exprContext, IdentifierContext, InsertstmtContext, Join_qualContext, Qualified_nameContext, Relation_exprContext, Select_clauseContext, Select_no_parensContext, Select_with_parensContext, SelectstmtContext, Simple_select_intersectContext, Simple_select_pramaryContext, StmtContext, Table_refContext, Target_elContext, Target_labelContext, Target_listContext, When_clauseContext, Where_clauseContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { PostgresTraverseResult } from './parser';
import { ParserRuleContext } from '@wsporto/typesql-parser';
import { PostgresColumnSchema } from '../drivers/types';
import { splitName } from '../mysql-query-analyzer/select-columns';

type NotNullInfo = {
	table_schema: string;
	table_name: string;
	column_name: string;
	is_nullable: boolean;
}

export function traverseSmt(stmt: StmtContext, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const selectstmt = stmt.selectstmt();
	if (selectstmt) {
		const result = traverseSelectstmt(selectstmt, dbSchema);
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


function traverseSelectstmt(selectstmt: SelectstmtContext, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {

	const result = collectContextsOfType(selectstmt, C_expr_exprContext).filter(c_expr => (c_expr as any).PARAM());
	const paramIsListResult = result.map(param => paramIsList(param));


	const columns = traverse_selectstmt(selectstmt, dbSchema);
	const columnsNullability = columns.map(col => !col.is_nullable);

	return {
		queryType: 'Select',
		columnsNullability,
		parameterList: paramIsListResult
	};
}

function traverse_selectstmt(selectstmt: SelectstmtContext, dbSchema: PostgresColumnSchema[]): NotNullInfo[] {
	const select_no_parens = selectstmt.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, dbSchema);
	}
	return [];
}

function traverse_select_no_parens(select_no_parens: Select_no_parensContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const select_clause = select_no_parens.select_clause();
	if (select_clause) {
		return traverse_select_clause(select_clause, dbSchema);
	}
	return [];
}

function traverse_select_clause(select_clause: Select_clauseContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const simple_select_intersect_list = select_clause.simple_select_intersect_list();
	let selectColumns: NotNullInfo[] = [];
	if (simple_select_intersect_list) {
		selectColumns = traverse_simple_select_intersect(simple_select_intersect_list[0], dbSchema);
	}
	//union
	for (let index = 1; index < simple_select_intersect_list.length; index++) {
		const unionNotNull = traverse_simple_select_intersect(simple_select_intersect_list[index], dbSchema);
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

function traverse_simple_select_intersect(simple_select_intersect: Simple_select_intersectContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const simple_select_pramary = simple_select_intersect.simple_select_pramary_list()[0];
	if (simple_select_pramary) {
		return traverse_simple_select_pramary(simple_select_pramary, dbSchema);
	}
	return [];
}

function traverse_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const fromColumns: NotNullInfo[] = [];

	const from_clause = simple_select_pramary.from_clause();
	if (from_clause) {
		const where_clause = simple_select_pramary.where_clause();
		const fields = traverse_from_clause(from_clause, dbSchema);
		const fieldsNotNull = where_clause != null ? fields.map(field => checkIsNullable(where_clause, field)) : fields;
		fromColumns.push(...fieldsNotNull);
	}
	const filteredColumns = filterColumns_simple_select_pramary(simple_select_pramary, fromColumns);
	return filteredColumns;
}

function filterColumns_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, fromColumns: NotNullInfo[]): NotNullInfo[] {
	const target_list_ = simple_select_pramary.target_list_();
	if (target_list_) {
		const target_list = target_list_.target_list();
		if (target_list) {
			return filterColumns_target_list(target_list, fromColumns);
		}
	}
	return [];
}

function filterColumns_target_list(target_list: Target_listContext, fromColumns: NotNullInfo[]): NotNullInfo[] {
	const columns = target_list.target_el_list().flatMap(target_el => {
		const fieldName = target_el.getText();
		if (fieldName == '*') {
			return fromColumns;
		}
		const column = isNotNull_target_el(target_el, fromColumns);
		// const result: NotNullInfo = {
		// 	column_name: target_el.getText(),
		// 	is_nullable: !isNotNull,
		// 	table_name: '',
		// 	table_schema: ''
		// }
		return [column];
		// const col = findColumn(fieldName, fromColumns);
		// if (col == null) {
		// 	throw Error('Could not find column:' + fieldName);
		// }
		// return [col];
	})
	return columns;
}

function isNotNull_target_el(target_el: Target_elContext, fromColumns: NotNullInfo[]): NotNullInfo {
	if (target_el instanceof Target_labelContext) {
		const a_expr = target_el.a_expr();
		const isNotNull = columnIsNotNull_a_expr(a_expr, fromColumns);
		const colLabel = target_el.colLabel();
		const alias = colLabel != null ? colLabel.getText() : '';
		return {
			column_name: alias || a_expr.getText(),
			is_nullable: !isNotNull,
			table_name: '',
			table_schema: ''
		};
	}
	throw Error('Column not found');
}

function columnIsNotNull_a_expr(a_expr: A_exprContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		return columnIsNotNull_a_expr_qual(a_expr_qual, fromColumns);
	}

	return false;
}

function columnIsNotNull_a_expr_qual(a_expr_qual: A_expr_qualContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return columnIsNotNull_a_expr_lessless(a_expr_lessless, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return columnIsNotNull_a_expr_or(a_expr_or, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_or(a_expr_or: A_expr_orContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_and = a_expr_or.a_expr_and_list()[0];
	if (a_expr_and) {
		return columnIsNotNull_a_expr_and(a_expr_and, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_and(a_expr_and: A_expr_andContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_between = a_expr_and.a_expr_between_list()[0];
	if (a_expr_between) {
		return columnIsNotNull_a_expr_between(a_expr_between, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_between(a_expr_between: A_expr_betweenContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (a_expr_in) {
		return columnIsNotNull_a_expr_in(a_expr_in, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_in(a_expr_in: A_expr_inContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_unary = a_expr_in.a_expr_unary_not();
	if (a_expr_unary) {
		return columnIsNotNull_a_expr_unary(a_expr_unary, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_unary(a_expr_unary: A_expr_unary_notContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_isnull = a_expr_unary.a_expr_isnull();
	if (a_expr_isnull) {
		return columnIsNotNull_a_expr_isnull(a_expr_isnull, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_isnull(a_expr_isnull: A_expr_isnullContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		return columnIsNotNull_a_expr_is_not(a_expr_is_not, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_is_not(a_expr_is_not: A_expr_is_notContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_compare = a_expr_is_not.a_expr_compare();
	if (a_expr_compare) {
		return columnIsNotNull_a_expr_compare(a_expr_compare, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_compare(a_expr_compare: A_expr_compareContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_like = a_expr_compare.a_expr_like_list()[0];
	if (a_expr_like) {
		return columnIsNotNull_a_expr_like(a_expr_like, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_like(a_expr_like: A_expr_likeContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_qual_op = a_expr_like.a_expr_qual_op_list()[0];
	if (a_expr_qual_op) {
		return columnIsNotNull_a_expr_qual_op(a_expr_qual_op, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_unary_qualop = a_expr_qual_op.a_expr_unary_qualop_list()[0];
	if (a_expr_unary_qualop) {
		return columnIsNotNull_a_expr_unary_qualop(a_expr_unary_qualop, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		const isNotNull = a_expr_add.a_expr_mul_list().every(a_expr_mul => columnIsNotNull_a_expr_mul(a_expr_mul, fromColumns))
		return isNotNull;
	}
	return false;
}

function columnIsNotNull_a_expr_mul(a_expr_mul: A_expr_mulContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_mul_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_mul_list) {
		return a_expr_mul.a_expr_caret_list().every(a_expr_caret => columnIsNotNull_a_expr_caret(a_expr_caret, fromColumns));
	}
	return false;
}

function columnIsNotNull_a_expr_caret(a_expr_caret: A_expr_caretContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_unary_sign_list = a_expr_caret.a_expr_unary_sign_list();
	if (a_expr_unary_sign_list) {
		return a_expr_caret.a_expr_unary_sign_list().every(a_expr_unary_sign => columnIsNotNull_a_expr_unary_sign(a_expr_unary_sign, fromColumns));;
	}
	return false;
}

function columnIsNotNull_a_expr_unary_sign(a_expr_unary_sign: A_expr_unary_signContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_at_time_zone = a_expr_unary_sign.a_expr_at_time_zone();
	if (a_expr_at_time_zone) {
		return columnIsNotNull_a_expr_at_time_zone(a_expr_at_time_zone, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_at_time_zone(a_expr_at_time_zone: A_expr_at_time_zoneContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_collate = a_expr_at_time_zone.a_expr_collate();
	if (a_expr_collate) {
		return columnIsNotNull_a_expr_collate(a_expr_collate, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_collate(a_expr_collate: A_expr_collateContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_typecast = a_expr_collate.a_expr_typecast();
	if (a_expr_typecast) {
		return columnIsNotNull_a_expr_typecast(a_expr_typecast, fromColumns);
	}
	return false;
}

function columnIsNotNull_a_expr_typecast(a_expr_typecast: A_expr_typecastContext, fromColumns: NotNullInfo[]): boolean {
	const c_expr = a_expr_typecast.c_expr();
	if (c_expr) {
		return columnIsNotNull_c_expr(c_expr, fromColumns);
	}
	return false;
}

function columnIsNotNull_c_expr(c_expr: C_exprContext, fromColumns: NotNullInfo[]): boolean {
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const fieldName = splitName(columnref.getText());
			const col = findColumn(fieldName.name, fromColumns);
			return !col.is_nullable;
		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			return aexprconst.NULL_P() === null;
		}
		const func_application = c_expr.func_expr()?.func_application();
		if (func_application) {
			return columnIsNotNull_func_application(func_application, fromColumns);
		}
	}
	if (c_expr instanceof C_expr_caseContext) {
		return columnIsNotNull_c_expr_case(c_expr, fromColumns);
	}

	return false;
}

function columnIsNotNull_c_expr_case(c_expr_case: C_expr_caseContext, fromColumns: NotNullInfo[]): boolean {
	const case_expr = c_expr_case.case_expr();
	const whenIsNotNull = case_expr.when_clause_list().when_clause_list().every(when_clause => columnIsNotNull_when_clause(when_clause, fromColumns));
	const elseExpr = case_expr.case_default()?.a_expr();
	const elseIsNotNull = elseExpr ? columnIsNotNull_a_expr(elseExpr, fromColumns) : false;
	return elseIsNotNull && whenIsNotNull;
}

function columnIsNotNull_when_clause(when_clause: When_clauseContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr_list = when_clause.a_expr_list();
	const thenExprList = a_expr_list.filter((_, index) => index % 2 == 1);
	return thenExprList.every(thenExpr => columnIsNotNull_a_expr(thenExpr, fromColumns));
}

function columnIsNotNull_func_application(func_application: Func_applicationContext, fromColumns: NotNullInfo[]): boolean {
	const functionName = func_application.func_name().getText().toLowerCase();
	if (functionName === 'count') {
		return true;
	}
	if (functionName === 'concat') {
		const func_arg_expr_list = func_application.func_arg_list().func_arg_expr_list();
		if (func_arg_expr_list) {
			return func_arg_expr_list.every(func_arg_expr => columnIsNotNull_func_arg_expr(func_arg_expr, fromColumns))
		}
		return false;
	}
	return false;
}

function columnIsNotNull_func_arg_expr(func_arg_expr: Func_arg_exprContext, fromColumns: NotNullInfo[]): boolean {
	const a_expr = func_arg_expr.a_expr();
	return columnIsNotNull_a_expr(a_expr, fromColumns);
}


function findColumn(fieldName: string, fromColumns: NotNullInfo[]) {
	const col = fromColumns.find(col => col.column_name === fieldName);
	if (col == null) {
		throw Error('Column not found: ' + fieldName);
	}
	return col;
}

function checkIsNullable(where_clause: Where_clauseContext, field: NotNullInfo): NotNullInfo {
	const isNotNullResult = !field.is_nullable || isNotNull(field, where_clause);
	const col: NotNullInfo = {
		...field,
		is_nullable: !isNotNullResult
	}
	return col;
}

function traverse_from_clause(from_clause: From_clauseContext, dbSchema: NotNullInfo[]) {
	const from_list = from_clause.from_list();
	if (from_list) {
		return traverse_from_list(from_list, dbSchema);
	}
	return [];
}

function traverse_from_list(from_list: From_listContext, dbSchema: NotNullInfo[]) {
	const fromColumns = from_list.table_ref_list().flatMap(table_ref => traverse_table_ref(table_ref, dbSchema));
	return fromColumns;
}

function traverse_table_ref(table_ref: Table_refContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const allColumns: NotNullInfo[] = [];
	const relation_expr = table_ref.relation_expr();
	if (relation_expr) {
		const tableName = traverse_relation_expr(relation_expr, dbSchema);
		const fromColumns = dbSchema.filter(col => col.table_name === tableName);
		allColumns.push(...fromColumns);
	}
	const table_ref_list = table_ref.table_ref_list();
	if (table_ref_list) {
		const joinColumns = table_ref_list.flatMap(table_ref => traverse_table_ref(table_ref, dbSchema));
		allColumns.push(...joinColumns);
	}
	const select_with_parens = table_ref.select_with_parens();
	if (select_with_parens) {
		return traverse_select_with_parens(select_with_parens, dbSchema);
	}
	return allColumns;
}

function traverse_join_qual(join_qual: Join_qualContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const a = join_qual;
	return [];
}

function traverse_select_with_parens(select_with_parens: Select_with_parensContext, dbSchema: NotNullInfo[]): NotNullInfo[] {
	const select_with_parens2 = select_with_parens.select_with_parens();
	if (select_with_parens2) {
		return traverse_select_with_parens(select_with_parens2, dbSchema);
	}
	const select_no_parens = select_with_parens.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, dbSchema);
	}
	return [];
}

function traverse_relation_expr(relation_expr: Relation_exprContext, dbSchema: NotNullInfo[]): string {
	const qualified_name = relation_expr.qualified_name();
	const name = traverse_qualified_name(qualified_name, dbSchema);
	return name;
}

function traverse_qualified_name(qualified_name: Qualified_nameContext, dbSchema: NotNullInfo[]): string {
	const colid = qualified_name.colid();
	if (colid) {
		return traverse_colid(colid, dbSchema);
	}
	return '';
}

function traverse_colid(colid: ColidContext, dbSchema: NotNullInfo[]): string {
	const identifier = colid.identifier();
	return traverse_identifier(identifier, dbSchema);
}

function traverse_identifier(identifier: IdentifierContext, dbSchema: NotNullInfo[]) {
	const tableName = identifier.Identifier().getText();
	return tableName;
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
		return a_expr_like_list.every(a_expr_like => isNotNull_a_expr_like(a_expr_like, field));
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
			return fieldName.name === field.column_name;
		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			return true;
		}
		const a_expr = c_expr.a_expr();
		if (a_expr) {
			return isNotNull_a_expr(field, a_expr);
		}
	}
	return false;
}