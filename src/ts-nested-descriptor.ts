import { Field, Model, ModelColumn } from "./describe-nested-query";
import { TsType, converToTsType } from "./mysql-mapping";
import { ColumnInfo } from "./mysql-query-analyzer/types";

export type TsField = {
    type: 'field';
    name: string;
    tsType: TsType;
    notNull: boolean;
}

export type TsRelationField = {
    type: 'relation';
    name: string;
    tsType: string;
    notNull: boolean;
}

export type FieldType = TsField | TsRelationField;

export type RelationType = {
    name: string;
    fields: TsField[];
}

export type NestedTsDescriptor = {
    name: string;
    tsType: string;
    fields: FieldType[];
    notNull: boolean;
    relations: RelationType[];
}

export function createNestedTsDescriptor(columns: ColumnInfo[], model: Model): NestedTsDescriptor {
    const result: NestedTsDescriptor = {
        name: model.name,
        notNull: true,
        tsType: model.name,
        fields: model.columns.map(col => mapColumnToNestedField(columns, col)),
        relations: mapToRelationList(columns, model.columns)
    }
    return result;
}

function mapColumnToNestedField(columns: ColumnInfo[], modelColumn: ModelColumn): TsField | TsRelationField {
    const modelType = modelColumn.type;

    if (modelType == 'field') {
        return mapModelColumnToTsField(columns, modelColumn);
    }
    else if (modelType == 'relation') {
        return mapModelColumnToTsRelation(modelColumn);
    }
    return modelType satisfies never;
}

function mapModelColumnToTsField(columns: ColumnInfo[], modelColumn: Field): TsField {
    const column = columns.find(col => col.columnName == modelColumn.name)!;
    const tsType = converToTsType(column.type);

    const field: TsField = {
        type: "field",
        name: modelColumn.name,
        tsType: tsType,
        notNull: column.notNull
    }
    return field;
}

function mapModelColumnToTsRelation(modelColumn: ModelColumn): TsRelationField {

    const field: TsRelationField = {
        type: 'relation',
        name: modelColumn.name,
        tsType: modelColumn.name,
        notNull: true
    }
    return field;
}
function mapToRelationList(columnsInfo: ColumnInfo[], columns: ModelColumn[]): RelationType[] {
    const allRelations = flattenRelations(columns);

    return allRelations.filter(r => r.columns.length > 0).map(relation => {
        const type: RelationType = {
            name: relation.name,
            //https://stackoverflow.com/a/54317362
            fields: relation.columns.filter((c): c is Field => c.type == 'field').map(c => {
                return mapModelColumnToTsField(columnsInfo, c)
            })
        }
        return type;
    });
}

//https://stackoverflow.com/a/34757676
function flattenRelations(columns: ModelColumn[], ret: Model[] = []) {
    for (const column of columns) {
        if (column.type == 'relation') {
            flattenRelations(column.columns, ret);
            ret.push(column);
        }
    }
    return ret;
}