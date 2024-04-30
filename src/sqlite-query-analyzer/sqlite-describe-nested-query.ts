import { Cardinality } from "../describe-nested-query";
import { ColumnInfo } from "../mysql-query-analyzer/types";

export type Relation2 = {
	name: string;
	alias: string;
	joinColumn: string;
	parentRelation: string;
	cardinality: Cardinality;
}

export type RelationInfo2 = {
	name: string;
	alias: string;
	fields: Field2[];
	relations: RelationField2[];
}

export type Field2 = {
	name: string;
	index: number;
}

export type RelationField2 = {
	name: string;
	alias: string;
	joinColumn: string;
	cardinality: Cardinality;
}

export type NestedRelation = {
	name: string;
	alias: string;
	fields: Field2[];
	relations?: NestedRelation[];
}

export function describeNestedQuery(columns: ColumnInfo[], relations: Relation2[]): RelationInfo2[] {
	const isJunctionTableMap = new Map<string, boolean>();
	const parentRef = new Map<string, Relation2>();
	relations.forEach(relation => {
		const isJunctionTableResult = isJunctionTable(relation, relations);
		const relationId = relation.alias || relation.name;
		isJunctionTableMap.set(relationId, isJunctionTableResult);
		parentRef.set(relationId, relation);
	})
	const filterJunctionTables = relations.filter(relation => !isJunctionTableMap.get(relation.alias || relation.name));

	const result = filterJunctionTables.map((relation, index) => {
		const parent = isJunctionTableMap.get(relation.parentRelation) ? parentRef.get(relation.parentRelation) : undefined;

		const relationInfo: RelationInfo2 = {
			name: relation.name,
			alias: relation.alias,
			fields: columns
				.map((item, index) => ({ item, index }))
				.filter(col => parent != null && (col.item.table == parent.name || col.item.table == parent.alias)
					|| col.item.table == relation.name || col.item.table == relation.alias
				)
				.map(col => ({ name: col.item.columnName, index: col.index })),
			relations: filterJunctionTables.slice(index + 1).filter(child => {
				const parent = isJunctionTableMap.get(child.parentRelation) ? parentRef.get(child.parentRelation)! : relation;
				return child.parentRelation == parent.name || (child.alias != '' && child.parentRelation == parent.alias)
			})
				.map(relation => (
					{
						name: relation.name,
						alias: relation.alias,
						cardinality: isJunctionTableMap.get(relation.parentRelation) ? 'many' : relation.cardinality,
						joinColumn: isJunctionTableMap.get(relation.parentRelation) ? parentRef.get(relation.parentRelation)?.joinColumn! : relation.joinColumn
					}
				))
		}
		return relationInfo;
	})
	return result;
}

function isJunctionTable(relation: Relation2, relations: Relation2[]): boolean {
	const parentRelation = relations.find(r => r.name == relation.parentRelation || (r.alias != '' && r.alias == relation.parentRelation));
	const childRelation = relations.find(r => r.parentRelation == relation.name || (r.alias != '' && r.parentRelation == relation.alias));
	const isJunctionTable = relation.parentRelation != '' && parentRelation?.cardinality == 'one' && childRelation?.cardinality == 'one';
	return isJunctionTable
}