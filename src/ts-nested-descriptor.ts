import type { Field, RelationInfo, NestedResultInfo, RelationField } from './describe-nested-query';
import { type MySqlType, type TsType, converToTsType } from './mysql-mapping';
import type { ColumnInfo } from './mysql-query-analyzer/types';
import type { RelationField2 } from './sqlite-query-analyzer/sqlite-describe-nested-query';

export type TsField = {
	type: 'field';
	name: string;
	index: number;
	tsType: TsType;
	notNull: boolean;
};

export type TsField2 = {
	name: string;
	index: number;
	tsType: TsType;
	notNull: boolean;
};

export type TsRelationField = {
	type: 'relation';
	list: boolean;
	name: string;
	tsType: string;
	notNull: boolean;
};

export type TsRelationField2 = {
	list: boolean;
	name: string;
	tsType: string;
	notNull: boolean;
};

export type FieldType = TsField | TsRelationField;

export type RelationType = {
	name: string;
	groupKeyIndex: number;
	fields: FieldType[];
};

export type RelationType2 = {
	name: string;
	groupIndex: number;
	fields: TsField2[];
	relations: TsRelationField2[];
};

export type NestedTsDescriptor = {
	relations: RelationType[];
};

export type NestedTsDescriptor2 = {
	relations: RelationType2[];
};

export function createNestedTsDescriptor(columns: ColumnInfo[], nestedResultInfo: NestedResultInfo): NestedTsDescriptor {
	const result: NestedTsDescriptor = {
		relations: nestedResultInfo.relations.map((r) => mapColumnToNestedField(columns, r))
	};
	return result;
}

function mapColumnToNestedField(columns: ColumnInfo[], modelColumn: RelationInfo): RelationType {
	const relation: RelationType = {
		name: modelColumn.name,
		groupKeyIndex: modelColumn.groupKeyIndex,
		fields: modelColumn.columns.map((c) => mapToField(columns, c))
	};
	return relation;
}

function mapToField(columns: ColumnInfo[], field: Field | RelationField): FieldType {
	const fieldType = field.type;
	if (fieldType === 'field') {
		return mapModelColumnToTsField(columns, field);
	}
	if (fieldType === 'relation') {
		return mapModelColumnToTsRelation(field);
	}
	return fieldType satisfies never;
}

function mapModelColumnToTsField(columns: ColumnInfo[], modelColumn: Field): TsField {
	const column = columns.find((col) => col.columnName === modelColumn.name)!;
	const tsType = converToTsType(column.type as MySqlType);

	const field: TsField = {
		type: 'field',
		name: modelColumn.name,
		index: modelColumn.index,
		tsType: tsType,
		notNull: column.notNull
	};
	return field;
}

function mapModelColumnToTsRelation(modelColumn: RelationField): TsRelationField {
	const field: TsRelationField = {
		type: 'relation',
		list: modelColumn.cardinality === 'many',
		name: modelColumn.name,
		tsType: modelColumn.name + (modelColumn.cardinality === 'many' ? '[]' : ''),
		notNull: modelColumn.notNull
	};
	return field;
}

export function mapToTsRelation2(relationField: RelationField2): TsRelationField2 {
	const field: TsRelationField2 = {
		list: relationField.cardinality === 'many',
		name: relationField.name,
		tsType: relationField.name + (relationField.cardinality === 'many' ? '[]' : ''),
		notNull: true
	};
	return field;
}

// function mapToRelationList(columnsInfo: ColumnInfo[], columns: ModelColumn[]): RelationType[] {
//     const allRelations = flattenRelations(columns);

//     return allRelations.filter(r => r.columns.length > 0).map(relation => {
//         const type: RelationType = {
//             name: relation.name,
//             //https://stackoverflow.com/a/54317362
//             fields: relation.columns.filter((c): c is Field => c.type == 'field').map(c => {
//                 return mapModelColumnToTsField(columnsInfo, c)
//             })
//         }
//         return type;
//     });
// }

// //https://stackoverflow.com/a/34757676
// function flattenRelations(columns: ModelColumn[], ret: Model[] = []) {
//     for (const column of columns) {
//         if (column.type == 'relation') {
//             flattenRelations(column.columns, ret);
//             ret.push(column);
//         }
//     }
//     return ret;
// }
