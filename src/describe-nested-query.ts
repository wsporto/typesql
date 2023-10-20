import { ExprContext, JoinedTableContext, QueryContext, SimpleExprColumnRefContext, TableFactorContext, TableReferenceContext } from "ts-mysql-parser";
import { extractQueryInfo, parse } from "./mysql-query-analyzer/parse";
import { findColumnSchema, getSimpleExpressions, splitName } from "./mysql-query-analyzer/select-columns";
import { ColumnInfo, ColumnSchema } from "./mysql-query-analyzer/types";
import partition from "lodash.partition";


export type Model = {
    type: 'relation',
    name: string;
    tableName: string;
    tableAlias: string | '';
    cardinality: Cardinality;
    columns: ModelColumn[];
}

export type Cardinality = 'one' | 'many' | '';

export type ModelColumn = Model | Field;

export type Field = {
    type: 'field',
    name: string;
}

export type TableName = {
    name: string;
    alias: string | '';
}

//utility for tests
export function describeNestedQuery(sql: string, dbSchema: ColumnSchema[]): Model {
    const queryContext = parse(sql);
    const queryInfo = extractQueryInfo(sql, dbSchema);
    const columns = queryInfo.kind == 'Select' ? queryInfo.columns : [];
    return generateNestedInfo(queryContext, dbSchema, columns);
}

export function generateNestedInfo(queryContext: QueryContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]) {

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
                            const model = createModelFromTabRef(tableRef, dbSchema, columns); //root
                            return model;
                        })
                        return modelColumns[0];
                    }
                }

            }

        }
    }
    return {} as Model;
}

function createModelFromTabRef(tableRef: TableReferenceContext, dbSchema: ColumnSchema[], columns: ColumnInfo[]): Model {

    const tableFactor = tableRef.tableFactor();
    const parentModel = tableFactor ? createModelFromTableFactor(tableFactor, columns, 'one') : null; //root;

    const joinedTableList = tableRef.joinedTable();
    if (joinedTableList.length > 0) {
        createModelFromJoinedList(joinedTableList, parentModel, dbSchema, columns);
    }
    if (parentModel == null) {
        throw Error("createModelFromTabRef");
    }
    return parentModel;
}

function createModelFromTableFactor(tableFactor: TableFactorContext, columns: ColumnInfo[], cardinality: Cardinality): Model {
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
        const model: Model = {
            type: 'relation',
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

function createModelFromJoinedList(joinedTables: JoinedTableContext[], parentModel: Model | null, dbSchema: ColumnSchema[], columns: ColumnInfo[]) {
    const relation: TableName = {
        name: parentModel?.tableName || '',
        alias: parentModel?.tableAlias || '',
    };
    const { currentLevel, remaining } = getRelationsByLevel(joinedTables, relation);

    if (joinedTables.length >= 1) {
        currentLevel.forEach(joined => {
            const joinedModel = createModelFromJoined(joined, parentModel, dbSchema, columns);
            if (parentModel) {
                parentModel.columns.push(joinedModel);
            }
            createModelFromJoinedList(remaining, joinedModel, dbSchema, columns);
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

function createModelFromJoined(joinedTable: JoinedTableContext, parentModel: Model | null, dbSchema: ColumnSchema[], columns: ColumnInfo[]): Model {
    const onClause = joinedTable.expr();
    const tableRef = joinedTable.tableReference();
    if (tableRef) {
        const joinedModel = createModelFromTabRef(tableRef, dbSchema, columns);
        const cardinality = onClause ? verifyCardinality(onClause, dbSchema, joinedModel.tableName) : '';
        joinedModel.cardinality = cardinality;
        return joinedModel;
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