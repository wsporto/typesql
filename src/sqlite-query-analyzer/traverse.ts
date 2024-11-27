import {
	type Select_stmtContext,
	type Sql_stmtContext,
	ExprContext,
	type Table_or_subqueryContext,
	type Result_columnContext,
	type Insert_stmtContext,
	Column_nameContext,
	type Update_stmtContext,
	type Delete_stmtContext,
	type Join_constraintContext,
	type Table_nameContext,
	type Join_operatorContext,
	type Returning_clauseContext,
	type Select_coreContext,
	Table_function_nameContext
} from '@wsporto/ts-mysql-parser/dist/sqlite';
import type { ColumnDef, ExtensionFunctionCatalog, FieldName, TraverseContext, TypeAndNullInfer, TypeAndNullInferParam } from '../mysql-query-analyzer/types';
import { filterColumns, findColumn, getExpressions, includeColumn, splitName } from '../mysql-query-analyzer/select-columns';
import { freshVar } from '../mysql-query-analyzer/collect-constraints';
import {
	type DeleteResult,
	type InsertResult,
	type QuerySpecificationResult,
	type SelectResult,
	type TraverseResult2,
	type UpdateResult,
	getOrderByColumns
} from '../mysql-query-analyzer/traverse';
import type { Relation2 } from './sqlite-describe-nested-query';
import { type Either, left, right } from 'fp-ts/lib/Either';
import type { TypeSqlError } from '../types';
import type { ParserRuleContext } from '@wsporto/ts-mysql-parser';

function traverse_Sql_stmtContext(sql_stmt: Sql_stmtContext, traverseContext: TraverseContext): TraverseResult2 {
	const select_stmt = sql_stmt.select_stmt();
	if (select_stmt) {
		const selectResult = traverse_select_stmt(select_stmt, traverseContext);
		return selectResult;
	}
	const insert_stmt = sql_stmt.insert_stmt();
	if (insert_stmt) {
		const insertResult = traverse_insert_stmt(insert_stmt, traverseContext);
		return insertResult;
	}
	const update_stmt = sql_stmt.update_stmt();
	if (update_stmt) {
		const updateResult = traverse_update_stmt(update_stmt, traverseContext);
		return updateResult;
	}
	const delete_stmt = sql_stmt.delete_stmt();
	if (delete_stmt) {
		const deleteResult = traverse_delete_stmt(delete_stmt, traverseContext);
		return deleteResult;
	}
	throw Error('traverse_Sql_stmtContext');
}

export function tryTraverse_Sql_stmtContext(
	sql_stmt: Sql_stmtContext,
	traverseContext: TraverseContext
): Either<TypeSqlError, TraverseResult2> {
	try {
		const traverseResult = traverse_Sql_stmtContext(sql_stmt, traverseContext);
		return right(traverseResult);
	} catch (err) {
		const error = err as Error;
		return left({
			name: 'parser error',
			description: error.message
		});
	}
}

function traverse_select_stmt(
	select_stmt: Select_stmtContext,
	traverseContext: TraverseContext,
	subQuery = false,
	recursive = false,
	recursiveNames: string[] = [],
	withTable?: string
): SelectResult {
	const common_table_stmt = select_stmt.common_table_stmt();
	if (common_table_stmt) {
		const recursive = common_table_stmt.RECURSIVE_() != null;
		const common_table_expression = common_table_stmt.common_table_expression_list();
		common_table_expression.forEach((common_table_expression) => {
			const table_name = common_table_expression.table_name();
			const recursiveNames = common_table_expression.column_name_list().map((column_name) => column_name.getText());
			const paramsBefore = traverseContext.parameters.length;
			const select_stmt = common_table_expression.select_stmt();
			traverse_select_stmt(
				select_stmt,
				{ ...traverseContext, subQuery: true },
				subQuery,
				recursive,
				recursiveNames,
				table_name.getText()
			);
			const parameters = traverseContext.parameters.slice(paramsBefore).map((_, index) => paramsBefore + index);
			traverseContext.dynamicSqlInfo2.with.push({
				fragment: extractOriginalSql(common_table_expression),
				relationName: table_name.getText(),
				parameters: parameters
			});
		});
	}

	const [mainSelect, ...unionSelect] = select_stmt.select_core_list();
	const mainQueryResult = traverse_select_core(mainSelect, traverseContext, subQuery, recursive, recursiveNames);
	if (withTable) {
		for (const [index, col] of mainQueryResult.columns.entries()) {
			const colDef = mapTypeAndNullInferToColumnDef(col, recursiveNames[index], withTable);
			traverseContext.withSchema.push(colDef);
		}
	}

	unionSelect.forEach((select_core) => {
		const unionResult = traverse_select_core(select_core, traverseContext, subQuery, recursive);
		unionResult.columns.forEach((col, colIndex) => {
			mainQueryResult.columns[colIndex].table = '';
			traverseContext.constraints.push({
				expression: 'UNION',
				type1: mainQueryResult.columns[colIndex].type,
				type2: col.type
			});
		});
	});

	const sortedParameters = traverseContext.parameters.sort((param1, param2) => param1.paramIndex - param2.paramIndex);
	const selectResult: SelectResult = {
		queryType: 'Select',
		parameters: sortedParameters,
		columns: mainQueryResult.columns,
		multipleRowsResult: isMultipleRowResult(select_stmt, mainQueryResult.fromColumns),
		relations: traverseContext.relations,
		dynamicQueryInfo: traverseContext.dynamicSqlInfo2,
		constraints: traverseContext.constraints
	};
	const order_by_stmt = select_stmt.order_by_stmt();
	let hasOrderByParameter = false;
	if (order_by_stmt) {
		const selectColumns = mainQueryResult.columns.map((col, index) => mapTypeAndNullInferToColumnDef(col, recursiveNames[index]));
		const ordering_term_list = order_by_stmt.ordering_term_list();
		ordering_term_list.forEach((ordering_term) => {
			const expr = ordering_term.expr();
			if (expr.getText() === '?') {
				hasOrderByParameter = true;
			} else {
				traverse_expr(expr, {
					...traverseContext,
					fromColumns: mainQueryResult.fromColumns.concat(selectColumns)
				});
			}
		});
		if (hasOrderByParameter) {
			const orderByColumns = getOrderByColumns(mainQueryResult.fromColumns, mainQueryResult.columns);
			selectResult.orderByColumns = orderByColumns;
		}
	}
	const limit = select_stmt.limit_stmt();
	if (limit) {
		traverseContext.dynamicSqlInfo2.limitOffset = {
			fragment: extractOriginalSql(limit),
			parameters: []
		};
		const expr_list = limit.expr_list();
		const expr1 = expr_list[0];
		const paramsBefore = traverseContext.parameters.length;
		const exrp1Type = traverse_expr(expr1, traverseContext);
		exrp1Type.notNull = true;
		traverseContext.constraints.push({
			expression: expr1.getText(),
			type1: exrp1Type.type,
			type2: freshVar('INTEGER', 'INTEGER')
		});
		if (expr_list.length === 2) {
			const expr2 = expr_list[1];
			const exrp2Type = traverse_expr(expr2, traverseContext);
			exrp2Type.notNull = true;
			traverseContext.constraints.push({
				expression: expr2.getText(),
				type1: exrp2Type.type,
				type2: freshVar('INTEGER', 'INTEGER')
			});
		}
		traverseContext.parameters.slice(paramsBefore).forEach((_, index) => {
			traverseContext.dynamicSqlInfo2.limitOffset?.parameters.push(paramsBefore + index);
		});
	}

	return selectResult;
}

function mapTypeAndNullInferToColumnDef(col: TypeAndNullInfer, name?: string, tableName?: string): ColumnDef {
	return {
		columnName: name ?? col.name,
		columnType: col.type,
		notNull: col.notNull,
		columnKey: '',
		table: tableName ?? col.table,
		tableAlias: '',
		hidden: col.hidden || 0
	};
}

function traverse_select_core(
	select_core: Select_coreContext,
	traverseContext: TraverseContext,
	subQuery = false,
	recursive = false,
	recursiveName?: string[]
) {
	const columnsResult: ColumnDef[] = [];
	const listType: TypeAndNullInfer[] = [];

	const table_or_subquery = select_core.table_or_subquery_list();
	if (table_or_subquery) {
		const fields = traverse_table_or_subquery(table_or_subquery, null, null, traverseContext);
		columnsResult.push(...fields);
	}
	const join_clause = select_core.join_clause();
	if (join_clause) {
		const join_table_or_subquery = join_clause.table_or_subquery_list();
		const join_constraint_list = join_clause.join_constraint_list();
		const join_operator_list = join_clause.join_operator_list();
		const fields = traverse_table_or_subquery(join_table_or_subquery, join_constraint_list, join_operator_list, traverseContext);
		columnsResult.push(...fields);
	}

	const result_column = select_core.result_column_list();
	const fromColumns = subQuery || recursive ? traverseContext.fromColumns.concat(columnsResult) : columnsResult;

	result_column.forEach((result_column) => {
		if (result_column.STAR()) {
			const tableName = result_column.table_name()?.getText();
			columnsResult.filter(col => col.hidden !== 1).forEach((col) => {
				const table = col.tableAlias || col.table;
				if (!tableName || includeColumn(col, tableName)) {
					listType.push({
						name: col.columnName,
						type: col.columnType,
						notNull: col.notNull,
						table: table,
						hidden: col.hidden
					});
					if (!traverseContext.subQuery) {
						traverseContext.dynamicSqlInfo2.select.push({
							fragment: `${table}.${col.columnName}`,
							fragmentWitoutAlias: `${table}.${col.columnName}`,
							dependOnRelations: [table],
							parameters: []
						});
					}
				}
			});
		}

		const expr = result_column.expr();
		const alias = result_column.column_alias()?.getText();
		if (expr) {
			const exprType = traverse_expr(expr, {
				...traverseContext,
				fromColumns: fromColumns
			});
			if (alias) {
				traverseContext.relations
					.filter(
						(relation) => relation.joinColumn === exprType.name && (relation.name === exprType.table || relation.alias === exprType.table)
					)
					.forEach((relation) => {
						relation.joinColumn = alias;
					});
			}

			if (exprType.type.kind === 'TypeVar') {
				if (alias) {
					exprType.name = alias;
				}
				listType.push(exprType);
			}

			if (!traverseContext.subQuery) {
				const { relations, params } = extractRelationsAndParams(expr, fromColumns, traverseContext.parameters);
				traverseContext.dynamicSqlInfo2.select.push({
					fragment: extractOriginalSql(result_column),
					fragmentWitoutAlias: extractOriginalSql(expr),
					dependOnRelations: [...new Set(relations)],
					parameters: params
				});
			}
		}
	});

	const newColumns = listType.map((selectField) => {
		const col: ColumnDef = {
			columnName: selectField.name,
			table: selectField.table,
			columnType: selectField.type,
			notNull: selectField.notNull,
			columnKey: '',
			hidden: selectField.hidden || 0
		};
		return col;
	});
	const whereExpr = select_core._whereExpr;
	if (whereExpr) {
		traverse_expr(whereExpr, {
			...traverseContext,
			fromColumns: fromColumns.concat(newColumns)
		});
		if (!traverseContext.subQuery) {
			const { relations, params } = extractRelationsAndParams(whereExpr, fromColumns.concat(newColumns), traverseContext.parameters);
			traverseContext.dynamicSqlInfo2.where.push({
				fragment: `AND ${extractOriginalSql(whereExpr)}`,
				dependOnRelations: [...new Set(relations)], //remove duplicated
				parameters: params
			});
		}
	}
	const groupByExprList = select_core._groupByExpr || [];
	groupByExprList.forEach((groupByExpr) => {
		traverse_expr(groupByExpr, {
			...traverseContext,
			fromColumns: newColumns.concat(fromColumns)
		});
	});

	const havingExpr = select_core._havingExpr;
	if (havingExpr) {
		//select have precedence: newColumns.concat(fromColumns)
		traverse_expr(havingExpr, {
			...traverseContext,
			fromColumns: newColumns.concat(fromColumns)
		});
	}
	const querySpecification: QuerySpecificationResult = {
		columns: listType.map((col) => ({
			...col,
			notNull: col.notNull || isNotNull(col.name, whereExpr) || isNotNull(col.name, havingExpr)
		})),
		fromColumns: columnsResult //TODO - return isMultipleRowResult instead
	};
	return querySpecification;
}

function extractRelationsAndParams(expr: ExprContext, fromColumns: ColumnDef[], parameters: TypeAndNullInferParam[]) {
	const columnsRef = getExpressions(expr, Column_nameContext);
	const relations = columnsRef
		.filter((expr) => !expr.isSubQuery)
		.map((colRef) => {
			const fieldName = splitName((colRef.expr as ExprContext).parentCtx!.getText());
			const column = findColumn(fieldName, fromColumns);
			return column.tableAlias || column.table;
		});
	const expressionList = getExpressions(expr, ExprContext);
	const paramsIds = expressionList
		.filter((expr) => (expr.expr as ExprContext).BIND_PARAMETER() != null)
		.map((expr) => (expr.expr as ExprContext).BIND_PARAMETER().symbol.start);
	const params = getParamsIndexes(parameters, paramsIds);

	return {
		relations,
		params
	};
}

function traverse_table_or_subquery(
	table_or_subquery_list: Table_or_subqueryContext[],
	join_constraint_list: Join_constraintContext[] | null,
	join_operator_list: Join_operatorContext[] | null,
	traverseContext: TraverseContext
): ColumnDef[] {
	const allFields: ColumnDef[] = [];
	table_or_subquery_list.forEach((table_or_subquery, index) => {
		const numParamsBefore = traverseContext.parameters.length;

		const isLeftJoin = index > 0 && join_operator_list ? join_operator_list[index - 1]?.LEFT_() != null : false;
		const table_function_name = table_or_subquery.table_function_name();
		const table_name = table_or_subquery.table_name() || table_function_name;
		const table_alias_temp = table_or_subquery.table_alias()?.getText() || '';
		let tableOrSubqueryFields: ColumnDef[] = [];

		const virtualTableMatch = /\('.*'\)/; //ex. FROM email('fts5')

		//grammar error: select * from table1 inner join table2....; inner is parsed as table_alias
		const table_alias =
			table_alias_temp.toLowerCase() === 'left' ||
				table_alias_temp.toLowerCase() === 'right' ||
				table_alias_temp.toLowerCase() === 'full' ||
				table_alias_temp.toLowerCase() === 'outer' ||
				table_alias_temp.toLowerCase() === 'inner' ||
				table_alias_temp.toLowerCase() === 'cross' ||
				table_alias_temp.match(virtualTableMatch)
				? ''
				: table_alias_temp;

		const join_constraint = join_constraint_list && index > 0 ? join_constraint_list[index - 1] : undefined;
		const asAlias = table_or_subquery.AS_() || false;
		const tableAlias = table_or_subquery.table_alias()?.getText();
		const tableOrSubqueryName = table_name ? table_name.any_name().getText() : '';
		const schema = table_or_subquery.schema_name()?.getText() || '';

		if (table_name) {

			const tableName: FieldName = {
				name: table_name.getText(),
				prefix: schema
			};
			tableOrSubqueryFields = filterColumns(traverseContext.dbSchema, traverseContext.withSchema, table_alias, tableName);
			if (table_function_name) {
				const table_function_expr = table_or_subquery.expr(0);
				if (table_function_expr) {
					const exprType = traverse_expr(table_function_expr, { ...traverseContext, fromColumns: allFields });
					if (exprType.name === '?' && tableOrSubqueryFields[0]?.columnKey === 'VT') {
						exprType.type.type = 'TEXT';
						exprType.notNull = true;
					}
				}
			}
			const usingFields = join_constraint?.USING_() ? join_constraint?.column_name_list().map((column_name) => column_name.getText()) : [];
			const filteredFields = usingFields.length > 0 ? filterUsingFields(tableOrSubqueryFields, usingFields) : tableOrSubqueryFields;
			if (isLeftJoin) {
				allFields.push(
					...filteredFields.map((field) => ({
						...field,
						notNull: false
					}))
				);
			} else {
				allFields.push(...filteredFields);
			}
		}
		const select_stmt = table_or_subquery.select_stmt();
		if (select_stmt) {
			const subQueryResult = traverse_select_stmt(select_stmt, {
				...traverseContext,
				subQuery: true
			});

			tableOrSubqueryFields = subQueryResult.columns.map((t) => {
				const colDef: ColumnDef = {
					table: t.table ? tableAlias || '' : '',
					columnName: t.name,
					columnType: t.type,
					columnKey: '',
					notNull: t.notNull,
					tableAlias: tableAlias,
					hidden: t.hidden || 0
				};
				return colDef;
			});
			allFields.push(...tableOrSubqueryFields);
		}
		const table_or_subquery_list2 = table_or_subquery.table_or_subquery_list();
		if (table_or_subquery_list2.length > 0) {
			tableOrSubqueryFields = traverse_table_or_subquery(table_or_subquery_list2, null, null, traverseContext);
			allFields.push(...tableOrSubqueryFields);
		}
		const idColumn = tableOrSubqueryFields.find((field) => field.columnKey === 'PRI')?.columnName!;
		const relation: Relation2 = {
			name: asAlias ? table_alias : tableOrSubqueryName,
			alias: table_alias,
			parentRelation: '',
			cardinality: 'one',
			parentCardinality: 'one',
			joinColumn: idColumn
		};

		if (join_constraint) {
			//index 0 is the FROM (root relation)
			const expr = join_constraint.expr(); //ON expr
			if (expr) {
				traverse_expr(expr, {
					...traverseContext,
					fromColumns: allFields
				});

				const allJoinColumsn = getAllColumns(expr);
				allJoinColumsn.forEach((joinColumn) => {
					const column = allFields.find(
						(col) => col.columnName === joinColumn.name && (col.tableAlias === joinColumn.prefix || col.table === joinColumn.prefix)
					)!;
					const filterUniqueKeys = allFields.filter(
						(col) => (joinColumn.prefix === col.table || joinColumn.prefix === col.tableAlias) && col.columnKey === 'PRI'
					);
					const compositeKey = filterUniqueKeys.find((uni) => uni.columnName === column.columnName);
					const notUnique = (filterUniqueKeys.length > 1 && compositeKey) || (column?.columnKey !== 'UNI' && column?.columnKey !== 'PRI');
					if (joinColumn.prefix !== relation.name && joinColumn.prefix !== relation.alias) {
						relation.parentRelation = joinColumn.prefix;
						if (notUnique) {
							relation.parentCardinality = 'many';
						}
					}
					if (joinColumn.prefix === relation.name || joinColumn.prefix === relation.alias) {
						if (notUnique) {
							relation.cardinality = 'many';
						}
					}
				});
			}
		}
		if (!traverseContext.subQuery) {
			traverseContext.relations.push(relation);

			//dynamic query
			const fragment = `${join_operator_list != null && index > 0 ? extractOriginalSql(join_operator_list[index - 1]) : 'FROM'
				} ${extractOriginalSql(table_or_subquery_list[index])}${join_constraint != null ? ` ${extractOriginalSql(join_constraint)}` : ''}`;

			const params = traverseContext.parameters.slice(numParamsBefore).map((_, index) => index + numParamsBefore);

			traverseContext.dynamicSqlInfo2.from.push({
				fragment: fragment,
				relationName: relation.name,
				relationAlias: relation.alias,
				parentRelation: relation.parentRelation,
				fields: tableOrSubqueryFields.map((field) => field.columnName),
				parameters: params
			});
		}
	});
	return allFields;
}

function traverse_expr(expr: ExprContext, traverseContext: TraverseContext): TypeAndNullInfer {
	const function_name = expr.function_name()?.getText().toLowerCase();
	if (function_name) {
		return traverse_function(expr, function_name, traverseContext);
	}

	const column_name = expr.column_name();
	const table_name = expr.table_name();
	if (column_name) {
		const type = traverse_column_name(column_name, table_name, traverseContext);
		return {
			name: type.columnName,
			type: type.columnType,
			notNull: type.notNull,
			table: type.tableAlias || type.table,
			hidden: type.hidden
		};
	}
	const literal = expr.literal_value();
	if (literal) {
		if (literal.STRING_LITERAL()) {
			const type = freshVar(literal.getText(), 'TEXT');
			return {
				name: type.name,
				type: type,
				notNull: true,
				table: type.table || ''
			};
		}
		if (literal.NUMERIC_LITERAL()) {
			const type = freshVar(literal.getText(), 'INTEGER');
			return {
				name: type.name,
				type: type,
				notNull: true,
				table: type.table || ''
			};
		}
		if (literal.TRUE_() || literal.FALSE_()) {
			const type = freshVar(literal.getText(), 'BOOLEAN');
			return {
				name: type.name,
				type: type,
				notNull: true,
				table: type.table || ''
			};
		}
		const type = freshVar(literal.getText(), '?');
		return {
			name: type.name,
			type: type,
			notNull: literal.NULL_() == null,
			table: type.table || ''
		};
	}
	if (expr.unary_operator()) {
		const exprRight = expr.expr(0);
		return traverse_expr(exprRight, traverseContext);
	}
	const parameter = expr.BIND_PARAMETER();
	if (parameter) {
		const param = freshVar('?', '?');
		const type: TypeAndNullInferParam = {
			name: param.name,
			type: param,
			notNull: undefined,
			table: param.table || '',
			paramIndex: parameter.symbol.start
		};
		traverseContext.parameters.push(type);
		return type;
	}
	if (expr.STAR() || expr.DIV() || expr.MOD()) {
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);
		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const typeRight = traverse_expr(exprRight, traverseContext);
		if (typeLeft.name === '?') {
			typeLeft.notNull = true;
		}
		if (typeRight.name === '?') {
			typeRight.notNull = true;
		}
		const returnType = freshVar(expr.getText(), '?');
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeLeft.type,
			type2: returnType
		});
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeRight.type,
			type2: returnType
		});
		return {
			name: returnType.name,
			type: returnType,
			notNull: typeLeft.notNull && typeRight.notNull,
			table: returnType.table || ''
		};
	}
	if (expr.PLUS() || expr.MINUS()) {
		const returnType = freshVar(expr.getText(), 'REAL'); //NUMERIC
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);
		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const typeRight = traverse_expr(exprRight, traverseContext);
		typeLeft.table = '';
		typeRight.table = '';
		if (typeLeft.name === '?') {
			typeLeft.notNull = true;
		}
		if (typeRight.name === '?') {
			typeRight.notNull = true;
		}
		traverseContext.constraints.push({
			expression: exprLeft.getText(),
			type1: returnType,
			type2: typeLeft.type
		});
		const isDateFunctionContext =
			expr.parentCtx instanceof ExprContext && expr.parentCtx.function_name()?.getText().toLowerCase() === 'date';

		if (!isDateFunctionContext) {
			traverseContext.constraints.push({
				expression: exprRight.getText(),
				type1: returnType,
				type2: typeRight.type
			});
		}

		return {
			...typeLeft,
			notNull: typeLeft.notNull && typeRight.notNull
		};
	}
	if (
		expr.LT2() ||
		expr.GT2() ||
		expr.AMP() ||
		expr.PIPE() ||
		expr.LT() ||
		expr.LT_EQ() ||
		expr.GT() ||
		expr.GT_EQ() ||
		expr.NOT_EQ1() ||
		expr.NOT_EQ2()
	) {
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);
		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const typeRight = traverse_expr(exprRight, traverseContext);
		if (typeLeft.name === '?') {
			typeLeft.notNull = true;
		}
		if (typeRight.name === '?') {
			typeRight.notNull = true;
		}
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeLeft.type,
			type2: typeRight.type
		});
		const resultType = freshVar(expr.getText(), 'INTEGER');
		return {
			name: resultType.name,
			type: resultType,
			notNull: true,
			table: resultType.table || ''
		};
	}
	if (expr.PIPE2()) {
		const exprLeft = expr.expr(0);
		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const exprRight = expr.expr(1);
		const typeRight = traverse_expr(exprRight, traverseContext);
		if (typeLeft.name === '?') {
			typeLeft.type.type = 'TEXT';
		}
		if (typeRight.name === '?') {
			typeRight.type.type = 'TEXT';
		}
		return {
			name: expr.getText(),
			type: freshVar(expr.getText(), 'TEXT'),
			notNull: typeLeft.notNull && typeRight.notNull,
			table: ''
		}
	}
	if (expr.IS_()) {
		//is null/is not null/is true, is false
		const exprLeft = expr.expr(0);
		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const exprRight = expr.expr(1);
		const typeRight = traverse_expr(exprRight, traverseContext);
		typeLeft.notNull = typeRight.notNull;

		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeLeft.type,
			type2: typeRight.type
		});
		const type = freshVar(expr.getText(), 'INTEGER');
		return {
			name: type.name,
			type: type,
			notNull: true,
			table: type.table || ''
		};
	}
	if (expr.ASSIGN()) {
		//=
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);
		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const typeRight = traverse_expr(exprRight, traverseContext);
		if (typeLeft.name === '?') {
			typeLeft.notNull = true;
		}
		if (typeRight.name === '?') {
			typeRight.notNull = true;
		}

		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeLeft.type,
			type2: typeRight.type
		});
		const type = freshVar(expr.getText(), '?');
		return {
			name: type.name,
			type: type,
			notNull: true,
			table: type.table || ''
		};
	}
	if (expr.BETWEEN_()) {
		const exprType = traverse_expr(expr.expr(0), traverseContext);
		const between1 = traverse_expr(expr.expr(1), traverseContext);
		const between2 = traverse_expr(expr.expr(2), traverseContext);
		if (between1.name === '?') {
			between1.notNull = true;
		}
		if (between2.name === '?') {
			between2.notNull = true;
		}
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: exprType.type,
			type2: between1.type
		});
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: exprType.type,
			type2: between2.type
		});
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: between1.type,
			type2: between2.type
		});
		return exprType;
	}
	if (expr.OR_() || expr.AND_()) {
		const expr1 = expr.expr(0);
		const expr2 = expr.expr(1);
		traverse_expr(expr1, traverseContext);
		return traverse_expr(expr2, traverseContext);
	}
	if (expr.IN_()) {
		const exprList = expr.expr_list();
		const inExprLeft = exprList[0];
		const typeLeft = traverse_expr(inExprLeft, traverseContext);
		if (typeLeft.name === '?') {
			typeLeft.notNull = true;
		}

		if (expr.NOT_()) {
			//NOT IN (SELECT...)
			const select_stmt = expr.select_stmt();
			if (select_stmt) {
				const select_stmt_type = traverse_select_stmt(select_stmt, traverseContext, true);
				const selectType = select_stmt_type.columns[0];
				traverseContext.constraints.push({
					expression: expr.getText(),
					type1: typeLeft!.type,
					type2: { ...selectType.type, list: true }
				});
			}
			//NOT IN (1, 2, 3)
			exprList.slice(1).forEach((inExpr) => {
				const typeRight = traverse_expr(inExpr, traverseContext);
				if (typeRight.name === '?') {
					typeRight.notNull = true;
				}
				traverseContext.constraints.push({
					expression: expr.getText(),
					type1: typeLeft!.type,
					type2: { ...typeRight.type, list: true }
				});
			});
		} else {
			const rightExpr = exprList[1];
			//IN (SELECT...)
			const select_stmt2 = rightExpr.select_stmt();
			if (select_stmt2) {
				const select_stmt_type = traverse_select_stmt(select_stmt2, traverseContext, true);
				const selectType2 = select_stmt_type.columns[0];
				traverseContext.constraints.push({
					expression: expr.getText(),
					type1: typeLeft!.type,
					type2: { ...selectType2.type, list: true }
				});
			}
			//IN (1, 2, 3)
			rightExpr.expr_list().forEach((inExpr2) => {
				const typeRight = traverse_expr(inExpr2, traverseContext);
				if (typeRight.name === '?') {
					typeRight.notNull = true;
				}
				traverseContext.constraints.push({
					expression: expr.getText(),
					type1: typeLeft!.type,
					type2: { ...typeRight.type, list: true }
				});
			});
		}

		const type = freshVar(expr.getText(), '?');
		return {
			name: type.name,
			type: type,
			notNull: true,
			table: type.table || ''
		};
	}
	if (expr.LIKE_() || expr.GLOB_()) {
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);

		const typeLeft = traverse_expr(exprLeft, traverseContext);
		const typeRight = traverse_expr(exprRight, traverseContext);
		if (typeLeft.name === '?') {
			typeLeft.notNull = true;
		}
		if (typeRight.name === '?') {
			typeRight.notNull = true;
		}

		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeLeft.type,
			type2: typeRight.type
		});
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: typeLeft.type,
			type2: freshVar(expr.getText(), 'TEXT')
		});
		const type = freshVar(expr.getText(), 'INTEGER');
		return {
			name: type.name,
			type: type,
			notNull: true,
			table: type.table || ''
		};
	}
	if (expr.MATCH_()) {
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);
		const typeRight = traverse_expr(exprRight, traverseContext);
		if (typeRight.name === '?') {
			typeRight.notNull = true;
			typeRight.type = freshVar(exprRight.getText(), 'TEXT');
		}

		const type = freshVar(expr.getText(), 'INTEGER');
		return {
			name: type.name,
			type: type,
			notNull: true,
			table: type.table || ''
		};
	}
	const select_stmt = expr.select_stmt();
	if (select_stmt) {
		const subQueryType = traverse_select_stmt(select_stmt, { ...traverseContext, subQuery: true }, true);
		const type = { ...subQueryType.columns[0].type, table: '' };
		return {
			name: type.name,
			type: type,
			notNull: subQueryType.columns[0].notNull,
			table: type.table || ''
		};
	}
	if (expr.OPEN_PAR() && expr.CLOSE_PAR()) {
		const type = freshVar(expr.getText(), '?');
		const exprTypes = expr.expr_list().map((innerExpr) => {
			const exprType = traverse_expr(innerExpr, traverseContext);
			traverseContext.constraints.push({
				expression: innerExpr.getText(),
				type1: exprType.type,
				type2: type
			});
			return exprType;
		});
		return {
			name: type.name,
			type: type,
			notNull: exprTypes.every((type) => type.notNull),
			table: type.table || ''
		};
	}

	if (expr.CASE_()) {
		const resultTypes: TypeAndNullInfer[] = []; //then and else
		const whenTypes: TypeAndNullInfer[] = [];
		expr.expr_list().forEach((expr_, index) => {
			const type = traverse_expr(expr_, traverseContext);
			if (index % 2 === 0 && (!expr.ELSE_() || index < expr.expr_list().length - 1)) {
				whenTypes.push(type);
			} else {
				resultTypes.push(type);
			}
		});
		resultTypes.forEach((resultType, index) => {
			if (index > 0) {
				traverseContext.constraints.push({
					expression: expr.getText(),
					type1: resultTypes[0].type,
					type2: resultType.type
				});
			}
		});
		whenTypes.forEach((whenType) => {
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: freshVar('INTEGER', 'INTEGER'),
				type2: whenType.type
			});
		});
		const type = resultTypes[0];
		return {
			name: extractOriginalSql(expr),
			type: type.type,
			notNull: expr.ELSE_() ? resultTypes.every((type) => type.notNull) : false,
			table: type.table || ''
		};
	}
	throw Error(`traverse_expr not supported:${expr.getText()}`);
}

function traverse_function(expr: ExprContext, function_name: string, traverseContext: TraverseContext): TypeAndNullInfer {
	if (function_name === 'avg') {
		const functionType = freshVar(expr.getText(), 'REAL');
		const sumParamExpr = expr.expr(0);
		const paramType = traverse_expr(sumParamExpr, traverseContext);
		if (paramType.type.kind === 'TypeVar') {
			functionType.table = paramType.table;
		}
		return {
			name: functionType.name,
			type: functionType,
			notNull: paramType.notNull,
			table: functionType.table || ''
		};
	}
	if (function_name === 'sum') {
		const sumParamExpr = expr.expr(0);
		const paramType = traverse_expr(sumParamExpr, traverseContext);

		return {
			name: expr.getText(),
			type: paramType.type,
			notNull: false,
			table: paramType.table || ''
		};
	}
	if (function_name === 'min' || function_name === 'max') {
		const functionType = freshVar(expr.getText(), '?');
		let paramNotNull: boolean | undefined = false;
		expr.expr_list().forEach((exprParam, index, array) => {
			const paramType = traverse_expr(exprParam, traverseContext);
			if (array.length == 1 && index == 0) {
				paramNotNull = paramType.notNull;
			}
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: functionType,
				type2: paramType.type
			});
		})

		return {
			name: functionType.name,
			type: functionType,
			notNull: paramNotNull,
			table: functionType.table || ''
		};
	}
	if (function_name === 'count') {
		const functionType = freshVar(expr.getText(), 'INTEGER');
		if (expr.expr_list().length === 1) {
			const sumParamExpr = expr.expr(0);
			const paramType = traverse_expr(sumParamExpr, traverseContext);
			if (paramType.type.kind === 'TypeVar') {
				functionType.table = paramType.table;
			}
		}

		return {
			name: functionType.name,
			type: functionType,
			notNull: true,
			table: functionType.table || ''
		};
	}
	if (function_name === 'concat') {
		const functionType = freshVar(expr.getText(), 'TEXT');
		expr.expr_list().forEach((paramExpr) => {
			const paramType = traverse_expr(paramExpr, traverseContext);
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: functionType,
				type2: paramType.type
			});
			if (paramType.type.kind === 'TypeVar') {
				functionType.table = paramType.table;
			}
		});

		return {
			name: functionType.name,
			type: functionType,
			notNull: true,
			table: functionType.table || ''
		};
	}
	if (function_name === 'length') {
		const functionType = freshVar(expr.getText(), 'INTEGER');
		const paramExpr = expr.expr(0);
		const paramType = traverse_expr(paramExpr, traverseContext);
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: freshVar(expr.getText(), '?'), //str or blob
			type2: paramType.type
		});
		if (paramType.type.kind === 'TypeVar') {
			functionType.table = paramType.table;
		}

		return {
			name: functionType.name,
			type: functionType,
			notNull: false,
			table: functionType.table || ''
		};
	}
	if (function_name === 'group_concat') {
		expr.expr_list().forEach((paramExpr) => {
			const param1Type = traverse_expr(paramExpr, traverseContext);
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: freshVar(expr.getText(), 'TEXT'),
				type2: param1Type.type
			});
		});

		return {
			name: expr.getText(),
			type: freshVar(expr.getText(), 'TEXT'),
			notNull: false,
			table: ''
		};
	}
	if (function_name === 'random') {
		const functionType = freshVar(expr.getText(), 'INTEGER');
		return {
			name: functionType.name,
			type: functionType,
			notNull: true,
			table: ''
		};
	}
	if (function_name === 'round') {
		const functionType = freshVar(expr.getText(), 'REAL');
		const param1Expr = expr.expr(0);
		const param1Type = traverse_expr(param1Expr, traverseContext);
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: functionType,
			type2: param1Type.type
		});
		const param2Expr = expr.expr(1);
		if (param2Expr) {
			const param2Type = traverse_expr(param2Expr, traverseContext);
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: freshVar(expr.getText(), 'INTEGER'),
				type2: param2Type.type
			});
		}

		return {
			name: functionType.name,
			type: functionType,
			notNull: param1Type.notNull,
			table: param1Type.table || ''
		};
	}
	if (function_name === 'coalesce') {
		const functionType = freshVar(expr.getText(), '?');
		const paramTypes = expr.expr_list().map((paramExpr) => {
			const paramType = traverse_expr(paramExpr, traverseContext);
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: functionType,
				type2: paramType.type
			});
			return paramType;
		});
		return {
			name: functionType.name,
			type: functionType,
			notNull: paramTypes.some((param) => param.notNull),
			table: functionType.table || ''
		};
	}
	if (function_name === 'strftime') {
		const functionType = freshVar(expr.getText(), 'TEXT');
		const paramExpr = expr.expr(1);
		const paramType = traverse_expr(paramExpr, traverseContext);
		paramType.notNull = true;
		traverseContext.constraints.push({
			expression: paramExpr.getText(),
			type1: freshVar(paramExpr.getText(), 'DATE_TIME'),
			type2: paramType.type
		});
		return {
			name: functionType.name,
			type: functionType,
			notNull: false,
			table: functionType.table || ''
		};
	}
	if (function_name === 'date' || function_name === 'time' || function_name === 'datetime') {
		const dateType = function_name === 'date' ? 'DATE' : 'DATE_TIME';
		const functionType = freshVar(expr.getText(), dateType);
		const param1 = traverse_expr(expr.expr(0), traverseContext);
		param1.notNull = true;
		expr.expr_list().forEach((paramExpr, index, arr) => {

			if (index === 0 && arr.length === 1) {
				traverseContext.constraints.push({
					expression: paramExpr.getText(),
					type1: freshVar(paramExpr.getText(), dateType),
					type2: param1.type
				});
			}
			else if (index > 0) {
				const paramType = traverse_expr(paramExpr, traverseContext);

				if (index === 1) {
					if (paramType.name === "'auto'" || paramType.name === "'unixepoch'") {
						traverseContext.constraints.push({
							expression: paramExpr.getText(),
							type1: freshVar(paramExpr.getText(), 'NUMERIC'),
							type2: param1.type
						});
					}
				}
				traverseContext.constraints.push({
					expression: paramExpr.getText(),
					type1: freshVar(paramExpr.getText(), 'TEXT'),
					type2: paramType.type
				});
			}
		})

		return {
			name: functionType.name,
			type: functionType,
			notNull: false,
			table: functionType.table || ''
		};
	}
	if (function_name === 'julianday') {
		const functionType = freshVar(expr.getText(), 'REAL');
		const paramExpr = expr.expr(0);
		const notNull = paramExpr.getText().toLowerCase() === `'now'`;
		const paramType = traverse_expr(paramExpr, traverseContext);
		traverseContext.constraints.push({
			expression: paramExpr.getText(),
			type1: freshVar(paramExpr.getText(), 'DATE'),
			type2: paramType.type
		});
		return {
			name: functionType.name,
			type: functionType,
			notNull,
			table: functionType.table || ''
		};
	}
	if (function_name === 'unixepoch') {
		const functionType = freshVar(expr.getText(), 'INTEGER');
		const paramExpr = expr.expr(0);
		const notNull = paramExpr.getText().toLowerCase() === `'now'`;
		const paramType = traverse_expr(paramExpr, traverseContext);
		traverseContext.constraints.push({
			expression: paramExpr.getText(),
			type1: freshVar(paramExpr.getText(), 'DATE'),
			type2: paramType.type
		});
		return {
			name: functionType.name,
			type: functionType,
			notNull,
			table: functionType.table || ''
		};
	}
	if (function_name === 'ifnull') {
		const functionType = freshVar(expr.getText(), '?');
		const paramTypes = expr.expr_list().map((paramExpr) => {
			const paramType = traverse_expr(paramExpr, traverseContext);
			if (paramType.name === '?') {
				paramType.notNull = false;
			}
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: functionType,
				type2: paramType.type
			});
			return paramType;
		});
		return {
			name: functionType.name,
			type: functionType,
			notNull: paramTypes.every((param) => param.notNull),
			table: functionType.table || ''
		};
	}
	if (function_name === 'row_number' || function_name === 'rank' || function_name === 'dense_rank') {
		const functionType = freshVar(expr.getText(), 'INTEGER');
		return {
			name: functionType.name,
			type: functionType,
			notNull: true,
			table: functionType.table || ''
		};
	}
	if (function_name === 'first_value' || function_name === 'last_value') {
		const paramExpr = expr.expr(0);
		const paramType = traverse_expr(paramExpr, traverseContext);
		return paramType;
	}
	if (function_name === 'lead' || function_name === 'lag') {
		const paramExpr = expr.expr(0);
		const paramType = traverse_expr(paramExpr, traverseContext);
		return { ...paramType, notNull: false };
	}
	if (function_name === 'iif') {
		const expr1 = expr.expr(0);
		traverse_expr(expr1, traverseContext);

		const expr2 = expr.expr(1);
		const expr2Type = traverse_expr(expr2, traverseContext);
		const expr3 = expr.expr(2);
		const expr3Type = traverse_expr(expr3, traverseContext);
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: expr2Type.type,
			type2: expr3Type.type
		});
		return {
			...expr2Type,
			notNull: expr2Type.notNull && expr3Type.notNull
		};
	}
	if (function_name === 'vector') {
		const functionType = freshVar(expr.getText(), 'BLOB');
		const param1Expr = expr.expr(0);
		const param1Type = traverse_expr(param1Expr, traverseContext);
		param1Type.notNull = true;
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: freshVar(expr.getText(), 'TEXT'),
			type2: param1Type.type
		});
		return {
			name: expr.getText(),
			type: functionType,
			notNull: true,
			table: ''
		};
	}
	if (function_name === 'highlight' || function_name === 'snippet') {
		const functionType = freshVar(expr.getText(), 'TEXT');
		const param0Expr = expr.expr(0);
		const param1Expr = expr.expr(1);
		const param1Type = traverse_expr(param1Expr, traverseContext);
		param1Type.notNull = true;
		traverseContext.constraints.push({
			expression: param1Expr.getText(),
			type1: freshVar(param1Expr.getText(), 'INTEGER'),
			type2: param1Type.type
		});
		const param2Expr = expr.expr(2);
		const param2Type = traverse_expr(param2Expr, traverseContext);
		param2Type.notNull = true;
		traverseContext.constraints.push({
			expression: param2Expr.getText(),
			type1: freshVar(param2Expr.getText(), 'TEXT'),
			type2: param2Type.type
		});
		const param3Expr = expr.expr(3);
		const param3Type = traverse_expr(param3Expr, traverseContext);
		param3Type.notNull = true;
		traverseContext.constraints.push({
			expression: param3Expr.getText(),
			type1: freshVar(param3Expr.getText(), 'TEXT'),
			type2: param3Type.type
		});
		if (function_name === 'snippet') {
			const param4Expr = expr.expr(4);
			const param4Type = traverse_expr(param4Expr, traverseContext);
			param4Type.notNull = true;
			traverseContext.constraints.push({
				expression: param4Expr.getText(),
				type1: freshVar(param4Expr.getText(), 'TEXT'),
				type2: param4Type.type
			});
			const param5Expr = expr.expr(5);
			const param5Type = traverse_expr(param5Expr, traverseContext);
			param5Type.notNull = true;
			traverseContext.constraints.push({
				expression: param5Expr.getText(),
				type1: freshVar(param5Expr.getText(), 'INTEGER'),
				type2: param5Type.type
			});
		}
		return {
			name: expr.getText(),
			type: functionType,
			notNull: false,
			table: param0Expr.getText()
		};
	}
	if (function_name === 'vector_extract') {
		const functionType = freshVar(expr.getText(), 'TEXT');
		const param1Expr = expr.expr(0);
		const param1Type = traverse_expr(param1Expr, traverseContext);
		traverseContext.constraints.push({
			expression: expr.getText(),
			type1: freshVar(expr.getText(), 'BLOB'),
			type2: param1Type.type
		});
		return {
			name: expr.getText(),
			type: functionType,
			notNull: true,
			table: ''
		};
	}
	if (function_name === 'vector_distance_cos') {
		const functionType = freshVar(expr.getText(), 'REAL');
		const param1Expr = expr.expr(0);
		if (param1Expr) {
			const param1Type = traverse_expr(param1Expr, traverseContext);
			param1Type.notNull = true;
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: freshVar(expr.getText(), 'BLOB'),
				type2: param1Type.type
			});
		}

		const param2Expr = expr.expr(1);
		if (param2Expr) {
			const param2Type = traverse_expr(param2Expr, traverseContext);
			param2Type.notNull = true;
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: freshVar(expr.getText(), 'TEXT'),
				type2: param2Type.type
			});
		}
		return {
			name: expr.getText(),
			type: functionType,
			notNull: true,
			table: ''
		};
	}

	const functionsSpec: ExtensionFunctionCatalog = {
		'trim': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				},
				{
					type: 'TEXT',
					notNull: true
				},
			],
			returnType: {
				type: 'TEXT',
				notNull: 0
			}
		},
		'rtrim': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				},
				{
					type: 'TEXT',
					notNull: true
				},
			],
			returnType: {
				type: 'TEXT',
				notNull: 0
			}
		},
		'ltrim': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				},
				{
					type: 'TEXT',
					notNull: true
				},
			],
			returnType: {
				type: 'TEXT',
				notNull: 0
			}
		},
		'replace': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				},
				{
					type: 'TEXT',
					notNull: true
				},
				{
					type: 'TEXT',
					notNull: true
				},
			],
			returnType: {
				type: 'TEXT',
				notNull: 0
			}
		},
		'json': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				}
			],
			returnType: {
				type: 'TEXT',
				notNull: 0 //index of parameter
			}
		},
		'jsonb': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				}
			],
			returnType: {
				type: 'BLOB',
				notNull: 0
			}
		},
		'json_array': {
			paramsTypes: [
				{
					type: 'any',
					notNull: false
				}
			],
			returnType: {
				type: 'TEXT',
				notNull: 0
			}
		},
		'jsonb_array': {
			paramsTypes: [
				{
					type: 'any',
					notNull: false
				}
			],
			returnType: {
				type: 'BLOB',
				notNull: 0
			}
		},
		'json_array_length': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				},
				{
					type: 'TEXT',
					notNull: false
				}
			],
			returnType: {
				type: 'INTEGER',
				notNull: false
			}
		},
		'json_error_position': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				}
			],
			returnType: {
				type: 'INTEGER',
				notNull: 0
			}
		},
		'json_extract': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				}
			],
			variableParameters: true,
			returnType: {
				type: 'any',
				notNull: false
			}
		},
		'jsonb_extract': {
			paramsTypes: [
				{
					type: 'TEXT',
					notNull: false
				}
			],
			variableParameters: true,
			returnType: {
				type: 'BLOB',
				notNull: false
			}
		}
	}

	const sqlean_uuid_functions: ExtensionFunctionCatalog = {
		'uuid4': {
			paramsTypes: [],
			returnType: {
				type: 'TEXT',
				notNull: true
			}
		},
		'uuid7': {
			paramsTypes: [],
			returnType: {
				type: 'TEXT',
				notNull: true
			}
		}
	}
	const allFunctions = { ...functionsSpec, ...sqlean_uuid_functions };
	const functionCatalog = allFunctions[function_name];
	if (functionCatalog) {
		const functionType = freshVar(expr.getText(), functionCatalog.returnType.type);

		const params = expr.expr_list().map((exprParam, index) => {
			const paramType = traverse_expr(exprParam, traverseContext);
			const catalogType = functionCatalog.variableParameters === true ? functionCatalog.paramsTypes[0] : functionCatalog.paramsTypes[index];
			if (catalogType) {
				if (paramType.name === '?') {
					paramType.notNull = typeof (catalogType.notNull) === 'boolean' ? catalogType.notNull : false;
				}
				traverseContext.constraints.push({
					expression: expr.getText(),
					type1: freshVar(expr.getText(), catalogType.type),
					type2: paramType.type
				});
			}
			return paramType;
		})
		const isNotNull: boolean = typeof (functionCatalog.returnType.notNull) === 'number'
			? params[functionCatalog.returnType.notNull].notNull || false
			: functionCatalog.returnType.notNull;
		return {
			name: expr.getText(),
			type: functionType,
			notNull: isNotNull,
			table: ''
		};
	}
	throw Error(`traverse_expr: function not supported:${function_name}`);
}

function extractOriginalSql(rule: ParserRuleContext) {
	const startIndex = rule.start.start;
	const stopIndex = rule.stop?.stop || startIndex;
	const result = rule.start.getInputStream()?.getText(startIndex, stopIndex);
	return result;
}

function traverse_column_name(
	column_name: Column_nameContext,
	table_name: Table_nameContext | null,
	traverseContext: TraverseContext
): ColumnDef {
	const fieldName: FieldName = {
		name: column_name.getText(),
		prefix: table_name?.getText() || ''
	};
	const column = findColumn(fieldName, traverseContext.fromColumns);
	// const typeVar = freshVar(column.columnName, column.columnType.type, column.tableAlias || column.table);
	return column;
}

export function isNotNull(columnName: string, where: ExprContext | null): boolean {
	if (where == null) {
		return false;
	}
	if (where.AND_()) {
		const ifNullList = where.expr_list().map((expr) => isNotNull(columnName, expr));
		const result = ifNullList.some((v) => v);
		return result;
	}
	if (where.OR_()) {
		const possibleNullList = where.expr_list().map((expr) => isNotNull(columnName, expr));
		const result = possibleNullList.every((v) => v);
		return result;
	}
	return isNotNullExpr(columnName, where);
}

function isNotNullExpr(columnName: string, expr: ExprContext): boolean {
	if (expr.OPEN_PAR() && expr.CLOSE_PAR()) {
		const innerExpr = expr.expr(0);
		return isNotNull(columnName, innerExpr);
	}
	if (
		expr.ASSIGN() ||
		expr.GT() ||
		expr.GT_EQ() ||
		expr.LT() ||
		expr.LT_EQ() ||
		(expr.IS_() && expr.expr_list().length === 2 && expr.expr(1).getText() === 'notnull')
	) {
		const exprLeft = expr.expr(0);
		const exprRight = expr.expr(1);
		const column_name_left = exprLeft.column_name();
		const column_name_right = exprRight.column_name();
		if (column_name_left || column_name_right) {
			const columnLeft = column_name_left?.getText();
			const columnRight = column_name_right?.getText();
			if (columnLeft === columnName || columnRight === columnName) {
				return true;
			}
		}
	}
	return false;
}

export function isMultipleRowResult(select_stmt: Select_stmtContext, fromColumns: ColumnDef[]) {
	if (select_stmt.select_core_list().length === 1) {
		//UNION queries are multipleRowsResult = true
		const select_core = select_stmt.select_core(0);
		const from = select_core.FROM_();
		if (!from) {
			return false;
		}
		const groupBy = select_stmt.select_core_list().some((select_core) => select_core.GROUP_() != null);
		if (groupBy) {
			return true;
		}
		const agreegateFunction = select_core.result_column_list().some((result_column) => isAgregateFunction(result_column));
		if (agreegateFunction) {
			return false;
		}
		const _whereExpr = select_core._whereExpr;
		const isSingleResult = select_core.join_clause() == null && _whereExpr && where_is_single_result(_whereExpr, fromColumns);
		if (isSingleResult === true) {
			return false;
		}
	}
	if (isLimitOne(select_stmt)) {
		return false;
	}

	return true;
}

function isAgregateFunction(result_column: Result_columnContext) {
	if (result_column.expr()?.over_clause() != null) {
		//window function isMultipleRow = true
		return false;
	}
	const expr = result_column.expr();
	const isAgreg = expr && isAgregateFunctionExpr(expr);
	return isAgreg;
}

function isAgregateFunctionExpr(expr: ExprContext) {
	//ex. min(value)/100, 100/min(value)
	const isAgrr = expr.expr_list().some((expr) => isAgregateFunctionExpr(expr));
	if (isAgrr) {
		return isAgrr;
	}
	const function_name = expr.function_name()?.getText().toLowerCase();
	return (
		function_name === 'count' ||
		function_name === 'sum' ||
		function_name === 'avg' ||
		function_name === 'min' ||
		function_name === 'max' ||
		function_name === 'group_concat'
	);
}

function isLimitOne(select_stmt: Select_stmtContext) {
	const limit_stmt = select_stmt.limit_stmt();
	if (limit_stmt && limit_stmt.expr(0).getText() === '1') {
		return true;
	}
	return false;
}

function where_is_single_result(whereExpr: ExprContext, fromColumns: ColumnDef[]): boolean {
	if (whereExpr.ASSIGN()) {
		const isSingleResult = is_single_result(whereExpr, fromColumns);
		return isSingleResult;
	}
	const expr_list = whereExpr.expr_list();
	const onlyAnd = !whereExpr.OR_();
	const oneSingle = expr_list.some((expr) => is_single_result(expr, fromColumns));
	if (onlyAnd && oneSingle) {
		return true;
	}
	return false;
}

function is_single_result(expr: ExprContext, fromColumns: ColumnDef[]): boolean {
	const expr1 = expr.expr(0);
	const expr2 = expr.expr(1); //TODO: 1 = id
	const column_name = expr1?.column_name();
	if (column_name && expr.ASSIGN()) {
		const fieldName = splitName(column_name.getText());
		const column = findColumn(fieldName, fromColumns);
		if (column.columnKey === 'PRI') {
			return true;
		}
	}
	return false;
}

function traverse_insert_stmt(insert_stmt: Insert_stmtContext, traverseContext: TraverseContext): InsertResult {
	const table_name = insert_stmt.table_name();
	const fromColumns = filterColumns(traverseContext.dbSchema, [], '', splitName(table_name.getText()));
	const columns = insert_stmt.column_name_list().map((column_name) => {
		return traverse_column_name(column_name, null, {
			...traverseContext,
			fromColumns
		});
	});
	const insertColumns: TypeAndNullInferParam[] = [];
	const value_row_list = insert_stmt.values_clause()?.value_row_list() || [];
	value_row_list.forEach((value_row) => {
		value_row.expr_list().forEach((expr, index) => {
			const numberParamsBefore = traverseContext.parameters.length;
			const exprType = traverse_expr(expr, traverseContext);
			traverseContext.parameters.slice(numberParamsBefore).forEach((param) => {
				const col = columns[index];
				traverseContext.constraints.unshift({
					expression: expr.getText(),
					type1: col.columnType,
					type2: exprType.type
				});
				const notNullColumn = col.columnKey === 'PRI' && col.columnType.type === 'INTEGER' ? false : col.notNull;
				insertColumns.push({
					...param,
					notNull: exprType.name === '?' ? notNullColumn : param.notNull
				});
			});
		});
	});
	const select_stmt = insert_stmt.select_stmt();
	if (select_stmt) {
		const columnNullability = new Map<string, boolean | undefined>();
		const selectResult = traverse_select_stmt(select_stmt, traverseContext);
		selectResult.columns.forEach((selectColumn, index) => {
			const col = columns[index];
			traverseContext.constraints.unshift({
				expression: col.columnName,
				type1: col.columnType,
				type2: selectColumn.type
			});
			const notNullColumn = col.columnKey === 'PRI' && col.columnType.type === 'INTEGER' ? false : col.notNull;
			columnNullability.set(selectColumn.type.id, notNullColumn);
		});

		traverseContext.parameters.forEach((param) => {
			insertColumns.push({
				...param,
				notNull: columnNullability.get(param.type.id) != null ? columnNullability.get(param.type.id)! : param.notNull
			});
		});
	}
	const upsert_clause = insert_stmt.upsert_clause();
	if (upsert_clause) {
		const assign_list = upsert_clause.ASSIGN_list();
		const paramsBefore = traverseContext.parameters.length;
		assign_list.forEach((_, index) => {
			const column_name = upsert_clause.column_name(index);
			const col = traverse_column_name(column_name, null, {
				...traverseContext,
				fromColumns
			});
			const expr = upsert_clause.expr(index);
			const table_name = expr.table_name();
			const excludedColumns =
				table_name && table_name.getText() === 'excluded' ? fromColumns.map((col) => ({ ...col, table: 'excluded' })) : [];
			const exprType = traverse_expr(expr, {
				...traverseContext,
				fromColumns: fromColumns.concat(excludedColumns)
			});
			traverseContext.constraints.push({
				expression: column_name.getText(),
				type1: col.columnType,
				type2: exprType.type
			});
		});
		traverseContext.parameters.slice(paramsBefore).forEach((param) => {
			insertColumns.push({
				...param,
				notNull: param.notNull
			});
		});
	}

	const returning_clause = insert_stmt.returning_clause();
	const returninColumns = returning_clause ? traverse_returning_clause(returning_clause, fromColumns) : [];

	const queryResult: InsertResult = {
		queryType: 'Insert',
		constraints: traverseContext.constraints,
		parameters: insertColumns,
		columns: returninColumns,
		returing: returning_clause != null
	};
	return queryResult;
}

function traverse_returning_clause(returning_clause: Returning_clauseContext, fromColumns: ColumnDef[]) {
	const result_column_list = returning_clause.result_column_list();
	const result = result_column_list.flatMap((result_column) => {
		if (result_column.STAR()) {
			return fromColumns.map((col) => {
				const newCol: TypeAndNullInfer = {
					name: col.columnName,
					type: col.columnType,
					notNull: col.notNull,
					table: col.table
				};
				return newCol;
			});
		}
		return [];
	});
	return result;
}

function traverse_update_stmt(update_stmt: Update_stmtContext, traverseContext: TraverseContext): UpdateResult {
	const table_name = update_stmt.qualified_table_name().getText();
	const fromColumns = filterColumns(traverseContext.dbSchema, [], '', splitName(table_name));

	const column_name_list = Array.from({
		length: update_stmt.ASSIGN_list().length
	}).map((_, i) => update_stmt.column_name(i));
	const columns = column_name_list.map((column_name) => {
		return traverse_column_name(column_name, null, {
			...traverseContext,
			fromColumns
		});
	});
	const updateColumns: TypeAndNullInfer[] = [];
	const whereParams: TypeAndNullInferParam[] = [];
	const expr_list = update_stmt.expr_list();
	let paramsBefore = traverseContext.parameters.length;
	expr_list.forEach((expr, index) => {
		paramsBefore = traverseContext.parameters.length;
		const exprType = traverse_expr(expr, {
			...traverseContext,
			fromColumns
		});
		if (!update_stmt.WHERE_() || expr.start.start < update_stmt.WHERE_().symbol.start) {
			const col = columns[index];
			traverseContext.constraints.push({
				expression: expr.getText(),
				type1: col.columnType,
				type2: exprType.type
			});
			traverseContext.parameters.slice(paramsBefore).forEach((param, index) => {
				updateColumns.push({
					...param,
					notNull: param.notNull && col.notNull
				});
			});
		} else {
			traverseContext.parameters.slice(paramsBefore).forEach((param, index) => {
				whereParams.push(param);
			});
		}
	});

	const queryResult: UpdateResult = {
		queryType: 'Update',
		constraints: traverseContext.constraints,
		columns: updateColumns,
		whereParams: whereParams,
		parameters: traverseContext.parameters
	};
	return queryResult;
}

function traverse_delete_stmt(delete_stmt: Delete_stmtContext, traverseContext: TraverseContext): DeleteResult {
	const table_name = delete_stmt.qualified_table_name().getText();
	const fromColumns = filterColumns(traverseContext.dbSchema, [], '', splitName(table_name));

	const expr = delete_stmt.expr();
	traverse_expr(expr, { ...traverseContext, fromColumns });

	const queryResult: DeleteResult = {
		queryType: 'Delete',
		constraints: traverseContext.constraints,
		parameters: traverseContext.parameters
	};
	return queryResult;
}

function getAllColumns(expr: ExprContext): FieldName[] {
	const columns: FieldName[] = [];
	if (expr.ASSIGN()) {
		const expr1 = expr.expr(0);
		const expr2 = expr.expr(1);
		columns.push(splitName(expr1.getText()));
		columns.push(splitName(expr2.getText()));
	}
	return columns;
}

function filterUsingFields(fields: ColumnDef[], usingFields: string[]) {
	const result = fields.filter((field) => !usingFields.includes(field.columnName));
	return result;
}
function getParamsIndexes(parameters: TypeAndNullInferParam[], paramsIds: number[]): number[] {
	const map = new Map<number, number>();
	parameters.forEach((param, index) => {
		map.set(param.paramIndex, index);
	});
	return paramsIds.map((id) => map.get(id)!);
}

function getWhereFragmentExpressions(whereExpr: ExprContext): ExprContext[] {
	const exprList: ExprContext[] = [];

	const likeExpr = whereExpr.LIKE_();
	if (likeExpr) {
		addExpr(exprList, likeExpr.parentCtx);
	}
	if (!whereExpr.LIKE_()) {
		exprList.push(...whereExpr.expr_list());
	}
	return exprList;
}

function addExpr(exprList: ExprContext[], parentCtx: ParserRuleContext) {
	if (parentCtx instanceof ExprContext) {
		exprList.push(parentCtx);
	}
}
