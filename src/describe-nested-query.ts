import {
	type ExprContext,
	type JoinedTableContext,
	type QueryContext,
	SimpleExprColumnRefContext,
	type TableFactorContext,
	type TableReferenceContext
} from '@wsporto/typesql-parser/mysql/MySQLParser';
import { extractQueryInfo, parse } from './mysql-query-analyzer/parse';
import { findColumnSchema, getSimpleExpressions, splitName } from './mysql-query-analyzer/select-columns';
import type { ColumnInfo, ColumnSchema } from './mysql-query-analyzer/types';
import { preprocessSql } from './describe-query';

export type NestedResultInfo = {
	relations: RelationInfo[];
};

export type RelationInfo = {
	name: string;
	groupKeyIndex: number;
	columns: ModelColumn[];
};

export type Cardinality = 'one' | 'many' | '';

export type ModelColumn = Field | RelationField;

export type Field = {
	type: 'field';
	name: string;
	index: number;
};

export type RelationField = {
	type: 'relation';
	name: string;
	cardinality: Cardinality;
	notNull: boolean;
};

export type TableName = {
	name: string;
	alias: string | '';
	asSymbol: boolean;
	isJunctionTable: boolean;
};

//utility for tests
export function describeNestedQuery(sql: string, dbSchema: ColumnSchema[]): NestedResultInfo {
	const { sql: processedSql } = preprocessSql(sql, 'mysql');
	const queryContext = parse(processedSql);
	const queryInfo = extractQueryInfo(sql, dbSchema);
	const columns = queryInfo.kind === 'Select' ? queryInfo.columns : [];
	return generateNestedInfo(queryContext, dbSchema, columns);
}

export function generateNestedInfo(queryContext: QueryContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]): NestedResultInfo {
	const selectStatement = queryContext.simpleStatement()?.selectStatement();
	if (selectStatement) {
		const queryExpression = selectStatement.queryExpression();
		if (queryExpression) {
			const queryExpressionBody = queryExpression.queryExpressionBody();
			if (queryExpressionBody) {
				const querySpec = queryExpressionBody.querySpecification();
				if (querySpec) {
					const fromClause = querySpec.fromClause();
					if (fromClause) {
						const tableReferences = fromClause.tableReferenceList()?.tableReference_list() || [];
						const modelColumns = tableReferences.map((tableRef) => {
							const nestedResultInfo: NestedResultInfo = {
								relations: getResult(tableRef, dbSchema, columns)
							};
							return nestedResultInfo;
						});
						return modelColumns[0];
					}
				}
			}
		}
	}
	throw Error('generateNestedInfo');
}

type Relation = {
	parent: TableName;
	child: TableName;
	cardinality: Cardinality;
	isJunctionTable: boolean;
	junctionChildTable: string;
};

function getResult(tableRef: TableReferenceContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]) {
	const relations = getRelations(tableRef, dbSchema, columns);
	return relations;
}

function getRelations(tableRef: TableReferenceContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]) {
	const relations: Relation[] = [];
	const tableFactor = tableRef.tableFactor();
	const parentList: TableName[] = [];
	if (tableFactor != null) {
		//root
		const tableName = getTableInfoFromTableFactor(tableFactor);
		parentList.push(tableName);
	}
	const joinedTableList = tableRef.joinedTable_list();
	for (const joined of joinedTableList) {
		const onClause = joined.expr();
		const tableName = getTableInfoFromTableJoinedTable(joined);
		const parentRelations = onClause ? getParentRelations(onClause, tableName, parentList) : [];
		const cardinality = onClause ? verifyCardinality(onClause, dbSchema, tableName.name) : '';
		parentList.push(tableName);
		for (const parent of parentRelations) {
			relations.push({
				parent: parent,
				child: tableName,
				cardinality,
				isJunctionTable: false, //will be set later
				junctionChildTable: ''
			});
		}
	}
	for (let index = 0; index < relations.length; index++) {
		const relation = relations[index];
		const [isJunction, childRelationName] = isJunctionTable(relation, relations);
		if (isJunction) {
			relation.isJunctionTable = true;
			relation.junctionChildTable = childRelationName;
			const relationItem = parentList.find((r) => r.name === relation.child.name)!;
			relationItem.isJunctionTable = true;
		}
	}

	const result = parentList
		.map((r, index) => ({ r, index })) //keep index
		.filter(({ r }) => r.isJunctionTable === false)
		.map(({ r, index }) => {
			const relationFields = relations
				.filter((r2) => r2.parent.name === r.name || (r.alias !== '' && r2.parent.alias === r.alias))
				.map((relation) => {
					//relation many always have not null array (possible empty)
					const nullable =
						relation.cardinality === 'one' &&
						columns.some((c) => (c.table === relation.child.name || c.table === relation.child.alias) && c.notNull === false);

					const field: ModelColumn = {
						type: 'relation',
						name: getRelationName(relation),
						cardinality: relation.cardinality,
						notNull: !nullable
					};
					return field;
				});

			const previousRelation = parentList[index - 1];
			const junctionRelation = previousRelation?.isJunctionTable ? previousRelation : undefined;

			const fields: ModelColumn[] = columns
				.map((col, index) => ({ col, index })) //keep index
				.filter(
					({ col }) =>
						col.table === r.name ||
						col.table === r.alias ||
						(junctionRelation != null && (col.table === junctionRelation?.name || col.table === junctionRelation?.alias))
				)
				.map(({ col, index }) => {
					const f: ModelColumn = {
						type: 'field',
						name: col.name,
						index: index
					};
					return f;
				});

			const relationInfo: RelationInfo = {
				name: r.asSymbol ? r.alias : r.name,
				// tableName: r.name,
				// tableAlias: r.alias,
				groupKeyIndex: columns.findIndex((col) => col.table === r.name || col.table === r.alias),
				columns: fields.concat(relationFields)
			};
			return relationInfo;
		});
	return result;
}

function getRelationName(relation: Relation) {
	if (relation.isJunctionTable) {
		return relation.junctionChildTable;
	}
	if (relation.child.asSymbol) {
		return relation.child.alias;
	}
	return relation.child.name;
}

function getParentRelations(onExpr: ExprContext, currentRelation: TableName, parentList: TableName[]) {
	const result: TableName[] = [];
	const tokens = getOnClauseTokens(onExpr);
	for (const token of tokens) {
		if (token instanceof SimpleExprColumnRefContext) {
			const fieldName = splitName(token.getText());
			if (fieldName.prefix !== currentRelation.alias && fieldName.prefix !== currentRelation.name) {
				const ref = parentList.find((p) => p.name === fieldName.prefix || p.alias === fieldName.prefix)!;
				result.push(ref);
			}
		}
	}
	return result;
}

function getTableInfoFromTableJoinedTable(joinedTable: JoinedTableContext): TableName {
	const onClause = joinedTable.expr();
	const tableRef = joinedTable.tableReference();
	if (tableRef) {
		const tableFactor = tableRef.tableFactor();
		if (tableFactor) {
			const relationInfo = getTableInfoFromTableFactor(tableFactor);
			return relationInfo;
		}
	}
	throw Error('getTableInfoFromTableJoinedTable');
}

function getTableInfoFromTableFactor(tableFactor: TableFactorContext): TableName {
	const singleTable = tableFactor.singleTable();
	if (singleTable) {
		const table = singleTable.tableRef().getText();
		const tableAlias = singleTable?.tableAlias()?.identifier().getText() || '';
		const asSymbol = singleTable?.tableAlias()?.AS_SYMBOL() != null;
		const tableName = splitName(table);
		const model: TableName = {
			name: tableName.name,
			alias: tableAlias,
			asSymbol,
			isJunctionTable: false //will be checked later
		};
		return model;
	}
	throw Error('createModelFromTableFactor');
}

function isJunctionTable(relation: Relation, relations: Relation[]): [boolean, string] {
	const parentRelation = relations.find((r) => r.child === relation.parent);
	const childRelation = relations.find((r) => r.parent === relation.child);
	const childRelationCardinality = childRelation?.cardinality;
	const isJunctionTable = (parentRelation == null || parentRelation.cardinality === 'one') && childRelationCardinality === 'one';
	return [isJunctionTable, childRelation?.child.name!];
}

function verifyCardinality(expr: ExprContext, dbSchema: ColumnSchema[], tableName: string): Cardinality {
	const tokens = getOnClauseTokens(expr);
	for (const token of tokens) {
		if (token instanceof SimpleExprColumnRefContext) {
			const fieldName = splitName(token.getText());
			const column = findColumnSchema(tableName, fieldName.name, dbSchema);
			if (column != null && column.columnKey !== 'PRI' && column.columnKey !== 'UNI') {
				return 'many';
			}
		}
	}
	return 'one';
}

function getOnClauseTokens(expr: ExprContext) {
	const tokens = getSimpleExpressions(expr);
	return tokens;
}
