import { A_expr_addContext, A_expr_andContext, A_expr_at_time_zoneContext, A_expr_betweenContext, A_expr_caretContext, A_expr_collateContext, A_expr_compareContext, A_expr_inContext, A_expr_is_notContext, A_expr_isnullContext, A_expr_lesslessContext, A_expr_likeContext, A_expr_mulContext, A_expr_orContext, A_expr_qual_opContext, A_expr_qualContext, A_expr_typecastContext, A_expr_unary_notContext, A_expr_unary_qualopContext, A_expr_unary_signContext, A_exprContext, AexprconstContext, Array_expr_listContext, Array_exprContext, C_expr_caseContext, C_expr_existsContext, C_expr_exprContext, C_exprContext, ColidContext, ColumnElemContext, ColumnrefContext, Common_table_exprContext, CopystmtContext, DeletestmtContext, Expr_listContext, From_clauseContext, From_listContext, Func_applicationContext, Func_arg_exprContext, Func_expr_common_subexprContext, Func_expr_windowlessContext, Func_exprContext, Func_tableContext, IdentifierContext, In_expr_listContext, In_expr_selectContext, In_exprContext, Insert_column_itemContext, InsertstmtContext, Join_qualContext, Join_typeContext, Qualified_nameContext, Relation_exprContext, Select_clauseContext, Select_no_parensContext, Select_with_parensContext, SelectstmtContext, Set_clauseContext, Simple_select_intersectContext, Simple_select_pramaryContext, StmtContext, Table_refContext, Target_elContext, Target_labelContext, Target_listContext, Unreserved_keywordContext, UpdatestmtContext, Values_clauseContext, When_clauseContext, Where_clauseContext } from '@wsporto/typesql-parser/postgres/PostgreSQLParser';
import { ParserRuleContext } from '@wsporto/typesql-parser';
import { PostgresColumnSchema } from '../drivers/types';
import { extractOriginalSql, splitName, splitTableName } from '../mysql-query-analyzer/select-columns';
import { DynamicSqlInfo2, FieldName } from '../mysql-query-analyzer/types';
import { QueryType } from '../types';
import { Relation2 } from '../sqlite-query-analyzer/sqlite-describe-nested-query';
import { CheckConstraintResult } from '../drivers/postgres';
import { JsonArrayType, JsonFieldType, JsonObjType, JsonPropertyDef, JsonType, PostgresEnumType, PostgresSimpleType } from '../sqlite-query-analyzer/types';
import { parseSql } from '@wsporto/typesql-parser/postgres';
import { UserFunctionSchema } from './types';

export type NotNullInfo = {
	table_schema: string;
	table_name: string;
	column_name: string;
	is_nullable: boolean;
	original_is_nullable?: boolean;
	column_default?: true;
	column_key?: 'PRI' | 'UNI' | '',
	type: PostgresSimpleType;
	jsonType?: JsonType;
	recordTypes?: NotNullInfo[];
}


export type PostgresTraverseResult = {
	queryType: QueryType;
	multipleRowsResult: boolean;
	columns: NotNullInfo[];
	parametersNullability: ParamInfo[];
	whereParamtersNullability?: ParamInfo[];
	parameterList: boolean[];
	limit?: number;
	returning?: boolean;
	relations?: Relation2[];
	dynamicQueryInfo?: DynamicSqlInfo2;
}

export type ParamInfo = {
	isNotNull: boolean;
	checkConstraint?: PostgresEnumType;
}

type ParamWithIndex = ParamInfo & {
	paramIndex: number;
}

type TraverseResult = {
	columnsNullability: boolean[],
	parameters: ParamWithIndex[],
	relations?: Relation2[];
	dynamicQueryInfo?: DynamicSqlInfo2;
}

type TraverseContext = {
	dbSchema: PostgresColumnSchema[];
	fromColumns: NotNullInfo[];
	parentColumns: NotNullInfo[];
	withColumns: NotNullInfo[];
	checkConstraints: CheckConstraintResult;
	userFunctions: UserFunctionSchema[],
	propagatesNull?: boolean;
	collectNestedInfo: boolean;
	collectDynamicQueryInfo: boolean;
	filter_expr?: A_exprContext;
	columnRefIsRecord?: true;
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

export function traverseSmt(stmt: StmtContext, dbSchema: PostgresColumnSchema[], checkConstraints: CheckConstraintResult, userFunctions: UserFunctionSchema[], options: TraverseOptions): PostgresTraverseResult {
	const { collectNestedInfo = false, collectDynamicQueryInfo = false } = options;

	const traverseResult: TraverseResult = {
		columnsNullability: [],
		parameters: []
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
		fromColumns: [],
		parentColumns: [],
		withColumns: [],
		checkConstraints,
		userFunctions
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
		return traverseUpdatestmt(updatestmt, traverseContext, traverseResult);
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

function collectContextsOfType(ctx: ParserRuleContext, targetType: any, includeSubQuery = true): ParserRuleContext[] {
	const results: ParserRuleContext[] = [];

	if (ctx instanceof targetType) {
		results.push(ctx);
	}

	ctx.children?.forEach(child => {
		if (child instanceof ParserRuleContext) {
			if (includeSubQuery || !(child instanceof Select_with_parensContext)) {
				results.push(...collectContextsOfType(child, targetType, includeSubQuery));
			}
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

	const selectResult = traverse_selectstmt(selectstmt, context, traverseResult);
	//select parameters are collected after from paramters
	traverseResult.parameters.sort((param1, param2) => param1.paramIndex - param2.paramIndex);

	const multipleRowsResult = !(selectResult.singleRow || isSingleRowResult(selectstmt, selectResult.columns));

	const limit = checkLimit(selectstmt);
	const postgresTraverseResult: PostgresTraverseResult = {
		queryType: 'Select',
		multipleRowsResult,
		columns: selectResult.columns,
		parametersNullability: traverseResult.parameters.map(param => ({ isNotNull: param.isNotNull, ...addConstraintIfNotNull(param.checkConstraint) })),
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

function traverse_selectstmt(selectstmt: SelectstmtContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const select_no_parens = selectstmt.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, context, traverseResult);
	}
	//select_with_parens
	return {
		columns: [],
		singleRow: true
	};
}

function traverse_select_no_parens(select_no_parens: Select_no_parensContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const with_clause = select_no_parens.with_clause()
	if (with_clause) {
		with_clause.cte_list().common_table_expr_list()
			.forEach(common_table_expr => {
				const withResult = traverse_common_table_expr(common_table_expr, context, traverseResult);
				context.withColumns.push(...withResult);
			});
	}
	const select_clause = select_no_parens.select_clause();
	const selectResult = traverse_select_clause(select_clause, context, traverseResult);
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

function traverse_common_table_expr(common_table_expr: Common_table_exprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const tableName = common_table_expr.name().getText();
	const select_stmt = common_table_expr.preparablestmt().selectstmt();
	const numParamsBefore = traverseResult.parameters.length;
	const selectResult = traverse_selectstmt(select_stmt, { ...context, collectDynamicQueryInfo: false }, traverseResult);
	const columnsWithTalbeName = selectResult.columns.map(col => ({ ...col, table_name: tableName }));
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

function traverse_select_clause(select_clause: Select_clauseContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const simple_select_intersect_list = select_clause.simple_select_intersect_list();
	const mainSelectResult = traverse_simple_select_intersect(simple_select_intersect_list[0], context, traverseResult);
	let columns = mainSelectResult.columns;

	//union
	for (let index = 1; index < simple_select_intersect_list.length; index++) {
		const unionResult = traverse_simple_select_intersect(simple_select_intersect_list[index], context, traverseResult);
		columns = columns.map((value, columnIndex) => {
			const col: NotNullInfo = {
				column_name: value.column_name,
				is_nullable: value.is_nullable || unionResult.columns[columnIndex].is_nullable,
				table_name: '',
				table_schema: '',
				type: value.type,
				...(value.column_default && { column_default: value.column_default }),
			}
			return col;
		});
	}

	return {
		columns,
		singleRow: simple_select_intersect_list.length == 1 ? mainSelectResult.singleRow : false
	}

}

function traverse_simple_select_intersect(simple_select_intersect: Simple_select_intersectContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const simple_select_pramary = simple_select_intersect.simple_select_pramary_list()[0];
	if (simple_select_pramary) {
		return traverse_simple_select_pramary(simple_select_pramary, context, traverseResult);
	}
	return {
		columns: [],
		singleRow: true
	};
}

function traverse_simple_select_pramary(simple_select_pramary: Simple_select_pramaryContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	let fromResult: FromResult = {
		columns: [],
		singleRow: false
	};

	const from_clause = simple_select_pramary.from_clause();
	if (from_clause) {
		const where_clause = simple_select_pramary.where_clause();
		fromResult = traverse_from_clause(from_clause, context, traverseResult);
		fromResult.columns = where_clause != null ? fromResult.columns.map(field => checkIsNullable(where_clause, field)) : fromResult.columns;
	}
	const values_clause = simple_select_pramary.values_clause();
	if (values_clause) {
		const valuesColumns = traverse_values_clause(values_clause, context, traverseResult);
		return {
			columns: valuesColumns,
			singleRow: false
		}
	}
	const where_a_expr = simple_select_pramary.where_clause()?.a_expr();
	//fromColumns has precedence
	//context.fromColumns only becase of insert. update
	const newContext = { ...context, fromColumns: [...context.fromColumns, ...fromResult.columns, ...context.parentColumns] };
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
	return {
		columns: filteredColumns,
		singleRow: fromResult.singleRow
	};
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
	const values_result = expr_list_list.map(expr_list => traverse_expr_list(expr_list, context, traverseResult));
	return computeNullability(values_result);
}

function computeNullability(values_result: NotNullInfo[][]) {
	const result = values_result[0].map((_, i) => (
		{
			column_name: `column${i + 1}`,
			is_nullable: values_result.some(row => row[i].is_nullable),
			table_name: '',
			table_schema: '',
			type: values_result[0][i].type
		} satisfies NotNullInfo));
	return result;
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
			is_nullable: exprResult.is_nullable && exprResult.column_default !== true,
			table_name: exprResult.table_name,
			table_schema: exprResult.table_schema,
			type: exprResult.type,
			...(exprResult.column_key != null && { column_key: exprResult.column_key }),
			...(exprResult.jsonType != null && { jsonType: exprResult.jsonType })
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
		table_schema: '',
		type: 'unknown'
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
		table_schema: '',
		type: 'bool'
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
		table_schema: '',
		type: 'bool'
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
		table_schema: '',
		type: 'bool'
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
		table_schema: '',
		type: 'bool'
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
			return { ...result, is_nullable: false };
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

function getCheckConstraint(col: NotNullInfo, checkConstraints: CheckConstraintResult) {
	const key = `[${col.table_schema}][${col.table_name}][${col.column_name}]`;
	return checkConstraints[key];
}

function traverse_expr_compare(a_expr_compare: A_expr_compareContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_like_list = a_expr_compare.a_expr_like_list();
	const result = a_expr_like_list.map(a_expr_like => traverse_expr_like(a_expr_like, context, traverseResult));
	if (!a_expr_compare.sub_type()) {
		if (a_expr_like_list.length === 1) {
			return result[0];
		}
		if (a_expr_like_list.length === 2) {
			const constraintLeft = getCheckConstraint(result[0], context.checkConstraints);
			const constraintRight = getCheckConstraint(result[1], context.checkConstraints);
			if (isParameter(result[0].column_name) && constraintRight) {
				traverseResult.parameters.at(-1)!.checkConstraint = constraintRight;
			}
			if (isParameter(result[1].column_name) && constraintLeft) {
				traverseResult.parameters.at(-1)!.checkConstraint = constraintLeft;
			}
		}
		return {
			column_name: '?column?',
			is_nullable: result.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'bool'
		}
	}
	const select_with_parens = a_expr_compare.select_with_parens();
	if (select_with_parens) {
		const result = traverse_select_with_parens(select_with_parens, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: result.columns.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: result.columns[0].type
		}
	}
	const a_expr = a_expr_compare.a_expr();
	if (a_expr) {
		const result = traverse_a_expr(a_expr, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: result.is_nullable,
			table_name: '',
			table_schema: '',
			type: result.type
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
			table_schema: '',
			type: 'unknown'
		} satisfies NotNullInfo
	}
	throw Error('traverse_expr_like -  Not expected:' + a_expr_like.getText());
}

function traverse_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_unary_qualop = a_expr_qual_op.a_expr_unary_qualop_list();
	if (a_expr_unary_qualop) {
		const result = a_expr_unary_qualop.map(a_expr_unary_qualop => traverse_expr_unary_qualop(a_expr_unary_qualop, context, traverseResult));
		if (result.length === 1) {
			return result[0];
		}
		return {
			column_name: '?column?',
			is_nullable: result.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'unknown'
		} satisfies NotNullInfo
	}
	throw Error('traverse_expr_qual_op -  Not expected:' + a_expr_qual_op.getText());
}

function traverse_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		//a_expr_mul ((MINUS | PLUS) a_expr_mul)*
		const exprResult = a_expr_add.a_expr_mul_list().map(a_expr_mul => traverse_expr_mul(a_expr_mul, context, traverseResult));
		if (exprResult.length === 1) {
			return exprResult[0];
		}
		const result: NotNullInfo = {
			column_name: '?column?',
			is_nullable: exprResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: mapAddExprType(exprResult.map(exprResult => exprResult.type as ArithmeticType))
		}
		return result;
	}
	throw Error('traverse_expr_unary_qualop -  Not expected:' + a_expr_unary_qualop.getText());
}

function traverse_expr_mul(a_expr_mul: A_expr_mulContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_mul_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_mul_list) {
		// a_expr_caret ((STAR | SLASH | PERCENT) a_expr_caret)*
		const exprResult = a_expr_mul.a_expr_caret_list().map(a_expr_caret => traverse_expr_caret(a_expr_caret, context, traverseResult));
		if (exprResult.length === 1) {
			return exprResult[0];
		}
		const result: NotNullInfo = {
			column_name: '?column?',
			is_nullable: exprResult.some(exprRes => exprRes.is_nullable),
			table_name: '',
			table_schema: '',
			type: mapAddExprType(exprResult.map(exprResult => exprResult.type as ArithmeticType))
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
			table_schema: '',
			type: 'unknown'
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
	return {
		...col, is_nullable: col.is_nullable
	}
}

type NameAndTypeId = {
	name: string;
	type: PostgresSimpleType;
}
function getNameAndTypeIdFromAExprConst(a_expr_const: AexprconstContext): NameAndTypeId {
	if (a_expr_const.iconst()) {
		return {
			name: a_expr_const.getText(),
			type: 'int4'
		}
	}
	if (a_expr_const.fconst()) {
		return {
			name: a_expr_const.getText(),
			type: 'float4'
		}
	}
	const type_function_name = a_expr_const.func_name()?.type_function_name()?.getText().toLowerCase();
	if (type_function_name === 'date') {
		return {
			name: 'date',
			type: 'date'
		}
	}
	if (a_expr_const.sconst()) {
		return {
			name: a_expr_const.getText().slice(1, -1),
			type: 'text'
		}
	}
	//binary
	if (a_expr_const.bconst()) {
		return {
			name: a_expr_const.getText(),
			type: 'bit'
		}
	}
	if (a_expr_const.xconst()) {
		return {
			name: a_expr_const.getText(),
			type: 'bytea'
		}
	}
	if (a_expr_const.TRUE_P() || a_expr_const.FALSE_P()) {
		return {
			name: a_expr_const.getText(),
			type: 'bool'
		}
	}
	if (a_expr_const.NULL_P()) {
		return {
			name: a_expr_const.getText(),
			type: 'null'
		}
	}
	return {
		name: a_expr_const.getText(),
		type: 'unknown'
	}
}

function traversec_expr(c_expr: C_exprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	if (c_expr instanceof C_expr_exprContext) {
		if (c_expr.ARRAY()) {
			const select_with_parens = c_expr.select_with_parens();
			if (select_with_parens) {
				traverse_select_with_parens(select_with_parens, context, traverseResult);
				return {
					column_name: '?column?',
					is_nullable: true,
					table_schema: '',
					table_name: '',
					type: 'unknown'
				}
			}
			const array_expr = c_expr.array_expr();
			if (array_expr) {
				const result = traverse_array_expr(array_expr, context, traverseResult);
				return {
					...result,
					type: `${result.type}[]` as PostgresSimpleType
				};
			}
		}
		const columnref = c_expr.columnref();
		if (columnref) {
			if (context.columnRefIsRecord) {
				const table = splitTableName(columnref.getText());
				const columns = filterColumns(context.fromColumns, table);
				return {
					column_name: columnref.getText(),
					is_nullable: false,
					table_name: '',
					table_schema: '',
					type: 'record',
					recordTypes: columns
				}
			}
			else {
				const col = traverseColumnRef(columnref, context.fromColumns);
				return col;
			}

		}
		const aexprconst = c_expr.aexprconst();
		if (aexprconst) {
			const { name, type } = getNameAndTypeIdFromAExprConst(aexprconst);
			const is_nullable = aexprconst.NULL_P() != null;
			return {
				column_name: name,
				is_nullable,
				table_name: '',
				table_schema: '',
				type
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
				table_schema: '',
				type: 'unknown'
			}
		}
		const fun_expr = c_expr.func_expr();
		if (fun_expr) {
			context.columnRefIsRecord = undefined;
			const func_application = fun_expr.func_application();
			if (func_application) {
				if (is_json_build_object_func(func_application)) {
					return traverse_json_build_obj_func(func_application, context, traverseResult);
				}
				if (is_json_agg(func_application)) {
					const filter_expr = fun_expr.filter_clause()?.a_expr();
					return traverse_json_agg(func_application, { ...context, filter_expr }, traverseResult);
				}

				const isNotNull = traversefunc_application(func_application, context, traverseResult);

				const filter_clause = fun_expr.filter_clause();
				if (filter_clause) {
					const a_expr = filter_clause.a_expr();
					traverse_a_expr(a_expr, context, traverseResult);
				}

				return {
					...isNotNull,
					table_name: '',
					table_schema: ''
				}
			}
			const func_expr_common_subexpr = c_expr.func_expr()?.func_expr_common_subexpr();
			if (func_expr_common_subexpr) {
				const isNotNull = traversefunc_expr_common_subexpr(func_expr_common_subexpr, context, traverseResult);
				return {
					...isNotNull,
					column_name: func_expr_common_subexpr.getText().split('(')?.[0]?.trim() || func_expr_common_subexpr.getText()
				}
			}
		}

		const select_with_parens = c_expr.select_with_parens();
		if (select_with_parens) {
			const result = traverse_select_with_parens(select_with_parens, { ...context, parentColumns: context.fromColumns, fromColumns: [] }, traverseResult);
			return {
				column_name: '?column?',
				is_nullable: result.columns[0].jsonType ? result.columns[0].is_nullable : true,
				table_name: '',
				table_schema: '',
				type: result.columns[0].type,
				jsonType: result.columns[0].jsonType != null && result.columns[0].jsonType.name === 'json' ?
					{ ...result.columns[0].jsonType, notNull: false } : result.columns[0].jsonType
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
				table_schema: '',
				type: 'record',
				recordTypes: expr_list.map(expr => ({ ...expr, column_name: '' }))
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
				table_schema: '',
				type: 'unknown'
			}
		}
	}
	if (c_expr instanceof C_expr_caseContext) {
		const isNotNull = traversec_expr_case(c_expr, context, traverseResult);
		return isNotNull;
	}
	if (c_expr instanceof C_expr_existsContext) {
		const select_with_parens = c_expr.select_with_parens();
		traverse_select_with_parens(select_with_parens, context, traverseResult);
		return {
			column_name: '?column?',
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'bool'
		}
	}
	throw Error('traversec_expr -  Not expected:' + c_expr.getText());
}

function filterColumns(fromColumns: NotNullInfo[], fieldName: FieldName): NotNullInfo[] {
	return fromColumns.filter(col => (fieldName.prefix === '' || col.table_name === fieldName.prefix)
		&& (fieldName.name === '*' || col.column_name === fieldName.name)).map(col => {
			const result: NotNullInfo = {
				column_name: col.column_name,
				is_nullable: col.is_nullable,
				table_name: col.table_name,
				table_schema: col.table_schema,
				type: col.type,
				...(col.column_key !== undefined) && { column_key: col.column_key },
				...(col.jsonType !== undefined) && { jsonType: col.jsonType },
				...(col.original_is_nullable !== undefined && { original_is_nullable: col.original_is_nullable }),
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

function traversec_expr_case(c_expr_case: C_expr_caseContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const case_expr = c_expr_case.case_expr();
	const whenResult = case_expr.when_clause_list().when_clause_list().map(when_clause => traversewhen_clause(when_clause, context, traverseResult));
	const whenIsNotNull = whenResult.every(when => when);
	const elseExpr = case_expr.case_default()?.a_expr();
	const elseResult = elseExpr ? traverse_a_expr(elseExpr, { ...context }, traverseResult) : null;
	const elseIsNotNull = elseResult?.is_nullable === false || false;
	const notNull = elseIsNotNull && whenIsNotNull;
	return {
		column_name: '?column?',
		is_nullable: !notNull,
		table_name: '',
		table_schema: '',
		type: whenResult[0].type ?? 'unknown',
		jsonType: allJsonTypesMatch(whenResult, elseResult) ? whenResult[0].jsonType : undefined
	}
}

function allJsonTypesMatch(whenResultList: NotNullInfo[], elseResult: NotNullInfo | null): boolean {
	const firstType = whenResultList[0]?.jsonType;
	const allMatch = whenResultList.every(res => {
		const match = res.jsonType == firstType;
		return match;
	}) && (elseResult?.type === 'null' || elseResult?.jsonType == firstType);
	return allMatch;
}

function traversewhen_clause(when_clause: When_clauseContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr_list = when_clause.a_expr_list();
	const [whenExprList, thenExprList] = partition(a_expr_list, (index) => index % 2 === 0);

	const whenExprResult = thenExprList.map((thenExpr, index) => {
		traverse_a_expr(whenExprList[index], context, traverseResult);
		const thenExprResult = traverse_a_expr(thenExpr, { ...context, filter_expr: whenExprList[index] }, traverseResult);
		return thenExprResult;
	});
	const notNull = whenExprResult.every(res => res);
	return {
		column_name: '?column?',
		is_nullable: !notNull,
		table_name: '',
		table_schema: '',
		type: whenExprResult[0].type,
		jsonType: whenExprResult[0].jsonType
	}
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

function getFunctionName(func_application: Func_applicationContext) {
	const functionName = func_application.func_name().getText().toLowerCase();
	return functionName;
}

function is_json_build_object_func(func_application: Func_applicationContext) {
	const functionName = getFunctionName(func_application);
	return functionName === 'json_build_object'
		|| functionName === 'jsonb_build_object';
}

function is_json_agg(func_application: Func_applicationContext) {
	const functionName = getFunctionName(func_application);
	return functionName === 'json_agg'
		|| functionName === 'jsonb_agg';
}

function mapJsonBuildArgsToJsonProperty(args: NotNullInfo[], filterExpr: A_exprContext | undefined): JsonPropertyDef[] {
	const keys = args.filter((_, index) => index % 2 === 0);
	const values = args.filter((_, index) => index % 2 === 1);
	const nullability = inferJsonNullability(values, filterExpr);
	const properties: JsonPropertyDef[] = [];
	for (let i = 0; i < values.length; i++) {
		const key = keys[i];
		const value = values[i];
		if (value !== undefined) {
			const type = value.jsonType ? value.jsonType : { name: 'json_field', type: value.type, notNull: nullability[i] } satisfies JsonFieldType;
			properties.push({ key: key.column_name, type });
		}
	}
	return properties;
}

type FieldInfo = {
	name: string;
	type: PostgresSimpleType;
	notNull: boolean;
}

function inferJsonNullability(columns: NotNullInfo[], filterExpr: A_exprContext | undefined): boolean[] {
	const tables = columns.filter(col => filterExpr && col.original_is_nullable === false
		&& isNotNull_a_expr({ name: col.column_name, prefix: col.table_name }, filterExpr))
		.map(col => col.table_name);
	const fields = columns.map(col => {
		return col.original_is_nullable != null && tables.includes(col.table_name) ? !col.original_is_nullable : !col.is_nullable;
	});
	return fields;
}

function transformFieldsToJsonObjType(fields: NotNullInfo[]): JsonObjType {
	const jsonObject: JsonObjType = {
		name: 'json',
		notNull: true,
		properties: fields.map(col => mapFieldToPropertyDef(col))
	}
	return jsonObject;
}
function mapFieldToPropertyDef(field: NotNullInfo) {
	const prop: JsonPropertyDef = {
		key: field.column_name,
		type: transformFieldToJsonField(field)
	}
	return prop;
}

function transformFieldToJsonField(field: NotNullInfo) {
	const jsonField: JsonType = field.jsonType ? field.jsonType : { name: 'json_field', type: field.type, notNull: !field.is_nullable };
	return jsonField;
}

function traverse_json_build_obj_func(func_application: Func_applicationContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const columnName = func_application.func_name()?.getText() || func_application.getText();
	const func_arg_expr_list = func_application.func_arg_list()?.func_arg_expr_list() || [];
	const argsResult = func_arg_expr_list.map(func_arg_expr => traversefunc_arg_expr(func_arg_expr, context, traverseResult))
	const result: NotNullInfo = {
		column_name: columnName,
		is_nullable: false,
		table_name: '',
		table_schema: '',
		type: 'json',
		jsonType: {
			name: 'json',
			notNull: true,
			properties: mapJsonBuildArgsToJsonProperty(argsResult, context.filter_expr),
		}
	}
	return result;
}

function traverse_json_agg(func_application: Func_applicationContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const columnName = func_application.func_name()?.getText() || func_application.getText();
	const func_arg_expr_list = func_application.func_arg_list()?.func_arg_expr_list() || [];
	const argsResult = func_arg_expr_list.map(func_arg_expr => traversefunc_arg_expr(func_arg_expr, { ...context, columnRefIsRecord: true }, traverseResult))
	const result: NotNullInfo = {
		column_name: columnName,
		is_nullable: context.filter_expr != null,
		table_name: '',
		table_schema: '',
		type: 'json[]',
		jsonType: createJsonTypeForJsonAgg(argsResult[0], context.filter_expr)
	}
	return result;
}

function createJsonTypeForJsonAgg(arg: NotNullInfo, filter_expr: A_exprContext | undefined): JsonType {
	if (arg.recordTypes) {
		const jsonType = mapRecordsToJsonType(arg.recordTypes, filter_expr);
		return {
			name: 'json[]',
			properties: [jsonType]
		};
	}
	const jsonType: JsonArrayType | undefined = arg.jsonType ? { name: 'json[]', properties: [arg.jsonType] } : undefined;
	const fieldType: JsonArrayType = { name: 'json[]', properties: [{ name: 'json_field', type: arg.type, notNull: !arg.is_nullable }] }
	const result = jsonType || fieldType
	return result;
}

function mapRecordsToJsonType(recordTypes: NotNullInfo[], filterExpr: A_exprContext | undefined): JsonObjType {
	const jsonNullability = inferJsonNullability(recordTypes, filterExpr);
	const fields: NotNullInfo[] = recordTypes.map((col, index) => ({ ...col, column_name: col.column_name ? col.column_name : `f${index + 1}`, is_nullable: !jsonNullability[index] }))
	const jsonType = transformFieldsToJsonObjType(fields);
	return jsonType;
}

function traversefunc_application(func_application: Func_applicationContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const functionName = getFunctionName(func_application);
	const func_arg_expr_list = func_application.func_arg_list()?.func_arg_expr_list() || [];
	if (functionName === 'row_to_json') {
		const argResult = traversefunc_arg_expr(func_arg_expr_list[0], { ...context, columnRefIsRecord: true }, traverseResult);
		if (argResult.recordTypes) {
			const jsonType = mapRecordsToJsonType(argResult.recordTypes, context.filter_expr);
			return {
				column_name: functionName,
				is_nullable: false,
				table_name: '',
				table_schema: '',
				type: 'json',
				jsonType
			};
		}
	}

	const argsResult = func_arg_expr_list.map(func_arg_expr => traversefunc_arg_expr(func_arg_expr, context, traverseResult))
	if (functionName === 'count') {
		return {
			column_name: functionName,
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'int8'
		};
	}
	if (functionName === 'concat'
		|| functionName === 'concat_ws') {
		return {
			column_name: functionName,
			is_nullable: argsResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'text'
		};
	}
	if (functionName === 'to_tsvector') {
		return {
			column_name: functionName,
			is_nullable: argsResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'tsvector'
		};
	}
	if (functionName === 'ts_rank') {
		return {
			column_name: functionName,
			is_nullable: argsResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'float4'

		};
	}
	if (functionName === 'to_tsquery'
		|| functionName === 'plainto_tsquery'
		|| functionName === 'phraseto_tsquery'
		|| functionName === 'websearch_to_tsquery') {
		return {
			column_name: functionName,
			is_nullable: argsResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'tsquery'
		};
	}
	if (functionName === 'to_date') {
		return {
			column_name: functionName,
			is_nullable: argsResult.some(col => col.is_nullable),
			table_name: '',
			table_schema: '',
			type: 'date'
		};
	}
	if (functionName === 'generate_series') {
		return {
			column_name: functionName,
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'unknown'
		};
	}
	if (functionName === 'row_number'
		|| functionName === 'rank'
		|| functionName === 'dense_rank') {
		return {
			column_name: functionName,
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'int4'
		};
	}
	if (functionName === 'percent_rank'
		|| functionName === 'cume_dist') {
		return {
			column_name: functionName,
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'float8'
		};
	}
	if (functionName === 'first_value'
		|| functionName === 'last_value'
		|| functionName === 'ntile'
	) {
		const firstArg = argsResult[0];
		return firstArg;
	}
	if (functionName === 'json_build_array'
		|| functionName === 'jsonb_build_array'
	) {
		return {
			column_name: functionName,
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'json[]',
			jsonType: {
				name: 'json[]',
				properties: argsResult.map(arg => arg.jsonType || { name: 'json_field', type: arg.type, notNull: !arg.is_nullable } satisfies JsonFieldType)
			}
		};
	}
	if (functionName === 'to_json' || functionName === 'to_jsonb') {
		return {
			column_name: functionName,
			is_nullable: true,
			table_name: '',
			table_schema: '',
			type: 'json'
		};
	}
	if (functionName === 'sum') {
		return {
			...argsResult[0],
			column_name: functionName,
			is_nullable: true,
			type: argsResult[0].type ? mapSumType(argsResult[0].type) : 'unknown'
		};
	}

	if (functionName === 'json_object_agg') {
		return {
			column_name: functionName,
			is_nullable: false,
			table_name: '',
			table_schema: '',
			type: 'json',
			jsonType: {
				name: 'json_map',
				type: argsResult[1].jsonType || { name: 'json_field', type: argsResult[1].type, notNull: !argsResult[1].is_nullable } satisfies JsonFieldType
			}
		};
	}

	return {
		column_name: functionName,
		is_nullable: true,
		table_name: '',
		table_schema: '',
		type: 'unknown'
	};
}

function mapSumType(type: PostgresSimpleType): PostgresSimpleType {
	switch (type) {
		case 'int2':
		case 'int4':
			return 'int8';
		case 'int8':
		case 'numeric':
			return 'numeric';
		default:
			return type;

	}
}

function traversefunc_expr_common_subexpr(func_expr_common_subexpr: Func_expr_common_subexprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	if (func_expr_common_subexpr.COALESCE() || func_expr_common_subexpr.GREATEST() || func_expr_common_subexpr.LEAST()) {
		const func_arg_list = func_expr_common_subexpr.expr_list().a_expr_list();
		const result = func_arg_list.map(func_arg_expr => {
			const paramResult = traverse_a_expr(func_arg_expr, { ...context, propagatesNull: true }, traverseResult);
			return paramResult;
		});
		return {
			...result[0],
			is_nullable: result.every(col => col.is_nullable),
			table_name: '',
			table_schema: ''
		}
	}
	if (func_expr_common_subexpr.EXTRACT()) {
		const a_expr = func_expr_common_subexpr.extract_list().a_expr();
		const result = traverse_a_expr(a_expr, context, traverseResult)
		return {
			column_name: 'extract',
			is_nullable: result.is_nullable,
			table_name: '',
			table_schema: '',
			type: 'float8'
		}
	}
	func_expr_common_subexpr.a_expr_list().forEach(a_expr => {
		traverse_a_expr(a_expr, context, traverseResult);
	})
	return {
		column_name: func_expr_common_subexpr.getText(),
		is_nullable: true,
		table_name: '',
		table_schema: '',
		type: 'unknown'
	};
}

function traversefunc_arg_expr(func_arg_expr: Func_arg_exprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const a_expr = func_arg_expr.a_expr();
	return traverse_a_expr(a_expr, context, traverseResult);
}

function traverse_array_expr(array_expr: Array_exprContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo {
	const expr_list = array_expr.expr_list();
	if (expr_list) {
		const traverse_expr_list_result = traverse_expr_list(expr_list, context, traverseResult);
		return {
			...traverse_expr_list_result[0],
			column_name: '?column?',
			table_name: '',
			table_schema: ''
		}
	}
	const array_expr_list = array_expr.array_expr_list();
	if (array_expr_list) {
		const traverse_array_expr_list_result = traverse_array_expr_list(array_expr_list, context, traverseResult);
		return {
			...traverse_array_expr_list_result[0],
			column_name: '?column?',
			table_name: '',
			table_schema: ''
		}
	}
	return {
		column_name: array_expr.getText(),
		is_nullable: true,
		table_name: '',
		table_schema: '',
		type: 'unknown'
	};
}

function traverse_array_expr_list(array_expr_list: Array_expr_listContext, context: TraverseContext, traverseResult: TraverseResult): NotNullInfo[] {
	const result = array_expr_list.array_expr_list().map(array_expr => {
		return traverse_array_expr(array_expr, context, traverseResult);
	})
	return result;
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
	const isNotNullResult = !field.is_nullable || isNotNull({ name: field.column_name, prefix: field.table_name }, where_clause);
	const col: NotNullInfo = {
		...field,
		is_nullable: !isNotNullResult
	}
	return col;
}

function traverse_from_clause(from_clause: From_clauseContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const from_list = from_clause.from_list();
	if (from_list) {
		const fromListResult = traverse_from_list(from_list, context, traverseResult);
		return fromListResult
	}
	return {
		columns: [],
		singleRow: false
	};
}

function traverse_from_list(from_list: From_listContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const fromListResult = from_list.table_ref_list().map(table_ref => traverse_table_ref(table_ref, context, traverseResult));
	const columns = fromListResult.flatMap(tableRes => tableRes.columns);
	return {
		columns: columns,
		singleRow: fromListResult.length === 1 ? fromListResult[0].singleRow : false
	};
}

type FromResult = {
	singleRow: boolean;
	columns: NotNullInfo[]
}

function getFromColumns(tableName: TableName, withColumns: NotNullInfo[], dbSchema: PostgresColumnSchema[]) {
	const filteredWithColumns = withColumns.filter(col => col.table_name.toLowerCase() === tableName.name.toLowerCase());
	const filteredSchema = filteredWithColumns.length > 0 ? filteredWithColumns : dbSchema.filter(col => col.table_name.toLowerCase() === tableName.name.toLowerCase());
	return filteredSchema;
}


function checkLeftJoinIsNullable(leftJoin: Join, subsequentJoins: Join[]): boolean {
	if (!leftJoin.joinQual) {
		return true; // No condition = always nullable
	}

	const leftTable = getTableName(leftJoin.tableRef);
	const leftJoinColumns = getJoinColumns(leftJoin.joinQual)
		.filter(col => col.prefix === leftTable.name || col.prefix === leftTable.alias);

	for (const join of subsequentJoins) {
		// Only INNER JOINs can cancel nullability
		if (!(join.joinType === null || join.joinType.INNER_P())) {
			continue;
		}
		const joinTable = getTableName(leftJoin.tableRef);
		const joinConditionColumns = getJoinColumns(join.joinQual!)
			.filter(col => col.prefix === joinTable.name || col.prefix === joinTable.alias);;

		// Check if this join references columns from the left join
		const referencesLeftJoin = joinConditionColumns.some(col =>
			leftJoinColumns.some(lc => lc.prefix === col.prefix && isNotNull_a_expr(col, join.joinQual?.a_expr()!))
		);

		if (referencesLeftJoin) {
			return false; // LEFT JOIN is effectively filtered by INNER JOIN — not nullable
		}
	}

	return true; // No INNER JOIN filtered it — remains nullable
}

function traverse_table_ref(table_ref: Table_refContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const allColumns: NotNullInfo[] = [];
	const relation_expr = table_ref.relation_expr();
	const aliasClause = table_ref.alias_clause();
	const aliasNameList = aliasClause?.name_list()?.name_list()?.map(name => name.getText());
	const alias = aliasClause ? aliasClause.colid().getText() : '';
	if (relation_expr) {
		const tableName = traverse_relation_expr(relation_expr);
		const fromColumns = getFromColumns(tableName, context.withColumns, context.dbSchema);
		const tableNameWithAlias = alias ? alias : tableName.name;
		const columnsWithAlias = fromColumns.map(col => ({ ...col, table_name: tableNameWithAlias.toLowerCase() }));
		const fromColumnsResult = columnsWithAlias.concat(context.parentColumns);
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

		if (context.collectDynamicQueryInfo && traverseResult.dynamicQueryInfo!.from.length == 0) {
			collectDynamicQueryInfoTableRef(table_ref, null, null, fromColumnsResult, [], traverseResult);
		}

		const joinList = extractJoins(table_ref);
		const joinColumns = joinList.flatMap((join, index) => {
			const joinType = join.joinType; //INNER, LEFT
			const joinQual = join.joinQual;
			const numParamsBefore = traverseResult.parameters.length;
			const joinTableRefResult = traverse_table_ref(join.tableRef, context, traverseResult);
			const isLeftJoin = joinType?.LEFT();
			const filteredColumns = joinQual && joinQual?.USING() ? filterUsingColumns(joinTableRefResult.columns, joinQual) : joinTableRefResult.columns;
			const subsequentJoints = joinList.slice(index + 1);
			const resultColumns = isLeftJoin ? filteredColumns.map(col => {
				const checkIsNullable = checkLeftJoinIsNullable(join, subsequentJoints);
				const colResult: NotNullInfo =
				{
					...col,
					is_nullable: checkIsNullable ? true : col.is_nullable,
					original_is_nullable:
						col.is_nullable
				};
				return colResult;
			}) : filteredColumns;

			if (context.collectNestedInfo && joinQual) {
				collectNestedInfo(joinQual, resultColumns, traverseResult);
			}
			if (context.collectDynamicQueryInfo) {
				const parameters = traverseResult.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);
				collectDynamicQueryInfoTableRef(join.tableRef, joinType, joinQual, resultColumns, parameters, traverseResult);
			}

			return resultColumns;
		});
		allColumns.push(...joinColumns);
	}
	const func_table = table_ref.func_table();
	if (func_table) {
		const funcAlias = table_ref.func_alias_clause()?.alias_clause()?.colid()?.getText() || '';
		const result = traverse_func_table(func_table, context, traverseResult);
		const resultWithAlias = result.columns.map(col => ({ ...col, table_name: funcAlias || col.table_name } satisfies NotNullInfo));
		return {
			columns: resultWithAlias,
			singleRow: result.singleRow
		};
	}
	const select_with_parens = table_ref.select_with_parens();
	if (select_with_parens) {
		const columns = traverse_select_with_parens(select_with_parens, { ...context, collectDynamicQueryInfo: false }, traverseResult);
		const withAlias = columns.columns.map((col, i) => (
			{
				...col,
				column_name: aliasNameList?.[i] || col.column_name,
				table_name: alias || col.table_name
			}) satisfies NotNullInfo);
		return {
			columns: withAlias,
			singleRow: false
		};
	}
	return {
		columns: allColumns,
		singleRow: false
	};
}

type Join = {
	tableRef: Table_refContext;
	joinType: Join_typeContext | null;
	joinQual: Join_qualContext | null;
}

function extractJoins(table_ref: Table_refContext): Join[] {
	const joinList: Join[] = [];
	let currentJoinType: Join['joinType'] | null = null;
	for (const child of table_ref.children || []) {
		if (child instanceof Join_typeContext) {
			currentJoinType = child;
		}
		if (child instanceof Table_refContext) {
			joinList.push({ joinQual: null, joinType: currentJoinType, tableRef: child });
			currentJoinType = null;
		}
		if (child instanceof Join_qualContext) {
			const lastJoin = joinList.at(-1);
			if (lastJoin) {
				lastJoin.joinQual = child;
			}
		}
	}
	return joinList;
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

function traverse_select_with_parens(select_with_parens: Select_with_parensContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const select_with_parens2 = select_with_parens.select_with_parens();
	if (select_with_parens2) {
		return traverse_select_with_parens(select_with_parens2, context, traverseResult);
	}
	const select_no_parens = select_with_parens.select_no_parens();
	if (select_no_parens) {
		return traverse_select_no_parens(select_no_parens, context, traverseResult);
	}
	return {
		columns: [],
		singleRow: false
	};
}

export type TableReturnType = {
	kind: 'table';
	columns: { name: string; type: string }[];
};

export type SetofReturnType = {
	kind: 'setof';
	table: string;
};

function traverse_func_table(func_table: Func_tableContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const func_expr_windowless = func_table.func_expr_windowless();
	if (func_expr_windowless) {
		const result = traverse_func_expr_windowless(func_expr_windowless, context, traverseResult);
		return result;
	}
	throw Error('Stmt not supported: ' + func_table.getText());
}

export type FunctionReturnType = TableReturnType | SetofReturnType;

export function parseReturnType(returnType: string): FunctionReturnType {
	const trimmed = returnType.trim();

	// Handle TABLE(...)
	if (trimmed.toLowerCase().startsWith('table(') && trimmed.endsWith(')')) {
		const inside = trimmed.slice(6, -1); // remove "TABLE(" and final ")"
		const columns: { name: string; type: string }[] = [];

		const parts = inside.split(',').map(part => part.trim());

		for (const part of parts) {
			const match = part.match(/^(\w+)\s+(.+)$/);
			if (!match) {
				throw new Error(`Invalid column definition: ${part}`);
			}
			const [, name, type] = match;
			columns.push({ name, type });
		}

		return { kind: 'table', columns };
	}

	// Handle SETOF typename
	const setofMatch = trimmed.match(/^SETOF\s+(\w+)$/i);
	if (setofMatch) {
		return { kind: 'setof', table: setofMatch[1] };
	}

	throw new Error(`Unsupported return type format: ${returnType}`);
}

function traverse_func_expr_windowless(func_expr_windowless: Func_expr_windowlessContext, context: TraverseContext, traverseResult: TraverseResult): FromResult {
	const func_application = func_expr_windowless.func_application();
	if (func_application) {
		const func_name = func_application.func_name().getText().toLowerCase();
		const funcSchema = context.userFunctions.find(func => func.function_name.toLowerCase() === func_name);
		if (funcSchema) {
			const definition = funcSchema.definition;
			const returnType = parseReturnType(funcSchema.return_type);
			const functionColumns = returnType.kind === 'table' ? returnType.columns.map(col => {
				const columnInfo: NotNullInfo = {
					column_name: col.name,
					type: col.type as PostgresSimpleType,
					is_nullable: true,
					table_name: '',
					table_schema: ''
				}
				return columnInfo;
			}) : context.dbSchema.filter(col => col.table_name.toLowerCase() === returnType.table);
			if (funcSchema.language.toLowerCase() === 'sql') {
				const parser = parseSql(definition);
				const selectstmt = parser.stmt().selectstmt();
				const { columns, multipleRowsResult } = traverseSelectstmt(selectstmt, context, traverseResult);
				return {
					columns: columns.map((c) => ({ ...c, table_name: funcSchema.function_name })),
					singleRow: !multipleRowsResult
				};
			}
			else {
				return {
					columns: functionColumns,
					singleRow: false
				};
			}

		}
	}
	throw Error('Stmt not supported: ' + func_expr_windowless.getText());
}

function traverse_relation_expr(relation_expr: Relation_exprContext): TableName {
	const qualified_name = relation_expr.qualified_name();
	const name = traverse_qualified_name(qualified_name);
	return name;
}

function traverse_qualified_name(qualified_name: Qualified_nameContext): TableName {
	const colid_name = qualified_name.colid() ? get_colid_text(qualified_name.colid()) : '';

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

function get_colid_text(colid: ColidContext): string {
	const identifier = colid.identifier();
	if (identifier) {
		return traverse_identifier(identifier);
	}
	const unreserved_keyword = colid.unreserved_keyword();
	if (unreserved_keyword) {
		return traverse_unreserved_keyword(unreserved_keyword);
	}
	return '';
}

function traverse_identifier(identifier: IdentifierContext): string {
	const tableName = identifier.Identifier().getText();
	return tableName;
}

function traverse_unreserved_keyword(unreserved_keyword: Unreserved_keywordContext) {
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
		parameters: []
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
		parentColumns: [],
		withColumns: [],
		checkConstraints: {},
		userFunctions: [],
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

	const paramIsListResult = getInParameterList(insertstmt);
	const result: PostgresTraverseResult = {
		queryType: 'Insert',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.map(param => ({ isNotNull: param.isNotNull, ...addConstraintIfNotNull(param.checkConstraint) })),
		columns: returninColumns,
		parameterList: paramIsListResult
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
		parentColumns: [],
		withColumns: [],
		checkConstraints: {},
		userFunctions: [],
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
		parametersNullability: traverseResult.parameters.map(param => ({ isNotNull: param.isNotNull, ...addConstraintIfNotNull(param.checkConstraint) })),
		columns: returninColumns,
		parameterList: paramIsListResult
	}
	if (returning_clause) {
		result.returning = true;
	}
	return result;
}

function addConstraintIfNotNull(checkConstraint: PostgresEnumType | undefined): { checkConstraint: PostgresEnumType } | undefined {
	return checkConstraint !== undefined ? { checkConstraint } : undefined;
}

function traverseUpdatestmt(updatestmt: UpdatestmtContext, traverseContext: TraverseContext, traverseResult: TraverseResult): PostgresTraverseResult {

	const relation_expr_opt_alias = updatestmt.relation_expr_opt_alias();
	const tableName = relation_expr_opt_alias.relation_expr().getText();
	const tableAlias = relation_expr_opt_alias.colid()?.getText() || '';
	const updateColumns: NotNullInfo[] = traverseContext.dbSchema.filter(col => col.table_name.toLowerCase() === tableName.toLowerCase())
		.map(col => ({ ...col, table_name: tableAlias || col.table_name }));
	const context: TraverseContext = {
		...traverseContext,
		fromColumns: updateColumns,
		collectNestedInfo: false,
		collectDynamicQueryInfo: false
	}

	updatestmt.set_clause_list().set_clause_list()
		.forEach(set_clause => traverse_set_clause(set_clause, context, traverseResult));

	const from_clause = updatestmt.from_clause();
	const fromResult: FromResult = from_clause ? traverse_from_clause(from_clause, context, traverseResult) : { columns: [], singleRow: true };

	const parametersBefore = traverseResult.parameters.length;
	const where_clause = updatestmt.where_or_current_clause();
	if (where_clause) {
		const a_expr = where_clause.a_expr();
		traverse_a_expr(a_expr, { ...context, fromColumns: updateColumns.concat(fromResult.columns) }, traverseResult);
	}

	const whereParameters = traverseResult.parameters.slice(parametersBefore);

	const returning_clause = updatestmt.returning_clause();
	const returninColumns = returning_clause ? traverse_target_list(returning_clause.target_list(), context, traverseResult) : [];

	const paramIsListResult = getInParameterList(updatestmt);
	const result: PostgresTraverseResult = {
		queryType: 'Update',
		multipleRowsResult: false,
		parametersNullability: traverseResult.parameters.slice(0, parametersBefore).map(param => ({ isNotNull: param.isNotNull, ...addConstraintIfNotNull(param.checkConstraint) })),
		columns: returninColumns,
		parameterList: paramIsListResult,
		whereParamtersNullability: whereParameters.map(param => ({ isNotNull: param.isNotNull, ...addConstraintIfNotNull(param.checkConstraint) }))
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
		traverseResult.parameters.at(-1)!.isNotNull = !column.is_nullable;
		const columnConstraint = getCheckConstraint(column, context.checkConstraints);
		if (columnConstraint) {
			traverseResult.parameters.at(-1)!.checkConstraint = columnConstraint;
		}
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

function isNotNull(field: FieldName, where_clause: Where_clauseContext): boolean {

	const a_expr = where_clause.a_expr();
	if (a_expr) {
		return isNotNull_a_expr(field, a_expr);
	}
	return false;
}

function isNotNull_a_expr(field: FieldName, a_expr: A_exprContext): boolean {
	const a_expr_qual = a_expr.a_expr_qual();
	if (a_expr_qual) {
		return isNotNull_a_expr_qual(a_expr_qual, field);
	}
	return false;
}

function isNotNull_a_expr_qual(a_expr_qual: A_expr_qualContext, field: FieldName): boolean {
	const a_expr_lessless = a_expr_qual.a_expr_lessless();
	if (a_expr_lessless) {
		return isNotNull_a_expr_lessless(a_expr_lessless, field);
	}
	return false;
}

function isNotNull_a_expr_lessless(a_expr_lessless: A_expr_lesslessContext, field: FieldName): boolean {
	const a_expr_or = a_expr_lessless.a_expr_or_list()[0];
	if (a_expr_or) {
		return isNotNull_a_expr_or(a_expr_or, field);
	}
	return false;
}

//a_expr_or: "valueisnotnulland(id>0orvalueisnotnull)"
//a_expr_or: "valueisnotnullor(id>0orvalueisnotnull)"
function isNotNull_a_expr_or(a_expr_or: A_expr_orContext, field: FieldName): boolean {
	const a_expr_and = a_expr_or.a_expr_and_list();
	if (a_expr_and) {
		//1. valueisnotnull
		//2. (id>0orvalueisnotnull)
		const result = a_expr_and.every(a_expr_and => isNotNull_a_expr_and(a_expr_and, field));
		return result;
	}
	return false;
}

function isNotNull_a_expr_and(a_expr_and: A_expr_andContext, field: FieldName): boolean {
	const a_expr_between_list = a_expr_and.a_expr_between_list();
	if (a_expr_between_list) {
		return a_expr_between_list.some(a_expr_between => isNotNull_a_expr_between(a_expr_between, field));
	}
	return false;
}

function isNotNull_a_expr_between(a_expr_between: A_expr_betweenContext, field: FieldName): boolean {
	const a_expr_in = a_expr_between.a_expr_in_list()[0];
	if (a_expr_in) {
		return isNotNull_a_expr_in(a_expr_in, field);
	}
	return false;
}

function isNotNull_a_expr_in(a_expr_in: A_expr_inContext, field: FieldName): boolean {
	const a_expr_unary_not = a_expr_in.a_expr_unary_not();
	if (a_expr_unary_not) {
		return isNotNull_a_expr_unary_not(a_expr_unary_not, field);
	}
	return false;
}

function isNotNull_a_expr_unary_not(a_expr_unary_not: A_expr_unary_notContext, field: FieldName): boolean {
	const a_expr_isnull = a_expr_unary_not.a_expr_isnull();
	if (a_expr_isnull) {
		return isNotNull_a_expr_isnull(a_expr_isnull, field);
	}
	return false;
}

function isNotNull_a_expr_isnull(a_expr_isnull: A_expr_isnullContext, field: FieldName): boolean {
	const a_expr_is_not = a_expr_isnull.a_expr_is_not();
	if (a_expr_is_not) {
		const isNotNull = isNotNull_a_expr_is_not(a_expr_is_not, field);
		if (isNotNull && a_expr_is_not.IS() && a_expr_is_not.NOT() && a_expr_is_not.NULL_P()) {
			return true;
		}
		if (a_expr_is_not.IS() && a_expr_is_not.NULL_P()) {
			return false;
		}
		return isNotNull;
	}
	return false;
}

function isNotNull_a_expr_is_not(a_expr_is_not: A_expr_is_notContext, field: FieldName): boolean {
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

function isNotNull_a_expr_compare(a_expr_compare: A_expr_compareContext, field: FieldName): boolean {
	const a_expr_like_list = a_expr_compare.a_expr_like_list()
	if (a_expr_like_list) {
		//a = b, b = a, id > 10, id = $1
		return a_expr_like_list.some(a_expr_like => isNotNull_a_expr_like(a_expr_like, field));
	}
	return false;
}

function isNotNull_a_expr_like(a_expr_like: A_expr_likeContext, field: FieldName): boolean {
	const a_expr_qual_op_list = a_expr_like.a_expr_qual_op_list();
	if (a_expr_qual_op_list) {
		return a_expr_qual_op_list.every(a_expr_qual_op => isNotNull_a_expr_qual_op(a_expr_qual_op, field))
	}
	return false;
}

function isNotNull_a_expr_qual_op(a_expr_qual_op: A_expr_qual_opContext, field: FieldName): boolean {
	const a_expr_unary_qualop_list = a_expr_qual_op.a_expr_unary_qualop_list();
	if (a_expr_unary_qualop_list) {
		return a_expr_unary_qualop_list.every(a_expr_unary_qualop => isNotNul_a_expr_unary_qualop(a_expr_unary_qualop, field))
	}
	return false;
}

function isNotNul_a_expr_unary_qualop(a_expr_unary_qualop: A_expr_unary_qualopContext, field: FieldName): boolean {
	const a_expr_add = a_expr_unary_qualop.a_expr_add();
	if (a_expr_add) {
		return isNotNull_a_expr_add(a_expr_add, field);
	}
	return false;
}

type ArithmeticType = 'int2' | 'int4' | 'int8' | 'float4' | 'float8' | 'numeric' | 'date' | 'timestamp'; //'interval'
function mapAddExprType(types: (ArithmeticType | 'unknown')[]): ArithmeticType | 'unknown' {

	const arithmeticMatrix: Record<ArithmeticType, Partial<Record<ArithmeticType, ArithmeticType>>> = {
		int2: { int2: 'int2', int4: 'int4', int8: 'int8', float4: 'float4', float8: 'float8', numeric: 'numeric', date: 'date' },
		int4: { int2: 'int4', int4: 'int4', int8: 'int8', float4: 'float4', float8: 'float8', numeric: 'numeric', date: 'date' },
		int8: { int2: 'int8', int4: 'int8', int8: 'int8', float4: 'float8', float8: 'float8', numeric: 'numeric', date: 'date' },
		float4: { int2: 'float4', int4: 'float4', int8: 'float8', float4: 'float4', float8: 'float8', numeric: 'numeric' },
		float8: { int2: 'float8', int4: 'float8', int8: 'float8', float4: 'float8', float8: 'float8', numeric: 'numeric' },
		numeric: { int2: 'numeric', int4: 'numeric', int8: 'numeric', float4: 'numeric', float8: 'numeric', numeric: 'numeric' },
		date: { int2: 'date', int4: 'date', int8: 'date', date: 'int4', /*interval: 'timestamp'*/ }, // date - date = integer
		timestamp: { /*interval: 'timestamp', timestamp: 'interval'*/ },
		// interval: { date: 'timestamp', interval: 'interval' }
	};
	let currentType: ArithmeticType | undefined = 'int2';
	for (const type of types) {
		if (type === 'unknown') {
			return 'unknown';
		}
		currentType = arithmeticMatrix[currentType][type];
		if (!currentType) {
			return 'unknown'
		}
	}
	return currentType;
}

function isNotNull_a_expr_add(a_expr_add: A_expr_addContext, field: FieldName): boolean {
	const a_expr_mul_list = a_expr_add.a_expr_mul_list();
	if (a_expr_mul_list) {
		return a_expr_mul_list.every(a_expr_mul => isNotNull_a_expr_mul(a_expr_mul, field))
	}
	return false;
}

function isNotNull_a_expr_mul(a_expr_mul: A_expr_mulContext, field: FieldName): boolean {
	const a_expr_caret_list = a_expr_mul.a_expr_caret_list();
	if (a_expr_caret_list) {
		return a_expr_caret_list.every(a_expr_caret => isNotNull_a_expr_caret(a_expr_caret, field));
	}
	return false;
}

function isNotNull_a_expr_caret(a_expr_caret: A_expr_caretContext, field: FieldName): boolean {
	const a_expr_unary_sign_list = a_expr_caret.a_expr_unary_sign_list();
	if (a_expr_unary_sign_list) {
		return a_expr_unary_sign_list.every(a_expr_unary_sign => isNotNull_a_expr_unary_sign(a_expr_unary_sign, field))
	}
	return false;
}

function isNotNull_a_expr_unary_sign(a_expr_unary_sign: A_expr_unary_signContext, field: FieldName): boolean {
	const a_expr_at_time_zone = a_expr_unary_sign.a_expr_at_time_zone();
	if (a_expr_at_time_zone) {
		return isNotNull_a_expr_at_time_zone(a_expr_at_time_zone, field);
	}
	return false;
}

function isNotNull_a_expr_at_time_zone(a_expr_at_time_zone: A_expr_at_time_zoneContext, field: FieldName): boolean {
	const a_expr_collate = a_expr_at_time_zone.a_expr_collate();
	if (a_expr_collate) {
		return isNotNull_a_expr_collate(a_expr_collate, field);
	}
	return false;
}

function isNotNull_a_expr_collate(a_expr_collate: A_expr_collateContext, field: FieldName): boolean {
	const a_expr_typecast = a_expr_collate.a_expr_typecast();
	if (a_expr_typecast) {
		return isNotNull_a_expr_typecast(a_expr_typecast, field);
	}
	return false;
}

function isNotNull_a_expr_typecast(a_expr_typecast: A_expr_typecastContext, field: FieldName): boolean {
	const c_expr = a_expr_typecast.c_expr();
	if (c_expr) {
		return isNotNull_c_expr(c_expr, field);
	}
	return false;
}

function isNotNull_c_expr(c_expr: C_exprContext, field: FieldName): boolean {
	if (c_expr instanceof C_expr_exprContext) {
		const columnref = c_expr.columnref();
		if (columnref) {
			const fieldName = splitName(columnref.getText());
			return (fieldName.name === field.name && (fieldName.prefix === '' || field.prefix === fieldName.prefix));
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

function isSingleRowResult(selectstmt: SelectstmtContext, fromColumns: NotNullInfo[]): boolean {

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
		const uniqueKeys = fromColumns.filter(col => col.column_key === 'PRI' || col.column_key === 'UNI')
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
		const c_expr_list = collectContextsOfType(target_el, Func_exprContext, false);
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
	// RANK(), DENSE_RANK(), PERCENT_RANK() - they are window functions, not aggregate functions, 
	// even though your query is returning them from a join involving pg_aggregate.
	return !func_expr.over_clause() && aggregateFunctions.has(funcName);
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

	if (uniqueKeys.length === 0) {
		return false;
	}

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

