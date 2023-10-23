import { ExprContext, JoinedTableContext, QueryContext, SimpleExprColumnRefContext, TableFactorContext, TableReferenceContext } from "ts-mysql-parser";
import { extractQueryInfo, parse } from "./mysql-query-analyzer/parse";
import { findColumnSchema, getSimpleExpressions, splitName } from "./mysql-query-analyzer/select-columns";
import { ColumnInfo, ColumnSchema } from "./mysql-query-analyzer/types";

export type NestedResultInfo = {
    relations: RelationInfo[];
}

export type RelationInfo = {
    name: string;
    tableName: string;
    tableAlias: string | '';
    columns: ModelColumn[];
}

export type Cardinality = 'one' | 'many' | '';

export type ModelColumn = Field | RelationField;

export type Field = {
    type: 'field',
    name: string;
}

export type RelationField = {
    type: 'relation',
    name: string;
    cardinality: Cardinality;
}

export type TableName = {
    name: string;
    alias: string | '';
}

//utility for tests
export function describeNestedQuery(sql: string, dbSchema: ColumnSchema[]): NestedResultInfo {
    const queryContext = parse(sql);
    const queryInfo = extractQueryInfo(sql, dbSchema);
    const columns = queryInfo.kind == 'Select' ? queryInfo.columns : [];
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
                        const tableReferences = fromClause.tableReferenceList()?.tableReference() || [];
                        const modelColumns = tableReferences.map(tableRef => {
                            const nestedResultInfo: NestedResultInfo = {
                                relations: getResult(tableRef, dbSchema, columns)
                            };
                            return nestedResultInfo;
                        })
                        return modelColumns[0];
                    }
                }

            }

        }
    }
    throw Error('generateNestedInfo')
}

type Relation = {
    parent: TableName;
    child: TableName;
    cardinality: Cardinality;
}

function getResult(tableRef: TableReferenceContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]) {
    const relations = getRelations(tableRef, dbSchema, columns);
    return relations;
}

function getRelations(tableRef: TableReferenceContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]) {
    const relations: Relation[] = [];
    const tableFactor = tableRef.tableFactor();
    const parentList: TableName[] = [];
    if (tableFactor != null) { //root
        const tableName = getTableInfoFromTableFactor(tableFactor);
        parentList.push(tableName);
    }
    const joinedTableList = tableRef.joinedTable();
    joinedTableList.forEach(joined => {
        const onClause = joined.expr();
        const tableName = getTableInfoFromTableJoinedTable(joined);
        const parentRelations = onClause ? getParentRelations(onClause, tableName, parentList) : [];
        const cardinality = onClause ? verifyCardinality(onClause, dbSchema, tableName.name) : '';
        parentList.push(tableName);
        parentRelations.forEach(parent => {
            relations.push({
                parent: parent,
                child: tableName,
                cardinality
            })
        })
    })
    const result = parentList.map(r => {
        const relationFields = relations.filter(r2 => r2.parent.name == r.name || r2.parent.alias == r.alias).map(f => {
            const field: ModelColumn = {
                type: 'relation',
                name: f.child.alias,
                cardinality: f.cardinality,
            }
            return field;
        })
        const fields: ModelColumn[] = columns.filter(field => field.table == r.name || field.table == r.alias).map(c => {
            const f: ModelColumn = {
                type: 'field',
                name: c.columnName
            }
            return f;
        });
        const relationInfo: RelationInfo = {
            name: r.alias,
            tableName: r.name,
            tableAlias: r.alias,
            columns: fields.concat(relationFields)
        }
        return relationInfo;
    })
    return result;
}

function getParentRelations(onExpr: ExprContext, currentRelation: TableName, parentList: TableName[]) {
    const result: TableName[] = [];
    const tokens = getOnClauseTokens(onExpr);
    for (const token of tokens) {
        if (token instanceof SimpleExprColumnRefContext) {
            const fieldName = splitName(token.text);
            if (fieldName.prefix != currentRelation.alias && fieldName.prefix != currentRelation.name) {
                const ref = parentList.find(p => p.name == fieldName.prefix || p.alias == fieldName.prefix)!;
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
    throw Error('getTableInfoFromTableJoinedTable')
}


function getTableInfoFromTableFactor(tableFactor: TableFactorContext): TableName {
    const singleTable = tableFactor.singleTable();
    if (singleTable) {
        const table = singleTable.tableRef().text;
        const tableAlias = singleTable?.tableAlias()?.identifier().text || '';
        const tableName = splitName(table);
        const model: TableName = {
            name: tableName.name,
            alias: tableAlias
        }
        return model;
    }
    throw Error('createModelFromTableFactor')
}

function verifyCardinality(expr: ExprContext, dbSchema: ColumnSchema[], tableName: string): Cardinality {
    const tokens = getOnClauseTokens(expr);
    for (const token of tokens) {
        if (token instanceof SimpleExprColumnRefContext) {

            const fieldName = splitName(token.text);
            const column = findColumnSchema(tableName, fieldName.name, dbSchema);
            if (column != null && column.columnKey != 'PRI' && column.columnKey != 'UNI') {
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