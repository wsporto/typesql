import { A_expr_addContext, A_expr_andContext, A_expr_at_time_zoneContext, A_expr_betweenContext, A_expr_caretContext, A_expr_collateContext, A_expr_compareContext, A_expr_inContext, A_expr_is_notContext, A_expr_isnullContext, A_expr_lesslessContext, A_expr_likeContext, A_expr_mulContext, A_expr_orContext, A_expr_qual_opContext, A_expr_qualContext, A_expr_typecastContext, A_expr_unary_notContext, A_expr_unary_qualopContext, A_expr_unary_signContext, A_exprContext, C_expr_caseContext, C_expr_exprContext, C_exprContext, ColidContext, Common_table_exprContext, DeletestmtContext, Expr_listContext, From_clauseContext, From_listContext, Func_applicationContext, Func_arg_exprContext, Func_expr_common_subexprContext, IdentifierContext, Insert_column_itemContext, InsertstmtContext, Join_qualContext, Qualified_nameContext, Relation_exprContext, Select_clauseContext, Select_no_parensContext, Select_with_parensContext, SelectstmtContext, Set_clauseContext, Simple_select_intersectContext, Simple_select_pramaryContext, StmtContext, Table_refContext, Target_elContext, Target_labelContext, Target_listContext, Unreserved_keywordContext, UpdatestmtContext, When_clauseContext, Where_clauseContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { PostgresTraverseResult } from './parser';
import { ParserRuleContext } from '@wsporto/typesql-parser';
import { PostgresColumnSchema } from '../drivers/types';
import { splitName } from '../mysql-query-analyzer/select-columns';
import { FieldName } from '../mysql-query-analyzer/types';

type NotNullInfo = {
	table_schema: string;
	table_name: string;
	column_name: string;
	is_nullable: boolean;
}

type TraverseResult = {
	columnsNullability: boolean[],
	parametersNullability: boolean[],
}

export function traverseSmt(stmt: StmtContext, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const traverseResult: TraverseResult = {
		columnsNullability: [],
		parametersNullability: []
	}
	const selectstmt = stmt.selectstmt();
	if (selectstmt) {
		const result = traverseSelectstmt(selectstmt, dbSchema, traverseResult);
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


function traverseSelectstmt(selectstmt: SelectstmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	const result = collectContextsOfType(selectstmt, C_expr_exprContext).filter(c_expr => (c_expr as any).PARAM());
	const paramIsListResult = result.map(param => paramIsList(param));


	const columns = traverse_selectstmt(selectstmt, dbSchema, traverseResult);
	const columnsNullability = columns.map(col => !col.is_nullable);

	return {
		queryType: 'Select',
		columnsNullability,
		parametersNullability: [],
		parameterList: paramIsListResult
	};
}

function traverse_selectstmt(selectstmt: SelectstmtContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const select_no_parens = selectstmt.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, dbSchema, traverseResult);
	}
	return [];
}

function traverse_select_no_parens(select_no_parens: Select_no_parensContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	let withColumns: NotNullInfo[] = [];
	const with_clause = select_no_parens.with_clause()
	if (with_clause) {
		withColumns = with_clause.cte_list().common_table_expr_list().flatMap(common_table_expr => traverse_common_table_expr(common_table_expr, dbSchema, traverseResult));
	}
	const select_clause = select_no_parens.select_clause();
	if (select_clause) {
		return traverse_select_clause(select_clause, withColumns.concat(dbSchema), traverseResult);
	}
	return [];
}

function traverse_common_table_expr(common_table_expr: Common_table_exprContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult) {
	const tableName = common_table_expr.name().getText();
	const select_stmt = common_table_expr.preparablestmt().selectstmt();
	if (select_stmt) {
		const columns = traverse_selectstmt(select_stmt, dbSchema, traverseResult);
		const columnsWithTalbeName = columns.map(col => ({ ...col, table_name: tableName }));
		return columnsWithTalbeName;
	}
	return [];
}

function traverse_select_clause(select_clause: Select_clauseContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const simple_select_intersect_list = select_clause.simple_select_intersect_list();
	let selectColumns: NotNullInfo[] = [];
	if (simple_select_intersect_list) {
		selectColumns = traverse_simple_select_intersect(simple_select_intersect_list[0], dbSchema, traverseResult);
	}
	//union
	for (let index = 1; index < simple_select_intersect_list.length; index++) {
		const unionNotNull = traverse_simple_select_intersect(simple_select_intersect_list[index], dbSchema, traverseResult);
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

function traverse_simple_select_intersect(simple_select_intersect: Simple_select_intersectContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const simple_select_pramary = simple_select_intersect.simple_select_pramary_list()[0];
	if (simple_select_pramary) {
		return traverse_simple_select_pramary(simple_select_pramary, dbSchema, traverseResult);
	}
	return [];
}

function traverse_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const fromColumns: NotNullInfo[] = [];

	const from_clause = simple_select_pramary.from_clause();
	if (from_clause) {
		const where_clause = simple_select_pramary.where_clause();
		const fields = traverse_from_clause(from_clause, dbSchema, traverseResult);
		const fieldsNotNull = where_clause != null ? fields.map(field => checkIsNullable(where_clause, field)) : fields;
		fromColumns.push(...fieldsNotNull);
	}
	const filteredColumns = filterColumns_simple_select_pramary(simple_select_pramary, fromColumns, traverseResult);
	return filteredColumns;
}

function filterColumns_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const target_list_ = simple_select_pramary.target_list_();
	if (target_list_) {
		const target_list = target_list_.target_list();
		if (target_list) {
			return filterColumns_target_list(target_list, fromColumns, traverseResult);
		}
	}
	return [];
}

function filterColumns_target_list(target_list: Target_listContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const columns = target_list.target_el_list().flatMap(target_el => {
		const fieldName = splitName(target_el.getText());
		if (fieldName.name == '*') {
			const columns = filterColumns(fromColumns, fieldName);
			return columns;
		}
		const column = isNotNull_target_el(target_el, fromColumns, traverseResult);
		return [column];
	})
	return columns;
}

function isNotNull_target_el(target_el: Target_elContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo {
	if (target_el instanceof Target_labelContext) {
		const a_expr = target_el.a_expr();
		const isNotNull = traverse_a_expr(a_expr, fromColumns, traverseResult);
		const colLabel = target_el.colLabel();
		const alias = colLabel != null ? colLabel.getText() : '';
		const fieldName = splitName(a_expr.getText());
		return {
			column_name: alias || fieldName.name,
			is_nullable: !isNotNull,
			table_name: fieldName.prefix,
			table_schema: ''
		};
	}
	throw Error('Column not found');
}

function traverse_a_expr(a_expr: A_exprContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		return traverse_a_expr_qual(a_expr_qual, fromColumns, traverseResult);
	}

	return false;
}

function traverse_a_expr_qual(a_expr_qual: A_expr_qualContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return traverse_a_expr_lessless(a_expr_lessless, fromColumns, traverseResult);
	}
	return false;
}

function traverse_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return traverse_expr_or(a_expr_or, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_or(a_expr_or: A_expr_orContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_and = a_expr_or.a_expr_and_list()[0];
	if (a_expr_and) {
		return traverse_expr_and(a_expr_and, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_and(a_expr_and: A_expr_andContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_between = a_expr_and.a_expr_between_list()[0];
	if (a_expr_between) {
		return traverse_expr_between(a_expr_between, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_between(a_expr_between: A_expr_betweenContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (a_expr_in) {
		return traverse_expr_in(a_expr_in, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_in(a_expr_in: A_expr_inContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_unary = a_expr_in.a_expr_unary_not();
	if (a_expr_unary) {
		return traverse_expr_unary(a_expr_unary, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_unary(a_expr_unary: A_expr_unary_notContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_isnull = a_expr_unary.a_expr_isnull();
	if (a_expr_isnull) {
		return traverse_expr_isnull(a_expr_isnull, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_isnull(a_expr_isnull: A_expr_isnullContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		return traverse_expr_is_not(a_expr_is_not, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_is_not(a_expr_is_not: A_expr_is_notContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_compare = a_expr_is_not.a_expr_compare();
	if (a_expr_compare) {
		return traverse_expr_compare(a_expr_compare, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_compare(a_expr_compare: A_expr_compareContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_like = a_expr_compare.a_expr_like_list()[0];
	if (a_expr_like) {
		return traverse_expr_like(a_expr_like, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_like(a_expr_like: A_expr_likeContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_qual_op = a_expr_like.a_expr_qual_op_list()[0];
	if (a_expr_qual_op) {
		return traverse_expr_qual_op(a_expr_qual_op, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_unary_qualop = a_expr_qual_op.a_expr_unary_qualop_list()[0];
	if (a_expr_unary_qualop) {
		return traverse_expr_unary_qualop(a_expr_unary_qualop, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		const isNotNull = a_expr_add.a_expr_mul_list().every(a_expr_mul => traverse_expr_mul(a_expr_mul, fromColumns, traverseResult))
		return isNotNull;
	}
	return false;
}

function traverse_expr_mul(a_expr_mul: A_expr_mulContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_mul_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_mul_list) {
		return a_expr_mul.a_expr_caret_list().every(a_expr_caret => traverse_expr_caret(a_expr_caret, fromColumns, traverseResult));
	}
	return false;
}

function traverse_expr_caret(a_expr_caret: A_expr_caretContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_unary_sign_list = a_expr_caret.a_expr_unary_sign_list();
	if (a_expr_unary_sign_list) {
		return a_expr_caret.a_expr_unary_sign_list().every(a_expr_unary_sign => traverse_expr_unary_sign(a_expr_unary_sign, fromColumns, traverseResult));;
	}
	return false;
}

function traverse_expr_unary_sign(a_expr_unary_sign: A_expr_unary_signContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_at_time_zone = a_expr_unary_sign.a_expr_at_time_zone();
	if (a_expr_at_time_zone) {
		return traverse_expr_at_time_zone(a_expr_at_time_zone, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_at_time_zone(a_expr_at_time_zone: A_expr_at_time_zoneContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_collate = a_expr_at_time_zone.a_expr_collate();
	if (a_expr_collate) {
		return traverse_expr_collate(a_expr_collate, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_collate(a_expr_collate: A_expr_collateContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_typecast = a_expr_collate.a_expr_typecast();
	if (a_expr_typecast) {
		return traverse_expr_typecast(a_expr_typecast, fromColumns, traverseResult);
	}
	return false;
}

function traverse_expr_typecast(a_expr_typecast: A_expr_typecastContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const c_expr = a_expr_typecast.c_expr();
	if (c_expr) {
		return traversec_expr(c_expr, fromColumns, traverseResult);
	}
	return false;
}

function traversec_expr(c_expr: C_exprContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const fieldName = splitName(columnref.getText());
			const col = findColumn(fieldName, fromColumns);
			return !col.is_nullable;
		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			return aexprconst.NULL_P() === null;
		}
		if (c_expr.PARAM()) {
			traverseResult.parametersNullability.push(false);
		}
		const func_application = c_expr.func_expr()?.func_application();
		if (func_application) {
			return traversefunc_application(func_application, fromColumns, traverseResult);
		}
		const func_expr_common_subexpr = c_expr.func_expr()?.func_expr_common_subexpr();
		if (func_expr_common_subexpr) {
			return traversefunc_expr_common_subexpr(func_expr_common_subexpr, fromColumns, traverseResult);
		}
	}
	if (c_expr instanceof C_expr_caseContext) {
		return traversec_expr_case(c_expr, fromColumns, traverseResult);
	}

	return false;
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

function traversec_expr_case(c_expr_case: C_expr_caseContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const case_expr = c_expr_case.case_expr();
	const whenIsNotNull = case_expr.when_clause_list().when_clause_list().every(when_clause => traversewhen_clause(when_clause, fromColumns, traverseResult));
	const elseExpr = case_expr.case_default()?.a_expr();
	const elseIsNotNull = elseExpr ? traverse_a_expr(elseExpr, fromColumns, traverseResult) : false;
	return elseIsNotNull && whenIsNotNull;
}

function traversewhen_clause(when_clause: When_clauseContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr_list = when_clause.a_expr_list();
	const thenExprList = a_expr_list.filter((_, index) => index % 2 == 1);
	return thenExprList.every(thenExpr => traverse_a_expr(thenExpr, fromColumns, traverseResult));
}

function traversefunc_application(func_application: Func_applicationContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const functionName = func_application.func_name().getText().toLowerCase();
	if (functionName === 'count') {
		return true;
	}
	if (functionName === 'concat') {
		const func_arg_expr_list = func_application.func_arg_list().func_arg_expr_list();
		if (func_arg_expr_list) {
			return func_arg_expr_list.every(func_arg_expr => traversefunc_arg_expr(func_arg_expr, fromColumns, traverseResult))
		}
		return false;
	}

	return false;
}

function traversefunc_expr_common_subexpr(func_expr_common_subexpr: Func_expr_common_subexprContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	if (func_expr_common_subexpr.COALESCE()) {
		const func_arg_list = func_expr_common_subexpr.expr_list().a_expr_list();
		const result = func_arg_list.some(func_arg_expr => traverse_a_expr(func_arg_expr, fromColumns, traverseResult));
		return result;
	}
	if (func_expr_common_subexpr.EXTRACT()) {
		const a_expr = func_expr_common_subexpr.extract_list().a_expr();
		const result = traverse_a_expr(a_expr, fromColumns, traverseResult)
		return result;
	}
	return false;
}

function traversefunc_arg_expr(func_arg_expr: Func_arg_exprContext, fromColumns: NotNullInfo[], traverseResult: TraverseResult): boolean {
	const a_expr = func_arg_expr.a_expr();
	return traverse_a_expr(a_expr, fromColumns, traverseResult);
}


function findColumn(fieldName: FieldName, fromColumns: NotNullInfo[]) {
	const col = fromColumns.find(col => (fieldName.prefix === '' || col.table_name === fieldName.prefix) && col.column_name === fieldName.name);
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

function traverse_from_clause(from_clause: From_clauseContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult) {
	const from_list = from_clause.from_list();
	if (from_list) {
		return traverse_from_list(from_list, dbSchema, traverseResult);
	}
	return [];
}

function traverse_from_list(from_list: From_listContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult) {
	const fromColumns = from_list.table_ref_list().flatMap(table_ref => traverse_table_ref(table_ref, dbSchema, traverseResult));
	return fromColumns;
}

function traverse_table_ref(table_ref: Table_refContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const allColumns: NotNullInfo[] = [];
	const relation_expr = table_ref.relation_expr();
	const aliasClause = table_ref.alias_clause();
	const alias = aliasClause ? aliasClause.getText() : undefined;
	if (relation_expr) {
		const tableName = traverse_relation_expr(relation_expr, dbSchema);
		const tableNameWithAlias = alias ? alias : tableName;
		const fromColumns = dbSchema.filter(col => col.table_name === tableName).map(col => ({ ...col, table_name: tableNameWithAlias }));
		allColumns.push(...fromColumns);
	}
	const table_ref_list = table_ref.table_ref_list();
	const join_type_list = table_ref.join_type_list();
	const join_qual_list = table_ref.join_qual_list();
	if (table_ref_list) {
		const joinColumns = table_ref_list.flatMap((table_ref, joinIndex) => {
			const joinType = join_type_list[joinIndex]; //INNER, LEFT
			const joinQual = join_qual_list[joinIndex];
			const joinColumns = traverse_table_ref(table_ref, dbSchema, traverseResult);
			const isUsing = joinQual?.USING() ? true : false;
			const isLeftJoin = joinType.LEFT();
			const filteredColumns = isUsing ? filterUsingColumns(joinColumns, joinQual) : joinColumns;
			const resultColumns = isLeftJoin ? filteredColumns.map(col => ({ ...col, is_nullable: true })) : filteredColumns;
			return resultColumns;
		});
		allColumns.push(...joinColumns);
	}
	const select_with_parens = table_ref.select_with_parens();
	if (select_with_parens) {
		return traverse_select_with_parens(select_with_parens, dbSchema, traverseResult);
	}
	return allColumns;
}

function filterUsingColumns(fromColumns: NotNullInfo[], joinQual: Join_qualContext): NotNullInfo[] {
	const excludeList = joinQual.name_list().name_list().map(name => splitName(name.getText()));
	const filteredColumns = excludeColumns(fromColumns, excludeList);
	return filteredColumns;
}

function traverse_select_with_parens(select_with_parens: Select_with_parensContext, dbSchema: NotNullInfo[], traverseResult: TraverseResult): NotNullInfo[] {
	const select_with_parens2 = select_with_parens.select_with_parens();
	if (select_with_parens2) {
		return traverse_select_with_parens(select_with_parens2, dbSchema, traverseResult);
	}
	const select_no_parens = select_with_parens.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, dbSchema, traverseResult);
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
	return expr_list instanceof Expr_listContext;
}


function traverseInsertstmt(insertstmt: InsertstmtContext, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const insert_target = insertstmt.insert_target();
	const tableName = insert_target.getText();
	const insertColumns = dbSchema.filter(col => col.table_name === tableName);

	const insert_rest = insertstmt.insert_rest();
	const parametersNullability = insert_rest.insert_column_list()
		.insert_column_item_list()
		.map(insert_column_item => traverse_insert_column_item(insert_column_item, insertColumns));

	return {
		queryType: 'Insert',
		parametersNullability,
		columnsNullability: [],
		parameterList: []
	}
}

function traverseDeletestmt(deleteStmt: DeletestmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	return {
		queryType: 'Delete',
		parametersNullability: traverseResult.parametersNullability,
		columnsNullability: [],
		parameterList: []
	}
}

function traverseUpdatestmt(updatestmt: UpdatestmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	const relation_expr_opt_alias = updatestmt.relation_expr_opt_alias();
	const tableName = relation_expr_opt_alias.getText();
	const updateColumns = dbSchema.filter(col => col.table_name === tableName);

	updatestmt.set_clause_list().set_clause_list()
		.map(set_clause => traverse_set_clause(set_clause, updateColumns, traverseResult));

	const dataParameters = traverseResult.parametersNullability;
	const where_clause = updatestmt.where_or_current_clause();
	if (where_clause) {
		const a_expr = where_clause.a_expr();
		traverse_a_expr(a_expr, updateColumns, traverseResult);
	}
	const whereParameters = traverseResult.parametersNullability.slice(dataParameters.length);

	return {
		queryType: 'Update',
		parametersNullability: traverseResult.parametersNullability,
		columnsNullability: [],
		parameterList: [],
		whereParamtersNullability: whereParameters
	}
}

function traverse_set_clause(set_clause: Set_clauseContext, updateColumns: PostgresColumnSchema[], traverseResult: TraverseResult): boolean {
	const set_target = set_clause.set_target();
	const columnName = splitName(set_target.getText());
	const column = findColumn(columnName, updateColumns);
	const a_expr = set_clause.a_expr();
	const paramsBefore = traverseResult.parametersNullability.length;
	traverse_a_expr(a_expr, updateColumns, traverseResult);
	for (let i = paramsBefore; i < traverseResult.parametersNullability.length; i++) {
		traverseResult.parametersNullability[i] = traverseResult.parametersNullability[i] || !column.is_nullable;
	}

	return !column.is_nullable
}

function traverse_insert_column_item(insert_column_item: Insert_column_itemContext, dbSchema: PostgresColumnSchema[]): boolean {
	const colid = insert_column_item.colid();
	return isNotNull_colid(colid, dbSchema);
}

function isNotNull_colid(colid: ColidContext, dbSchema: PostgresColumnSchema[]): boolean {
	const columnName = colid.getText();
	const fieldName = splitName(columnName);
	const column = findColumn(fieldName, dbSchema);
	return !column.is_nullable;
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