import { BitExprContext, BoolPriContext, ColumnRefContext, DeleteStatementContext, ExprAndContext, ExprContext, ExprIsContext, ExprListContext, ExprNotContext, ExprOrContext, ExprXorContext, FromClauseContext, HavingClauseContext, InsertQueryExpressionContext, InsertStatementContext, PredicateContext, PredicateExprBetweenContext, PredicateExprInContext, PredicateExprLikeContext, PredicateOperationsContext, PrimaryExprAllAnyContext, PrimaryExprCompareContext, PrimaryExprIsNullContext, PrimaryExprPredicateContext, QueryContext, QueryExpressionBodyContext, QueryExpressionContext, QueryExpressionOrParensContext, QueryExpressionParensContext, QuerySpecificationContext, SelectItemContext, SelectItemListContext, SelectStatementContext, SimpleExprCaseContext, SimpleExprCastContext, SimpleExprColumnRefContext, SimpleExprContext, SimpleExprFunctionContext, SimpleExprIntervalContext, SimpleExprListContext, SimpleExprLiteralContext, SimpleExprParamMarkerContext, SimpleExprRuntimeFunctionContext, SimpleExprSubQueryContext, SimpleExprSumContext, SimpleExprWindowingFunctionContext, SingleTableContext, SubqueryContext, TableFactorContext, TableReferenceContext, TableReferenceListParensContext, UpdateStatementContext, WindowFunctionCallContext, WithClauseContext } from "ts-mysql-parser";
import { verifyNotInferred } from "../describe-query";
import { extractLimitParameters, extractOrderByParameters, getAllQuerySpecificationsFromSelectStatement, getLimitOptions, isSumExpressContext } from "./parse";
import { ColumnDef, ColumnSchema, Constraint, DynamicSqlInfo, FieldName, FragmentInfo, ParameterInfo, TraverseContext, Type, TypeAndNullInfer, TypeOperator, TypeVar } from "./types";
import { ExprOrDefault, FixedLengthParams, FunctionParams, VariableLengthParams, createColumnType, createColumnTypeFomColumnSchema, freshVar, generateTypeInfo, getDeleteColumns, getFunctionName, getInsertColumns, getInsertIntoTable, isDateLiteral, isDateTimeLiteral, isTimeLiteral, verifyDateTypesCoercion } from "./collect-constraints";
import { ExpressionAndOperator, extractFieldsFromUsingClause, extractOriginalSql, findColumn, findColumnOrNull, getColumnName, getExpressions, getSimpleExpressions, getTopLevelAndExpr, splitName } from "./select-columns";
import { inferNotNull, possibleNull } from "./infer-column-nullability";
import { inferParamNullability, inferParamNullabilityQuery, inferParamNullabilityQueryExpression } from "./infer-param-nullability";
import { ParameterDef } from "../types";
import { getPairWise, getParameterIndexes } from "./util";

export type TraverseResult = SelectStatementResult | InsertStatementResult | UpdateStatementResult | DeleteStatementResult;

export type SelectStatementResult = {
    type: 'Select';
    constraints: Constraint[];
    columns: TypeAndNullInfer[];
    parameters: TypeAndNullInfer[];
    limitParameters: ParameterInfo[];
    isMultiRow: boolean;
    orderByColumns?: string[];
    dynamicSqlInfo: DynamicSqlInfo;
}

export type InsertStatementResult = {
    type: 'Insert';
    constraints: Constraint[];
    parameters: ParameterDef[];
}

export type UpdateStatementResult = {
    type: 'Update';
    constraints: Constraint[];
    data: TypeAndNullInfer[];
    parameters: TypeAndNullInfer[];
}

export type DeleteStatementResult = {
    type: 'Delete';
    constraints: Constraint[];
    parameters: ParameterDef[];
}

export function traverseQueryContext(queryContext: QueryContext, dbSchema: ColumnSchema[], namedParameters: string[]) {
    const constraints: Constraint[] = [];
    const parameters: TypeVar[] = [];

    const traverseContext: TraverseContext = {
        constraints,
        dbSchema,
        parameters,
        fromColumns: [],
        subQueryColumns: [],
        subQuery: false,
        where: false,
        withSchema: [],
        dynamicSqlInfo: {
            with: [],
            select: [],
            from: [],
            where: []
        }
    }

    const selectStatement = queryContext.simpleStatement()?.selectStatement();
    if (selectStatement) {
        const typeInfer = traverseSelectStatement(selectStatement, traverseContext, namedParameters);
        return typeInfer;
    }
    const insertStatement = queryContext.simpleStatement()?.insertStatement();
    if (insertStatement) {
        return traverseInsertStatement(insertStatement, traverseContext);
    }
    const updateStatement = queryContext.simpleStatement()?.updateStatement();
    if (updateStatement) {
        const typeInfer = traverseUpdateStatement(updateStatement, traverseContext, namedParameters);
        return typeInfer;
    }
    const deleteStatement = queryContext.simpleStatement()?.deleteStatement();
    if (deleteStatement) {
        const typeInfer = traverseDeleteStatement(deleteStatement, traverseContext);
        return typeInfer;
    }
    throw Error('traverseSql - not supported: ' + queryContext.constructor.name);
}


function traverseSelectStatement(selectStatement: SelectStatementContext, traverseContext: TraverseContext, namedParameters: string[]): SelectStatementResult {

    const queryExpression = selectStatement.queryExpression();
    if (queryExpression) {
        const result = traverseQueryExpression(queryExpression, traverseContext);

        const orderByParameters = extractOrderByParameters(selectStatement);
        const limitParameters = extractLimitParameters(selectStatement);

        const paramInference = inferParamNullabilityQueryExpression(queryExpression);

        const allParameters = traverseContext.parameters
            .map((param, index) => {
                const param2: TypeAndNullInfer = {
                    name: param.name,
                    type: param,
                    notNull: paramInference[index],
                    table: ''
                }
                return param2;
            });
        const paramIndexes = getParameterIndexes(namedParameters.slice(0, allParameters.length)); //for [a, a, b, a] will return a: [0, 1, 3]; b: [2]
        paramIndexes.forEach(paramIndex => {
            getPairWise(paramIndex.indexes, (cur, next) => { //for [0, 1, 3] will return [0, 1], [1, 3]
                traverseContext.constraints.push({
                    expression: paramIndex.paramName,
                    type1: allParameters[cur].type,
                    type2: allParameters[next].type
                })
            });
        })

        const isMultiRow = isMultipleRowResult(selectStatement, result.fromColumns);
        const traverseResult: SelectStatementResult = {
            type: 'Select',
            constraints: traverseContext.constraints,
            columns: result.columns,
            parameters: allParameters,
            limitParameters,
            isMultiRow,
            dynamicSqlInfo: traverseContext.dynamicSqlInfo
        };
        const orderByColumns = orderByParameters.length > 0 ? getOrderByColumns(result.fromColumns, result.columns) : undefined;
        if (orderByColumns) {
            traverseResult.orderByColumns = orderByColumns;
        }
        return traverseResult;
    }
    throw Error('traverseSelectStatement - not supported: ' + selectStatement.text);
}

export function traverseInsertStatement(insertStatement: InsertStatementContext, traverseContext: TraverseContext): InsertStatementResult {

    const allParameters: ParameterDef[] = [];
    const paramsNullability: { [paramId: string]: boolean } = {};

    let exprOrDefaultList: ExprOrDefault[][] = [];
    const valuesContext = insertStatement.insertFromConstructor()?.insertValues().valueList().values();
    if (valuesContext) {
        exprOrDefaultList = valuesContext.map(valueContext => valueContext.children?.filter(valueContext => valueContext instanceof ExprIsContext || valueContext.text == 'DEFAULT') as ExprOrDefault[] || []);
    }

    const insertIntoTable = getInsertIntoTable(insertStatement);

    const fromColumns = traverseContext.dbSchema
        .filter(c => c.table == insertIntoTable)
        .map(c => {
            const col: ColumnDef = {
                table: c.table,
                columnName: c.column,
                columnType: freshVar(c.column, c.column_type),
                columnKey: c.columnKey,
                notNull: c.notNull
            }
            return col;
        })
    const insertColumns = getInsertColumns(insertStatement, fromColumns);
    traverseContext.fromColumns = insertColumns;

    exprOrDefaultList.forEach(exprOrDefault => {
        exprOrDefault.forEach((expr, index) => {
            const column = insertColumns[index];

            if (expr instanceof ExprContext) {
                const numberParamsBefore = traverseContext.parameters.length;
                const exprType = traverseExpr(expr, traverseContext);
                const paramNullabilityExpr = inferParamNullability(expr);
                traverseContext.parameters.slice(numberParamsBefore).forEach(param => {
                    paramsNullability[param.id] = paramNullabilityExpr.every(n => n) && column.notNull;
                })
                traverseContext.constraints.push({
                    expression: expr.text,
                    //TODO - CHANGING ORDER SHOULDN'T AFFECT THE TYPE INFERENCE
                    type1: exprType.kind == 'TypeOperator' ? exprType.types[0] : exprType,
                    type2: freshVar(column.columnName, column.columnType.type)
                })
            }
            else {

            }
        })
    })

    const updateList = insertStatement.insertUpdateList()?.updateList().updateElement() || [];
    updateList.forEach(updateElement => {
        const columnName = updateElement.columnRef().text;
        const field = splitName(columnName);
        const expr = updateElement.expr();
        if (expr) {
            const numberParamsBefore = traverseContext.parameters.length;
            const exprType = traverseExpr(expr, traverseContext);
            const column = findColumn(field, fromColumns);
            traverseContext.parameters.slice(numberParamsBefore).forEach(param => {
                paramsNullability[param.id] = column.notNull;
            })
            traverseContext.constraints.push({
                expression: expr.text,
                type1: exprType,
                type2: freshVar(column.columnName, column.columnType.type)
            })
        }
    });

    const insertQueryExpression = insertStatement.insertQueryExpression();
    if (insertQueryExpression) {
        //TODO - REMOVE numberParamsBefore (walk first insertQueryExpression)
        const numberParamsBefore = traverseContext.parameters.length;
        const exprTypes = traverseInsertQueryExpression(insertQueryExpression, traverseContext);

        exprTypes.columns.forEach((type, index) => {
            const column = insertColumns[index];
            if (type.type.kind == 'TypeVar') {
                paramsNullability[type.type.id] = column.notNull;
            }
            traverseContext.constraints.push({
                expression: insertQueryExpression.text,
                type1: type.type,
                type2: freshVar(column.columnName, column.columnType.type)
            })

        })
        const paramNullabilityExpr = inferParamNullabilityQuery(insertQueryExpression);
        traverseContext.parameters.slice(numberParamsBefore).forEach((param, index) => {
            if (paramsNullability[param.id] == null) {
                paramsNullability[param.id] = paramNullabilityExpr[index];
            }
        })

    }

    const typeInfo = generateTypeInfo(traverseContext.parameters, traverseContext.constraints);
    typeInfo.forEach((param, index) => {
        const paramId = traverseContext.parameters[index].id;
        allParameters.push({
            name: 'param' + (allParameters.length + 1),
            columnType: verifyNotInferred(param),
            notNull: paramsNullability[paramId]
        })
    })

    const typeInferenceResult: InsertStatementResult = {
        type: 'Insert',
        constraints: traverseContext.constraints,
        parameters: allParameters
    }
    return typeInferenceResult;
}


function traverseUpdateStatement(updateStatement: UpdateStatementContext, traverseContext: TraverseContext, namedParamters: string[]): UpdateStatementResult {

    const updateElement = updateStatement.updateList().updateElement();
    const withClause = updateStatement.withClause();
    const withSchema: ColumnDef[] = [];

    if (withClause) {
        traverseWithClause(withClause, traverseContext);
    }

    const updateColumns = getUpdateColumns(updateStatement, traverseContext);
    traverseContext.fromColumns = updateColumns;

    const dataTypes: TypeAndNullInfer[] = [];
    const whereParameters: TypeAndNullInfer[] = [];
    const paramsBefore = traverseContext.parameters.length;
    const whereExpr = updateStatement.whereClause()?.expr();
    const paramNullability = inferParamNullability(updateStatement);

    updateElement.forEach(updateElement => {
        const expr = updateElement.expr();
        if (expr) {
            const paramBeforeExpr = traverseContext.parameters.length;
            const result = traverseExpr(expr, traverseContext);
            const columnName = updateElement.columnRef().text;
            const field = splitName(columnName);
            const column = findColumn(field, updateColumns);
            traverseContext.constraints.push({
                expression: updateStatement.text,
                type1: result,
                type2: column.columnType //freshVar(column.columnName, )
            })
            traverseContext.parameters.slice(paramBeforeExpr, traverseContext.parameters.length).forEach((param, index) => {
                dataTypes.push({
                    name: namedParamters[paramBeforeExpr + index] || field.name,
                    type: param,
                    notNull: column.notNull && paramNullability[index],
                    table: ''
                })
            })

        }
    });

    const paramsAfter = traverseContext.parameters.length;

    if (whereExpr) {
        traverseExpr(whereExpr, traverseContext);
    }

    traverseContext.parameters.slice(0, paramsBefore).forEach((param, index) => {
        whereParameters.push({
            name: namedParamters[index] || 'param' + (whereParameters.length + 1),
            type: param,
            notNull: paramNullability[index],
            table: ''
        })
    })
    traverseContext.parameters.slice(paramsAfter).forEach((param, index) => {
        whereParameters.push({
            name: namedParamters[paramsAfter + index] || 'param' + (whereParameters.length + 1),
            type: param,
            notNull: paramNullability[paramsAfter + index],
            table: ''
        })
    })

    const typeInferenceResult: UpdateStatementResult = {
        type: 'Update',
        constraints: traverseContext.constraints,
        data: dataTypes,
        parameters: whereParameters
    }

    return typeInferenceResult;
}

export function traverseDeleteStatement(deleteStatement: DeleteStatementContext, traverseContext: TraverseContext): DeleteStatementResult {

    const whereExpr = deleteStatement.whereClause()?.expr();
    const deleteColumns = getDeleteColumns(deleteStatement, traverseContext.dbSchema);
    traverseContext.fromColumns = deleteColumns;
    const allParameters: ParameterDef[] = [];

    if (whereExpr) {

        traverseExpr(whereExpr, traverseContext);
        const typeInfo = generateTypeInfo(traverseContext.parameters, traverseContext.constraints);

        const paramNullability = inferParamNullability(whereExpr);
        typeInfo.forEach((param, paramIndex) => {
            allParameters.push({
                name: 'param' + (allParameters.length + 1),
                columnType: verifyNotInferred(param),
                notNull: paramNullability[paramIndex]
            })
        })
    }


    const typeInferenceResult: DeleteStatementResult = {
        type: 'Delete',
        constraints: traverseContext.constraints,
        parameters: allParameters
    }
    return typeInferenceResult;
}

export function getUpdateColumns(updateStatement: UpdateStatementContext, traverseContext: TraverseContext) {
    const tableReferences = updateStatement.tableReferenceList().tableReference();
    const columns = traverseTableReferenceList(tableReferences, traverseContext, null)
    return columns;
}

function traverseInsertQueryExpression(insertQueryExpression: InsertQueryExpressionContext, traverseContext: TraverseContext): QuerySpecificationResult {
    const queryExpressionOrParens = insertQueryExpression.queryExpressionOrParens();
    return traverseQueryExpressionOrParens(queryExpressionOrParens, traverseContext);
}

function traverseQueryExpressionOrParens(queryExpressionOrParens: QueryExpressionOrParensContext, traverseContext: TraverseContext): QuerySpecificationResult {
    const queryExpression = queryExpressionOrParens.queryExpression();
    if (queryExpression) {
        return traverseQueryExpression(queryExpression, traverseContext)
    }
    const queryEpressionParens = queryExpressionOrParens.queryExpressionParens();
    if (queryEpressionParens) {
        return traverseQueryExpressionParens(queryEpressionParens, traverseContext)
    }
    throw Error("walkQueryExpressionOrParens");
}

function traverseQueryExpression(queryExpression: QueryExpressionContext, traverseContext: TraverseContext, recursiveNames?: string[]): QuerySpecificationResult {
    const withClause = queryExpression.withClause();
    if (withClause) {
        traverseWithClause(withClause, traverseContext);
    }

    const queryExpressionBody = queryExpression.queryExpressionBody();
    if (queryExpressionBody) {
        return traverseQueryExpressionBody(queryExpressionBody, traverseContext, recursiveNames)
    }
    const queryExpressionParens = queryExpression.queryExpressionParens();
    if (queryExpressionParens) {
        return traverseQueryExpressionParens(queryExpressionParens, traverseContext, recursiveNames);
    }
    throw Error("walkQueryExpression");
}

function traverseQueryExpressionParens(queryExpressionParens: QueryExpressionParensContext, traverseContext: TraverseContext, recursiveNames?: string[]): QuerySpecificationResult {
    const queryExpression = queryExpressionParens.queryExpression();
    if (queryExpression) {
        return traverseQueryExpression(queryExpression, traverseContext, recursiveNames);
    }
    const queryExpressionParens2 = queryExpressionParens.queryExpressionParens();
    if (queryExpressionParens2) {
        return traverseQueryExpressionParens(queryExpressionParens, traverseContext, recursiveNames);
    }
    throw Error("walkQueryExpressionParens");
}

function createUnionVar(type: TypeVar, name: string) {
    const newVar: TypeVar = { ...type, name: name, table: '' };
    return newVar;
}

function traverseQueryExpressionBody(queryExpressionBody: QueryExpressionBodyContext, traverseContext: TraverseContext, recursiveNames?: string[]): QuerySpecificationResult {
    const allQueries = getAllQuerySpecificationsFromSelectStatement(queryExpressionBody);
    const [first, ...unionQuerySpec] = allQueries;
    const mainQueryResult = traverseQuerySpecification(first, traverseContext);

    const resultTypes = mainQueryResult.columns.map((t, index) => unionQuerySpec.length == 0 ? t.type : createUnionVar(t.type, recursiveNames && recursiveNames.length > 0 ? recursiveNames[index] : t.name)); //TODO mover para traversequeryspecificat?

    for (let queryIndex = 0; queryIndex < unionQuerySpec.length; queryIndex++) {
        const columnNames = recursiveNames && recursiveNames.length > 0 ? recursiveNames : mainQueryResult.columns.map(col => col.name);
        const newFromColumns = recursiveNames ? renameFromColumns(mainQueryResult.columns, columnNames) : [];
        const unionQuery = unionQuerySpec[queryIndex];
        const unionResult = traverseQuerySpecification(unionQuery, { ...traverseContext, fromColumns: newFromColumns });

        resultTypes.forEach((t2, index) => {
            mainQueryResult.columns[index].notNull = mainQueryResult.columns[index].notNull && unionResult.columns[index].notNull;
            traverseContext.constraints.push({
                expression: 'union',
                coercionType: 'Union',
                mostGeneralType: true,
                type1: t2,
                type2: unionResult.columns[index].type
            })
        });
    }
    const resultTypeAndNotNull = resultTypes.map((c, index) => {
        const col: TypeAndNullInfer = {
            name: resultTypes[index].name,
            type: resultTypes[index],
            notNull: mainQueryResult.columns[index].notNull,
            table: c.table || ''
        }
        return col;
    });
    const result: QuerySpecificationResult = {
        columns: resultTypeAndNotNull,
        fromColumns: mainQueryResult.fromColumns
    };
    return result;
}

type QuerySpecificationResult = {
    columns: TypeAndNullInfer[];
    fromColumns: ColumnDef[];
}

function renameFromColumns(fromColumns: TypeAndNullInfer[], recursiveNames: string[]): ColumnDef[] {
    const newFromColumns = fromColumns.map((col, index) => {
        const newCol: ColumnDef = {
            table: "",
            columnName: recursiveNames[index],
            columnType: col.type,
            columnKey: "",
            notNull: col.notNull
        }
        return newCol;
    });
    return newFromColumns;
}

export function traverseQuerySpecification(querySpec: QuerySpecificationContext, traverseContext: TraverseContext): QuerySpecificationResult {
    const fromClause = querySpec.fromClause();
    const fromColumnsFrom = fromClause ? traverseFromClause(fromClause, traverseContext) : [];
    const allColumns = traverseContext.subQuery ? traverseContext.fromColumns.concat(fromColumnsFrom) : fromColumnsFrom;     //(... where id = t1.id)
    const selectItemListResult = traverseSelectItemList(querySpec.selectItemList(), { ...traverseContext, fromColumns: allColumns, subQueryColumns: fromColumnsFrom });

    const whereClause = querySpec.whereClause();
    //TODO - HAVING, BLAH
    if (whereClause) {
        const whereExpr = whereClause?.expr();
        traverseExpr(whereExpr, { ...traverseContext, fromColumns: allColumns, subQueryColumns: fromColumnsFrom, where: !traverseContext.subQuery });
    }


    const columnNullability = inferNotNull(querySpec, traverseContext.dbSchema, allColumns);

    const columns = selectItemListResult.types.map((t, index) => {
        const resultType: TypeAndNullInfer = {
            name: t.name,
            type: t,
            notNull: columnNullability[index],
            table: t.table || ''
        }
        return resultType;

    });

    const havingClause = querySpec.havingClause();
    if (havingClause) {
        const selectColumns: ColumnDef[] = columns.map(c => {
            const col: ColumnDef = {
                table: "",
                columnName: c.name,
                columnType: c.type,
                columnKey: "",
                notNull: c.notNull
            }
            return col;
        })
        traverseHavingClause(havingClause, { ...traverseContext, fromColumns: selectColumns.concat(fromColumnsFrom) });
    }
    return {
        columns,
        fromColumns: fromColumnsFrom
    };
}

export function traverseWithClause(withClause: WithClauseContext, traverseContext: TraverseContext) {
    //result1, result2
    withClause.commonTableExpression().forEach(commonTableExpression => {
        const identifier = commonTableExpression.identifier().text;
        const recursiveNames = withClause.RECURSIVE_SYMBOL() ? commonTableExpression.columnInternalRefList()?.columnInternalRef().map(t => t.text) || [] : undefined;
        const subQuery = commonTableExpression.subquery();
        const subqueryResult = traverseSubquery(subQuery, traverseContext, recursiveNames); //recursive= true??
        subqueryResult.columns.forEach(col => {
            const withCol: ColumnDef = {
                table: identifier,
                columnName: col.name,
                columnType: col.type,
                columnKey: "",
                notNull: col.notNull
            }
            traverseContext.withSchema.push(withCol);
        })
        traverseContext.dynamicSqlInfo.with?.push({
            fragment: extractOriginalSql(commonTableExpression) + '',
            relation: identifier,
            fields: [],
            dependOnFields: [],
            dependOnParams: [],
            parameters: [], //Array.from({ length: paramsAfter - paramBefore }, (x, i) => i + paramBefore),
            dependOn: []
        })
    });
}

function traverseFromClause(fromClause: FromClauseContext, traverseContext: TraverseContext): ColumnDef[] {
    const tableReferenceList = fromClause.tableReferenceList()?.tableReference();

    const fromColumns = tableReferenceList ? traverseTableReferenceList(tableReferenceList, traverseContext, null) : [];

    return fromColumns;
}

function traverseTableReferenceList(tableReferenceList: TableReferenceContext[], traverseContext: TraverseContext, currentFragment: FragmentInfo | null): ColumnDef[] {

    const result: ColumnDef[] = [];
    const fragements: FragmentInfo[] = [];

    tableReferenceList.forEach(tab => {
        const tableFactor = tab.tableFactor();
        if (tableFactor) {
            let paramBefore = traverseContext.parameters.length;
            const fields = traverseTableFactor(tableFactor, traverseContext, currentFragment);
            let paramsAfter = traverseContext.parameters.length;
            result.push(...fields);
            fragements.push({
                fragment: 'FROM ' + extractOriginalSql(tableFactor) + '',
                fields: [], //fields.map(field => ({ field: field.columnName, name: field.columnName, table: field.table })),
                dependOnFields: [],
                dependOnParams: [],
                parameters: Array.from({ length: paramsAfter - paramBefore }, (x, i) => i + paramBefore),
                dependOn: []
            })
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

            if (tableReferences) {
                const innerJoinFragment: FragmentInfo = {
                    fragment: extractOriginalSql(joined) + '',
                    fields: [],
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: [],
                    dependOn: []
                }

                const usingFields = extractFieldsFromUsingClause(joined);
                const paramsBefore = traverseContext.parameters.length;
                const joinedFields = traverseTableReferenceList([tableReferences], traverseContext, innerJoinFragment);
                const paramsAfter = traverseContext.parameters.length;
                //doesn't duplicate the fields of the USING clause. Ex. INNER JOIN mytable2 USING(id);
                const joinedFieldsFiltered = usingFields.length > 0 ? filterUsingFields(joinedFields, usingFields) : joinedFields;
                allJoinedColumns.push(joinedFieldsFiltered);

                innerJoinFragment.fields = [...joinedFieldsFiltered.map(f => ({
                    field: f.columnName,
                    table: f.tableAlias || f.table,
                    name: f.columnName
                }))]
                innerJoinFragment.parameters = Array.from({ length: paramsAfter - paramsBefore }, (x, i) => i + paramsAfter - 1);
                fragements.push(innerJoinFragment)

                const onClause = joined.expr(); //ON expr
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

                    traverseExpr(onClause, { ...traverseContext, fromColumns: allJoinedColumns.flatMap(c => c).concat(result) })
                    const columns = getExpressions(onClause, SimpleExprColumnRefContext);
                    columns.forEach(columnRef => {
                        const fieldName = splitName(columnRef.expr.text);
                        if (innerJoinFragment?.relation != fieldName.prefix) {
                            innerJoinFragment.parentRelation = fieldName.prefix
                        }
                    });

                }
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

    });
    if (!traverseContext.subQuery) {
        traverseContext.dynamicSqlInfo.from = fragements;
    }
    return result;
}

function traverseTableFactor(tableFactor: TableFactorContext, traverseContext: TraverseContext, currentFragment: FragmentInfo | null): ColumnDef[] {

    const singleTable = tableFactor.singleTable();
    if (singleTable) {
        return traverseSingleTable(singleTable, traverseContext.dbSchema, traverseContext.withSchema, currentFragment, traverseContext.dynamicSqlInfo.with);
    }

    const derivadTable = tableFactor.derivedTable();
    if (derivadTable) {
        const tableAlias = derivadTable.tableAlias()?.identifier().text;
        if (currentFragment) {
            currentFragment.relation = tableAlias;
        }
        const subQuery = derivadTable.subquery();
        if (subQuery) {
            const subQueryResult = traverseSubquery(subQuery, traverseContext);
            const result = subQueryResult.columns.map(t => {
                const colDef: ColumnDef = {
                    table: tableAlias || '',
                    columnName: t.name,
                    columnType: t.type,
                    columnKey: "",
                    notNull: t.notNull,
                    tableAlias: tableAlias
                }
                return colDef;
            })
            return result;
        }
    }
    const tableReferenceListParens = tableFactor.tableReferenceListParens();
    if (tableReferenceListParens) {
        const listParens = traverseTableReferenceListParens(tableReferenceListParens, traverseContext);
        return listParens;
    }
    throw Error('traverseTableFactor - not supported: ' + tableFactor.constructor.name);
}

//tableReferenceList | tableReferenceListParens
function traverseTableReferenceListParens(ctx: TableReferenceListParensContext, traverseContext: TraverseContext): ColumnDef[] {

    const tableReferenceList = ctx.tableReferenceList();
    if (tableReferenceList) {
        return traverseTableReferenceList(tableReferenceList.tableReference(), traverseContext, null);
    }

    const tableReferenceListParens = ctx.tableReferenceListParens();

    if (tableReferenceListParens) {
        return traverseTableReferenceListParens(tableReferenceListParens, traverseContext);
    }

    throw Error('traverseTableReferenceListParens - not supported: ' + ctx.constructor.name);
}

function traverseSingleTable(singleTable: SingleTableContext, dbSchema: ColumnSchema[], withSchema: ColumnDef[], currentFragment: FragmentInfo | null, withFragments: FragmentInfo[] | undefined): ColumnDef[] {
    const table = singleTable?.tableRef().text;
    const tableAlias = singleTable?.tableAlias()?.identifier().text;
    const tableName = splitName(table);
    if (currentFragment) {
        currentFragment.relation = tableAlias || tableName.name;
    }
    withFragments?.forEach(withFragment => {
        if (withFragment.relation == table) {
            withFragment.parentRelation = tableAlias || tableName.name;
        }
    })
    const fields = filterColumns(dbSchema, withSchema, tableAlias, tableName)
    return fields;
}

function traverseSubquery(subQuery: SubqueryContext, traverseContext: TraverseContext, recursiveNames?: string[] | undefined): QuerySpecificationResult {
    const queryExpressionParens = subQuery.queryExpressionParens();
    const queryExpression = queryExpressionParens.queryExpression();
    if (queryExpression) {
        return traverseQueryExpression(queryExpression, { ...traverseContext, subQuery: true }, recursiveNames);
    }
    const queryExpressionParens2 = queryExpressionParens.queryExpressionParens();
    if (queryExpressionParens2) {
        return traverseQueryExpressionParens(queryExpressionParens2, traverseContext);
    }
    throw Error('traverseSubquery - not expected: ' + subQuery.constructor.name);
}

function traverseSelectItemList(selectItemList: SelectItemListContext, traverseContext: TraverseContext): TypeOperator {
    const listType: TypeVar[] = [];
    if (selectItemList.MULT_OPERATOR()) {
        traverseContext.fromColumns.forEach(col => {
            const columnType = createColumnType(col);
            listType.push(columnType);
            const tableName = col.tableAlias || col.table;
            const fieldFragment: FragmentInfo = {
                fragment: `${tableName}.${col.columnName}`,
                fragementWithoutAlias: `${tableName}.${col.columnName}`,
                fields: [{
                    field: col.columnName,
                    name: col.columnName,
                    table: tableName
                }],
                dependOnFields: [],
                dependOnParams: [],
                parameters: [],
                dependOn: [tableName]
            }
            if (!traverseContext.subQuery) {
                traverseContext.dynamicSqlInfo.select.push(fieldFragment);
            }
        })
    }
    selectItemList.selectItem().forEach(selectItem => {
        const tableWild = selectItem.tableWild();
        if (tableWild) {
            if (tableWild.MULT_OPERATOR()) {
                const itemName = splitName(selectItem.text);
                const allColumns = selectAllColumns(itemName.prefix, traverseContext.fromColumns);
                allColumns.forEach(col => {
                    const columnType = createColumnType(col);
                    listType.push(columnType);
                })
            }
        }
        const expr = selectItem.expr();
        if (expr) {
            const selectFragment: FragmentInfo = {
                fragment: extractOriginalSql(selectItem) + '',
                fragementWithoutAlias: extractOriginalSql(expr),
                fields: [],
                dependOnFields: [],
                dependOnParams: [],
                parameters: [],
                dependOn: []
            }
            const exprType = traverseExpr(expr, { ...traverseContext, currentFragement: traverseContext.subQuery ? traverseContext.currentFragement : selectFragment });
            if (!traverseContext.subQuery) {
                traverseContext.dynamicSqlInfo.select?.push(selectFragment);
            }
            // const fields = exprType.kind == 'TypeVar' ? [{ field: exprType.name, table: exprType.table + '', name: getColumnName(selectItem) }] : []


            if (exprType.kind == 'TypeOperator') {
                const subqueryType = exprType.types[0] as TypeVar;
                subqueryType.name = getColumnName(selectItem);
                listType.push(subqueryType);
            }
            else if (exprType.kind == 'TypeVar') {
                exprType.name = getColumnName(selectItem);
                listType.push({ ...exprType }); //clone
            }
        }
    });
    const result: TypeOperator = {
        kind: 'TypeOperator',
        types: listType
    };
    return result;
}

function traverseHavingClause(havingClause: HavingClauseContext, traverseContext: TraverseContext) {
    const havingExpr = havingClause.expr();
    traverseExpr(havingExpr, traverseContext);
}

function traverseExpr(expr: ExprContext, traverseContext: TraverseContext): Type {

    if (expr instanceof ExprIsContext) {
        const boolPri = expr.boolPri();

        let paramsCount = traverseContext.parameters.length;
        const boolPriType = traverseBoolPri(boolPri, traverseContext);

        if (traverseContext.where) {
            const currentFragment: FragmentInfo = {
                fragment: 'AND ' + extractOriginalSql(expr),
                fields: [],
                dependOnFields: [],
                dependOnParams: [],
                parameters: [],
                dependOn: []
            }
            const paramsRight = getExpressions(expr, SimpleExprParamMarkerContext);
            paramsRight.forEach(_ => {
                currentFragment.dependOnParams.push(paramsCount);
                paramsCount++;
            });
            const columnsRef = getExpressions(expr, ColumnRefContext);
            columnsRef.forEach(colRef => {
                const fileName = splitName(colRef.expr.text);
                currentFragment.fields.push({
                    field: fileName.name,
                    name: fileName.name,
                    table: fileName.prefix
                })
            })
            traverseContext.dynamicSqlInfo.where.push(currentFragment);
        }

        return boolPriType;
    }
    if (expr instanceof ExprNotContext) {
        const expr2 = expr.expr();
        if (expr2) {
            return traverseExpr(expr2, traverseContext);
        }
        return freshVar(expr.text, 'tinyint');;
    }
    if (expr instanceof ExprAndContext || expr instanceof ExprXorContext || expr instanceof ExprOrContext) {
        const all: ExpressionAndOperator[] = [];
        getTopLevelAndExpr(expr, all);
        all.forEach(andExpression => {

            let paramsCount = traverseContext.parameters.length;
            traverseExpr(andExpression.expr, { ...traverseContext, where: false })
            if (traverseContext.where) {
                const currentFragment: FragmentInfo = {
                    fragment: andExpression.operator + ' ' + extractOriginalSql(andExpression.expr),
                    fields: [],
                    dependOnFields: [],
                    dependOnParams: [],
                    parameters: [],
                    dependOn: []
                }
                const paramsRight = getExpressions(andExpression.expr, SimpleExprParamMarkerContext);
                paramsRight.forEach(_ => {
                    currentFragment.dependOnParams.push(paramsCount);
                    paramsCount++;
                });
                const columnsRef = getExpressions(andExpression.expr, ColumnRefContext);
                columnsRef.forEach(colRef => {
                    const fileName = splitName(colRef.expr.text);
                    currentFragment.fields.push({
                        field: fileName.name,
                        name: fileName.name,
                        table: fileName.prefix
                    })
                })
                traverseContext.dynamicSqlInfo.where.push(currentFragment);
            }

        })
        return freshVar(expr.text, 'tinyint');
    }

    throw Error('traverseExpr - not supported: ' + expr.text);
}

function traverseBoolPri(boolPri: BoolPriContext, traverseContext: TraverseContext): Type {
    if (boolPri instanceof PrimaryExprPredicateContext) {
        const predicate = boolPri.predicate();
        const predicateType = traversePredicate(predicate, traverseContext);
        return predicateType;
    }
    if (boolPri instanceof PrimaryExprIsNullContext) {
        const boolPri2 = boolPri.boolPri();
        traverseBoolPri(boolPri2, traverseContext);
        return freshVar(boolPri.text, 'tinyint');
    }
    if (boolPri instanceof PrimaryExprCompareContext) {

        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.predicate();
        // let paramsCount = traverseContext.parameters.length;
        const typeLeft = traverseBoolPri(compareLeft, traverseContext);
        const typeRight = traversePredicate(compareRight, traverseContext);

        traverseContext.constraints.push({
            expression: boolPri.text,
            type1: typeLeft,
            type2: typeRight
        })


        return freshVar(boolPri.text, 'tinyint');
    }
    if (boolPri instanceof PrimaryExprAllAnyContext) {
        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.subquery();
        const typeLeft = traverseBoolPri(compareLeft, traverseContext);
        const subQueryResult = traverseSubquery(compareRight, traverseContext);
        traverseContext.constraints.push({
            expression: boolPri.text,
            type1: typeLeft,
            type2: {
                kind: 'TypeOperator',
                types: subQueryResult.columns.map(t => t.type)
            }
        })
        return freshVar(boolPri.text, 'tinyint');
    }

    throw Error('traverseExpr - not supported: ' + boolPri.constructor.name);

}

function traversePredicate(predicate: PredicateContext, traverseContext: TraverseContext): Type {
    const bitExpr = predicate.bitExpr()[0]; //TODO - predicate length = 2? [1] == predicateOperations
    const bitExprType = traverseBitExpr(bitExpr, traverseContext);
    const predicateOperations = predicate.predicateOperations();
    if (predicateOperations) {
        const rightType = traversePredicateOperations(predicateOperations, bitExprType, traverseContext);
        if (bitExprType.kind == 'TypeOperator' && rightType.kind == 'TypeOperator') {
            rightType.types.forEach((t, i) => {
                traverseContext.constraints.push({
                    expression: predicateOperations.text,
                    type1: t, // ? array of id+id
                    type2: bitExprType.types[i],
                    mostGeneralType: true
                })

            })

        }
        if (bitExprType.kind == 'TypeVar' && rightType.kind == 'TypeOperator') {

            rightType.types.forEach((t, i) => {
                traverseContext.constraints.push({
                    expression: predicateOperations.text,
                    type1: bitExprType, // ? array of id+id
                    type2: { ...t, list: true },
                    mostGeneralType: true
                })
            })
            // return rightType.types[0];
        }

        return bitExprType;

    }
    return bitExprType;
}

function traverseExprList(exprList: ExprListContext, traverseContext: TraverseContext): Type {

    const listType = exprList.expr().map(item => {
        const exprType = traverseExpr(item, traverseContext);
        return exprType as TypeVar;

    })
    const type: TypeOperator = {
        kind: 'TypeOperator',
        types: listType
    }
    return type;
}

function traverseBitExpr(bitExpr: BitExprContext, traverseContext: TraverseContext): Type {
    const simpleExpr = bitExpr.simpleExpr();
    if (simpleExpr) {
        return traverseSimpleExpr(simpleExpr, { ...traverseContext, where: false });
    }
    if (bitExpr.bitExpr().length == 2) {



        const bitExprLeft = bitExpr.bitExpr()[0];
        const typeLeftTemp = traverseBitExpr(bitExprLeft, traverseContext);
        const typeLeft = typeLeftTemp.kind == 'TypeOperator' ? typeLeftTemp.types[0] : typeLeftTemp;
        //const newTypeLeft = typeLeft.name == '?'? freshVar('?', 'bigint') : typeLeft;

        const bitExprRight = bitExpr.bitExpr()[1]
        const typeRightTemp = traverseBitExpr(bitExprRight, traverseContext);

        //In the expression 'id + (value + 2) + ?' the '(value+2)' is treated as a SimpleExprListContext and return a TypeOperator
        const typeRight = typeRightTemp.kind == 'TypeOperator' ? typeRightTemp.types[0] : typeRightTemp;
        //const newTypeRight = typeRight.name == '?'? freshVar('?', 'bigint') : typeRight;
        const bitExprType = freshVar(bitExpr.text, '?');
        if (typeLeftTemp.kind == 'TypeVar' && typeRightTemp.kind == 'TypeVar' && typeLeftTemp.table == typeRightTemp.table) {
            bitExprType.table = typeLeftTemp.table;
        }
        //PRECISA?
        // traverseContext.constraints.push({
        //     expression: bitExpr.text,
        //     type1: typeLeft,
        //     type2: typeRight,
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })


        // traverseContext.constraints.push({
        //     expression: bitExpr.text,
        //     type1: typeLeft,
        //     type2: typeRight,
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })
        // traverseContext.constraints.push({
        //     expression: bitExpr.text,
        //     type1: bitExprType,
        //     type2: typeRight,
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })
        traverseContext.constraints.push({
            expression: bitExprLeft.text,
            type1: bitExprType,
            type2: typeLeft,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        traverseContext.constraints.push({
            expression: bitExprRight.text,
            type1: bitExprType,
            type2: typeRight,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        // const resultType = freshVar(bitExprRight.text, 'number');
        // traverseContext.constraints.push({
        //     expression: bitExprRight.text,
        //     type1: resultType,
        //     type2: freshVar(bitExprRight.text, 'number'),
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })

        return bitExprType;
    }

    if (bitExpr.INTERVAL_SYMBOL()) {
        const bitExpr2 = bitExpr.bitExpr()[0];
        const leftType = traverseBitExpr(bitExpr2, traverseContext);
        const expr = bitExpr.expr()!; //expr interval
        traverseExpr(expr, traverseContext);
        traverseContext.constraints.push({
            expression: bitExpr.text,
            type1: leftType,
            type2: freshVar('datetime', 'datetime')
        })
        return freshVar('datetime', 'datetime');

    }
    throw Error('traverseBitExpr - not supported: ' + bitExpr.constructor.name);
}

function traversePredicateOperations(predicateOperations: PredicateOperationsContext, parentType: Type, traverseContext: TraverseContext): Type {
    if (predicateOperations instanceof PredicateExprInContext) {

        const subquery = predicateOperations.subquery();
        if (subquery) {
            const subQueryResult = traverseSubquery(subquery, traverseContext);
            return { kind: 'TypeOperator', types: subQueryResult.columns.map(t => t.type) };
        }
        const exprList = predicateOperations.exprList();
        if (exprList) {
            const rightType = traverseExprList(exprList, { ...traverseContext, where: false });
            return rightType;
        }
    }

    if (predicateOperations instanceof PredicateExprLikeContext) {
        const simpleExpr = predicateOperations.simpleExpr()[0];
        const rightType = traverseSimpleExpr(simpleExpr, { ...traverseContext, where: false });
        traverseContext.constraints.push({
            expression: simpleExpr.text,
            type1: parentType,
            type2: rightType
        })

        return rightType;

    }
    if (predicateOperations instanceof PredicateExprBetweenContext) {
        const bitExpr = predicateOperations.bitExpr();
        const predicate = predicateOperations.predicate();
        const bitExprType = traverseBitExpr(bitExpr, traverseContext);
        const predicateType = traversePredicate(predicate, traverseContext);
        traverseContext.constraints.push({
            expression: predicateOperations.text,
            type1: parentType,
            type2: bitExprType
        });
        traverseContext.constraints.push({
            expression: predicateOperations.text,
            type1: parentType,
            type2: predicateType
        });
        traverseContext.constraints.push({
            expression: predicateOperations.text,
            type1: bitExprType,
            type2: predicateType
        });
        return bitExprType;
    }
    throw Error("Not supported: " + predicateOperations.constructor.name);

}

function traverseSimpleExpr(simpleExpr: SimpleExprContext, traverseContext: TraverseContext): Type {
    if (simpleExpr instanceof SimpleExprColumnRefContext) {
        const fieldName = splitName(simpleExpr.text);
        const column = findColumn(fieldName, traverseContext.fromColumns);
        const typeVar = freshVar(column.columnName, column.columnType.type, column.tableAlias || column.table);
        traverseContext.constraints.push({
            expression: simpleExpr.text,
            type1: typeVar,
            type2: column.columnType,
            mostGeneralType: true
        })
        if (traverseContext.currentFragement != null) {
            if (!traverseContext.subQuery) {
                traverseContext.currentFragement.dependOn.push(column.tableAlias || column.table)
            }
            else {
                const subQueryColumn = findColumnOrNull(fieldName, traverseContext.subQueryColumns);
                if (subQueryColumn == null) {
                    traverseContext.currentFragement.dependOn.push(column.tableAlias || column.table);
                }
            }
        }
        return typeVar;
    }
    if (simpleExpr instanceof SimpleExprParamMarkerContext) {
        const param = freshVar('?', '?');
        traverseContext.parameters.push(param);
        return param;
    }
    if (simpleExpr instanceof SimpleExprLiteralContext) {
        const literal = simpleExpr.literal();

        if (literal.textLiteral()) {
            const text = literal.textLiteral()?.text.slice(1, -1) || ''; //remove quotes
            return freshVar(text, 'varchar');
        }
        const numLiteral = literal.numLiteral();
        if (numLiteral) {
            return freshVar(numLiteral.text, 'int');
            // addNamedNode(simpleExpr, freshVar('bigint', 'bigint'), namedNodes)
            // if(numLiteral.INT_NUMBER()) {
            //     const typeInt = freshVar('int', 'int');
            //     addNamedNode(simpleExpr, typeInt, namedNodes)
            // }
            // if(numLiteral.DECIMAL_NUMBER()) {
            //     const typeDecimal = freshVar('decimal', 'decimal');
            //     addNamedNode(simpleExpr, typeDecimal, namedNodes)
            // }
            // if(numLiteral.FLOAT_NUMBER()) {
            //     const typeFloat = freshVar('float', 'float');
            //     addNamedNode(simpleExpr, typeFloat, namedNodes)
            // }
            ;
        }
        const boolLiteral = literal.boolLiteral();
        if (boolLiteral) {
            return freshVar(boolLiteral.text, 'bit');
        }
        const nullLiteral = literal.nullLiteral();
        if (nullLiteral) {
            return freshVar(nullLiteral.text, '?');
        }
        throw Error('literal not supported:' + literal.text);
        //...
    }
    if (simpleExpr instanceof SimpleExprListContext) {
        const exprList = simpleExpr.exprList();

        const listType = exprList.expr().map(item => {
            const exprType = traverseExpr(item, { ...traverseContext, where: false });
            return exprType as TypeVar;
        })
        const resultType: TypeOperator = {
            kind: 'TypeOperator',
            types: listType
        }
        return resultType;
    }
    if (simpleExpr instanceof SimpleExprSubQueryContext) {
        const subquery = simpleExpr.subquery();
        const subqueryResult = traverseSubquery(subquery, traverseContext);
        return {
            kind: 'TypeOperator',
            types: subqueryResult.columns.map(t => ({ ...t.type, table: '' }))
        }
    }
    if (simpleExpr instanceof SimpleExprCaseContext) {

        //case when expr then expr else expr
        const caseType = freshVar(simpleExpr.text, '?');

        simpleExpr.whenExpression().forEach(whenExprCont => {
            const whenExpr = whenExprCont.expr();
            const whenType = traverseExpr(whenExpr, traverseContext);

            traverseContext.constraints.push({
                expression: whenExpr.text,
                type1: whenType.kind == 'TypeOperator' ? whenType.types[0] : whenType,
                type2: freshVar('tinyint', 'tinyint') //bool
            })
        })

        const thenTypes = simpleExpr.thenExpression().map(thenExprCtx => {
            const thenExpr = thenExprCtx.expr();
            const thenType = traverseExpr(thenExpr, traverseContext);

            traverseContext.constraints.push({
                expression: thenExprCtx.text,
                type1: caseType,
                type2: thenType.kind == 'TypeOperator' ? thenType.types[0] : thenType,
                mostGeneralType: true,
            })
            return thenType;
        })

        const elseExpr = simpleExpr.elseExpression()?.expr();
        if (elseExpr) {
            const elseType = traverseExpr(elseExpr, traverseContext);

            traverseContext.constraints.push({
                expression: simpleExpr.elseExpression()?.text!,
                type1: caseType,
                type2: elseType.kind == 'TypeOperator' ? elseType.types[0] : elseType,
                mostGeneralType: true
            })
            thenTypes.forEach(thenType => {
                traverseContext.constraints.push({
                    expression: simpleExpr.elseExpression()?.text!,
                    type1: thenType,
                    type2: elseType.kind == 'TypeOperator' ? elseType.types[0] : elseType,
                    mostGeneralType: true
                })

            })
        }
        return caseType;
    }
    if (simpleExpr instanceof SimpleExprIntervalContext) {
        const exprList = simpleExpr.expr();
        const exprLeft = exprList[0];
        const exprRight = exprList[1];
        const typeLeft = traverseExpr(exprLeft, traverseContext);
        const typeRight = traverseExpr(exprRight, traverseContext);
        traverseContext.constraints.push({
            expression: exprLeft.text,
            type1: typeLeft,
            type2: freshVar('bigint', 'bigint')
        })
        if (typeRight.kind == 'TypeVar' && (isDateLiteral(typeRight.name) || isDateTimeLiteral(typeRight.name))) {
            typeRight.type = 'datetime';
        }
        traverseContext.constraints.push({
            expression: exprRight.text,
            type1: typeRight,
            type2: freshVar('datetime', 'datetime')
        })
        return freshVar('datetime', 'datetime');
    }
    if (simpleExpr instanceof SimpleExprSumContext) {

        const sumExpr = simpleExpr.sumExpr();
        if (sumExpr.MAX_SYMBOL() || sumExpr.MIN_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                const inSumExprType = traverseExpr(inSumExpr, traverseContext);
                traverseContext.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: inSumExprType,
                    mostGeneralType: true
                })
            }
            return functionType;
        }
        if (sumExpr.COUNT_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, 'bigint');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                traverseExpr(inSumExpr, traverseContext);
            }
            return functionType;
        }

        if (sumExpr.SUM_SYMBOL() || sumExpr.AVG_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                const inSumExprType = traverseExpr(inSumExpr, traverseContext);
                traverseContext.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: inSumExprType,
                    mostGeneralType: true,
                    coercionType: 'SumFunction'
                })
                if (inSumExprType.kind == 'TypeVar') {
                    functionType.table = inSumExprType.table
                }
            }
            return functionType;
        }
        if (sumExpr.GROUP_CONCAT_SYMBOL()) {
            const exprList = sumExpr.exprList();
            if (exprList) {
                exprList.expr().map(item => {
                    const exprType = traverseExpr(item, traverseContext);
                    return exprType;
                })
                /*
                The result type is TEXT or BLOB unless group_concat_max_len is less than or equal to 512, 
                in which case the result type is VARCHAR or VARBINARY.
                */
                //TODO - Infer TEXT/BLOB or VARCHAR/VARBINARY
                return freshVar(sumExpr.text, 'varchar');;
            }
        }
        throw Error('Expression not supported: ' + sumExpr.constructor.name);
    }
    if (simpleExpr instanceof SimpleExprRuntimeFunctionContext) {
        const runtimeFunctionCall = simpleExpr.runtimeFunctionCall();
        if (runtimeFunctionCall.NOW_SYMBOL()) {
            return freshVar(simpleExpr.text, 'datetime');
        }
        if (runtimeFunctionCall.CURDATE_SYMBOL()) {
            return freshVar(simpleExpr.text, 'date');
        }
        if (runtimeFunctionCall.CURTIME_SYMBOL()) {
            return freshVar(simpleExpr.text, 'time');
        }
        if (runtimeFunctionCall.REPLACE_SYMBOL()) {
            const exprList = runtimeFunctionCall.expr();
            exprList.forEach(expr => {
                const exprType = traverseExpr(expr, traverseContext);
                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
            })
            return freshVar('varchar', 'varchar');
        }

        if (runtimeFunctionCall.YEAR_SYMBOL() || runtimeFunctionCall.MONTH_SYMBOL() || runtimeFunctionCall.DAY_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if (expr) {
                const paramType = traverseExpr(expr, traverseContext);
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime'
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date'
                }
                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'date')
                })
            }
            const returnType = runtimeFunctionCall.YEAR_SYMBOL() ? 'year' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        if (runtimeFunctionCall.DATE_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if (expr) {
                const paramType = traverseExpr(expr, traverseContext);
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime'
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date'
                }
                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'date')
                })
            }
            return freshVar(simpleExpr.text, 'date');
        }
        if (runtimeFunctionCall.HOUR_SYMBOL() || runtimeFunctionCall.MINUTE_SYMBOL() || runtimeFunctionCall.SECOND_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if (expr) {
                const paramType = traverseExpr(expr, traverseContext);
                if (paramType.kind == 'TypeVar' && isTimeLiteral(paramType.name)) {
                    paramType.type = 'time';
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date';
                }
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime';
                }

                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'time')
                })
            }
            //HOUR can return values greater than 23. Ex.: SELECT HOUR('272:59:59');
            //https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html#function_hour
            const returnType = runtimeFunctionCall.HOUR_SYMBOL() ? 'int' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        const trimFunction = runtimeFunctionCall.trimFunction();
        if (trimFunction) {
            const exprList = trimFunction.expr();
            if (exprList.length == 1) {
                const exprType = traverseExpr(exprList[0], traverseContext);
                traverseContext.constraints.push({
                    expression: exprList[0].text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
            }
            if (exprList.length == 2) {
                const exprType = traverseExpr(exprList[0], traverseContext);
                const expr2Type = traverseExpr(exprList[1], traverseContext);
                traverseContext.constraints.push({
                    expression: exprList[0].text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
                traverseContext.constraints.push({
                    expression: exprList[1].text,
                    type1: expr2Type,
                    type2: freshVar('varchar', 'varchar')
                })
            }
            return freshVar('varchar', 'varchar');
        }
        const substringFunction = runtimeFunctionCall.substringFunction();
        if (substringFunction) {
            const exprList = substringFunction.expr();
            const varcharParam = freshVar('varchar', 'varchar');
            const intParam = freshVar('int', 'int');
            const params: FunctionParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, intParam, intParam]
            }
            traverseExprListParameters(exprList, params, traverseContext);
            return varcharParam;
        }

        if (runtimeFunctionCall.ADDDATE_SYMBOL()
            || runtimeFunctionCall.DATE_ADD_SYMBOL()
            || runtimeFunctionCall.SUBDATE_SYMBOL()
            || runtimeFunctionCall.DATE_SUB_SYMBOL()) {

            //SELECT ADDDATE('2008-01-02', INTERVAL 31 DAY)
            //SELECT ADDDATE('2008-01-02', 31)
            const expr1 = runtimeFunctionCall.expr()[0];
            const expr2 = runtimeFunctionCall.expr()[1];
            const typeExpr1 = traverseExpr(expr1, traverseContext);
            const typeExpr2 = traverseExpr(expr2, traverseContext);

            if (typeExpr1.kind == 'TypeVar' && (isDateLiteral(typeExpr1.name) || isDateTimeLiteral(typeExpr1.name))) {
                typeExpr1.type = 'datetime';
            }

            traverseContext.constraints.push({
                expression: expr1.text,
                type1: typeExpr1,
                type2: freshVar('datetime', 'datetime')
            })

            traverseContext.constraints.push({
                expression: expr2.text,
                type1: typeExpr2,
                type2: freshVar('bigint', 'bigint')
            })

            return freshVar('datetime', 'datetime');
        }

        if (runtimeFunctionCall.COALESCE_SYMBOL()) {
            const exprList = runtimeFunctionCall.exprListWithParentheses()?.exprList().expr();
            if (exprList) {
                const paramType = freshVar('COALESCE', 'any');
                const params: FunctionParams = {
                    kind: 'VariableLengthParams',
                    paramType: '?'
                }
                const paramsTypeList = traverseExprListParameters(exprList, params, traverseContext);
                paramsTypeList.forEach((typeVar, paramIndex) => {
                    traverseContext.constraints.push({
                        expression: runtimeFunctionCall.text + '_param' + (paramIndex + 1),
                        type1: paramType,
                        type2: typeVar,
                        mostGeneralType: true,
                        coercionType: 'Coalesce'
                    })
                })
                return paramType;
            }
        }
        //MOD (number, number): number
        if (runtimeFunctionCall.MOD_SYMBOL()) {
            const functionType = freshVar('number', 'number');
            const exprList = runtimeFunctionCall.expr();
            const param1 = traverseExpr(exprList[0], traverseContext);
            const param2 = traverseExpr(exprList[1], traverseContext);
            traverseContext.constraints.push({
                expression: simpleExpr.text,
                type1: freshVar('number', 'number'),
                type2: param1,
                mostGeneralType: true,
                coercionType: 'Numeric'
            })
            traverseContext.constraints.push({
                expression: simpleExpr.text,
                type1: freshVar('number', 'number'),
                type2: param2,
                mostGeneralType: true,
                coercionType: 'Numeric'
            })
            traverseContext.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: param1,
                mostGeneralType: true
            })
            traverseContext.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: param2,
                mostGeneralType: true
            })
            return functionType;
        }
        if (runtimeFunctionCall.IF_SYMBOL()) {
            const exprList = runtimeFunctionCall.expr();
            const expr1 = exprList[0];
            const expr2 = exprList[1];
            const expr3 = exprList[2];
            traverseExpr(expr1, traverseContext);
            const expr2Type = traverseExpr(expr2, traverseContext);
            const expr3Type = traverseExpr(expr3, traverseContext);
            traverseContext.constraints.push({
                expression: runtimeFunctionCall.text,
                type1: expr2Type,
                type2: expr3Type,
                mostGeneralType: true
            })
            return expr2Type;
        }
        throw Error('Function not supported: ' + runtimeFunctionCall.text);
    }
    if (simpleExpr instanceof SimpleExprFunctionContext) {
        const functionIdentifier = getFunctionName(simpleExpr);

        if (functionIdentifier === 'concat_ws' || functionIdentifier?.toLowerCase() === 'concat') {
            const varcharType = freshVar(simpleExpr.text, 'varchar');
            const params: VariableLengthParams = {
                kind: 'VariableLengthParams',
                paramType: 'varchar'
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return varcharType;
        }

        if (functionIdentifier === 'avg') {
            const functionType = freshVar(simpleExpr.text, '?');
            traverseContext.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: freshVar('decimal', 'decimal'),
                mostGeneralType: true
            })
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return functionType;
        }

        if (functionIdentifier === 'round') {
            const functionType = freshVar(simpleExpr.text, '?');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            const paramsType = walkFunctionParameters(simpleExpr, params, traverseContext);
            //The return value has the same type as the first argument
            traverseContext.constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: paramsType[0], //type of the first parameter
                mostGeneralType: true
            })
            return functionType;
        }

        if (functionIdentifier === 'floor') {
            const doubleParam = freshVar('double', 'double');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [doubleParam, doubleParam]
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return freshVar(simpleExpr.text, 'bigint');
        }

        if (functionIdentifier === 'str_to_date') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, varcharParam]
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return freshVar(simpleExpr.text, 'date');
        }

        if (functionIdentifier === 'datediff') {
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                udfExprList.forEach((inExpr) => {
                    const expr = inExpr.expr();
                    const exprType = traverseExpr(expr, traverseContext);
                    const newType = verifyDateTypesCoercion(exprType);

                    traverseContext.constraints.push({
                        expression: expr.text,
                        type1: newType,
                        type2: freshVar('date', 'date'),
                        mostGeneralType: true
                    })
                })
            }
            return freshVar(simpleExpr.text, 'bigint');
        }

        if (functionIdentifier === 'period_add' || functionIdentifier == 'period_diff') {
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                udfExprList.forEach((inExpr) => {
                    const expr = inExpr.expr();
                    const exprType = traverseExpr(expr, traverseContext);

                    traverseContext.constraints.push({
                        expression: expr.text,
                        type1: exprType,
                        type2: freshVar('bigint', 'bigint'),
                        mostGeneralType: true
                    })
                })
            }
            return freshVar(simpleExpr.text, 'bigint');
        }

        if (functionIdentifier === 'lpad' || functionIdentifier == 'rpad') {
            const varcharParam = freshVar('varchar', 'varchar');
            const intParam = freshVar('int', 'int');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, intParam, varcharParam]
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return varcharParam;
        }

        if (functionIdentifier === 'lower'
            || functionIdentifier === 'lcase'
            || functionIdentifier === 'upper'
            || functionIdentifier === 'ucase'
            || functionIdentifier === 'trim'
            || functionIdentifier === 'ltrim'
            || functionIdentifier === 'rtrim') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return varcharParam;
        }

        if (functionIdentifier === 'length' || functionIdentifier == 'char_length') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(simpleExpr, params, traverseContext);
            return freshVar('int', 'int');
        }
        if (functionIdentifier === 'abs') {
            const functionType = freshVar('number', 'number');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            udfExprList?.forEach(expr => {
                const param1 = traverseExpr(expr.expr(), traverseContext);
                traverseContext.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: param1,
                    mostGeneralType: true,
                    coercionType: 'Numeric'
                })
            })

            return functionType;
        }
        if (functionIdentifier == 'ceiling' || functionIdentifier == 'ceil') {
            const functionType = freshVar('number', 'number');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            udfExprList?.forEach(expr => {
                const param1 = traverseExpr(expr.expr(), traverseContext);
                traverseContext.constraints.push({
                    expression: simpleExpr.text,
                    type1: functionType,
                    type2: param1,
                    mostGeneralType: true,
                    coercionType: 'Ceiling'
                })
            })

            return functionType;
        }
        if (functionIdentifier == 'timestampdiff') {

            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                const [first, ...rest] = udfExprList;
                const unit = first.text.trim().toLowerCase();
                rest.forEach((inExpr, paramIndex) => {
                    const expr = inExpr.expr();
                    const exprType = traverseExpr(expr, traverseContext);
                    const newType = verifyDateTypesCoercion(exprType);

                    //const expectedType = ['hour', 'minute', 'second'].includes(unit)? 'time' : 'datetime'
                    traverseContext.constraints.push({
                        expression: expr.text,
                        type1: newType,
                        type2: freshVar('datetime', 'datetime'),
                        mostGeneralType: true
                    })
                })

            }
            return freshVar('int', 'int');
        }

        if (functionIdentifier == 'ifnull' || functionIdentifier == 'nullif') {
            const functionType = freshVar(simpleExpr.text, '?');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                const [expr1, expr2] = udfExprList;

                const expr1Type = traverseExpr(expr1.expr(), traverseContext);
                traverseContext.constraints.push({
                    expression: expr1.text,
                    type1: functionType,
                    type2: expr1Type
                })

                const expr2Type = traverseExpr(expr2.expr(), traverseContext);
                traverseContext.constraints.push({
                    expression: expr2.text,
                    type1: functionType,
                    type2: expr2Type
                })

            }
            return functionType;
        }

        if (functionIdentifier == 'md5' //md5(str) - TODO - have input constraint = string
            || functionIdentifier == 'hex' //md5(n or str)
            || functionIdentifier == 'unhex') { //unhex (str) - TODO - have input constraint = string
            const functionType = freshVar(simpleExpr.text, 'char');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                const [expr1] = udfExprList;
                const paramType = traverseExpr(expr1.expr(), traverseContext);
                traverseContext.constraints.push({
                    expression: expr1.text,
                    type1: paramType,
                    type2: freshVar(expr1.text, 'varchar')
                })
            }
            return functionType;
        }

        throw Error('Function not supported: ' + functionIdentifier);
    }
    if (simpleExpr instanceof SimpleExprWindowingFunctionContext) {
        const windowFunctionCall = simpleExpr.windowFunctionCall();
        return traverseWindowFunctionCall(windowFunctionCall, traverseContext);
    }
    if (simpleExpr instanceof SimpleExprCastContext) {
        const castType = simpleExpr.castType();
        if (castType.CHAR_SYMBOL()) {
            return freshVar(castType.text, 'char');
        }
    }

    throw Error('traverseSimpleExpr - not supported: ' + simpleExpr.constructor.name);
}

function traverseWindowFunctionCall(windowFunctionCall: WindowFunctionCallContext, traverseContext: TraverseContext) {
    if (windowFunctionCall.ROW_NUMBER_SYMBOL()
        || windowFunctionCall.RANK_SYMBOL()
        || windowFunctionCall.DENSE_RANK_SYMBOL()
        || windowFunctionCall.CUME_DIST_SYMBOL()
        || windowFunctionCall.PERCENT_RANK_SYMBOL()) {
        return freshVar(windowFunctionCall.text, 'bigint');
    }
    const expr = windowFunctionCall.expr();
    if (expr) {
        return traverseExpr(expr, traverseContext);
    }
    const exprWithParentheses = windowFunctionCall.exprWithParentheses();
    if (exprWithParentheses) {
        const expr = exprWithParentheses.expr();
        return traverseExpr(expr, traverseContext);
    }
    throw Error('No support for expression' + windowFunctionCall.constructor.name);
}

function traverseExprListParameters(exprList: ExprContext[], params: FunctionParams, traverseContext: TraverseContext) {
    return exprList.map((expr, paramIndex) => {
        const exprType = traverseExpr(expr, traverseContext);
        const paramType = params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType);
        traverseContext.constraints.push({
            expression: expr.text,
            type1: exprType,
            type2: paramType,
            mostGeneralType: true
        })
        return paramType;
    })
}

function walkFunctionParameters(simpleExprFunction: SimpleExprFunctionContext, params: FunctionParams, traverseContext: TraverseContext) {
    const functionName = getFunctionName(simpleExprFunction);
    const udfExprList = simpleExprFunction.functionCall().udfExprList()?.udfExpr();
    if (udfExprList) {
        const paramTypes = udfExprList
            .filter((undefined, paramIndex) => {
                return functionName == 'timestampdiff' ? paramIndex != 0 : true; //filter the first parameter of timestampdiff function
            })
            .map((inExpr, paramIndex) => {
                const expr = inExpr.expr();
                const exprType = traverseExpr(expr, traverseContext);
                traverseContext.constraints.push({
                    expression: expr.text,
                    type1: exprType,
                    type2: params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType),
                })
                return exprType;
            })
        return paramTypes;
    }
    const exprList = simpleExprFunction.functionCall().exprList()?.expr();
    if (exprList) {
        const paramTypes = exprList.map((inExpr, paramIndex) => {
            const inSumExprType = traverseExpr(inExpr, traverseContext);
            traverseContext.constraints.push({
                expression: inExpr.text,
                type1: params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType),
                type2: inSumExprType,
                mostGeneralType: true
            })
            return inSumExprType;
        })
        return paramTypes;
    }
    throw Error('Error in walkFunctionParameters')
}

export function filterColumns(dbSchema: ColumnSchema[], withSchema: ColumnDef[], tableAlias: string | undefined, table: FieldName): ColumnDef[] {
    const withResult = withSchema.filter(t => t.table.toLowerCase() == table.name.toLowerCase()).map(s => ({ ...s, tableAlias: tableAlias }));
    const tableColumns1 = dbSchema
        .filter(schema => schema.table.toLowerCase() == table.name.toLowerCase() && (schema.schema == table.prefix || table.prefix == ''))
        .map(tableColumn => {

            //name and colum are the same on the leaf table
            const r: ColumnDef = {
                columnName: tableColumn.column, columnType: createColumnTypeFomColumnSchema(tableColumn),
                notNull: tableColumn.notNull, table: table.name, tableAlias: tableAlias || '', columnKey: tableColumn.columnKey
            }
            return r;
        });
    const result = tableColumns1.concat(withResult);
    return result;

}

export function selectAllColumns(tablePrefix: string, fromColumns: ColumnDef[]): ColumnDef[] {
    return fromColumns.filter(column => {
        if (tablePrefix == '' || tablePrefix == column.tableAlias || tablePrefix == column.table) {
            return true;
        }
        return false;
    });
}

function filterUsingFields(joinedFields: ColumnDef[], usingFields: string[]) {
    return joinedFields.filter(joinedField => {
        const isUsing = usingFields.includes(joinedField.columnName);
        if (!isUsing) {
            return true;
        }
        return false;
    })
}

export function isMultipleRowResult(selectStatement: SelectStatementContext, fromColumns: ColumnDef[]) {
    if (isLimitOne(selectStatement)) {
        return false;
    }
    const querySpecs = getAllQuerySpecificationsFromSelectStatement(selectStatement);
    if (querySpecs.length == 1) { //UNION queries are multipleRowsResult = true
        const fromClause = querySpecs[0].fromClause();
        if (!fromClause) {
            return false;
        }
        if (querySpecs[0].selectItemList().childCount == 1) {
            const selectItem = <SelectItemContext>querySpecs[0].selectItemList().getChild(0);
            //if selectItem = * (TerminalNode) childCount = 0; selectItem.expr() throws exception
            const expr = selectItem.childCount > 0 ? selectItem.expr() : null;
            if (expr) {
                //SUM, MAX... WITHOUT GROUP BY are multipleRowsResult = false
                const groupBy = querySpecs[0].groupByClause();
                if (!groupBy && isSumExpressContext(expr)) {
                    return false;
                }
            }
        }
        const joinedTable = fromClause.tableReferenceList()?.tableReference()[0].joinedTable();
        if (joinedTable && joinedTable.length > 0) {
            return true;
        }

        const whereClauseExpr = querySpecs[0].whereClause()?.expr();
        const isMultipleRowResult = whereClauseExpr && verifyMultipleResult2(whereClauseExpr, fromColumns);
        if (isMultipleRowResult == false) {
            return false;
        }
    }

    return true;
}

function isLimitOne(selectStatement: SelectStatementContext) {
    const limitOptions = getLimitOptions(selectStatement);
    if (limitOptions.length == 1 && limitOptions[0].text == '1') {
        return true;
    }
    if (limitOptions.length == 2 && limitOptions[1].text == '1') {
        return true;
    }
    return false;
}

export function verifyMultipleResult2(exprContext: ExprContext, fromColumns: ColumnDef[]): boolean {
    if (exprContext instanceof ExprIsContext) {

        const boolPri = exprContext.boolPri();

        if (boolPri instanceof PrimaryExprCompareContext) {
            if (boolPri.compOp().EQUAL_OPERATOR()) {
                let compareLeft = boolPri.boolPri();
                let compareRight = boolPri.predicate();
                if (isUniqueKeyComparation(compareLeft, fromColumns) || isUniqueKeyComparation(compareRight, fromColumns)) {
                    return false; //multipleRow = false
                }
            }
            return true; //multipleRow = true

        }
        return true; //multipleRow

    }
    if (exprContext instanceof ExprNotContext) {
        return true;
    }
    if (exprContext instanceof ExprAndContext) {
        const oneIsSingleResult = exprContext.expr().some(expr => verifyMultipleResult2(expr, fromColumns) == false)
        return oneIsSingleResult == false;
    }
    // if (exprContext instanceof ExprXorContext) {
    //     const expressions = exprContext.expr();
    // }
    if (exprContext instanceof ExprOrContext) {
        return true; //multipleRow = true
    }

    throw Error('Unknow type:' + exprContext.constructor.name);
}

function isUniqueKeyComparation(compare: BoolPriContext | PredicateContext, fromColumns: ColumnDef[]) {
    const tokens = getSimpleExpressions(compare);
    if (tokens.length == 1 && tokens[0] instanceof SimpleExprColumnRefContext) {
        const fieldName = splitName(tokens[0].text);
        const col = findColumn(fieldName, fromColumns);
        if (col.columnKey == 'PRI' || col.columnKey == 'UNI') { //TODO - UNIQUE
            return true; //isUniqueKeyComparation = true
        }
    }
    return false; //isUniqueKeyComparation = false
}

function getOrderByColumns(fromColumns: ColumnDef[], selectColumns: TypeAndNullInfer[]) {
    const fromColumnsNames = fromColumns.map(col => col.columnName); //TODO - loading twice
    const selectColumnsNames = selectColumns.map(col => col.name);
    const allOrderByColumns = Array.from(new Set(fromColumnsNames.concat(selectColumnsNames)));
    return allOrderByColumns;
}

