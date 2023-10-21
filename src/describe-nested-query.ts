import { ExprContext, JoinedTableContext, QueryContext, SimpleExprColumnRefContext, TableFactorContext, TableReferenceContext } from "ts-mysql-parser";
import { extractQueryInfo, parse } from "./mysql-query-analyzer/parse";
import { findColumnSchema, getSimpleExpressions, splitName } from "./mysql-query-analyzer/select-columns";
import { ColumnInfo, ColumnSchema } from "./mysql-query-analyzer/types";
import partition from "lodash.partition";

export type NestedResultInfo = {
    relations: RelationInfo[];
}

export type RelationInfo = {
    name: string;
    tableName: string;
    tableAlias: string | '';
    cardinality: Cardinality;
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
                        const nestedResultInfo: NestedResultInfo = {
                            relations: []
                        };
                        const modelColumns = tableReferences.map(tableRef => {
                            createRelationInfoFromTabRef(tableRef, dbSchema, columns, nestedResultInfo); //root
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

function createRelationInfoFromTabRef(tableRef: TableReferenceContext, dbSchema: ColumnSchema[], columns: ColumnInfo[], nestedResult: NestedResultInfo): RelationInfo {

    const tableFactor = tableRef.tableFactor();
    const parentRelationInfo = tableFactor ? createRelationInfoFromTableFactor(tableFactor, columns, 'one') : null; //root;

    if (parentRelationInfo == null) {
        throw Error('createModelFromTableFactor')
    }

    const joinedTableList = tableRef.joinedTable();
    if (joinedTableList.length > 0) {
        createRelationInfoFromJoinedList(joinedTableList, parentRelationInfo, dbSchema, columns, nestedResult);
    }
    return parentRelationInfo;
}

function createRelationInfoFromTableFactor(tableFactor: TableFactorContext, columns: ColumnInfo[], cardinality: Cardinality): RelationInfo {
    const singleTable = tableFactor.singleTable();
    if (singleTable) {
        const table = singleTable.tableRef().text;
        const tableAlias = singleTable?.tableAlias()?.identifier().text || '';
        const tableName = splitName(table);
        const tableColumns = columns.filter(col => col.table == tableName.name || col.table == tableAlias)
        const modelColumns = tableColumns.map(col => {
            const field: Field = {
                type: 'field',
                name: col.columnName
            }
            return field;
        })
        const model: RelationInfo = {
            cardinality,
            name: tableAlias || tableName.name,
            tableName: tableName.name,
            tableAlias: tableAlias,
            columns: modelColumns
        }
        return model;
    }
    throw Error('createModelFromTableFactor')
}

function createRelationInfoFromJoinedList(joinedTables: JoinedTableContext[], parentModel: RelationInfo, dbSchema: ColumnSchema[], columns: ColumnInfo[], nestedResult: NestedResultInfo) {
    const relation: TableName = {
        name: parentModel?.tableName || '',
        alias: parentModel?.tableAlias || '',
    };
    nestedResult.relations.push(parentModel);
    const { currentLevel, remaining } = getRelationsByLevel(joinedTables, relation);

    if (joinedTables.length >= 1) {
        currentLevel.forEach(joined => {
            const relationInfo = createRelationInfoFromJoined(joined, parentModel, dbSchema, columns, nestedResult);
            if (parentModel) {
                parentModel.columns.push({
                    type: 'relation',
                    name: relationInfo.name,
                    cardinality: relationInfo.cardinality
                });

            }
            createRelationInfoFromJoinedList(remaining, relationInfo, dbSchema, columns, nestedResult);
        })
    }
}

type PartitionJoinedContext = {
    currentLevel: JoinedTableContext[];
    remaining: JoinedTableContext[];
}

function getRelationsByLevel(joinedTables: JoinedTableContext[], relation: TableName): PartitionJoinedContext {
    //https://stackoverflow.com/posts/36808767/edit (partition function)
    const [currentLevel, remaining] = partition(joinedTables, joined => {
        const onClause = joined.expr();
        if (onClause && includeRelation(joined, relation)) {
            return true;
        }
        return false;
    });

    // const currentLevel = joinedTables.filter(joined => {
    //     const onClause = joined.expr();
    //     if (onClause && includeRelation(onClause, relation)) {
    //         return true;
    //     }
    //     return false;
    // });

    // const remaining = joinedTables.filter(joined => {
    //     const onClause = joined.expr();
    //     if (onClause && !includeRelation(onClause, relation)) {
    //         return true;
    //     }
    // });
    const result: PartitionJoinedContext = {
        currentLevel,
        remaining
    }
    return result;
}

function createRelationInfoFromJoined(joinedTable: JoinedTableContext, parentModel: RelationInfo | null, dbSchema: ColumnSchema[], columns: ColumnInfo[], nestedResult: NestedResultInfo): RelationInfo {
    const onClause = joinedTable.expr();
    const tableRef = joinedTable.tableReference();
    if (tableRef) {
        const relationInfo = createRelationInfoFromTabRef(tableRef, dbSchema, columns, nestedResult);
        const cardinality = onClause ? verifyCardinality(onClause, dbSchema, relationInfo.tableName) : '';
        relationInfo.cardinality = cardinality;
        return relationInfo;
    }
    throw Error('createModelFromJoined')

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

function includeRelation(onClause: ExprContext, tableName: TableName) {
    const tokens = getOnClauseTokens(onClause);
    for (const token of tokens) {
        if (token instanceof SimpleExprColumnRefContext) {
            const tableRef = splitName(token.text);
            if (tableName.name == tableRef.prefix || tableName.alias == tableRef.prefix) {
                return true;
            }
        }
    }
    return false;
}