import { Cardinality } from "../describe-nested-query";
import { ColumnInfo } from "../mysql-query-analyzer/types";

export type Relation2 = {
	name: string;
	alias: string;
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
	cardinality: Cardinality;
}

export type NestedRelation = {
	name: string;
	alias: string;
	fields: Field2[];
	relations?: NestedRelation[];
}

export function describeNestedQuery(columns: ColumnInfo[], relations: Relation2[]): RelationInfo2[] {
	const result = relations.map((relation) => {
		const relationInfo: RelationInfo2 = {
			name: relation.name,
			alias: relation.alias,
			fields: columns
				.map((item, index) => ({ item, index }))
				.filter(col => col.item.table == relation.name || col.item.table == relation.alias)
				.map(col => ({ name: col.item.columnName, index: col.index })),
			relations: relations.filter(child => child.parentRelation == relation.name || (relation.alias != '' && child.parentRelation == relation.alias)).map(relation => ({ name: relation.name, alias: relation.alias, cardinality: relation.cardinality }))
		}
		return relationInfo;
	})
	return result;
}