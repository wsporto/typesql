import { A_expr_addContext, A_expr_andContext, A_expr_at_time_zoneContext, A_expr_betweenContext, A_expr_caretContext, A_expr_collateContext, A_expr_compareContext, A_expr_inContext, A_expr_is_notContext, A_expr_isnullContext, A_expr_lesslessContext, A_expr_likeContext, A_expr_mulContext, A_expr_orContext, A_expr_qual_opContext, A_expr_qualContext, A_expr_typecastContext, A_expr_unary_notContext, A_expr_unary_qualopContext, A_expr_unary_signContext, A_exprContext, C_expr_caseContext, C_expr_existsContext, C_expr_exprContext, C_exprContext, ColidContext, ColumnElemContext, ColumnrefContext, Common_table_exprContext, CopystmtContext, DeletestmtContext, Expr_listContext, From_clauseContext, From_listContext, Func_applicationContext, Func_arg_exprContext, Func_expr_common_subexprContext, Func_exprContext, IdentifierContext, In_expr_listContext, In_expr_selectContext, In_exprContext, Insert_column_itemContext, InsertstmtContext, Join_qualContext, Join_typeContext, Qualified_nameContext, Relation_exprContext, Select_clauseContext, Select_no_parensContext, Select_with_parensContext, SelectstmtContext, Set_clauseContext, Simple_select_intersectContext, Simple_select_pramaryContext, StmtContext, Table_refContext, Target_elContext, Target_labelContext, Target_listContext, Unreserved_keywordContext, UpdatestmtContext, Values_clauseContext, When_clauseContext, Where_clauseContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { ParserRuleContext } from '@wsporto/typesql-parser';
import { PostgresColumnSchema } from '../drivers/types';
import { extractOriginalSql, splitName } from '../mysql-query-analyzer/select-columns';
import { DynamicSqlInfo2, FieldName } from '../mysql-query-analyzer/types';
import { QueryType } from '../types';
import { Relation2 } from '../sqlite-query-analyzer/sqlite-describe-nested-query';

export type NotNullInfo = {
	table_schema: string;
	table_name: string;
	column_name: string;
	is_nullable: boolean;
	type_id?: number;
}

export type PostgresTraverseResult = {
	queryType: QueryType;
	multipleRowsResult: boolean;
	columns: NotNullInfo[];
	parametersNullability: boolean[];
	whereParamtersNullability?: boolean[];
	parameterList: boolean[];
	limit?: number;
	returning?: boolean;
	relations?: Relation2[];
	dynamicQueryInfo?: DynamicSqlInfo2;
}

type ParamInfo = {
	paramIndex: number;
	isNotNull: boolean;
}

type TraverseResult = {
	columnsNullability: boolean[],
	parameters: ParamInfo[],
	singleRow: boolean;
	relations?: Relation2[];
	dynamicQueryInfo?: DynamicSqlInfo2;
}

type TraverseContext = {
	dbSchema: PostgresColumnSchema[];
	fromColumns: NotNullInfo[];
	propagatesNull?: boolean;
	collectNestedInfo: boolean;
	collectDynamicQueryInfo: boolean;
}

export type Relation3 = {
	name: string;
	alias: string;
	parentRelation: string;
	joinColumn: string;
};

export type TraverseOptions = {
	collectNestedInfo?: boolean;
	collectDynamicQueryInfo?: boolean;
}

export function defaultOptions(): TraverseOptions {
	return {
		collectNestedInfo: false,
		collectDynamicQueryInfo: false
	};
}

export function traverseSmt(stmt: StmtContext, dbSchema: PostgresColumnSchema[], options: TraverseOptions): PostgresTraverseResult {
	const { collectNestedInfo = false, collectDynamicQueryInfo = false } = options;

	const traverseResult: TraverseResult = {
		columnsNullability: [],
		parameters: [],
		singleRow: false
	}
	if (collectNestedInfo) {
		traverseResult.relations = [];
	}
	if (collectDynamicQueryInfo) {
		const dynamicQueryInfo: DynamicSqlInfo2 = {
			with: [],
			select: [],
			from: [],
			where: []
		}
		traverseResult.dynamicQueryInfo = dynamicQueryInfo;
	}
	const traverseContext: TraverseContext = {
		dbSchema,
		collectNestedInfo,
		collectDynamicQueryInfo,
		fromColumns: []
	}
	const selectstmt = stmt.selectstmt();
	if (selectstmt) {
		const result = traverseSelectstmt(selectstmt, traverseContext, traverseResult);
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
	const copystmt = stmt.copystmt();
	if (copystmt) {
		return traverseCopystmt(copystmt, dbSchema, traverseResult);
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

function getInParameterList(ctx: ParserRuleContext) {
	const result = collectContextsOfType(ctx, C_expr_exprContext).filter(c_expr => (c_expr as any).PARAM());
	const paramIsListResult = result.map(param => paramIsList(param));
	return paramIsListResult;
}

function traverseSelectstmt(selectstmt: SelectstmtContext, context: TraverseContext, traverseResult: TraverseResult): PostgresTraverseResult {

	const paramIsListResult = getInParameterList(selectstmt);

	const columns = traverse_selectstmt(selectstmt, context, traverseResult);
	//select parameters are collected after from paramters
	traverseResult.parameters.sort((param1, param2) => param1.paramIndex - param2.paramIndex);

	const multipleRowsResult = !isSingleRowResult(selectstmt, context.dbSchema);

	const limit = checkLimit(selectstmt);
	const postgresTraverseResult: PostgresTraverseResult = {
		queryType: 'Select',
		multipleRowsResult,
		columns,
		parametersNullability: traverseResult.parameters.map(param => param.isNotNull),
		parameterList: paramIsListResult,
		limit
	};
	if (traverseResult.relations) {
		postgresTraverseResult.relations = traverseResult.relations;
	}
	if (traverseResult.dynamicQueryInfo) {
		postgresTraverseResult.dynamicQueryInfo = traverseResult.dynamicQueryInfo;
	}
	return postgresTraverseResult;
}

function traverse_selectstmt(selectstmt: SelectstmtContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const select_no_parens = selectstmt.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, context, traverseResult);
	}
	return [];
}

function traverse_select_no_parens(select_no_parens: Select_no_parensContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	let withColumns: NotNullInfo[] = [];
	const with_clause = select_no_parens.with_clause()
	if (with_clause) {
		with_clause.cte_list().common_table_expr_list()
			.forEach(common_table_expr => {
				const newContext: TraverseContext = { ...context, fromColumns: withColumns.concat(context.fromColumns) };
				const withResult = traverse_common_table_expr(common_table_expr, newContext, traverseResult);
				withColumns.push(...withResult);
			});
	}
	const select_clause = select_no_parens.select_clause();
	const newContext = { ...context, fromColumns: withColumns.concat(context.fromColumns) };
	const selectResult = traverse_select_clause(select_clause, newContext, traverseResult);
	const select_limit = select_no_parens.select_limit();
	if (select_limit) {
		const numParamsBefore = traverseResult.parameters.length;
		const limit_clause = select_limit.limit_clause();
		const limit_a_expr = limit_clause.select_limit_value().a_expr();
		traverse_a_expr(limit_a_expr, context, traverseResult);
		let fragment = '';
		if (limit_clause) {
			if (context.collectDynamicQueryInfo) {
				fragment += extractOriginalSql(limit_clause);
			}
		}
		const offset_clause = select_limit.offset_clause();
		if (offset_clause) {
			const offset_a_expr = offset_clause.select_offset_value().a_expr();
			traverse_a_expr(offset_a_expr, context, traverseResult);
			if (context.collectDynamicQueryInfo) {
				fragment += ' ' + extractOriginalSql(offset_clause);
			}
		}
		if (fragment) {
			const parameters = traverseResult.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);
			traverseResult.dynamicQueryInfo!.limitOffset = {
				fragment,
				parameters
			}
		}
	}

	return selectResult;
}

function traverse_common_table_expr(common_table_expr: Common_table_exprContext, context: TraverseContext, traverseResult: TraverseResult) {
	const tableName = common_table_expr.name().getText();
	const select_stmt = common_table_expr.preparablestmt().selectstmt();
	const numParamsBefore = traverseResult.parameters.length;
	const columns = traverse_selectstmt(select_stmt, { ...context, collectDynamicQueryInfo: false }, traverseResult);
	const columnsWithTalbeName = columns.map(col => ({ ...col, table_name: tableName }));
	if (context.collectDynamicQueryInfo) {
		const parameters = traverseResult.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);
		traverseResult.dynamicQueryInfo?.with.push({
			fragment: extractOriginalSql(common_table_expr),
			relationName: tableName,
			parameters
		})
	}
	return columnsWithTalbeName;
}

function traverse_select_clause(select_clause: Select_clauseContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const simple_select_intersect_list = select_clause.simple_select_intersect_list();
	let selectColumns: NotNullInfo[] = [];
	if (simple_select_intersect_list) {
		selectColumns = traverse_simple_select_intersect(simple_select_intersect_list[0], context, traverseResult);
	}
	//union
	for (let index = 1; index < simple_select_intersect_list.length; index++) {
		const unionNotNull = traverse_simple_select_intersect(simple_select_intersect_list[index], context, traverseResult);
		selectColumns = selectColumns.map((value, columnIndex) => {
			const col: NotNullInfo = {
				column_name: value.column_name,
				is_nullable: value.is_nullable || unionNotNull[columnIndex].is_nullable,
				table_name: '',
				table_schema: ''
			}
			return col;
		});
	}

	return selectColumns;
}

function traverse_simple_select_intersect(simple_select_intersect: Simple_select_intersectContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const simple_select_pramary = simple_select_intersect.simple_select_pramary_list()[0];
	if (simple_select_pramary) {
		return traverse_simple_select_pramary(simple_select_pramary, context, traverseResult);
	}
	return [];
}

function traverse_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const fromColumns: NotNullInfo[] = [];

	const from_clause = simple_select_pramary.from_clause();
	if (from_clause) {
		const where_clause = simple_select_pramary.where_clause();
		const fields = traverse_from_clause(from_clause, context, traverseResult);
		const fieldsNotNull = where_clause != null ? fields.map(field => checkIsNullable(where_clause, field)) : fields;
		fromColumns.push(...fieldsNotNull);
	}
	const values_clause = simple_select_pramary.values_clause();
	if (values_clause) {
		const valuesColumns = traverse_values_clause(values_clause, context, traverseResult);
		return valuesColumns;
	}
	const where_a_expr = simple_select_pramary.where_clause()?.a_expr();
	//fromColumns has precedence
	const newContext = { ...context, fromColumns: fromColumns.concat(context.fromColumns) };
	if (where_a_expr) {
		const numParamsBefore = traverseResult.parameters.length;
		traverse_a_expr(where_a_expr, newContext, traverseResult);
		if (context.collectDynamicQueryInfo) {
			const parameters = traverseResult.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);
			const relations = extractRelations(where_a_expr);
			traverseResult.dynamicQueryInfo?.where.push({
				fragment: `AND ${extractOriginalSql(where_a_expr)}`,
				parameters,
				dependOnRelations: relations
			})
		}
	}
	simple_select_pramary.group_clause()?.group_by_list()?.group_by_item_list().forEach(group_by => {
		const a_expr = group_by.a_expr();
		if (a_expr) {
			traverse_a_expr(a_expr, newContext, traverseResult);
		}
	});
	const having_expr = simple_select_pramary.having_clause()?.a_expr();
	if (having_expr) {
		traverse_a_expr(having_expr, newContext, traverseResult);
	}

	const filteredColumns = filterColumns_simple_select_pramary(simple_select_pramary, newContext, traverseResult);
	return filteredColumns;
}

function extractRelations(a_expr: A_exprContext): string[] {
	const columnsRef = collectContextsOfType(a_expr, ColumnrefContext);
	const relations = columnsRef
		.map((colRefExpr) => {
			const colRef = colRefExpr as ColumnrefContext;
			const tableName = splitName(colRef.getText());
			return tableName;
		});
	const uniqueRelations = [...new Set(relations.map(relation => relation.prefix))]
	return uniqueRelations;
}

function traverse_values_clause(values_clause: Values_clauseContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const expr_list_list = values_clause.expr_list_list();
	return expr_list_list.flatMap(expr_list => traverse_expr_list(expr_list, context, traverseResult));
}

function traverse_expr_list(expr_list: Expr_listContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const columns = expr_list.a_expr_list().map((a_expr, index) => {
		const exprResult = traverse_a_expr(a_expr, context, traverseResult);
		if (isParameter(exprResult.column_name)) {
			traverseResult.parameters.at(-1)!.isNotNull = !context.fromColumns[index].is_nullable;
		}
		return exprResult;
	});
	return columns;
}

function filterColumns_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const target_list_ = simple_select_pramary.target_list_();
	if (target_list_) {
		const target_list = target_list_.target_list();
		if (target_list) {
			return traverse_target_list(target_list, context, traverseResult);
		}
	}
	const target_list = simple_select_pramary.target_list();
	if (target_list) {
		return traverse_target_list(target_list, context, traverseResult);
	}
	return [];
}

function traverse_target_list(target_list: Target_listContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const columns = target_list.target_el_list().flatMap((target_el, index) => {
		const fieldName = splitName(target_el.getText());
		if (fieldName.name == '*') {
			const columns = filterColumns(context.fromColumns, fieldName);
			if (context.collectDynamicQueryInfo) {
				columns.forEach(col => {
					traverseResult.dynamicQueryInfo?.select.push({
						fragment: `${col.table_name}.${col.column_name}`,
						fragmentWitoutAlias: `${col.table_name}.${col.column_name}`,
						dependOnRelations: [col.table_name],
						parameters: []
					});
				})
			}
			return columns;
		}
		const column = traverse_target_el(target_el, context, traverseResult);
		if (isParameter(column.column_name)) {
			traverseResult.parameters.at(-1)!.isNotNull = !context.fromColumns[index].is_nullable;
		}
		return [column];
	})
	return columns;
}

function traverse_target_el(target_el: Target_elContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	if (target_el instanceof Target_labelContext) {
		const a_expr = target_el.a_expr();
		const numParamsBefore = traverseResult.parameters.length;
		const exprResult = traverse_a_expr(a_expr, context, traverseResult);
		const colLabel = target_el.colLabel();
		const alias = colLabel != null ? colLabel.getText() : '';

		if (alias) {
			traverseResult.relations?.forEach(relation => {
				if ((relation.name === exprResult.table_name || relation.alias === exprResult.table_name)
					&& relation.joinColumn === exprResult.column_name) {
					relation.joinColumn = alias;
				}
			})
		}
		if (context.collectDynamicQueryInfo) {
			const parameters = traverseResult.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);
			const relations = extractRelations(target_el.a_expr());
			traverseResult.dynamicQueryInfo?.select.push({
				fragment: extractOriginalSql(target_el),
				fragmentWitoutAlias: extractOriginalSql(target_el.a_expr()),
				dependOnRelations: relations,
				parameters
			})
		}
		return {
			column_name: alias || exprResult.column_name,
			is_nullable: exprResult.is_nullable,
			table_name: exprResult.table_name,
			table_schema: exprResult.table_schema
		};
	}
	throw Error('Column not found');
}

function traverse_a_expr(a_expr: A_exprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		const notNull = traverse_a_expr_qual(a_expr_qual, context, traverseResult);
		return notNull;
	}
	return {
		column_name: '',
		is_nullable: true,
		table_name: '',
		table_schema: ''
	};
}

function traverse_a_expr_qual(a_expr_qual: A_expr_qualContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return traverse_a_expr_lessless(a_expr_lessless, context, traverseResult);
	}
	throw Error('traverse_a_expr_qual -  Not expected:' + a_expr_qual.getText());
}

function traverse_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return traverse_expr_or(a_expr_or, context, traverseResult);
	}
	throw Error('traverse_a_expr_lessless -  Not expected:' + a_expr_lessless.getText());
}

function traverse_expr_or(a_expr_or: A_expr_orContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	// expr1 OR expr2
	const result = a_expr_or.a_expr_and_list().map(a_expr_and => traverse_expr_and(a_expr_and, context, traverseResult));
	if (result.length === 1) {
		return result[0];
	}
	return {
		column_name: '?column?',
		is_nullable: result.some(col => col.is_nullable),
		table_name: '',
		table_schema: ''
	} satisfies NotNullInfo;
}

function traverse_expr_and(a_expr_and: A_expr_andContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const result = a_expr_and.a_expr_between_list().map(a_expr_between => traverse_expr_between(a_expr_between, context, traverseResult));
	if (result.length === 1) {
		return result[0];
	}
	return {
		column_name: '?column?',
		is_nullable: result.some(col => col.is_nullable),
		table_name: '',
		table_schema: ''
	} satisfies NotNullInfo;
}

function traverse_expr_between(a_expr_between: A_expr_betweenContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (!a_expr_between.AND()) {
		return traverse_expr_in(a_expr_in, context, traverseResult);
	}
	const start = a_expr_between.a_expr_in_list()[1];
	traverse_expr_in(start, context, traverseResult);
	const end = a_expr_between.a_expr_in_list()[2];
	traverse_expr_in(end, context, traverseResult);
	return {
		column_name: a_expr_between.getText(),
		is_nullable: false,
		table_name: '',
		table_schema: ''
	}
}

function traverse_expr_in(a_expr_in: A_expr_inContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_unary = a_expr_in.a_expr_unary_not();
	let leftExprResult = undefined;
	if (a_expr_unary) {
		leftExprResult = traverse_expr_unary(a_expr_unary, context, traverseResult);
	}
	const in_expr = a_expr_in.in_expr();
	if (in_expr) {
		traverse_in_expr(in_expr, context, traverseResult);
	}
	if (in_expr === null && leftExprResult != null) {
		return leftExprResult;
	}
	return {
		column_name: a_expr_in.getText(),
		//id in (...)  -> is_nullable: false
		// value -> is_nullable = leftExprResult.is_nullable
		is_nullable: in_expr != null ? false : leftExprResult!.is_nullable,
		table_name: '',
		table_schema: ''
	} satisfies NotNullInfo
}

function traverse_in_expr(in_expr: In_exprContext, context: TraverseContext, traverseResult: TraverseResult) {
	if (in_expr instanceof In_expr_selectContext) {
		const select_with_parens = in_expr.select_with_parens();
		traverse_select_with_parens(select_with_parens, context, traverseResult);
	}
	if (in_expr instanceof In_expr_listContext) {
		in_expr.expr_list().a_expr_list().forEach(a_expr => {
			traverse_a_expr(a_expr, context, traverseResult);
		})
	}
}

function traverse_expr_unary(a_expr_unary: A_expr_unary_notContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_isnull = a_expr_unary.a_expr_isnull();
	if (a_expr_isnull) {
		return traverse_expr_isnull(a_expr_isnull, context, traverseResult);
	}
	throw Error('traverse_expr_unary -  Not expected:' + a_expr_unary.getText());
}

function traverse_expr_isnull(a_expr_isnull: A_expr_isnullContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		return traverse_expr_is_not(a_expr_is_not, context, traverseResult);
	}
	throw Error('traverse_expr_isnull -  Not expected:' + a_expr_isnull.getText());
}

function traverse_expr_is_not(a_expr_is_not: A_expr_is_notContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_compare = a_expr_is_not.a_expr_compare();
	if (a_expr_compare) {
		const result = traverse_expr_compare(a_expr_compare, context, traverseResult);
		if (a_expr_is_not.IS() && a_expr_is_not.NULL_P()) {
			checkParamterNullability(result, traverseResult);
		}
		return result;
	}
	throw Error('traverse_expr_is_not -  Not expected:' + a_expr_is_not.getText());
}

function checkParamterNullability(column: NotNullInfo, traverseResult: TraverseResult) {
	if (isParameter(column.column_name)) {
		column.is_nullable = true;
		const param = traverseResult.parameters.at(-1);
		if (param) {
			param.isNotNull = false;
		}
	}
}

function traverse_expr_compare(a_expr_compare: A_expr_compareContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_like_list = a_expr_compare.a_expr_like_list();
	const result = a_expr_like_list.map(a_expr_like => traverse_expr_like(a_expr_like, context, traverseResult));
	if (!a_expr_compare.sub_type()) {
		if (a_expr_like_list.length === 1) {
			return result[0];
		}
		return {
			column_name: '?column?',
			is_nullable: result.some(col => col.is_nullable),
			table_name: '',
			table_schema: ''
		}
	}
	const select_with_parens = a_expr_compare.select_with_parens();
	if (select_with_parens) {
		const result = traverse_select_with_parens(select_with_parens, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: result.some(col => col.is_nullable),
			table_name: '',
			table_schema: ''
		}
	}
	const a_expr = a_expr_compare.a_expr();
	if (a_expr) {
		const result = traverse_a_expr(a_expr, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: result.is_nullable,
			table_name: '',
			table_schema: ''
		}
	}
	throw Error('traverse_expr_compare -  Not expected:' + a_expr_compare.getText());
}

function traverse_expr_like(a_expr_like: A_expr_likeContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_qual_op_list = a_expr_like.a_expr_qual_op_list();
	if (a_expr_qual_op_list) {
		const result = a_expr_qual_op_list.map(a_expr_qual_op => traverse_expr_qual_op(a_expr_qual_op, context, traverseResult));
		if (result.length === 1) {
			return result[0];
		}
		return {
			column_name: '?column?',
			is_nullable: result.some(col => col.is_nullable),
			table_name: '',
			table_schema: ''
		} satisfies NotNullInfo
	}
	throw Error('traverse_expr_like -  Not expected:' + a_expr_like.getText());
}

function traverse_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_unary_qualop = a_expr_qual_op.a_expr_unary_qualop_list()[0];
	if (a_expr_unary_qualop) {
		return traverse_expr_unary_qualop(a_expr_unary_qualop, context, traverseResult);
	}
	throw Error('traverse_expr_qual_op -  Not expected:' + a_expr_qual_op.getText());
}

function traverse_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		const exprResult = a_expr_add.a_expr_mul_list().map(a_expr_mul => traverse_expr_mul(a_expr_mul, context, traverseResult));
		if (exprResult.length === 1) {
			return exprResult[0];
		}
		const result: NotNullInfo = {
			column_name: '?column?',
			is_nullable: exprResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: ''
		}
		return result;
	}
	throw Error('traverse_expr_unary_qualop -  Not expected:' + a_expr_unary_qualop.getText());
}

function traverse_expr_mul(a_expr_mul: A_expr_mulContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_mul_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_mul_list) {
		const notNullInfo = a_expr_mul.a_expr_caret_list().map(a_expr_caret => traverse_expr_caret(a_expr_caret, context, traverseResult));
		if (notNullInfo.length === 1) {
			return notNullInfo[0];
		}
		const result: NotNullInfo = {
			column_name: '?column?',
			is_nullable: notNullInfo.some(notNullInfo => notNullInfo.is_nullable),
			table_name: '',
			table_schema: ''
		}
		return result;
	}
	throw Error('traverse_expr_mul -  Not expected:' + a_expr_mul.getText());
}

function traverse_expr_caret(a_expr_caret: A_expr_caretContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_unary_sign_list = a_expr_caret.a_expr_unary_sign_list();
	if (a_expr_unary_sign_list) {
		const notNullInfo = a_expr_caret.a_expr_unary_sign_list()
			.map(a_expr_unary_sign => traverse_expr_unary_sign(a_expr_unary_sign, context, traverseResult));
		if (notNullInfo.length === 1) {
			return notNullInfo[0];
		}
		const result: NotNullInfo = {
			column_name: '?column?',
			is_nullable: notNullInfo.some(notNullInfo => notNullInfo.is_nullable),
			table_name: '',
			table_schema: ''
		}
		return result;
	}
	throw Error('traverse_expr_caret -  Not expected:' + a_expr_caret.getText());
}

function traverse_expr_unary_sign(a_expr_unary_sign: A_expr_unary_signContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_at_time_zone = a_expr_unary_sign.a_expr_at_time_zone();
	if (a_expr_at_time_zone) {
		return traverse_expr_at_time_zone(a_expr_at_time_zone, context, traverseResult);
	}
	throw Error('traverse_expr_unary_sign -  Not expected:' + a_expr_unary_sign.getText());
}

function traverse_expr_at_time_zone(a_expr_at_time_zone: A_expr_at_time_zoneContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_collate = a_expr_at_time_zone.a_expr_collate();
	if (a_expr_collate) {
		return traverse_expr_collate(a_expr_collate, context, traverseResult);
	}
	throw Error('traverse_expr_at_time_zone -  Not expected:' + a_expr_at_time_zone.getText());
}

function traverse_expr_collate(a_expr_collate: A_expr_collateContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_typecast = a_expr_collate.a_expr_typecast();
	if (a_expr_typecast) {
		return traverse_expr_typecast(a_expr_typecast, context, traverseResult);
	}
	throw Error('traverse_expr_collate -  Not expected:' + a_expr_collate.getText());
}

function traverse_expr_typecast(a_expr_typecast: A_expr_typecastContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const c_expr = a_expr_typecast.c_expr();
	if (c_expr) {
		return traversec_expr(c_expr, context, traverseResult);
	}
	throw Error('traverse_expr_typecast -  Not expected:' + a_expr_typecast.getText());
}

function traverseColumnRef(columnref: ColumnrefContext, fromColumns: NotNullInfo[]): NotNullInfo {
	const fieldName = splitName(columnref.getText());
	const col = findColumn(fieldName, fromColumns);
	return col;
}

function traversec_expr(c_expr: C_exprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const col = traverseColumnRef(columnref, context.fromColumns);
			return col;
		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			const is_nullable = aexprconst.NULL_P() != null;
			return {
				column_name: aexprconst.getText(),
				is_nullable,
				table_name: '',
				table_schema: ''
			}
		}
		if (c_expr.PARAM()) {
			traverseResult.parameters.push({
				paramIndex: c_expr.start.start,
				isNotNull: !context.propagatesNull
			});
			return {
				column_name: c_expr.PARAM().getText(),
				is_nullable: !!context.propagatesNull,
				table_name: '',
				table_schema: ''
			}
		}
		const func_application = c_expr.func_expr()?.func_application();
		if (func_application) {
			const isNotNull = traversefunc_application(func_application, context, traverseResult);
			return {
				column_name: func_application.func_name()?.getText() || func_application.getText(),
				is_nullable: !isNotNull,
				table_name: '',
				table_schema: ''
			}
		}
		const func_expr_common_subexpr = c_expr.func_expr()?.func_expr_common_subexpr();
		if (func_expr_common_subexpr) {
			const isNotNull = traversefunc_expr_common_subexpr(func_expr_common_subexpr, context, traverseResult);
			return {
				column_name: func_expr_common_subexpr.getText().split('(')?.[0]?.trim() || func_expr_common_subexpr.getText(),
				is_nullable: !isNotNull,
				table_name: '',
				table_schema: ''
			}
		}
		const select_with_parens = c_expr.select_with_parens();
		if (select_with_parens) {
			traverse_select_with_parens(select_with_parens, context, traverseResult);
			return {
				column_name: '?column?',
				is_nullable: true,
				table_name: '',
				table_schema: ''
			}
		}
		const a_expr_in_parens = c_expr._a_expr_in_parens;
		if (a_expr_in_parens) {
			return traverse_a_expr(a_expr_in_parens, context, traverseResult);
		}
		const explicit_row = c_expr.explicit_row();
		if (explicit_row) {
			const expr_list = explicit_row.expr_list().a_expr_list()
				.map(a_expr => traverse_a_expr(a_expr, context, traverseResult));
			return {
				column_name: '?column?',
				is_nullable: expr_list.some(col => col.is_nullable),
				table_name: '',
				table_schema: ''
			}
		}
		const implicit_row = c_expr.implicit_row();
		if (implicit_row) {
			const expr_list = implicit_row.expr_list().a_expr_list().concat(implicit_row.a_expr())
				.map(a_expr => traverse_a_expr(a_expr, context, traverseResult));
			return {
				column_name: '?column?',
				is_nullable: expr_list.some(col => col.is_nullable),
				table_name: '',
				table_schema: ''
			}
		}
	}
	if (c_expr instanceof C_expr_caseContext) {
		const isNotNull = traversec_expr_case(c_expr, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: !isNotNull,
			table_name: '',
			table_schema: ''
		}
	}
	if (c_expr instanceof C_expr_existsContext) {
		const select_with_parens = c_expr.select_with_parens();
		traverse_select_with_parens(select_with_parens, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: false,
			table_name: '',
			table_schema: ''
		}
	}
	throw Error('traversec_expr -  Not expected:' + c_expr.getText());
}

function filterColumns(fromColumns: NotNullInfo[], fieldName: FieldName) {
	return fromColumns.filter(col => (fieldName.prefix === '' || col.table_name === fieldName.prefix)
		&& (fieldName.name === '*' || col.column_name === fieldName.name)).map(col => {
			const result: NotNullInfo = {
				column_name: col.column_name,
				is_nullable: col.is_nullable,
				table_name: col.table_name,
				table_schema: col.table_schema
			}
			return result;
		});
}

function excludeColumns(fromColumns: NotNullInfo[], excludeList: FieldName[]) {
	return fromColumns.filter(col => {
		const found = excludeList.find(excluded => (excluded.prefix === '' || col.table_name === excluded.prefix)
			&& excluded.name == col.column_name);
		return !found;
	});
}

function traversec_expr_case(c_expr_case: C_expr_caseContext, context: TraverseContext, traverseResult: TraverseResult): boolean {
	const case_expr = c_expr_case.case_expr();
	const whenResult = case_expr.when_clause_list().when_clause_list().map(when_clause => traversewhen_clause(when_clause, context, traverseResult));
	const whenIsNotNull = whenResult.every(when => when);
	const elseExpr = case_expr.case_default()?.a_expr();
	const elseIsNotNull = elseExpr ? !traverse_a_expr(elseExpr, context, traverseResult).is_nullable : false;
	return elseIsNotNull && whenIsNotNull;
}

function traversewhen_clause(when_clause: When_clauseContext, context: TraverseContext, traverseResult: TraverseResult): boolean {
	const a_expr_list = when_clause.a_expr_list();
	const [whenExprList, thenExprList] = partition(a_expr_list, (index) => index % 2 === 0);

	const whenExprResult = thenExprList.map((thenExpr, index) => {
		traverse_a_expr(whenExprList[index], context, traverseResult);
		const thenExprResult = traverse_a_expr(thenExpr, context, traverseResult);
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

function traversefunc_application(func_application: Func_applicationContext, context: TraverseContext, traverseResult: TraverseResult): boolean {
	const functionName = func_application.func_name().getText().toLowerCase();
	const func_arg_expr_list = func_application.func_arg_list()?.func_arg_expr_list() || [];
	const argsResult = func_arg_expr_list.map(func_arg_expr => traversefunc_arg_expr(func_arg_expr, context, traverseResult))
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

	return false;
}

function traversefunc_expr_common_subexpr(func_expr_common_subexpr: Func_expr_common_subexprContext, context: TraverseContext, traverseResult: TraverseResult): boolean {
	if (func_expr_common_subexpr.COALESCE() || func_expr_common_subexpr.GREATEST() || func_expr_common_subexpr.LEAST()) {
		const func_arg_list = func_expr_common_subexpr.expr_list().a_expr_list();
		const result = func_arg_list.map(func_arg_expr => {
			const paramResult = traverse_a_expr(func_arg_expr, { ...context, propagatesNull: true }, traverseResult);
			return paramResult;
		});
		return result.some(col => !col.is_nullable);
	}
	if (func_expr_common_subexpr.EXTRACT()) {
		const a_expr = func_expr_common_subexpr.extract_list().a_expr();
		const result = traverse_a_expr(a_expr, context, traverseResult)
		return !result.is_nullable;
	}
	func_expr_common_subexpr.a_expr_list().forEach(a_expr => {
		traverse_a_expr(a_expr, context, traverseResult);
	})
	return false;
}

function traversefunc_arg_expr(func_arg_expr: Func_arg_exprContext, context: TraverseContext, traverseResult: TraverseResult): boolean {
	const a_expr = func_arg_expr.a_expr();
	return !traverse_a_expr(a_expr, context, traverseResult).is_nullable;
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

function traverse_from_clause(from_clause: From_clauseContext, context: TraverseContext, traverseResult: TraverseResult) {
	const from_list = from_clause.from_list();
	if (from_list) {
		return traverse_from_list(from_list, context, traverseResult);
	}
	return [];
}

function traverse_from_list(from_list: From_listContext, context: TraverseContext, traverseResult: TraverseResult) {
	const newColumns = from_list.table_ref_list().flatMap(table_ref => traverse_table_ref(table_ref, context, traverseResult));
	return newColumns;
}

function traverse_table_ref(table_ref: Table_refContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const { fromColumns, dbSchema } = context;
	const allColumns: NotNullInfo[] = [];
	const relation_expr = table_ref.relation_expr();
	const aliasClause = table_ref.alias_clause();
	const alias = aliasClause ? aliasClause.colid().getText() : '';
	if (relation_expr) {
		const tableName = traverse_relation_expr(relation_expr, dbSchema);
		const tableNameWithAlias = alias ? alias : tableName.name;
		const fromColumnsResult = fromColumns.concat(dbSchema).filter(col => col.table_name.toLowerCase() === tableName.name.toLowerCase())
			.map(col => ({ ...col, table_name: tableNameWithAlias.toLowerCase() }));
		allColumns.push(...fromColumnsResult);
		if (context.collectNestedInfo) {

			const key = fromColumnsResult.filter(col => (col as PostgresColumnSchema).column_key === 'PRI');

			const renameAs = aliasClause?.AS() != null;
			const relation: Relation2 = {
				name: tableName.name,
				alias: alias,
				renameAs,
				parentRelation: '',
				joinColumn: key[0]?.column_name || '',
				cardinality: 'one',
				parentCardinality: 'one'
			}
			traverseResult.relations?.push(relation);
		}
		const table_ref_list = table_ref.table_ref_list();
		const join_type_list = table_ref.join_type_list();
		const join_qual_list = table_ref.join_qual_list();

		if (context.collectDynamicQueryInfo && traverseResult.dynamicQueryInfo!.from.length == 0) {
			collectDynamicQueryInfoTableRef(table_ref, null, null, fromColumnsResult, [], traverseResult);
		}

		if (table_ref_list) {
			const joinColumns = table_ref_list.flatMap((table_ref, joinIndex) => {
				const joinType = join_type_list[joinIndex]; //INNER, LEFT
				const joinQual = join_qual_list[joinIndex];
				const numParamsBefore = traverseResult.parameters.length;
				const joinColumns = traverse_table_ref(table_ref, context, traverseResult);
				const isUsing = joinQual?.USING() ? true : false;
				const isLeftJoin = joinType?.LEFT();
				const filteredColumns = isUsing ? filterUsingColumns(joinColumns, joinQual) : joinColumns;
				const resultColumns = isLeftJoin ? filteredColumns.map(col => ({ ...col, is_nullable: true })) : filteredColumns;

				if (context.collectNestedInfo) {
					collectNestedInfo(joinQual, resultColumns, traverseResult);
				}
				if (context.collectDynamicQueryInfo) {
					const parameters = traverseResult.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);
					collectDynamicQueryInfoTableRef(table_ref, joinType, joinQual, resultColumns, parameters, traverseResult);
				}

				return resultColumns;
			});
			allColumns.push(...joinColumns);
		}
	}
	const select_with_parens = table_ref.select_with_parens();
	if (select_with_parens) {
		const columns = traverse_select_with_parens(select_with_parens, { ...context, collectDynamicQueryInfo: false }, traverseResult);
		const withAlias = columns.map(col => ({ ...col, table_name: alias || col.table_name }));
		return withAlias;
	}
	return allColumns;
}

function collectDynamicQueryInfoTableRef(table_ref: Table_refContext, joinType: Join_typeContext | null,
	joinQual: Join_qualContext | null, columns: NotNullInfo[], parameters: number[], traverseResult: TraverseResult) {
	const alias = table_ref.alias_clause() ? extractOriginalSql(table_ref.alias_clause()) : '';
	const fromExpr = extractOriginalSql(table_ref.relation_expr() || table_ref.select_with_parens());
	const tableName = table_ref.relation_expr()?.getText() || alias;
	const fromOrJoin = joinType ? `${extractOriginalSql(joinType)} JOIN` : 'FROM';
	const join = joinQual ? ` ${extractOriginalSql(joinQual)}` : '';

	const fromFragment = `${fromOrJoin} ${fromExpr} ${alias}${join}`;
	const fields = columns.map(col => col.column_name);
	const joinColumns = joinQual ? getJoinColumns(joinQual) : [];
	const parentList = joinColumns.filter(joinRef => joinRef.prefix !== tableName && joinRef.prefix !== alias);
	const parentRelation = parentList.length === 1 ? parentList[0].prefix : '';
	traverseResult.dynamicQueryInfo?.from.push({
		fragment: fromFragment,
		fields,
		parameters,
		relationName: tableName,
		relationAlias: alias,
		parentRelation
	})
}

function getJoinColumns(joinQual: Join_qualContext): FieldName[] {
	const a_expr_or_list = joinQual ? collectContextsOfType(joinQual, A_expr_orContext) : [];
	if (a_expr_or_list.length == 1) {
		const a_expr_or = a_expr_or_list[0] as A_expr_orContext;
		const a_expr_and = a_expr_or.a_expr_and_list()[0];
		const columnref = collectContextsOfType(a_expr_and, ColumnrefContext);
		const joinColumns = columnref.map(colRef => splitName(colRef.getText()));
		return joinColumns;
	}
	return [];
}

function collectNestedInfo(joinQual: Join_qualContext, resultColumns: NotNullInfo[], traverseResult: TraverseResult) {

	const joinColumns = getJoinColumns(joinQual);

	const currentRelation = traverseResult.relations?.at(-1);
	joinColumns.forEach(joinRef => {
		if (currentRelation) {
			const joinColumn = resultColumns.filter(col => col.column_name === joinRef.name)[0] as PostgresColumnSchema;
			const unique = joinColumn && (joinColumn.column_key === 'PRI' || joinColumn.column_key === 'UNI');
			if (joinRef.prefix === currentRelation.name || joinRef.prefix === currentRelation.alias) {
				if (!unique) {
					currentRelation.cardinality = 'many';
				}
			}
			else {
				currentRelation.parentRelation = joinRef.prefix;
				if (!unique) {
					currentRelation.parentCardinality = 'many';
				}
			}
		}
	})
}

function filterUsingColumns(fromColumns: NotNullInfo[], joinQual: Join_qualContext): NotNullInfo[] {
	const excludeList = joinQual.name_list().name_list().map(name => splitName(name.getText()));
	const filteredColumns = excludeColumns(fromColumns, excludeList);
	return filteredColumns;
}

function traverse_select_with_parens(select_with_parens: Select_with_parensContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const select_with_parens2 = select_with_parens.select_with_parens();
	if (select_with_parens2) {
		return traverse_select_with_parens(select_with_parens2, context, traverseResult);
	}
	const select_no_parens = select_with_parens.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, context, traverseResult);
	}
	return [];
}

function traverse_relation_expr(relation_expr: Relation_exprContext, dbSchema: NotNullInfo[]): TableName {
	const qualified_name = relation_expr.qualified_name();
	const name = traverse_qualified_name(qualified_name, dbSchema);
	return name;
}

function traverse_qualified_name(qualified_name: Qualified_nameContext, dbSchema: NotNullInfo[]): TableName {
	const colid_name = qualified_name.colid() ? get_colid_text(qualified_name.colid(), dbSchema) : '';

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

function get_colid_text(colid: ColidContext, dbSchema: NotNullInfo[]): string {
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
	const insertColumns = dbSchema.filter(col => col.table_name.toLowerCase() === tableName.toLowerCase());

	const insert_rest = insertstmt.insert_rest();
	const insertColumnsList = insert_rest.insert_column_list()
		.insert_column_item_list()
		.map(insert_column_item => traverse_insert_column_item(insert_column_item, insertColumns));

	const context: TraverseContext = {
		dbSchema,
		fromColumns: insertColumns,
		collectNestedInfo: false,
		collectDynamicQueryInfo: false
	}

	const selectstmt = insert_rest.selectstmt();
	traverseSelectstmt(selectstmt, { ...context, fromColumns: insertColumnsList }, traverseResult);

	const on_conflict = insertstmt.on_conflict_();
	if (on_conflict) {
		const set_clause_list = on_conflict.set_clause_list().set_clause_list() || [];
		set_clause_list.forEach(set_clause => traverse_set_clause(set_clause, context, traverseResult));
	}

	const returning_clause = insertstmt.returning_clause();
	const returninColumns = returning_clause ? traverse_target_list(returning_clause.target_list(), context, traverseResult) : [];

	const result: PostgresTraverseResult = {
		queryType: 'Insert',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.map(param => param.isNotNull),
		columns: returninColumns,
		parameterList: []
	}
	if (returning_clause) {
		result.returning = true;
	}
	return result;
}

function traverseDeletestmt(deleteStmt: DeletestmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	const relation_expr = deleteStmt.relation_expr_opt_alias().relation_expr();
	const tableName = relation_expr.getText();
	const deleteColumns = dbSchema.filter(col => col.table_name.toLowerCase() === tableName.toLowerCase());

	const paramIsListResult = getInParameterList(deleteStmt);

	const returning_clause = deleteStmt.returning_clause();
	const context: TraverseContext = {
		dbSchema,
		fromColumns: deleteColumns,
		collectNestedInfo: false,
		collectDynamicQueryInfo: false
	}
	const whereExpr = deleteStmt.where_or_current_clause()?.a_expr();
	if (whereExpr) {
		traverse_a_expr(whereExpr, context, traverseResult);
	}

	const returninColumns = returning_clause ? traverse_target_list(returning_clause.target_list(), context, traverseResult) : [];

	const result: PostgresTraverseResult = {
		queryType: 'Delete',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.map(param => param.isNotNull),
		columns: returninColumns,
		parameterList: paramIsListResult
	}
	if (returning_clause) {
		result.returning = true;
	}
	return result;
}

function traverseUpdatestmt(updatestmt: UpdatestmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	const relation_expr_opt_alias = updatestmt.relation_expr_opt_alias();
	const tableName = relation_expr_opt_alias.getText();
	const updateColumns = dbSchema.filter(col => col.table_name.toLowerCase() === tableName.toLowerCase());
	const context: TraverseContext = {
		dbSchema,
		fromColumns: updateColumns,
		collectNestedInfo: false,
		collectDynamicQueryInfo: false
	}

	updatestmt.set_clause_list().set_clause_list()
		.forEach(set_clause => traverse_set_clause(set_clause, context, traverseResult));


	const parametersBefore = traverseResult.parameters.length;
	const where_clause = updatestmt.where_or_current_clause();
	if (where_clause) {
		const a_expr = where_clause.a_expr();
		traverse_a_expr(a_expr, context, traverseResult);
	}
	const whereParameters = traverseResult.parameters.slice(parametersBefore);

	const returning_clause = updatestmt.returning_clause();
	const returninColumns = returning_clause ? traverse_target_list(returning_clause.target_list(), context, traverseResult) : [];

	const result: PostgresTraverseResult = {
		queryType: 'Update',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.slice(0, parametersBefore).map(param => param.isNotNull),
		columns: returninColumns,
		parameterList: [],
		whereParamtersNullability: whereParameters.map(param => param.isNotNull)
	}
	if (returning_clause) {
		result.returning = true;
	}
	return result;
}

function traverse_set_clause(set_clause: Set_clauseContext, context: TraverseContext, traverseResult: TraverseResult): void {
	const set_target = set_clause.set_target();
	const columnName = splitName(set_target.getText());
	const column = findColumn(columnName, context.fromColumns);
	const a_expr = set_clause.a_expr();
	const excludedColumns = context.fromColumns.map((col) => ({ ...col, table_name: 'excluded' }) satisfies NotNullInfo);
	const a_exprResult = traverse_a_expr(a_expr, { ...context, fromColumns: context.fromColumns.concat(excludedColumns) }, traverseResult);
	if (isParameter(a_exprResult.column_name)) {
		traverseResult.parameters[traverseResult.parameters.length - 1].isNotNull = !column.is_nullable;
	}
}

function traverse_insert_column_item(insert_column_item: Insert_column_itemContext, fromColumns: PostgresColumnSchema[]): NotNullInfo {
	const colid = insert_column_item.colid();
	return traverse_colid(colid, fromColumns);
}

function traverse_colid(colid: ColidContext, dbSchema: PostgresColumnSchema[]): NotNullInfo {
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
		const hasSetReturningFunction = simple_select_pramary.target_list_()?.target_list().target_el_list().some(target_el => isSetReturningFunction_target_el(target_el));
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

	const where_clause = simple_select_pramary.where_clause();
	if (where_clause) {
		const tableName = getTableName(table_ref_list[0]);
		const uniqueKeys = dbSchema.filter(col => col.table_name.toLowerCase() === tableName.name.toLowerCase()
			&& (col.column_key === 'PRI' || col.column_key === 'UNI'))
			.map(col => col.column_name);
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
	const uniqueCheck = a_expr_between_list.flatMap(a_expr_between => getCheckedKeys_a_expr_between(a_expr_between));
	const allIncluded = uniqueKeys.every(key => uniqueCheck.includes(key));

	return allIncluded;
}
function getCheckedKeys_a_expr_between(a_expr_between: A_expr_betweenContext): string[] {
	const checkedKeys = a_expr_between.a_expr_in_list().flatMap(a_expr_in => {
		const result = getCheckedKey_a_expr_in(a_expr_in);
		if (result) {
			return result.toLowerCase();
		}
		return [];
	});
	return checkedKeys;
}

function getCheckedKey_a_expr_in(a_expr_in: A_expr_inContext): string | null {
	const a_expr_compare = a_expr_in.a_expr_unary_not()?.a_expr_isnull()?.a_expr_is_not()?.a_expr_compare();
	if (a_expr_compare) {
		if (a_expr_compare.EQUAL() != null) {
			const a_expr_like_list = a_expr_compare.a_expr_like_list();
			if (a_expr_like_list && a_expr_like_list.length == 2) {
				const left = a_expr_like_list[0];
				const right = a_expr_like_list[1];
				const col1 = getCheckedUniqueColumn(left);
				const col2 = getCheckedUniqueColumn(right);
				if (col1) {
					return col1;
				}
				else if (col2) {
					return col2;
				}
			};
		}
	}
	return null;
}

//field or null
function getCheckedUniqueColumn(a_expr_like: A_expr_likeContext): string | null {
	const c_expr = a_expr_like.a_expr_qual_op_list()?.[0].a_expr_unary_qualop_list()?.[0].a_expr_add()
		.a_expr_mul_list()[0].a_expr_caret_list()[0].a_expr_unary_sign_list()[0].a_expr_at_time_zone()
		.a_expr_collate().a_expr_typecast().c_expr();
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const fieldName = splitName(columnref.getText());
			// const col = traverseColumnRef(columnref, dbSchema);
			return fieldName.name;
		}
	}
	return null;
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

function traverseCopystmt(copyStmt: CopystmtContext, dbSchema: PostgresColumnSchema[], traverseResult: TraverseResult): PostgresTraverseResult {

	const tableName = copyStmt.qualified_name().getText();
	const copyColumns = dbSchema.filter(col => col.table_name.toLowerCase() === tableName.toLowerCase());
	const columnlist = copyStmt.column_list_()?.columnlist()?.columnElem_list()
		.map(columnElem => traverse_columnElem(columnElem, copyColumns, traverseResult));

	return {
		queryType: 'Copy',
		columns: columnlist,
		multipleRowsResult: false,
		parameterList: [],
		parametersNullability: []
	}
}

function traverse_columnElem(columnElem: ColumnElemContext, fromColumns: PostgresColumnSchema[], traverseResult: TraverseResult): NotNullInfo {
	const colid = columnElem.colid();
	return traverse_colid(colid, fromColumns);
}
