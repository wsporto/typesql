import { ParserRuleContext } from "antlr4ts";
import { TerminalNode, ParseTree } from "antlr4ts/tree";
import { Interval } from "antlr4ts/misc/Interval";

import { QuerySpecificationContext, TableReferenceContext, TableFactorContext, TableReferenceListParensContext, SingleTableParensContext, 
    JoinedTableContext, SingleTableContext, ExprContext, SimpleExprLiteralContext, SimpleExprColumnRefContext, ExprIsContext, 
    PrimaryExprPredicateContext, SimpleExprListContext, PrimaryExprIsNullContext, PrimaryExprCompareContext, ExprNotContext, 
    ExprAndContext, ExprXorContext, ExprOrContext, SelectItemContext, PredicateContext, BitExprContext, SimpleExprVariableContext, 
    SimpleExprRuntimeFunctionContext, SimpleExprFunctionContext, SimpleExprCollateContext, SimpleExprParamMarkerContext, SimpleExprSumContext, 
    SimpleExprGroupingOperationContext, SimpleExprWindowingFunctionContext, SimpleExprConcatContext, SimpleExprUnaryContext, SimpleExprNotContext, 
    SimpleExprSubQueryContext, SimpleExprOdbcContext, SimpleExprMatchContext, SimpleExprBinaryContext, SimpleExprCastContext, SimpleExprCaseContext, 
    SimpleExprConvertContext, SimpleExprConvertUsingContext, SimpleExprDefaultContext, SimpleExprValuesContext, SimpleExprIntervalContext } from "ts-mysql-parser";

import { ColumnSchema, ColumnDef, FieldName } from "./types";
import { extractQueryInfoFromQuerySpecification } from "./parse";

export function filterColumns(dbSchema: ColumnSchema[], tablePrefix: string | undefined, table: FieldName) {
    const tableColumns = dbSchema.filter(schema => schema.table.toLowerCase() == table.name.toLowerCase() && (schema.schema == table.prefix || table.prefix == ''));
    return tableColumns.map(tableColumn => {

        //name and colum are the same on the leaf table
        const r: ColumnDef = { columnName: tableColumn.column, column: tableColumn.column, columnType: tableColumn.column_type,
            notNull: tableColumn.notNull,  table: table.name, tableAlias: tablePrefix || ''}
        return r;

    })
}

export function selectAllColumns(tablePrefix: string, fromColumns: ColumnDef[]) {
    const allColumns : ColumnDef[] = [];
    fromColumns.forEach( column=> {
        if(tablePrefix == '' || tablePrefix == column.tableAlias) {
            allColumns.push(column);
        }
        
    });
    return allColumns;
}

export function getColumnNames(querySpec: QuerySpecificationContext, fromColumns: ColumnDef[]) : string[] {
    const allColumns : string[] = [];

    if(querySpec.selectItemList().MULT_OPERATOR()) {
        allColumns.push(...selectAllColumns('', fromColumns).map( col => col.columnName));
    }
    const ctx = querySpec.selectItemList();
    ctx.selectItem().forEach( selectItem => {

        const tableWild = selectItem.tableWild();
        if(tableWild) {
            if(tableWild.MULT_OPERATOR()) {
                const itemName = splitName(selectItem.text);
                allColumns.push(...selectAllColumns(itemName.prefix, fromColumns).map( col => col.columnName));
            }
            
        }
        else {
            const alias = selectItem.selectAlias()?.identifier()?.text;
            const tokens = getTokens(selectItem);
            let columnName = extractOriginalSql(selectItem.expr()!)!; //TODO VERIFICAR NULL
            if(tokens.length == 1 && tokens[0] instanceof SimpleExprColumnRefContext) {
                columnName = splitName(tokens[0].text).name;
            }
            allColumns.push(alias || columnName)
        }
        
    })
    return allColumns;
}

export function getColumnsFrom(ctx: QuerySpecificationContext, dbSchema: ColumnSchema[]) {
    const tableReferences = ctx.fromClause()?.tableReferenceList()?.tableReference();
    const fromColumns = tableReferences? extractColumnsFromTableReferences(tableReferences, dbSchema) : [];
    return fromColumns;
}

//rule: tableReference
function extractColumnsFromTableReferences(tablesReferences: TableReferenceContext[], dbSchema: ColumnSchema[]): ColumnDef[] {
    const result: ColumnDef[] = [];

    tablesReferences.forEach(tab => {

        const tableFactor = tab.tableFactor();
        if (tableFactor) {
            const fields = extractFieldsFromTableFactor(tableFactor,dbSchema);
            result.push(...fields);
        }

        const allJoinedColumns : ColumnDef[][] = [];
        let firstLeftJoinIndex = -1;
        tab.joinedTable().forEach( (joined, index) => {
            if(joined.innerJoinType()?.INNER_SYMBOL() || joined.innerJoinType()?.JOIN_SYMBOL()) {
                firstLeftJoinIndex = -1; //dont need to add notNull = false to joins
            }
            else if(firstLeftJoinIndex == -1) {
                firstLeftJoinIndex = index; //add notNull = false to all joins after the first left join
            }
            
            const tableReferences = joined.tableReference();
            const onClause = joined.expr(); //ON expr
            
            if(tableReferences) {
                const usingFields = extractFieldsFromUsingClause(joined);
                const joinedFields = extractColumnsFromTableReferences([tableReferences], dbSchema);
                //doesn't duplicate the fields of the USING clause. Ex. INNER JOIN mytable2 USING(id);
                const joinedFieldsFiltered = usingFields.length > 0? filterUsingFields(joinedFields, usingFields) : joinedFields;
                if(onClause) {
                    joinedFieldsFiltered.forEach(field => {
                        const fieldName : FieldName = {
                            name: field.columnName,
                            prefix: field.tableAlias || ''
                        }
                        field.notNull = field.notNull || !possibleNull(fieldName, onClause);
                    })
                    //apply inference to the parent join too
                    result.forEach( field => {
                        const fieldName : FieldName = {
                            name: field.columnName,
                            prefix: field.tableAlias || ''
                        }
                        field.notNull = field.notNull || !possibleNull(fieldName, onClause);
                    })
                }

                allJoinedColumns.push(joinedFieldsFiltered);
            }
        })
        
        allJoinedColumns.forEach( (joinedColumns, index) => {
            joinedColumns.forEach(field => {
                if(firstLeftJoinIndex != -1 && index >= firstLeftJoinIndex) {

                    const newField : ColumnDef = {
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

function extractFieldsFromUsingClause(joinedTableContext: JoinedTableContext) : string[] {
    const usingFieldsClause = joinedTableContext.identifierListWithParentheses()?.identifierList();
    if(usingFieldsClause) {
        return usingFieldsClause.text.split(',').map( field => field.trim());
    }
    return [];
}

function filterUsingFields(joinedFields: ColumnDef[],  usingFields: string[]) {
    return joinedFields.filter( joinedField => {
        const isUsing = usingFields.includes(joinedField.columnName);
        if(!isUsing) {
            return joinedField;
        }
    })
}

//rule: singleTable
function extractFieldsFromSingleTable(dbSchema: ColumnSchema[], ctx: SingleTableContext) {
    const table = ctx?.tableRef().text;
    const tableAlias = ctx?.tableAlias()?.text;
    const tableName = splitName(table);
    const fields = filterColumns(dbSchema, tableAlias, tableName)
    return fields;
}

//rule: singleTableParens
function extractFieldsFromSingleTableParens(dbSchema: ColumnSchema[], ctx: SingleTableParensContext) : ColumnDef []{
    let fields :ColumnDef[] = [];
    //singleTable | singleTableParens
    const singleTable = ctx.singleTable();
    if(singleTable) {
       fields = extractFieldsFromSingleTable(dbSchema, singleTable);
    }

    const singleTableParens = ctx.singleTableParens();
    if(singleTableParens) {
        fields = extractFieldsFromSingleTableParens(dbSchema, singleTableParens);
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
function extractFieldsFromTableFactor(tableFactor: TableFactorContext, dbSchema: ColumnSchema[]): ColumnDef[] { //tableFactor: rule
    const singleTable = tableFactor.singleTable();
    if (singleTable) {
        return extractFieldsFromSingleTable(dbSchema, singleTable);
    }

    const singleTableParens = tableFactor.singleTableParens();
    if( singleTableParens ) {
        return extractFieldsFromSingleTableParens(dbSchema, singleTableParens);
    }

    const derivadTable = tableFactor.derivedTable();
    if (derivadTable) {
        //walkQueryExpressionParens(queryExpressionParens, namedNodes, constraints, dbSchema);
        //TODO - WALKSUBQUERY
        const subQuery = derivadTable.subquery().queryExpressionParens().queryExpression()?.queryExpressionBody()?.querySpecification();
        if(subQuery) {
            //subquery=true only for select (subquery); not for from(subquery)
            // const fromColumns
            const queryResult = extractQueryInfoFromQuerySpecification(subQuery, dbSchema, []); //TODO - WHY []?
            // console.log("queryResult=", queryResult);
            const tableAlias = derivadTable.tableAlias()?.text;
            return queryResult.columns.map( col => {
                const newCol : ColumnDef = {
                    column: col.name,
                    columnName: col.name,
                    columnType: col.type,
                    notNull: col.notNull,
                    table: tableAlias || '',
                    tableAlias: tableAlias
                }
                return newCol;
            });
        }
        
        // const tableAlias = derivadTable.tableAlias()?.text;
        // const querySpec = subQuery?.queryExpressionBody()?.querySpecification();
        // if(querySpec) {
        //     const subQueryColumns = processQuery(dbSchema, querySpec)
        //     const resultColumns = tableAlias? addTableAlias(subQueryColumns, tableAlias) : subQueryColumns;

        //     return resultColumns;
        // }
    }
    const tableReferenceListParens = tableFactor.tableReferenceListParens();
    if (tableReferenceListParens) {
        const listParens = extractColumnsFromTableListParens(tableReferenceListParens, dbSchema);
        return listParens;
    }

    return [];
}


//tableReferenceList | tableReferenceListParens
function extractColumnsFromTableListParens(ctx: TableReferenceListParensContext, dbSchema: ColumnSchema[]): ColumnDef[] {

    const tableReferenceList = ctx.tableReferenceList();
    if (tableReferenceList) {
        return extractColumnsFromTableReferences(tableReferenceList.tableReference(), dbSchema);
    }

    const tableReferenceListParens = ctx.tableReferenceListParens();
    
    if (tableReferenceListParens) {
        return extractColumnsFromTableListParens(tableReferenceListParens, dbSchema);
    }

    return [];
}

export function splitName(fieldName: string) : FieldName {
    const fieldNameSplit = fieldName.split('.');
    const result : FieldName = {
        name: fieldNameSplit.length == 2? fieldNameSplit[1] : fieldNameSplit[0],
        prefix: fieldNameSplit.length == 2? fieldNameSplit[0] : ''

    }
    return result;

}

export function findColumn(fieldName: FieldName, columns: ColumnDef[]): ColumnDef {
    //TODO - Put tableAlias always ''
    const found = columns.find(col => col.columnName.toLowerCase() == fieldName.name.toLowerCase() && 
        (fieldName.prefix == '' || fieldName.prefix == col.tableAlias || fieldName.prefix == col.table));
    if(!found) {
        throw Error('column not found:' + JSON.stringify(fieldName));
    }
    return found;
}

export function findColumn2(fieldName: FieldName, table: string, columns: ColumnSchema[]): ColumnSchema {
    //TODO - Put tableAlias always ''
    const found = columns.find(col => col.column.toLowerCase() === fieldName.name.toLowerCase() && table === col.table);
    if(!found) {
        throw Error('column not found:' + JSON.stringify(fieldName));
    }
    return found;
}

function possibleNull(field: FieldName, exprContext: ExprContext): boolean {
        
    if (exprContext instanceof ExprIsContext) {

        const boolPri = exprContext.boolPri();
        if (boolPri instanceof PrimaryExprPredicateContext) {
            const res = boolPri.predicate().bitExpr()[0].simpleExpr();
            if (res instanceof SimpleExprListContext) {
                const expr = res.exprList().expr()[0];
                return possibleNull(field, expr);
            }
        }
        if (boolPri instanceof PrimaryExprIsNullContext) {
            const compare = boolPri.boolPri();
            if (boolPri.notRule() && areEquals(field, compare.text)) {
                return false; //possibleNull
            }
        }
        if (boolPri instanceof PrimaryExprCompareContext) {
            let compare = boolPri.boolPri().text; //value > 10;
            let compare2 = boolPri.predicate().text; //10 < value
            //TODO - more complex expressions. ex. (value + value2) > 10; 
            if (areEquals(field, compare) || areEquals(field, compare2)) {
                return false;  //possibleNull
            }
        }
        return true; //possibleNull

    }
    if (exprContext instanceof ExprNotContext) {
        const expr = exprContext.expr();
        return !possibleNull(field, expr);
    }
    if (exprContext instanceof ExprAndContext) {
        const [first, ...rest] = exprContext.expr();
        let isPossibleNull = possibleNull(field, first);
        rest.forEach(expr => {
            isPossibleNull = isPossibleNull && possibleNull(field, expr);
        })
        return isPossibleNull;
    }
    if (exprContext instanceof ExprXorContext) {

    }
    if (exprContext instanceof ExprOrContext) {

        const [first, ...rest] = exprContext.expr();
        let isPossibleNull = possibleNull(field, first);
        rest.forEach(expr => {
            isPossibleNull = isPossibleNull || possibleNull(field, expr);
        })
        return isPossibleNull;
    }

    throw Error('Unknow type:' + exprContext.constructor.name);
}

function areEquals(field: FieldName, expressionField: string) {
    const compare = splitName(expressionField); //t1.name
    /*
    t1.name == t1.name
    t1.name == name
    name    == t1.name
    */
    return field.name == compare.name &&
        ((field.prefix == compare.prefix) || (field.prefix == '' || compare.prefix == ''))
}


function extractOriginalSql(rule: ParserRuleContext) {

    const startIndex = rule.start.startIndex;
    const stopIndex = rule.stop?.stopIndex || startIndex;
    const interval = new Interval(startIndex, stopIndex);
    const result = rule.start.inputStream?.getText(interval);
    return result;
}

function getTokens(ctx: SelectItemContext): ParseTree[] {
    let child = ctx.getChild(0);
    const tokens: ParseTree[] = [];
    while (!(child instanceof TerminalNode)) {
        //console.log("child=", child.constructor.name)
        if (child instanceof PredicateContext) {
            break;
        }
        child = child.getChild(0);
    }

    if (child instanceof PredicateContext) {

        expressionTraversal(tokens, child);
        return tokens;
    }
    return tokens;
}

function expressionTraversal(tokens: ParseTree[], parent: ParseTree) {

    for (let i = 0; i < parent.childCount; i++) {

        const child = parent.getChild(i);
        if (child instanceof BitExprContext) { //bitExpr op bitExpr | simpleExpr
            expressionTraversal(tokens, child);
        }
        else if (child.text == "*" || isSimpleExpression(child)) { //leaf
            tokens.push(child);
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