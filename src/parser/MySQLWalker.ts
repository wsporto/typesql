import { MySQLParserListener } from "./MySQLParserListener";
import {
    TableRefContext, SimpleExprParamMarkerContext, SelectItemContext, QuerySpecificationContext, FromClauseContext,
    PrimaryExprCompareContext, PredicateContext, FunctionCallContext, PrimaryExprIsNullContext,
    PrimaryExprAllAnyContext, PredicateExprInContext, PrimaryExprPredicateContext, SimpleExprColumnRefContext,
    SimpleExprLiteralContext, SimpleExprSubQueryContext, PredicateExprLikeContext, ExprContext,
    ExprIsContext, ExprNotContext, ExprXorContext, ExprOrContext, ExprAndContext, SimpleExprListContext, SimpleExprSumContext,
    BitExprContext, SimpleExprVariableContext, SimpleExprRuntimeFunctionContext, SimpleExprFunctionContext,
    SimpleExprCollateContext, SimpleExprGroupingOperationContext, SimpleExprWindowingFunctionContext, SimpleExprConcatContext,
    SimpleExprUnaryContext, SimpleExprNotContext, SimpleExprOdbcContext, SimpleExprMatchContext, SimpleExprBinaryContext,
    SimpleExprCastContext, SimpleExprCaseContext, SimpleExprConvertContext, SimpleExprConvertUsingContext, SimpleExprDefaultContext,
    SimpleExprValuesContext, SimpleExprIntervalContext, SubqueryContext, TableFactorContext, TableReferenceListParensContext, SelectItemListContext, 
    TableReferenceContext, SingleTableParensContext, SingleTableContext, JoinedTableContext, InsertStatementContext, UpdateStatementContext, 
    SelectStatementContext, UpdateListContext, DeleteStatementContext, OrderClauseContext, ThenExpressionContext, ElseExpressionContext, VariableContext, BoolPriContext, SimpleExprContext
} from "./MySQLParser";

import { TerminalNode, ErrorNode, ParseTree } from "antlr4ts/tree";
import { ParserRuleContext, RuleContext } from "antlr4ts";
import { Interval } from "antlr4ts/misc/Interval";
import { ParameterContext, ExpressionParamContext, FunctionParamContext, ResolvedParameter, ColumnDef2, DBSchema, FieldNullability, ExpressionCompareParamContext } from "../types";

type FieldName = {
    name: string;
    prefix: string;
}

export class MySQLWalker implements MySQLParserListener {
    parameters: ParameterContext[] = [];
    orderByParameter: boolean;
    querySpecification: QuerySpecificationContext[] = [];
    insertParameters: string[];
    insertIntoTable: string;
    insertIntoValues: string[];

    updateTable: string;
    updateColumns: string[];

    deleteTable?: string;

    seen : Map<string, boolean> = new Map();

    getTokens(ctx: SelectItemContext): ParseTree[] {
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

            this.expressionTraversal(tokens, child);
            return tokens;
        }
        return tokens;
    }

    inferNotNull(dbSchema: DBSchema): FieldNullability[] {
        
        const resultAllQueries = this.querySpecification.map( (query) =>  this.processQuery(dbSchema, query) ); //might have more than on (query1 union query2 union ...)
        const result = resultAllQueries[0]; // the first query of the union
        for (let queryIndex = 1; queryIndex < resultAllQueries.length; queryIndex++) { //union (if have any)
            result.forEach( (field, fieldIndex) => {
                field.notNull = field.notNull && resultAllQueries[queryIndex][fieldIndex].notNull; //if all the fields at the fieldIndex is null
            }) 
        }
       
        const fieldsNullability = result.map( field => (
            {
                name: field.columnName,
                notNull: field.notNull
            }
        ));
        return fieldsNullability;
    }

    getColumnsFrom(dbSchema: DBSchema, ctx: QuerySpecificationContext) {
        const tableReferences = ctx.fromClause()?.tableReferenceList()?.tableReference();
        const fromColumns = tableReferences? this.extractColumnsFromTableReferences(dbSchema, tableReferences) : [];
        return fromColumns;
    }

    processQuery(dbSchema: DBSchema, ctx: QuerySpecificationContext) {
        const fromColumns = this.getColumnsFrom(dbSchema, ctx);
        const fields = this.selectColumns(ctx.selectItemList(), fromColumns, ctx.whereClause()?.expr());
        return fields
    }

    filterColumns(dbSchema: DBSchema, tablePrefix: string | undefined, table: FieldName) {
        const tableColumns = dbSchema.columns.filter(schema => schema.table.toLowerCase() == table.name.toLowerCase() && (schema.schema == table.prefix || table.prefix == ''));
        return tableColumns.map(tableColumn => {

            //name and colum are the same on the leaf table
            const r: ColumnDef2 = { columnName: tableColumn.column, column: tableColumn.column, notNull: tableColumn.notNull,  table: table.name, tableAlias: tablePrefix || ''}
            return r;

        })
    }

    //rule: tableReference
    extractColumnsFromTableReferences(dbSchema: DBSchema, tablesReferences: TableReferenceContext[]): ColumnDef2[] {
        const result: ColumnDef2[] = [];

        tablesReferences.forEach(tab => {

            const tableFactor = tab.tableFactor();
            if (tableFactor) {
                const fields = this.extractFieldsFromTableFactor(dbSchema, tableFactor);
                result.push(...fields);
            }

            const allJoinedColumns : ColumnDef2[][] = [];
            let firstLeftJoinIndex = -1;
            tab.joinedTable().forEach( (joined, index) => {
                if(joined.text.toLowerCase().startsWith("innerjoin")) {
                    firstLeftJoinIndex = -1; //dont need to add notNull = false to joins
                }
                else if(firstLeftJoinIndex == -1) {
                    firstLeftJoinIndex = index; //add notNull = false to all joins after the first left join
                }
                
                const tableReferences = joined.tableReference();
                const onClause = joined.expr(); //ON expr
                
                if(tableReferences) {
                    const usingFields = this.extractFieldsFromUsingClause(joined);
                    const joinedFields = this.extractColumnsFromTableReferences(dbSchema, [tableReferences]);
                    //doesn't duplicate the fields of the USING clause. Ex. INNER JOIN mytable2 USING(id);
                    const joinedFieldsFiltered = usingFields.length > 0? this.filterUsingFields(joinedFields, usingFields) : joinedFields;
                    if(onClause) {
                        joinedFieldsFiltered.forEach(field => {
                            const fieldName : FieldName = {
                                name: field.columnName,
                                prefix: field.tableAlias || ''
                            }
                            field.notNull = field.notNull || !this.possibleNull(fieldName, onClause);
                        })
                        //apply inference to the parent join too
                        result.forEach( field => {
                            const fieldName : FieldName = {
                                name: field.columnName,
                                prefix: field.tableAlias || ''
                            }
                            field.notNull = field.notNull || !this.possibleNull(fieldName, onClause);
                        })
                    }

                    allJoinedColumns.push(joinedFieldsFiltered);
                }
            })
            
            allJoinedColumns.forEach( (joinedColumns, index) => {
                joinedColumns.forEach(field => {
                    if(firstLeftJoinIndex != -1 && index >= firstLeftJoinIndex) {

                        const newField : ColumnDef2 = {
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

    filterUsingFields(joinedFields: ColumnDef2[],  usingFields: string[]) {
        return joinedFields.filter( joinedField => {
            const isUsing = usingFields.includes(joinedField.columnName);
            if(!isUsing) {
                return joinedField;
            }
        })
    }

    extractFieldsFromUsingClause(joinedTableContext: JoinedTableContext) : string[] {
        const usingFieldsClause = joinedTableContext.identifierListWithParentheses()?.identifierList();
        if(usingFieldsClause) {
            return usingFieldsClause.text.split(',').map( field => field.trim());
        }
        return [];
    }

    //rule: singleTable
    extractFieldsFromSingleTable(dbSchema: DBSchema, ctx: SingleTableContext) {
        const table = ctx?.tableRef().text;
        const tableAlias = ctx?.tableAlias()?.text;
        const tableName = this.splitName(table);
        const fields = this.filterColumns(dbSchema, tableAlias, tableName)
        return fields;
    }

    //rule: singleTableParens
    extractFieldsFromSingleTableParens(dbSchema: DBSchema, ctx: SingleTableParensContext) : ColumnDef2 []{
        let fields :ColumnDef2[] = [];
        //singleTable | singleTableParens
        const singleTable = ctx.singleTable();
        if(singleTable) {
           fields = this.extractFieldsFromSingleTable(dbSchema, singleTable);
        }

        const singleTableParens = ctx.singleTableParens();
        if(singleTableParens) {
            fields = this.extractFieldsFromSingleTableParens(dbSchema, singleTableParens);
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
    extractFieldsFromTableFactor(dbSchema: DBSchema, tableFactor: TableFactorContext): ColumnDef2[] { //tableFactor: rule
        const singleTable = tableFactor.singleTable();
        if (singleTable) {
            return this.extractFieldsFromSingleTable(dbSchema, singleTable);
        }

        const singleTableParens = tableFactor.singleTableParens();
        if( singleTableParens ) {
            return this.extractFieldsFromSingleTableParens(dbSchema, singleTableParens);
        }

        const derivadTable = tableFactor.derivedTable();
        if (derivadTable) {
            const subQuery = derivadTable.subquery().queryExpressionParens().queryExpression();
            const tableAlias = derivadTable.tableAlias()?.text;
            const querySpec = subQuery?.queryExpressionBody()?.querySpecification();
            if(querySpec) {
                const subQueryColumns = this.processQuery(dbSchema, querySpec)
                const resultColumns = tableAlias? this.addTableAlias(subQueryColumns, tableAlias) : subQueryColumns;

                return resultColumns;
            }
        }
        const tableReferenceListParens = tableFactor.tableReferenceListParens();
        if (tableReferenceListParens) {
            const listParens = this.extractColumnsFromTableListParens(dbSchema, tableReferenceListParens);
            return listParens;
        }

        return [];
    }

    addTableAlias(subQueryColumns: ColumnDef2[], tableAlias: string) {
        const renameFields = subQueryColumns.map( col => {
            let newCol : ColumnDef2 = {
                ...col,
                tableAlias
            }
            return newCol;
        })
        return renameFields;
    }

    //tableReferenceList | tableReferenceListParens
    extractColumnsFromTableListParens(dbSchema: DBSchema, ctx: TableReferenceListParensContext): ColumnDef2[] {

        const tableReferenceList = ctx.tableReferenceList();
        if (tableReferenceList) {
            return this.extractColumnsFromTableReferences(dbSchema, tableReferenceList.tableReference());
        }

        const tableReferenceListParens = ctx.tableReferenceListParens();
        
        if (tableReferenceListParens) {
            return this.extractColumnsFromTableListParens(dbSchema, tableReferenceListParens);
        }

        return [];
    }

    splitName(fieldName: string) : FieldName {
        const fieldNameSplit = fieldName.split('.');
        const result : FieldName = {
            name: fieldNameSplit.length == 2? fieldNameSplit[1] : fieldNameSplit[0],
            prefix: fieldNameSplit.length == 2? fieldNameSplit[0] : ''

        }
        return result;

    }

    findColumn(fieldName: FieldName, columns: ColumnDef2[]): ColumnDef2 {
        //TODO - Put tableAlias always ''
        const found = columns.find(col => col.columnName == fieldName.name && 
            (fieldName.prefix == '' || fieldName.prefix == col.tableAlias || fieldName.prefix == col.table));
        if(!found) {
            // console.log("columns===", columns)
            throw Error('column not found:' + JSON.stringify(fieldName));
        }
        return found;
    }

    selectAllColumns(tablePrefix: string, fromColumns: ColumnDef2[], whereExpr: ExprContext | undefined) {
        const allColumns : ColumnDef2[] = [];
        fromColumns.forEach( column=> {
            if(tablePrefix == '' || tablePrefix == column.tableAlias) {
                //TODO - possible bug: column.columnName (need to pass the full qualified name)
                const fieldName : FieldName = {
                    name: column.columnName,
                    prefix: column.tableAlias || ''
                }
                const notNull = column.notNull || (whereExpr && !this.possibleNull(fieldName, whereExpr)) || false;
                const newCol : ColumnDef2 = {
                    ...column,
                    notNull
                }
                allColumns.push(newCol);
            }
            
        });
        return allColumns;
    }

    selectColumns(ctx: SelectItemListContext, fromColumns: ColumnDef2[], whereExpr: ExprContext | undefined) {
        
        const allColumns : ColumnDef2[] = [];

        if(ctx.MULT_OPERATOR()) {
            //TODO - replace by namedparameter tablePrefix = ''
            allColumns.push(...this.selectAllColumns('', fromColumns, whereExpr));
        }
        ctx.selectItem().forEach( selectItem => {
            if(selectItem.tableWild()?.MULT_OPERATOR()) {
                const itemName = this.splitName(selectItem.text);
                allColumns.push(...this.selectAllColumns(itemName.prefix, fromColumns, whereExpr))
            }
            else {
                const alias = selectItem.selectAlias()?.identifier()?.text;
                const tokens = this.getTokens(selectItem);
                const simpleExpression = tokens.every( token => token instanceof SimpleExprColumnRefContext 
                    || token instanceof SimpleExprLiteralContext);
                if(! simpleExpression) {
                    const columnName = this.extractOriginalSql(selectItem)!;
                    const newCol : ColumnDef2 = {
                        column: columnName,
                        columnName: alias || columnName,
                        notNull: false,
                        table: '',
                        tableAlias: ''
                    }
                    allColumns.push(newCol);
                }
                else {
                    const tokensColumnRef = tokens.filter( token => token instanceof SimpleExprColumnRefContext);
                    const columns = tokensColumnRef.map( token => this.splitName(token.text));
                    const notNull = columns.every( column => this.findColumn(column, fromColumns).notNull || (whereExpr && !this.possibleNull(column, whereExpr)) );
                    const fieldName = this.splitName(selectItem.text);
                    const columnName = columns.length>1? this.extractOriginalSql(selectItem)! : fieldName.name;
                    const newCol : ColumnDef2 = {
                        column: columnName,
                        columnName: alias || columnName,
                        notNull,
                        table: fieldName.prefix,
                        tableAlias: fieldName.prefix 
                    }
                    allColumns.push(newCol);
                }
            }
        })
        return allColumns;
    }

    visitTerminal?: (node: TerminalNode) => void;

    visitErrorNode(node: ErrorNode) {
        console.log("error node=", node.text);
    }

    enterEveryRule(ctx: ParserRuleContext) {
        //console.log("rule-----", ctx.constructor.name, ctx.text);
    }

    exitEveryRule(ctx: ParserRuleContext) {
        //console.log("exitrule-----", ctx.constructor.name);
    }

    enterTableRef(ctx: TableRefContext) {
        //console.log("table==", ctx.qualifiedIdentifier()?.text)
    }

    enterFromClause(ctx: FromClauseContext) {
        // this.fromRule = ctx;
        //console.log("enterFromClause");
    }

    exitFromClause(ctx: FromClauseContext) {
        // this.fromRule = null;
        //console.log("exitFromClause");
    }

    logParents(ctx: ParserRuleContext) {
        let parent = ctx.parent;
        while (parent) {
            console.log("parent=", parent.constructor.name, "=", parent.text);
            parent = parent.parent;
        }
    }

    private extractOriginalSql(rule: ParserRuleContext) {

        const startIndex = rule.start.startIndex;
        const stopIndex = rule.stop?.stopIndex || startIndex;
        const interval = new Interval(startIndex, stopIndex);
        const result = rule.start.inputStream?.getText(interval);
        return result;
    }

    possibleNull(field: FieldName, exprContext: ExprContext): boolean {
        
        if (exprContext instanceof ExprIsContext) {

            const boolPri = exprContext.boolPri();
            if (boolPri instanceof PrimaryExprPredicateContext) {
                const res = boolPri.predicate().bitExpr()[0].simpleExpr();
                if (res instanceof SimpleExprListContext) {
                    const expr = res.exprList().expr()[0];
                    return this.possibleNull(field, expr);
                }
            }
            if (boolPri instanceof PrimaryExprIsNullContext) {
                const compare = boolPri.boolPri();
                if (boolPri.notRule() && this.areEquals(field, compare.text)) {
                    return false; //possibleNull
                }
            }
            if (boolPri instanceof PrimaryExprCompareContext) {
                let compare = boolPri.boolPri().text; //value > 10;
                let compare2 = boolPri.predicate().text; //10 < value
                //TODO - more complex expressions. ex. (value + value2) > 10; 
                if (this.areEquals(field, compare) || this.areEquals(field, compare2)) {
                    return false;  //possibleNull
                }
            }
            return true; //possibleNull

        }
        if (exprContext instanceof ExprNotContext) {
            const expr = exprContext.expr();
            return !this.possibleNull(field, expr);
        }
        if (exprContext instanceof ExprAndContext) {
            const [first, ...rest] = exprContext.expr();
            let possibleNull = this.possibleNull(field, first);
            rest.forEach(expr => {
                possibleNull = possibleNull && this.possibleNull(field, expr);
            })
            return possibleNull;
        }
        if (exprContext instanceof ExprXorContext) {
            const expressions = exprContext.expr();

        }
        if (exprContext instanceof ExprOrContext) {

            const [first, ...rest] = exprContext.expr();
            let possibleNull = this.possibleNull(field, first);
            rest.forEach(expr => {
                possibleNull = possibleNull || this.possibleNull(field, expr);
            })
            return possibleNull;
        }

        throw Error('Unknow type:' + exprContext.constructor.name);
    }

    areEquals(field: FieldName, expressionField: string) {
        const compare = this.splitName(expressionField); //t1.name
        /*
        t1.name == t1.name
        t1.name == name
        name    == t1.name
        */
        return field.name == compare.name &&
            ((field.prefix == compare.prefix) || (field.prefix == '' || compare.prefix == ''))
    }

    removePrefix(name: string) {
        return name.indexOf('.') > 0 ? name.split('.')[1] : name;
    }

    isSimpleExpression(ctx: ParseTree) {
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

    expressionTraversal(tokens: ParseTree[], parent: ParseTree) {

        for (let i = 0; i < parent.childCount; i++) {

            const child = parent.getChild(i);
            if (child instanceof BitExprContext) { //bitExpr op bitExpr | simpleExpr
                this.expressionTraversal(tokens, child);
            }
            else if (child.text == "*" || this.isSimpleExpression(child)) { //leaf
                tokens.push(child);
            }
        }
    }


    enterQuerySpecification(ctx: QuerySpecificationContext) {
        //console.log("enterQuerySpecification");
        //this.logParents(ctx);

        const subQuery = this.getParentContext(ctx, SubqueryContext) || this.getParentContext(ctx, SimpleExprSubQueryContext);
        if (subQuery) return;
        this.querySpecification.push(ctx);
    }

    processPredicateContext(parseRuleContext: ParserRuleContext): ParameterContext | undefined {

        if (parseRuleContext instanceof PrimaryExprPredicateContext) { //primaryExprPredicate
            const predicate = parseRuleContext.predicate().predicateOperations(); //TODO - simpleExprWithParentheses
            if (predicate) {
                const result = this.processPredicateContext(predicate);
                return result;
            }
            else if (parseRuleContext.parent) {
                return this.processPredicateContext(parseRuleContext.parent);
            }
        }
        else if (parseRuleContext instanceof PrimaryExprIsNullContext) { //primaryExprIsNull
            const notNull = parseRuleContext.notRule()? true : false;
            const paramContext: ResolvedParameter = {
                type: 'resolved',
                notNull,
                columnType: '?'
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof PrimaryExprCompareContext) { //primaryExprCompare

            const key = parseRuleContext.start.tokenIndex + ':' + parseRuleContext.stop?.tokenIndex;
            if(this.seen.get(key)) {
                return undefined;
            }
            this.seen.set(key, true);
            const result = this.inferPrimaryExprCompare(parseRuleContext);
            return result;

        }
        else if (parseRuleContext instanceof PrimaryExprAllAnyContext) { //primaryExprAllAny
            console.log("PrimaryExprAllAnyContext");
            const paramContext: ExpressionParamContext = {
                type: 'expression',
                notNull: true,
                expression: 'anyAll'
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof FunctionCallContext) { //# simpleExprFunction
            const functionName = parseRuleContext.pureIdentifier()?.text || 'error';
            const paramContext: FunctionParamContext = {
                type: 'function',
                notNull: false,
                functionName
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof PredicateExprInContext) { //predicateExprIn
            // bitexpr IN (subquery or exprList) OR (subquery or exprList) IN bitexpr
            // 1) ? in (1, 2, 3); bitExpr=? 
            // 2) (1, 2, 3) in ?; bitExpr=?
            // 3) id in (1, 2, ?); bitExpr=id
            // 4) (1, 2, ?) in id; bitExpr=id
            // bitExpr in exprList  or exprList  in bitExpr  or bitExpr in exprList  or exprList in bitExpr
            const predicate = <PredicateContext>parseRuleContext.parent;
            const bitExpr = predicate.bitExpr()[0];
            const predicateExprIn = parseRuleContext.subquery() || parseRuleContext.exprList();
            const compare = bitExpr.text == '?' ? predicateExprIn : bitExpr; //compare is the other side of the ?
            const list = parseRuleContext.exprList() != null && bitExpr.text != '?'; // case 3) or 4)

            const expr = this.extractOriginalSql(compare!);

            const paramContext: ExpressionParamContext = {
                type: 'expression',
                notNull: true,
                expression: expr!,
                list: list
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof PredicateExprLikeContext) { //predicateExprLike
            const predicate = <PredicateContext>parseRuleContext.parent;
            const bitExpr = predicate.bitExpr()[0];
            const simpleExpr = parseRuleContext.simpleExpr()[0];

            const compare = bitExpr?.text == '?' ? simpleExpr : bitExpr;

            const paramContext: ExpressionParamContext = {
                type: 'expression',
                notNull: true,
                expression: compare.text
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof BitExprContext && parseRuleContext.childCount > 2) { //id+id
            const expr = this.extractOriginalSql(parseRuleContext)!
            const paramContext: ExpressionParamContext = {
                type: 'expression',
                notNull: false,
                expression: expr
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof ThenExpressionContext || parseRuleContext instanceof ElseExpressionContext) {
            const expr = parseRuleContext.expr();
            if(expr.text != '?') { // ex: id+?
                const exprStr = this.extractOriginalSql(expr)!;
                const paramContext: ExpressionParamContext = {
                    type: 'expression',
                    notNull: false,
                    expression: exprStr
                }
                return paramContext;
            }
            
            const caseExpr = <SimpleExprCaseContext> parseRuleContext.parent;
            const thenExprList = caseExpr.thenExpression();
            const elseExpr = caseExpr.elseExpression();
            
            const expressionList = thenExprList.map( thenExpr => thenExpr.expr().text).filter(exprText => exprText != '?');
            if(elseExpr) {
                const elseExprText = elseExpr.expr().text;
                if(elseExprText != '?') {
                    expressionList.push(elseExprText);
                }
            }
            const caseExprStr = expressionList.length == 0? '?' : expressionList.join(',');
            const paramContext: ExpressionParamContext = {
                type: 'expression',
                notNull: false,
                expression: caseExprStr
            }
            return paramContext;
        }
        else if (parseRuleContext instanceof SelectItemContext) {
            const originalExpr = this.extractOriginalSql(parseRuleContext) || "error";
            const paramContext: ExpressionParamContext = {
                type: 'expression',
                notNull: false,
                expression: originalExpr
            }
            return paramContext;
        }
        else if (parseRuleContext.parent) {
            const result = this.processPredicateContext(parseRuleContext.parent);
            return result;
        }
        return undefined;


    }

    removeExtraParentheses(sql: string) {
        let result = sql;
        while(result.startsWith('(') && result.endsWith(')')) {
            result = result.slice(1, -1);
        }
        return result;
    }

    inferPrimaryExprCompare(primaryExprCompare: PrimaryExprCompareContext) : ExpressionCompareParamContext {
        const compareLeft = primaryExprCompare.boolPri();
        const compareRight = primaryExprCompare.predicate();
        const sqlLeft = this.extractOriginalSql(compareLeft)!;
        const sqlRight = this.extractOriginalSql(compareRight)!;
        
        const paramContext: ExpressionCompareParamContext = {
            type: 'expressionCompare',
            notNull: true,
            expressionLeft: this.removeExtraParentheses(sqlLeft),
            expressionRight: this.removeExtraParentheses(sqlRight)
        }
        return paramContext;
    }

   inferBoolPri(boolPri: BoolPriContext, dbSchema: DBSchema) {
        if( boolPri instanceof PrimaryExprPredicateContext) {
            const predicate = boolPri.predicate();
            return this.inferPredicate(predicate, dbSchema);
        }
        if( boolPri instanceof PrimaryExprIsNullContext) {

        }
        if( boolPri instanceof PrimaryExprCompareContext) {

        }
        if( boolPri instanceof PrimaryExprAllAnyContext) {

        }
    }

    inferPredicate(predicate: PredicateContext, dbSchema: DBSchema) {
        const bitExpr = predicate.bitExpr()[0];
        const predicateOperations = predicate.predicateOperations();
        if(predicateOperations) {

        }
        const simpleExprWithParentheses = predicate.simpleExprWithParentheses();
        if(simpleExprWithParentheses) {

        }
        if(predicate.bitExpr().length > 1) {
            const bitExpr2 = predicate.bitExpr()[1];

        }
        const result = this.inferBitExpr(bitExpr, dbSchema)
        return result;
    }

    inferBitExpr(bitExpr: BitExprContext, dbSchema: DBSchema) {
        const simpleExpr = bitExpr.simpleExpr();
        if(simpleExpr) {
            return this.inferSimpleExpr(simpleExpr, dbSchema);
        }
    }

    inferSimpleExpr(simpleExpr: SimpleExprContext, dbSchema: DBSchema) : string[] {
        console.log("inferSimpleExpr=", simpleExpr.constructor.name, "-", simpleExpr.text);
        if( simpleExpr instanceof VariableContext) {

        }
        if( simpleExpr instanceof SimpleExprColumnRefContext) {

        }
        if( simpleExpr instanceof SimpleExprParamMarkerContext) {
            return ['?']
        }
        if( simpleExpr instanceof SimpleExprListContext) {
            const exprList = simpleExpr.exprList().text;
            return [exprList];
            
        }
        if( simpleExpr instanceof SimpleExprSubQueryContext) {
            const subquery = simpleExpr.subquery();
            const subQuerySql = this.extractOriginalSql(subquery)!;
            return [subQuerySql];
        }
        return [];

    }

    enterSimpleExprParamMarker(ctx: SimpleExprParamMarkerContext) {
        //console.log('enterSimpleExprasyc=', ctx.constructor.name);
        //this.logParents(ctx);
        const isSelectStmt = this.getParentContext(ctx, SelectStatementContext); //TODO - save statement type
        const isUpdateStmt = this.getParentContext(ctx, UpdateStatementContext);
        const isUpdateListContext = this.getParentContext(ctx, UpdateListContext);

        const isDeleteStmt = this.getParentContext(ctx, DeleteStatementContext);

        const processParameter = isSelectStmt || (isUpdateStmt && !isUpdateListContext) || isDeleteStmt;
        if(!processParameter) {
            return;
        }

        const predicateContext = ctx.parent!; //PredicateContext

        const paramContext = this.processPredicateContext(predicateContext);
        if(!paramContext) return;

        const querySpecContext = <QuerySpecificationContext>this.getParentContext(predicateContext, QuerySpecificationContext);
        const fromClause = querySpecContext?.fromClause();
        if (paramContext) {
            if (fromClause && (paramContext.type == 'expression' || paramContext.type == 'expressionCompare')) {
                const fromClauseStr = this.extractOriginalSql(fromClause)
                paramContext.from = fromClauseStr;
            }
            if(isUpdateStmt && (paramContext.type == 'expression' || paramContext.type == 'expressionCompare')) {
                paramContext.from = 'from ' + this.updateTable
            }
            if(isDeleteStmt && (paramContext.type == 'expression' || paramContext.type == 'expressionCompare')) {
                paramContext.from = 'from ' + this.deleteTable
            }
            this.parameters.push(paramContext);
        }
    }

    private getParentContext(ctx: RuleContext | undefined, parentContext: any): RuleContext | undefined {
        if (ctx instanceof parentContext) {
            return ctx;
        }
        if (ctx) {
            return this.getParentContext(ctx.parent, parentContext);
        }
        return undefined;

    }

    enterInsertStatement(ctx: InsertStatementContext) {
        this.insertIntoTable = this.splitName(ctx.tableRef().text).name;
        const fields = ctx.insertFromConstructor()?.fields()?.insertIdentifier().map( fields => {
            return fields.text
        }) || [];
        const values = ctx.insertFromConstructor()?.insertValues()?.valueList().values().map( values => {
            return values.text
        }) || [];
        
        this.insertParameters = fields;
        this.insertIntoValues = values;
        
    }

    enterUpdateStatement(ctx: UpdateStatementContext) {
        this.updateTable = ctx.tableReferenceList().tableReference()[0].text;
        this.updateColumns = ctx.updateList().updateElement().map( updateElement => updateElement.columnRef().text);
    }

    enterDeleteStatement(ctx: DeleteStatementContext) {
        this.deleteTable = ctx.tableRef()?.text;
    }

    enterOrderClause(ctx: OrderClauseContext) {
        ctx.orderList().orderExpression().forEach( orderByExpr => {
            if(orderByExpr.text == '?') {
                this.orderByParameter = true;
                return;
            }
        })
    }
}