import { ParserRuleContext, RuleContext } from "antlr4ts";
import { ParseTree } from "antlr4ts/tree";
import { Interval } from "antlr4ts/misc/Interval";

import {
    QuerySpecificationContext, TableReferenceContext, TableFactorContext, TableReferenceListParensContext, SingleTableParensContext,
    JoinedTableContext, SingleTableContext, SimpleExprLiteralContext, SimpleExprColumnRefContext, SimpleExprListContext, SimpleExprVariableContext,
    SimpleExprRuntimeFunctionContext, SimpleExprFunctionContext, SimpleExprCollateContext, SimpleExprParamMarkerContext, SimpleExprSumContext,
    SimpleExprGroupingOperationContext, SimpleExprWindowingFunctionContext, SimpleExprConcatContext, SimpleExprUnaryContext, SimpleExprNotContext,
    SimpleExprSubQueryContext, SimpleExprOdbcContext, SimpleExprMatchContext, SimpleExprBinaryContext, SimpleExprCastContext, SimpleExprCaseContext,
    SimpleExprConvertContext, SimpleExprConvertUsingContext, SimpleExprDefaultContext, SimpleExprValuesContext, SimpleExprIntervalContext, SubqueryContext
} from "ts-mysql-parser";

import { ColumnSchema, ColumnDef, FieldName } from "./types";
import { analiseQuery, getQuerySpecificationsFromSelectStatement } from "./parse";
import { possibleNull } from "./infer-column-nullability";
import { InferenceContext } from "./collect-constraints";

export function filterColumns(dbSchema: ColumnSchema[], withSchema: ColumnSchema[], tableAlias: string | undefined, table: FieldName) {
    const tableColumns1 = dbSchema.filter(schema => schema.table.toLowerCase() == table.name.toLowerCase() && (schema.schema == table.prefix || table.prefix == ''));
    const tableColumns = [...tableColumns1, ...withSchema]
    return tableColumns.map(tableColumn => {

        //name and colum are the same on the leaf table
        const r: ColumnDef = {
            columnName: tableColumn.column, column: tableColumn.column, columnType: tableColumn.column_type,
            notNull: tableColumn.notNull, table: table.name, tableAlias: tableAlias || '', columnKey: tableColumn.columnKey
        }
        return r;

    })
}

export function selectAllColumns(tablePrefix: string, fromColumns: ColumnDef[]) {
    const allColumns: ColumnDef[] = [];
    fromColumns.forEach(column => {
        if (tablePrefix == '' || tablePrefix == column.tableAlias || tablePrefix == column.table) {
            allColumns.push(column);
        }

    });
    return allColumns;
}

export function getColumnNames(querySpec: QuerySpecificationContext, fromColumns: ColumnDef[]): string[] {
    const allColumns: string[] = [];

    if (querySpec.selectItemList().MULT_OPERATOR()) {
        allColumns.push(...selectAllColumns('', fromColumns).map(col => col.columnName));
    }
    const ctx = querySpec.selectItemList();
    ctx.selectItem().forEach(selectItem => {

        const tableWild = selectItem.tableWild();
        if (tableWild) {
            if (tableWild.MULT_OPERATOR()) {
                const itemName = splitName(selectItem.text);
                allColumns.push(...selectAllColumns(itemName.prefix, fromColumns).map(col => col.columnName));
            }

        }
        else {
            const alias = selectItem.selectAlias()?.identifier()?.text;
            const tokens = getSimpleExpressions(selectItem);
            let columnName = extractOriginalSql(selectItem.expr()!)!; //TODO VERIFICAR NULL
            if (tokens.length == 1 && tokens[0] instanceof SimpleExprColumnRefContext) {
                columnName = splitName(tokens[0].text).name;
            }
            allColumns.push(alias || columnName)
        }

    })
    return allColumns;
}

// TODO - withSchema: ColumnSchema[] DEFAULT VALUE []
export function getColumnsFrom(ctx: QuerySpecificationContext, dbSchema: ColumnSchema[], withSchema: ColumnSchema[]) {
    const tableReferences = ctx.fromClause()?.tableReferenceList()?.tableReference();
    const fromColumns = tableReferences ? extractColumnsFromTableReferences(tableReferences, dbSchema, withSchema) : [];
    return fromColumns;
}

//rule: tableReference
function extractColumnsFromTableReferences(tablesReferences: TableReferenceContext[], dbSchema: ColumnSchema[], withSchema: ColumnSchema[]): ColumnDef[] {
    const result: ColumnDef[] = [];

    tablesReferences.forEach(tab => {

        const tableFactor = tab.tableFactor();
        if (tableFactor) {
            const fields = extractFieldsFromTableFactor(tableFactor, dbSchema, withSchema);
            result.push(...fields);
        }

        const allJoinedColumns: ColumnDef[][] = [];
        let firstLeftJoinIndex = -1;
        tab.joinedTable().forEach((joined, index) => {
            if (joined.innerJoinType()?.INNER_SYMBOL() || joined.innerJoinType()?.JOIN_SYMBOL()) {
                firstLeftJoinIndex = -1; //dont need to add notNull = false to joins
            }
            else if (firstLeftJoinIndex == -1) {
                firstLeftJoinIndex = index; //add notNull = false to all joins after the first left join
            }

            const tableReferences = joined.tableReference();
            const onClause = joined.expr(); //ON expr

            if (tableReferences) {
                const usingFields = extractFieldsFromUsingClause(joined);
                const joinedFields = extractColumnsFromTableReferences([tableReferences], dbSchema, withSchema);
                //doesn't duplicate the fields of the USING clause. Ex. INNER JOIN mytable2 USING(id);
                const joinedFieldsFiltered = usingFields.length > 0 ? filterUsingFields(joinedFields, usingFields) : joinedFields;
                if (onClause) {
                    joinedFieldsFiltered.forEach(field => {
                        const fieldName: FieldName = {
                            name: field.columnName,
                            prefix: field.tableAlias || ''
                        }
                        field.notNull = field.notNull || !possibleNull(fieldName, onClause);
                    })
                    //apply inference to the parent join too
                    result.forEach(field => {
                        const fieldName: FieldName = {
                            name: field.columnName,
                            prefix: field.tableAlias || ''
                        }
                        field.notNull = field.notNull || !possibleNull(fieldName, onClause);
                    })
                }

                allJoinedColumns.push(joinedFieldsFiltered);
            }
        })

        allJoinedColumns.forEach((joinedColumns, index) => {
            joinedColumns.forEach(field => {
                if (firstLeftJoinIndex != -1 && index >= firstLeftJoinIndex) {

                    const newField: ColumnDef = {
                        ...field,
                        notNull: false
                    }
                    result.push(newField);
                }
                else {
                    result.push(field);
                }

            })

        });

    })
    return result;
}

function extractFieldsFromUsingClause(joinedTableContext: JoinedTableContext): string[] {
    const usingFieldsClause = joinedTableContext.identifierListWithParentheses()?.identifierList();
    if (usingFieldsClause) {
        return usingFieldsClause.text.split(',').map(field => field.trim());
    }
    return [];
}

function filterUsingFields(joinedFields: ColumnDef[], usingFields: string[]) {
    return joinedFields.filter(joinedField => {
        const isUsing = usingFields.includes(joinedField.columnName);
        if (!isUsing) {
            return joinedField;
        }
    })
}

//rule: singleTable
function extractFieldsFromSingleTable(dbSchema: ColumnSchema[], withSchema: ColumnSchema[], ctx: SingleTableContext) {
    const table = ctx?.tableRef().text;
    const tableAlias = ctx?.tableAlias()?.identifier().text;
    const tableName = splitName(table);
    const fields = filterColumns(dbSchema, withSchema, tableAlias, tableName)
    return fields;
}

//rule: singleTableParens
function extractFieldsFromSingleTableParens(dbSchema: ColumnSchema[], withSchema: ColumnSchema[], ctx: SingleTableParensContext): ColumnDef[] {
    let fields: ColumnDef[] = [];
    //singleTable | singleTableParens
    const singleTable = ctx.singleTable();
    if (singleTable) {
        fields = extractFieldsFromSingleTable(dbSchema, withSchema, singleTable);
    }

    const singleTableParens = ctx.singleTableParens();
    if (singleTableParens) {
        fields = extractFieldsFromSingleTableParens(dbSchema, withSchema, singleTableParens);
    }
    return fields;

}

/*rule: 
tableFactor:
    singleTable
    | singleTableParens
    | derivedTable
    | tableReferenceListParens
    | {serverVersion >= 80004}? tableFunction 
*/
function extractFieldsFromTableFactor(tableFactor: TableFactorContext, dbSchema: ColumnSchema[], withSchema: ColumnSchema[]): ColumnDef[] { //tableFactor: rule
    const singleTable = tableFactor.singleTable();
    if (singleTable) {
        return extractFieldsFromSingleTable(dbSchema, withSchema, singleTable);
    }

    const singleTableParens = tableFactor.singleTableParens();
    if (singleTableParens) {
        return extractFieldsFromSingleTableParens(dbSchema, withSchema, singleTableParens);
    }

    const derivadTable = tableFactor.derivedTable();
    if (derivadTable) {
        //walkQueryExpressionParens(queryExpressionParens, namedNodes, constraints, dbSchema);
        //TODO - WALKSUBQUERY
        const subQuery = derivadTable.subquery()
        if (subQuery) {
            const tableAlias = derivadTable.tableAlias()?.identifier().text;
            return extractFieldsFromSubquery(subQuery, dbSchema, withSchema, tableAlias)
        }
    }
    const tableReferenceListParens = tableFactor.tableReferenceListParens();
    if (tableReferenceListParens) {
        const listParens = extractColumnsFromTableListParens(tableReferenceListParens, dbSchema, withSchema);
        return listParens;
    }

    return [];
}

export function analyzeSubQuery(subQuery: SubqueryContext, dbSchema: ColumnSchema[], withSchema: ColumnSchema[]) {
    const queries = getQuerySpecificationsFromSelectStatement(subQuery);
    const queryResult = analiseQuery(queries, dbSchema, withSchema, []); //TODO - WHY []?
    return queryResult;
}

function extractFieldsFromSubquery(subQuery: SubqueryContext, dbSchema: ColumnSchema[], withSchema: ColumnSchema[], tableAlias: string | undefined) {
    //subquery=true only for select (subquery); not for from(subquery)
    // const fromColumns
    const queryResult = analyzeSubQuery(subQuery, dbSchema, withSchema);
    // console.log("queryResult=", queryResult);
    // const tableAlias = derivadTable.tableAlias()?.text;
    return queryResult.columns.map(col => {
        const newCol: ColumnDef = {
            column: col.name,
            columnName: col.name,
            columnType: col.type,
            columnKey: '',
            notNull: col.notNull,
            table: tableAlias || '',
            tableAlias: tableAlias
        }
        return newCol;
    });
}


//tableReferenceList | tableReferenceListParens
function extractColumnsFromTableListParens(ctx: TableReferenceListParensContext, dbSchema: ColumnSchema[], withSchema: ColumnSchema[]): ColumnDef[] {

    const tableReferenceList = ctx.tableReferenceList();
    if (tableReferenceList) {
        return extractColumnsFromTableReferences(tableReferenceList.tableReference(), dbSchema, withSchema);
    }

    const tableReferenceListParens = ctx.tableReferenceListParens();

    if (tableReferenceListParens) {
        return extractColumnsFromTableListParens(tableReferenceListParens, dbSchema, withSchema);
    }

    return [];
}

export function splitName(fieldName: string): FieldName {
    const fieldNameSplit = fieldName.split('.');
    const result: FieldName = {
        name: fieldNameSplit.length == 2 ? fieldNameSplit[1] : fieldNameSplit[0],
        prefix: fieldNameSplit.length == 2 ? fieldNameSplit[0] : ''
    }
    const withoutStick: FieldName = {
        name: removeBackStick(result.name),
        prefix: result.prefix
    }
    return withoutStick;
}

function removeBackStick(name: string) {
    const withoutBackStick = name.startsWith("`") && name.endsWith("`") ? name.slice(1, -1) : name;
    return withoutBackStick;
}

const functionAlias: ColumnSchema[] = [
    {
        column: 'CURRENT_DATE',
        column_type: 'date',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''
    },
    {
        column: 'CURRENT_TIME',
        column_type: 'time',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'CURRENT_TIMESTAMP',
        column_type: 'timestamp',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'LOCALTIME',
        column_type: 'datetime',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    },
    {
        column: 'LOCALTIMESTAMP',
        column_type: 'datetime',
        columnKey: '',
        notNull: true,
        schema: '',
        table: ''

    }
]

export function findColumn(fieldName: FieldName, columns: ColumnDef[]): ColumnDef {
    //TODO - Put tableAlias always ''
    const functionType = functionAlias.find(col => col.column.toLowerCase() == fieldName.name.toLowerCase());
    if (functionType) {
        const colDef: ColumnDef = {
            column: functionType.column,
            columnName: functionType.column,
            columnType: functionType.column_type,
            columnKey: functionType.columnKey,
            notNull: functionType.notNull,
            table: ''
        }
        return colDef;
    }
    const found = columns.find(col => col.columnName.toLowerCase() == fieldName.name.toLowerCase() &&
        (fieldName.prefix == '' || fieldName.prefix == col.tableAlias || fieldName.prefix == col.table));
    if (!found) {
        throw Error('column not found:' + JSON.stringify(fieldName));
    }
    return found;
}

export function findColumn2(fieldName: FieldName, table: string, columns: ColumnSchema[]): ColumnSchema {
    //TODO - Put tableAlias always ''
    const functionType = functionAlias.find(col => col.column == fieldName.name);
    if (functionType) {
        return functionType;
    }
    const found = columns.find(col => col.column.toLowerCase() === fieldName.name.toLowerCase() && table === col.table);
    if (!found) {
        throw Error('column not found:' + JSON.stringify(fieldName));
    }
    return found;
}

function extractOriginalSql(rule: ParserRuleContext) {

    const startIndex = rule.start.startIndex;
    const stopIndex = rule.stop?.stopIndex || startIndex;
    const interval = new Interval(startIndex, stopIndex);
    const result = rule.start.inputStream?.getText(interval);
    return result;
}

export function getSimpleExpressions(ctx: RuleContext): ParseTree[] {

    const tokens: RuleContext[] = [];
    collectSimpleExpr(tokens, ctx);
    return tokens;
}

function collectSimpleExpr(tokens: RuleContext[], parent: RuleContext) {

    if (isSimpleExpression(parent)) {
        tokens.push(parent);
    }

    for (let i = 0; i < parent.childCount; i++) {
        const child = parent.getChild(i);
        if (child instanceof RuleContext) {
            collectSimpleExpr(tokens, child);
        }
    }
}

function isSimpleExpression(ctx: ParseTree) {
    return ctx instanceof SimpleExprVariableContext
        || ctx instanceof SimpleExprColumnRefContext
        || ctx instanceof SimpleExprRuntimeFunctionContext
        || ctx instanceof SimpleExprFunctionContext
        || ctx instanceof SimpleExprCollateContext
        || ctx instanceof SimpleExprLiteralContext
        || ctx instanceof SimpleExprParamMarkerContext
        || ctx instanceof SimpleExprSumContext
        || ctx instanceof SimpleExprGroupingOperationContext
        || ctx instanceof SimpleExprWindowingFunctionContext
        || ctx instanceof SimpleExprConcatContext
        || ctx instanceof SimpleExprUnaryContext
        || ctx instanceof SimpleExprNotContext
        || ctx instanceof SimpleExprListContext
        || ctx instanceof SimpleExprSubQueryContext
        || ctx instanceof SimpleExprOdbcContext
        || ctx instanceof SimpleExprMatchContext
        || ctx instanceof SimpleExprBinaryContext
        || ctx instanceof SimpleExprCastContext
        || ctx instanceof SimpleExprCaseContext
        || ctx instanceof SimpleExprConvertContext
        || ctx instanceof SimpleExprConvertUsingContext
        || ctx instanceof SimpleExprDefaultContext
        || ctx instanceof SimpleExprValuesContext
        || ctx instanceof SimpleExprIntervalContext;
}