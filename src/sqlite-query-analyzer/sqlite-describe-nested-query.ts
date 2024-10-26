import { type Either, left, right } from 'fp-ts/lib/Either';
import type { Cardinality } from '../describe-nested-query';
import type { ColumnInfo } from '../mysql-query-analyzer/types';
import type { TypeSqlError } from '../types';

export type Relation2 = {
	name: string;
	alias: string;
	joinColumn: string;
	parentRelation: string;
	cardinality: Cardinality;
	parentCardinality: Cardinality;
};

export type RelationInfo2 = {
	name: string;
	alias: string;
	fields: Field2[];
	groupIndex: number;
	relations: RelationField2[];
};

export type Field2 = {
	name: string;
	index: number;
};

export type RelationField2 = {
	name: string;
	alias: string;
	cardinality: Cardinality;
};

export type NestedRelation = {
	name: string;
	alias: string;
	fields: Field2[];
	relations?: NestedRelation[];
};

export function describeNestedQuery(columns: ColumnInfo[], relations: Relation2[]): Either<TypeSqlError, RelationInfo2[]> {
	const isJunctionTableMap = new Map<string, boolean>();
	const parentRef = new Map<string, Relation2>();
	for (const relation of relations) {
		const isJunctionTableResult = isJunctionTable(relation, relations, columns);
		const relationId = relation.alias || relation.name;
		isJunctionTableMap.set(relationId, isJunctionTableResult);
		parentRef.set(relationId, relation);
	}
	const filterJunctionTables = relations.filter((relation) => !isJunctionTableMap.get(relation.alias || relation.name));
	const result: RelationInfo2[] = [];

	for (const [index, relation] of filterJunctionTables.entries()) {
		const parent = isJunctionTableMap.get(relation.parentRelation) ? parentRef.get(relation.parentRelation) : undefined;
		const groupIndex = columns.findIndex(
			(col) => col.columnName === relation.joinColumn && (col.table === relation.name || col.table === relation.alias)
		);
		if (groupIndex === -1) {
			const error: TypeSqlError = {
				name: 'Error during nested result creation',
				description: `Must select the join column: ${relation.alias || relation.name}.${relation.joinColumn}`
			};
			return left(error);
		}

		const relationInfo: RelationInfo2 = {
			groupIndex: groupIndex,
			name: relation.name,
			alias: relation.alias,
			fields: columns
				.map((item, index) => ({ item, index }))
				.filter(
					(col) =>
						(parent != null && (col.item.table === parent.name || col.item.table === parent.alias)) ||
						col.item.table === relation.name ||
						col.item.table === relation.alias ||
						(relation.parentRelation === '' && col.item.table === '')
				)
				.map((col) => ({ name: col.item.columnName, index: col.index })),
			relations: filterJunctionTables
				.slice(index + 1)
				.filter((child) => {
					const parent = isJunctionTableMap.get(child.parentRelation) ? parentRef.get(child.parentRelation)! : relation;
					return child.parentRelation === parent.name || (child.alias !== '' && child.parentRelation === parent.alias);
				})
				.map((relation) => ({
					name: relation.name,
					alias: relation.alias,
					cardinality: isJunctionTableMap.get(relation.parentRelation) ? 'many' : relation.cardinality
				}))
		};
		result.push(relationInfo);
	}
	return right(result);
}

function isJunctionTable(relation: Relation2, relations: Relation2[], columns: ColumnInfo[]): boolean {
	const childRelation = relations.find(
		(r) => r.parentRelation === relation.name || (r.alias !== '' && r.parentRelation === relation.alias)
	);
	const isJunctionTable = relation.cardinality === 'many' && childRelation?.parentCardinality === 'many';
	return isJunctionTable && notIncludeRelationColumns(columns, relation);
}

function notIncludeRelationColumns(columns: ColumnInfo[], relation: Relation2): boolean {
	const relationColumns = columns.filter(col => col.table === relation.name || col.table === relation.alias);
	return relationColumns.length === 0;
}
