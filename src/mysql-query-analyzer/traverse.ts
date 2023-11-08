import { BitExprContext, BoolPriContext, DeleteStatementContext, ExprAndContext, ExprContext, ExprIsContext, ExprListContext, ExprNotContext, ExprOrContext, ExprXorContext, FromClauseContext, HavingClauseContext, InsertQueryExpressionContext, InsertStatementContext, PredicateContext, PredicateExprInContext, PredicateExprLikeContext, PredicateOperationsContext, PrimaryExprAllAnyContext, PrimaryExprCompareContext, PrimaryExprIsNullContext, PrimaryExprPredicateContext, QueryContext, QueryExpressionBodyContext, QueryExpressionContext, QueryExpressionOrParensContext, QueryExpressionParensContext, QuerySpecificationContext, SelectItemContext, SelectItemListContext, SelectStatementContext, SimpleExprCaseContext, SimpleExprCastContext, SimpleExprColumnRefContext, SimpleExprContext, SimpleExprFunctionContext, SimpleExprIntervalContext, SimpleExprListContext, SimpleExprLiteralContext, SimpleExprParamMarkerContext, SimpleExprRuntimeFunctionContext, SimpleExprSubQueryContext, SimpleExprSumContext, SimpleExprWindowingFunctionContext, SingleTableContext, SubqueryContext, TableFactorContext, TableReferenceContext, TableReferenceListParensContext, UpdateStatementContext, WindowFunctionCallContext, WithClauseContext } from "ts-mysql-parser";
import { verifyNotInferred } from "../describe-query";
import { extractLimitParameters, extractOrderByParameters, getAllQuerySpecificationsFromSelectStatement, getLimitOptions, isSumExpressContext } from "./parse";
import { ColumnDef, ColumnSchema, Constraint, FieldName, ParameterInfo, Type, TypeAndNullInfer, TypeOperator, TypeVar } from "./types";
import { ExprOrDefault, FixedLengthParams, FunctionParams, VariableLengthParams, createColumnType, createColumnTypeFomColumnSchema, freshVar, generateTypeInfo, getDeleteColumns, getFunctionName, getInsertColumns, getInsertIntoTable, isDateLiteral, isDateTimeLiteral, isTimeLiteral, verifyDateTypesCoercion } from "./collect-constraints";
import { extractFieldsFromUsingClause, findColumn, getColumnName, getSimpleExpressions, splitName } from "./select-columns";
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
    const selectStatement = queryContext.simpleStatement()?.selectStatement();
    if (selectStatement) {
        const typeInfer = traverseSelectStatement(selectStatement, constraints, parameters, dbSchema, namedParameters);
        return typeInfer;
    }
    const insertStatement = queryContext.simpleStatement()?.insertStatement();
    if (insertStatement) {
        return traverseInsertStatement(insertStatement, constraints, parameters, dbSchema);
    }
    const updateStatement = queryContext.simpleStatement()?.updateStatement();
    if (updateStatement) {
        const typeInfer = traverseUpdateStatement(updateStatement, constraints, parameters, dbSchema, namedParameters);
        return typeInfer;
    }
    const deleteStatement = queryContext.simpleStatement()?.deleteStatement();
    if (deleteStatement) {
        const typeInfer = traverseDeleteStatement(deleteStatement, constraints, parameters, dbSchema);
        return typeInfer;
    }
    throw Error('traverseSql - not supported: ' + queryContext.constructor.name);
}


function traverseSelectStatement(selectStatement: SelectStatementContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], namedParameters: string[]): SelectStatementResult {
    const queryExpression = selectStatement.queryExpression();
    if (queryExpression) {
        const withClause = queryExpression.withClause();
        const withSchema: ColumnDef[] = [];
        if (withClause) {
            traverseWithClause(withClause, constraints, parameters, dbSchema, withSchema);
        }
        const queryExpressionBody = queryExpression.queryExpressionBody();
        if (queryExpressionBody) {
            const result = traverseQueryExpressionBody(queryExpressionBody, constraints, parameters, dbSchema, withSchema, []);
            const orderByParameters = extractOrderByParameters(selectStatement);
            const limitParameters = extractLimitParameters(selectStatement);

            const paramInference = inferParamNullabilityQueryExpression(queryExpression);

            const allParameters = parameters
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
                    constraints.push({
                        expression: paramIndex.paramName,
                        type1: allParameters[cur].type,
                        type2: allParameters[next].type
                    })
                });
            })

            const isMultiRow = isMultipleRowResult(selectStatement, result.fromColumns);
            const traverseResult: SelectStatementResult = {
                type: 'Select',
                constraints,
                columns: result.columns,
                parameters: allParameters,
                limitParameters,
                isMultiRow
            };
            const orderByColumns = orderByParameters.length > 0 ? getOrderByColumns(result.fromColumns, result.columns) : undefined;
            if (orderByColumns) {
                traverseResult.orderByColumns = orderByColumns;
            }
            return traverseResult;
        }
    }
    throw Error('traverseSelectStatement - not supported: ' + selectStatement.text);
}

export function traverseInsertStatement(insertStatement: InsertStatementContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[]): InsertStatementResult {

    const allParameters: ParameterDef[] = [];
    const paramsNullability: { [paramId: string]: boolean } = {};

    let exprOrDefaultList: ExprOrDefault[][] = [];
    const valuesContext = insertStatement.insertFromConstructor()?.insertValues().valueList().values();
    if (valuesContext) {
        exprOrDefaultList = valuesContext.map(valueContext => valueContext.children?.filter(valueContext => valueContext instanceof ExprIsContext || valueContext.text == 'DEFAULT') as ExprOrDefault[] || []);
    }

    const insertIntoTable = getInsertIntoTable(insertStatement);

    const fromColumns = dbSchema
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

    exprOrDefaultList.forEach(exprOrDefault => {
        exprOrDefault.forEach((expr, index) => {
            const column = insertColumns[index];

            if (expr instanceof ExprContext) {
                const numberParamsBefore = parameters.length;
                const exprType = traverseExpr(expr, constraints, parameters, dbSchema, [], fromColumns);
                const paramNullabilityExpr = inferParamNullability(expr);
                parameters.slice(numberParamsBefore).forEach(param => {
                    paramsNullability[param.id] = paramNullabilityExpr.every(n => n) && column.notNull;
                })
                constraints.push({
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
            const numberParamsBefore = parameters.length;
            const exprType = traverseExpr(expr, constraints, parameters, dbSchema, /*withSchema*/[], fromColumns);
            const column = findColumn(field, fromColumns);
            parameters.slice(numberParamsBefore).forEach(param => {
                paramsNullability[param.id] = column.notNull;
            })
            constraints.push({
                expression: expr.text,
                type1: exprType,
                type2: freshVar(column.columnName, column.columnType.type)
            })
        }
    });

    const insertQueryExpression = insertStatement.insertQueryExpression();
    if (insertQueryExpression) {
        //TODO - REMOVE numberParamsBefore (walk first insertQueryExpression)
        const numberParamsBefore = parameters.length;
        const exprTypes = traverseInsertQueryExpression(insertQueryExpression, constraints, parameters, dbSchema, /*withSchema*/[], fromColumns);

        exprTypes.columns.forEach((type, index) => {
            const column = insertColumns[index];
            if (type.type.kind == 'TypeVar') {
                paramsNullability[type.type.id] = column.notNull;
            }
            constraints.push({
                expression: insertQueryExpression.text,
                type1: type.type,
                type2: freshVar(column.columnName, column.columnType.type)
            })

        })
        const paramNullabilityExpr = inferParamNullabilityQuery(insertQueryExpression);
        parameters.slice(numberParamsBefore).forEach((param, index) => {
            if (paramsNullability[param.id] == null) {
                paramsNullability[param.id] = paramNullabilityExpr[index];
            }
        })

    }

    const typeInfo = generateTypeInfo(parameters, constraints);
    typeInfo.forEach((param, index) => {
        const paramId = parameters[index].id;
        allParameters.push({
            name: 'param' + (allParameters.length + 1),
            columnType: verifyNotInferred(param),
            notNull: paramsNullability[paramId]
        })
    })

    const typeInferenceResult: InsertStatementResult = {
        type: 'Insert',
        constraints: constraints,
        parameters: allParameters
    }
    return typeInferenceResult;
}

function traverseUpdateStatement(updateStatement: UpdateStatementContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], namedParamters: string[]): UpdateStatementResult {

    const updateElement = updateStatement.updateList().updateElement();
    const withClause = updateStatement.withClause();
    const withSchema: ColumnDef[] = [];
    if (withClause) {
        traverseWithClause(withClause, constraints, parameters, dbSchema, withSchema);
    }
    const updateColumns = getUpdateColumns(updateStatement, constraints, parameters, dbSchema, withSchema, []);

    const dataTypes: TypeAndNullInfer[] = [];
    const whereParameters: TypeAndNullInfer[] = [];
    const paramsBefore = parameters.length;
    const whereExpr = updateStatement.whereClause()?.expr();
    const paramNullability = inferParamNullability(updateStatement);

    updateElement.forEach(updateElement => {
        const expr = updateElement.expr();
        if (expr) {
            const paramBeforeExpr = parameters.length;
            const result = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, updateColumns);
            const columnName = updateElement.columnRef().text;
            const field = splitName(columnName);
            const column = findColumn(field, updateColumns);
            constraints.push({
                expression: updateStatement.text,
                type1: result,
                type2: column.columnType //freshVar(column.columnName, )
            })
            parameters.slice(paramBeforeExpr, parameters.length).forEach((param, index) => {
                dataTypes.push({
                    name: namedParamters[paramBeforeExpr + index] || field.name,
                    type: param,
                    notNull: column.notNull && paramNullability[index],
                    table: ''
                })
            })

        }
    });

    const paramsAfter = parameters.length;

    if (whereExpr) {
        traverseExpr(whereExpr, constraints, parameters, dbSchema, withSchema, updateColumns);
    }

    parameters.slice(0, paramsBefore).forEach((param, index) => {
        whereParameters.push({
            name: namedParamters[index] || 'param' + (whereParameters.length + 1),
            type: param,
            notNull: paramNullability[index],
            table: ''
        })
    })
    parameters.slice(paramsAfter).forEach((param, index) => {
        whereParameters.push({
            name: namedParamters[paramsAfter + index] || 'param' + (whereParameters.length + 1),
            type: param,
            notNull: paramNullability[paramsAfter + index],
            table: ''
        })
    })

    const typeInferenceResult: UpdateStatementResult = {
        type: 'Update',
        constraints,
        data: dataTypes,
        parameters: whereParameters
    }

    return typeInferenceResult;
}

export function traverseDeleteStatement(deleteStatement: DeleteStatementContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[]): DeleteStatementResult {

    const whereExpr = deleteStatement.whereClause()?.expr();
    const deleteColumns = getDeleteColumns(deleteStatement, dbSchema);
    const allParameters: ParameterDef[] = [];

    if (whereExpr) {

        traverseExpr(whereExpr, constraints, parameters, dbSchema, [], deleteColumns);
        const typeInfo = generateTypeInfo(parameters, constraints);

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
        constraints,
        parameters: allParameters
    }
    return typeInferenceResult;
}

export function getUpdateColumns(updateStatement: UpdateStatementContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]) {
    const tableReferences = updateStatement.tableReferenceList().tableReference();
    const columns = traverseTableReferenceList(tableReferences, constraints, parameters, dbSchema, withSchema, fromColumns)
    return columns;
}

function traverseInsertQueryExpression(insertQueryExpression: InsertQueryExpressionContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): QuerySpecificationResult {
    const queryExpressionOrParens = insertQueryExpression.queryExpressionOrParens();
    return traverseQueryExpressionOrParens(queryExpressionOrParens, constraints, parameters, dbSchema, withSchema, fromColumns);
}

function traverseQueryExpressionOrParens(queryExpressionOrParens: QueryExpressionOrParensContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): QuerySpecificationResult {
    const queryExpression = queryExpressionOrParens.queryExpression();
    if (queryExpression) {
        return traverseQueryExpression(queryExpression, constraints, parameters, dbSchema, withSchema, fromColumns);
    }
    const queryEpressionParens = queryExpressionOrParens.queryExpressionParens();
    if (queryEpressionParens) {
        return traverseQueryExpressionParens(queryEpressionParens, constraints, parameters, dbSchema, withSchema, fromColumns);
    }
    throw Error("walkQueryExpressionOrParens");
}

function traverseQueryExpression(queryExpression: QueryExpressionContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[], recursive = false): QuerySpecificationResult {
    const queryExpressionBody = queryExpression.queryExpressionBody();
    if (queryExpressionBody) {
        return traverseQueryExpressionBody(queryExpressionBody, constraints, parameters, dbSchema, withSchema, fromColumns)
    }
    const queryExpressionParens = queryExpression.queryExpressionParens();
    if (queryExpressionParens) {
        return traverseQueryExpressionParens(queryExpressionParens, constraints, parameters, dbSchema, withSchema, fromColumns, recursive);
    }
    throw Error("walkQueryExpression");
}

function traverseQueryExpressionParens(queryExpressionParens: QueryExpressionParensContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[], recursive = false): QuerySpecificationResult {
    const queryExpression = queryExpressionParens.queryExpression();
    if (queryExpression) {
        return traverseQueryExpression(queryExpression, constraints, parameters, dbSchema, withSchema, fromColumns, recursive);
    }
    const queryExpressionParens2 = queryExpressionParens.queryExpressionParens();
    if (queryExpressionParens2) {
        return traverseQueryExpressionParens(queryExpressionParens, constraints, parameters, dbSchema, withSchema, fromColumns, recursive);
    }
    throw Error("walkQueryExpressionParens");
}

function createUnionVar(type: TypeVar, name: string) {
    const newVar: TypeVar = { ...type, name: name, table: '' };
    return newVar;
}

function traverseQueryExpressionBody(queryExpressionBody: QueryExpressionBodyContext | SubqueryContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[], recursiveNames?: string[]): QuerySpecificationResult {
    const subQuery = queryExpressionBody instanceof SubqueryContext ? true : false;
    const allQueries = getAllQuerySpecificationsFromSelectStatement(queryExpressionBody);
    const [first, ...unionQuerySpec] = allQueries;
    const mainQueryResult = traverseQuerySpecification(first, constraints, parameters, dbSchema, withSchema, fromColumns, subQuery);

    const resultTypes = mainQueryResult.columns.map((t, index) => unionQuerySpec.length == 0 ? t.type : createUnionVar(t.type, recursiveNames && recursiveNames.length > 0 ? recursiveNames[index] : t.name)); //TODO mover para traversequeryspecificat?

    for (let queryIndex = 0; queryIndex < unionQuerySpec.length; queryIndex++) {
        const columnNames = recursiveNames && recursiveNames.length > 0 ? recursiveNames : mainQueryResult.columns.map(col => col.name);
        const newFromColumns = recursiveNames ? renameFromColumns(mainQueryResult.columns, columnNames) : [];
        const unionQuery = unionQuerySpec[queryIndex];
        const unionResult = traverseQuerySpecification(unionQuery, constraints, parameters, dbSchema, withSchema, newFromColumns, subQuery);

        resultTypes.forEach((t2, index) => {
            mainQueryResult.columns[index].notNull = mainQueryResult.columns[index].notNull && unionResult.columns[index].notNull;
            constraints.push({
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

export function traverseQuerySpecification(querySpec: QuerySpecificationContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumnsParent: ColumnDef[], subQuery = false): QuerySpecificationResult {
    const fromClause = querySpec.fromClause();
    const fromColumns = fromClause ? traverseFromClause(fromClause, constraints, parameters, dbSchema, withSchema, fromColumnsParent) : [];
    const allColumns = subQuery ? fromColumnsParent.concat(fromColumns) : fromColumns;     //(... where id = t1.id)
    const selectItemListResult = traverseSelectItemList(querySpec.selectItemList(), constraints, parameters, dbSchema, withSchema, allColumns);

    const whereClause = querySpec.whereClause();
    //TODO - HAVING, BLAH
    if (whereClause) {
        const whereExpr = whereClause?.expr();
        traverseExpr(whereExpr, constraints, parameters, dbSchema, withSchema, allColumns);
    }


    const columnNullability = inferNotNull(querySpec, dbSchema, allColumns);

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
        traverseHavingClause(havingClause, constraints, parameters, dbSchema, withSchema, selectColumns.concat(fromColumns));
    }
    return {
        columns,
        fromColumns
    };
}

export function traverseWithClause(withClause: WithClauseContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[]) {
    //result1, result2
    withClause.commonTableExpression().forEach(commonTableExpression => {
        const identifier = commonTableExpression.identifier().text;
        const recursiveNames = withClause.RECURSIVE_SYMBOL() ? commonTableExpression.columnInternalRefList()?.columnInternalRef().map(t => t.text) || [] : undefined;
        const subQuery = commonTableExpression.subquery();
        const subqueryResult = traverseSubquery(subQuery, constraints, parameters, dbSchema, withSchema, [], recursiveNames); //recursive= true??
        subqueryResult.columns.forEach(col => {
            const withCol: ColumnDef = {
                table: identifier,
                columnName: col.name,
                columnType: col.type,
                columnKey: "",
                notNull: col.notNull
            }
            withSchema.push(withCol);
        })

    });
}

function traverseFromClause(fromClause: FromClauseContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumnsParent: ColumnDef[]): ColumnDef[] {
    const tableReferenceList = fromClause.tableReferenceList()?.tableReference();

    const fromColumns = tableReferenceList ? traverseTableReferenceList(tableReferenceList, constraints, parameters, dbSchema, withSchema, fromColumnsParent) : [];

    return fromColumns;
}

function traverseTableReferenceList(tableReferenceList: TableReferenceContext[], constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): ColumnDef[] {

    const result: ColumnDef[] = [];

    tableReferenceList.forEach(tab => {
        const tableFactor = tab.tableFactor();
        if (tableFactor) {
            const fields = traverseTableFactor(tableFactor, constraints, parameters, dbSchema, withSchema, fromColumns);
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

            if (tableReferences) {
                const usingFields = extractFieldsFromUsingClause(joined);
                const joinedFields = traverseTableReferenceList([tableReferences], constraints, parameters, dbSchema, withSchema, fromColumns);
                //doesn't duplicate the fields of the USING clause. Ex. INNER JOIN mytable2 USING(id);
                const joinedFieldsFiltered = usingFields.length > 0 ? filterUsingFields(joinedFields, usingFields) : joinedFields;
                allJoinedColumns.push(joinedFieldsFiltered);

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

                    traverseExpr(onClause, constraints, parameters, dbSchema, withSchema, allJoinedColumns.flatMap(c => c).concat(result))
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
    return result;
}

function traverseTableFactor(tableFactor: TableFactorContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): ColumnDef[] {

    const singleTable = tableFactor.singleTable();
    if (singleTable) {
        return traverseSingleTable(singleTable, constraints, parameters, dbSchema, withSchema);
    }

    const derivadTable = tableFactor.derivedTable();
    if (derivadTable) {
        const tableAlias = derivadTable.tableAlias()?.identifier().text;
        const subQuery = derivadTable.subquery();
        if (subQuery) {
            const subQueryResult = traverseSubquery(subQuery, constraints, parameters, dbSchema, withSchema, fromColumns);
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
        const listParens = traverseTableReferenceListParens(tableReferenceListParens, constraints, parameters, dbSchema, withSchema, fromColumns);
        return listParens;
    }
    throw Error('traverseTableFactor - not supported: ' + tableFactor.constructor.name);
}

//tableReferenceList | tableReferenceListParens
function traverseTableReferenceListParens(ctx: TableReferenceListParensContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): ColumnDef[] {

    const tableReferenceList = ctx.tableReferenceList();
    if (tableReferenceList) {
        return traverseTableReferenceList(tableReferenceList.tableReference(), constraints, parameters, dbSchema, withSchema, fromColumns);
    }

    const tableReferenceListParens = ctx.tableReferenceListParens();

    if (tableReferenceListParens) {
        return traverseTableReferenceListParens(tableReferenceListParens, constraints, parameters, dbSchema, withSchema, fromColumns);
    }

    throw Error('traverseTableReferenceListParens - not supported: ' + ctx.constructor.name);
}

function traverseSingleTable(singleTable: SingleTableContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[]): ColumnDef[] {
    const table = singleTable?.tableRef().text;
    const tableAlias = singleTable?.tableAlias()?.identifier().text;
    const tableName = splitName(table);
    const fields = filterColumns(dbSchema, withSchema, tableAlias, tableName)
    return fields;
}

function traverseSubquery(subQuery: SubqueryContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], fromColumns: ColumnDef[], withSchema: ColumnDef[], recursiveNames?: string[] | undefined): QuerySpecificationResult {
    const result = traverseQueryExpressionBody(subQuery, constraints, parameters, dbSchema, fromColumns, withSchema, recursiveNames);
    return result;
}

function traverseSelectItemList(selectItemList: SelectItemListContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): TypeOperator {
    const listType: TypeVar[] = [];
    if (selectItemList.MULT_OPERATOR()) {
        fromColumns.forEach(col => {
            const columnType = createColumnType(col);
            listType.push(columnType);
        })
    }
    selectItemList.selectItem().forEach(selectItem => {
        const tableWild = selectItem.tableWild();
        if (tableWild) {
            if (tableWild.MULT_OPERATOR()) {
                const itemName = splitName(selectItem.text);
                const allColumns = selectAllColumns(itemName.prefix, fromColumns);
                allColumns.forEach(col => {
                    const columnType = createColumnType(col);
                    listType.push(columnType);
                })
            }
        }
        const expr = selectItem.expr();
        if (expr) {
            const exprType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);

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

function traverseHavingClause(havingClause: HavingClauseContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]) {
    const havingExpr = havingClause.expr();
    traverseExpr(havingExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
}

function traverseExpr(expr: ExprContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): Type {

    if (expr instanceof ExprIsContext) {
        const boolPri = expr.boolPri();
        const boolPriType = traverseBoolPri(boolPri, constraints, parameters, dbSchema, withSchema, fromColumns);
        return boolPriType;
    }
    if (expr instanceof ExprNotContext) {
        return freshVar(expr.text, 'tinyint');;
    }
    if (expr instanceof ExprAndContext || expr instanceof ExprXorContext || expr instanceof ExprOrContext) {
        const exprLeft = expr.expr()[0];
        traverseExpr(exprLeft, constraints, parameters, dbSchema, withSchema, fromColumns);
        const exprRight = expr.expr()[1];
        traverseExpr(exprRight, constraints, parameters, dbSchema, withSchema, fromColumns);
        return freshVar(expr.text, 'tinyint');
    }

    throw Error('traverseExpr - not supported: ' + expr.text);
}

function traverseBoolPri(boolPri: BoolPriContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): Type {
    if (boolPri instanceof PrimaryExprPredicateContext) {
        const predicate = boolPri.predicate();
        const predicateType = traversePredicate(predicate, constraints, parameters, dbSchema, withSchema, fromColumns);
        return predicateType;
    }
    if (boolPri instanceof PrimaryExprIsNullContext) {
        const boolPri2 = boolPri.boolPri();
        traverseBoolPri(boolPri2, constraints, parameters, dbSchema, withSchema, fromColumns);
        return freshVar(boolPri.text, '?');
    }
    if (boolPri instanceof PrimaryExprCompareContext) {

        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.predicate();
        const typeLeft = traverseBoolPri(compareLeft, constraints, parameters, dbSchema, withSchema, fromColumns);
        const typeRight = traversePredicate(compareRight, constraints, parameters, dbSchema, withSchema, fromColumns);

        constraints.push({
            expression: boolPri.text,
            type1: typeLeft,
            type2: typeRight
        })
        return freshVar(boolPri.text, 'tinyint');
    }
    if (boolPri instanceof PrimaryExprAllAnyContext) {
        const compareLeft = boolPri.boolPri();
        const compareRight = boolPri.subquery();
        const typeLeft = traverseBoolPri(compareLeft, constraints, parameters, dbSchema, withSchema, fromColumns);
        const subQueryResult = traverseSubquery(compareRight, constraints, parameters, dbSchema, withSchema, fromColumns);
        constraints.push({
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

function traversePredicate(predicate: PredicateContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): Type {
    const bitExpr = predicate.bitExpr()[0]; //TODO - predicate length = 2? [1] == predicateOperations
    const bitExprType = traverseBitExpr(bitExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
    const predicateOperations = predicate.predicateOperations();
    if (predicateOperations) {
        const rightType = traversePredicateOperations(predicateOperations, bitExprType, constraints, parameters, fromColumns, dbSchema, withSchema);
        if (bitExprType.kind == 'TypeOperator' && rightType.kind == 'TypeOperator') {
            rightType.types.forEach((t, i) => {
                constraints.push({
                    expression: predicateOperations.text,
                    type1: t, // ? array of id+id
                    type2: bitExprType.types[i],
                    mostGeneralType: true
                })

            })

        }
        if (bitExprType.kind == 'TypeVar' && rightType.kind == 'TypeOperator') {

            rightType.types.forEach((t, i) => {
                constraints.push({
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

function traverseExprList(exprList: ExprListContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): Type {

    const listType = exprList.expr().map(item => {
        const exprType = traverseExpr(item, constraints, parameters, dbSchema, withSchema, fromColumns);
        return exprType as TypeVar;

    })
    const type: TypeOperator = {
        kind: 'TypeOperator',
        types: listType
    }
    return type;
}

function traverseBitExpr(bitExpr: BitExprContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): Type {
    const simpleExpr = bitExpr.simpleExpr();
    if (simpleExpr) {
        return traverseSimpleExpr(simpleExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
    }
    if (bitExpr.bitExpr().length == 2) {



        const bitExprLeft = bitExpr.bitExpr()[0];
        const typeLeftTemp = traverseBitExpr(bitExprLeft, constraints, parameters, dbSchema, withSchema, fromColumns);
        const typeLeft = typeLeftTemp.kind == 'TypeOperator' ? typeLeftTemp.types[0] : typeLeftTemp;
        //const newTypeLeft = typeLeft.name == '?'? freshVar('?', 'bigint') : typeLeft;

        const bitExprRight = bitExpr.bitExpr()[1]
        const typeRightTemp = traverseBitExpr(bitExprRight, constraints, parameters, dbSchema, withSchema, fromColumns);

        //In the expression 'id + (value + 2) + ?' the '(value+2)' is treated as a SimpleExprListContext and return a TypeOperator
        const typeRight = typeRightTemp.kind == 'TypeOperator' ? typeRightTemp.types[0] : typeRightTemp;
        //const newTypeRight = typeRight.name == '?'? freshVar('?', 'bigint') : typeRight;
        const bitExprType = freshVar(bitExpr.text, '?');
        if (typeLeftTemp.kind == 'TypeVar' && typeRightTemp.kind == 'TypeVar' && typeLeftTemp.table == typeRightTemp.table) {
            bitExprType.table = typeLeftTemp.table;
        }
        //PRECISA?
        // constraints.push({
        //     expression: bitExpr.text,
        //     type1: typeLeft,
        //     type2: typeRight,
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })


        // constraints.push({
        //     expression: bitExpr.text,
        //     type1: typeLeft,
        //     type2: typeRight,
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })
        // constraints.push({
        //     expression: bitExpr.text,
        //     type1: bitExprType,
        //     type2: typeRight,
        //     mostGeneralType: true,
        //     coercionType: 'Sum'
        // })
        constraints.push({
            expression: bitExprLeft.text,
            type1: bitExprType,
            type2: typeLeft,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        constraints.push({
            expression: bitExprRight.text,
            type1: bitExprType,
            type2: typeRight,
            mostGeneralType: true,
            coercionType: 'Sum'
        })
        // const resultType = freshVar(bitExprRight.text, 'number');
        // constraints.push({
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
        const leftType = traverseBitExpr(bitExpr2, constraints, parameters, dbSchema, withSchema, fromColumns);
        const expr = bitExpr.expr()!; //expr interval
        traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
        constraints.push({
            expression: bitExpr.text,
            type1: leftType,
            type2: freshVar('datetime', 'datetime')
        })
        return freshVar('datetime', 'datetime');

    }
    throw Error('traverseBitExpr - not supported: ' + bitExpr.constructor.name);
}

function traversePredicateOperations(predicateOperations: PredicateOperationsContext, parentType: Type, constraints: Constraint[], parameters: TypeVar[], fromColumns: ColumnDef[], dbSchema: ColumnSchema[], withSchema: ColumnDef[]): Type {
    if (predicateOperations instanceof PredicateExprInContext) {

        const subquery = predicateOperations.subquery();
        if (subquery) {
            const subQueryResult = traverseSubquery(subquery, constraints, parameters, dbSchema, withSchema, fromColumns);
            return { kind: 'TypeOperator', types: subQueryResult.columns.map(t => t.type) };
        }
        const exprList = predicateOperations.exprList();
        if (exprList) {
            const rightType = traverseExprList(exprList, constraints, parameters, dbSchema, withSchema, fromColumns);
            return rightType;
        }
    }

    if (predicateOperations instanceof PredicateExprLikeContext) {
        const simpleExpr = predicateOperations.simpleExpr()[0];
        const rightType = traverseSimpleExpr(simpleExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
        constraints.push({
            expression: simpleExpr.text,
            type1: parentType,
            type2: rightType
        })
        return rightType;

    }
    throw Error("Not expected");

}

function traverseSimpleExpr(simpleExpr: SimpleExprContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]): Type {
    if (simpleExpr instanceof SimpleExprColumnRefContext) {
        const fieldName = splitName(simpleExpr.text);
        const column = findColumn(fieldName, fromColumns);
        const typeVar = freshVar(column.columnName, column.columnType.type, column.tableAlias || column.table);
        constraints.push({
            expression: simpleExpr.text,
            type1: typeVar,
            type2: column.columnType,
            mostGeneralType: true
        })
        return typeVar;
    }
    if (simpleExpr instanceof SimpleExprParamMarkerContext) {
        const param = freshVar('?', '?');
        parameters.push(param);
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
            const exprType = traverseExpr(item, constraints, parameters, dbSchema, withSchema, fromColumns);
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
        const subqueryResult = traverseSubquery(subquery, constraints, parameters, dbSchema, withSchema, fromColumns);
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
            const whenType = traverseExpr(whenExpr, constraints, parameters, dbSchema, withSchema, fromColumns);

            constraints.push({
                expression: whenExpr.text,
                type1: whenType.kind == 'TypeOperator' ? whenType.types[0] : whenType,
                type2: freshVar('tinyint', 'tinyint') //bool
            })
        })

        const thenTypes = simpleExpr.thenExpression().map(thenExprCtx => {
            const thenExpr = thenExprCtx.expr();
            const thenType = traverseExpr(thenExpr, constraints, parameters, dbSchema, withSchema, fromColumns);

            constraints.push({
                expression: thenExprCtx.text,
                type1: caseType,
                type2: thenType.kind == 'TypeOperator' ? thenType.types[0] : thenType,
                mostGeneralType: true,
            })
            return thenType;
        })

        const elseExpr = simpleExpr.elseExpression()?.expr();
        if (elseExpr) {
            const elseType = traverseExpr(elseExpr, constraints, parameters, dbSchema, withSchema, fromColumns);

            constraints.push({
                expression: simpleExpr.elseExpression()?.text!,
                type1: caseType,
                type2: elseType.kind == 'TypeOperator' ? elseType.types[0] : elseType,
                mostGeneralType: true
            })
            thenTypes.forEach(thenType => {
                constraints.push({
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
        const typeLeft = traverseExpr(exprLeft, constraints, parameters, dbSchema, withSchema, fromColumns);
        const typeRight = traverseExpr(exprRight, constraints, parameters, dbSchema, withSchema, fromColumns);
        constraints.push({
            expression: exprLeft.text,
            type1: typeLeft,
            type2: freshVar('bigint', 'bigint')
        })
        if (typeRight.kind == 'TypeVar' && (isDateLiteral(typeRight.name) || isDateTimeLiteral(typeRight.name))) {
            typeRight.type = 'datetime';
        }
        constraints.push({
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
                const inSumExprType = traverseExpr(inSumExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
                traverseExpr(inSumExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
            }
            return functionType;
        }

        if (sumExpr.SUM_SYMBOL() || sumExpr.AVG_SYMBOL()) {
            const functionType = freshVar(simpleExpr.text, '?');
            const inSumExpr = sumExpr.inSumExpr()?.expr();
            if (inSumExpr) {
                const inSumExprType = traverseExpr(inSumExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
                    const exprType = traverseExpr(item, constraints, parameters, dbSchema, withSchema, fromColumns);
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
                const exprType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
                const paramType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime'
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date'
                }
                constraints.push({
                    expression: expr.text,
                    type1: paramType,
                    type2: freshVar(simpleExpr.text, 'date')
                })
            }
            const returnType = runtimeFunctionCall.YEAR_SYMBOL() ? 'year' : 'tinyint';
            return freshVar(simpleExpr.text, returnType);
        }
        if (runtimeFunctionCall.HOUR_SYMBOL() || runtimeFunctionCall.MINUTE_SYMBOL() || runtimeFunctionCall.SECOND_SYMBOL()) {
            const expr = runtimeFunctionCall.exprWithParentheses()?.expr();
            if (expr) {
                const paramType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
                if (paramType.kind == 'TypeVar' && isTimeLiteral(paramType.name)) {
                    paramType.type = 'time';
                }
                if (paramType.kind == 'TypeVar' && isDateLiteral(paramType.name)) {
                    paramType.type = 'date';
                }
                if (paramType.kind == 'TypeVar' && isDateTimeLiteral(paramType.name)) {
                    paramType.type = 'datetime';
                }

                constraints.push({
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
                const exprType = traverseExpr(exprList[0], constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
                    expression: exprList[0].text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
            }
            if (exprList.length == 2) {
                const exprType = traverseExpr(exprList[0], constraints, parameters, dbSchema, withSchema, fromColumns);
                const expr2Type = traverseExpr(exprList[1], constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
                    expression: exprList[0].text,
                    type1: exprType,
                    type2: freshVar('varchar', 'varchar')
                })
                constraints.push({
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
            traverseExprListParameters(exprList, params, constraints, parameters, dbSchema, withSchema, fromColumns);
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
            const typeExpr1 = traverseExpr(expr1, constraints, parameters, dbSchema, withSchema, fromColumns);
            const typeExpr2 = traverseExpr(expr2, constraints, parameters, dbSchema, withSchema, fromColumns);

            if (typeExpr1.kind == 'TypeVar' && (isDateLiteral(typeExpr1.name) || isDateTimeLiteral(typeExpr1.name))) {
                typeExpr1.type = 'datetime';
            }

            constraints.push({
                expression: expr1.text,
                type1: typeExpr1,
                type2: freshVar('datetime', 'datetime')
            })

            constraints.push({
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
                const paramsTypeList = traverseExprListParameters(exprList, params, constraints, parameters, dbSchema, withSchema, fromColumns);
                paramsTypeList.forEach((typeVar, paramIndex) => {
                    constraints.push({
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
            const param1 = traverseExpr(exprList[0], constraints, parameters, dbSchema, withSchema, fromColumns);
            const param2 = traverseExpr(exprList[1], constraints, parameters, dbSchema, withSchema, fromColumns);
            constraints.push({
                expression: simpleExpr.text,
                type1: freshVar('number', 'number'),
                type2: param1,
                mostGeneralType: true,
                coercionType: 'Numeric'
            })
            constraints.push({
                expression: simpleExpr.text,
                type1: freshVar('number', 'number'),
                type2: param2,
                mostGeneralType: true,
                coercionType: 'Numeric'
            })
            constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: param1,
                mostGeneralType: true
            })
            constraints.push({
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
            traverseExpr(expr1, constraints, parameters, dbSchema, withSchema, fromColumns);
            const expr2Type = traverseExpr(expr2, constraints, parameters, dbSchema, withSchema, fromColumns);
            const expr3Type = traverseExpr(expr3, constraints, parameters, dbSchema, withSchema, fromColumns);
            constraints.push({
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
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            return varcharType;
        }

        if (functionIdentifier === 'avg') {
            const functionType = freshVar(simpleExpr.text, '?');
            constraints.push({
                expression: simpleExpr.text,
                type1: functionType,
                type2: freshVar('decimal', 'decimal'),
                mostGeneralType: true
            })
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            return functionType;
        }

        if (functionIdentifier === 'round') {
            const functionType = freshVar(simpleExpr.text, '?');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [functionType]
            }
            const paramsType = walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            //The return value has the same type as the first argument
            constraints.push({
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
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            return freshVar(simpleExpr.text, 'bigint');
        }

        if (functionIdentifier === 'str_to_date') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam, varcharParam]
            }
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            return freshVar(simpleExpr.text, 'date');
        }

        if (functionIdentifier === 'datediff') {
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            if (udfExprList) {
                udfExprList.forEach((inExpr) => {
                    const expr = inExpr.expr();
                    const exprType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
                    const newType = verifyDateTypesCoercion(exprType);

                    constraints.push({
                        expression: expr.text,
                        type1: newType,
                        type2: freshVar('date', 'date'),
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
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
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
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            return varcharParam;
        }

        if (functionIdentifier === 'length' || functionIdentifier == 'char_length') {
            const varcharParam = freshVar('varchar', 'varchar');
            const params: FixedLengthParams = {
                kind: 'FixedLengthParams',
                paramsType: [varcharParam]
            }
            walkFunctionParameters(simpleExpr, params, constraints, parameters, dbSchema, withSchema, fromColumns);
            return freshVar('int', 'int');
        }
        if (functionIdentifier === 'abs') {
            const functionType = freshVar('number', 'number');
            const udfExprList = simpleExpr.functionCall().udfExprList()?.udfExpr();
            udfExprList?.forEach(expr => {
                const param1 = traverseExpr(expr.expr(), constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
                const param1 = traverseExpr(expr.expr(), constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
                    const exprType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
                    const newType = verifyDateTypesCoercion(exprType);

                    //const expectedType = ['hour', 'minute', 'second'].includes(unit)? 'time' : 'datetime'
                    constraints.push({
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

                const expr1Type = traverseExpr(expr1.expr(), constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
                    expression: expr1.text,
                    type1: functionType,
                    type2: expr1Type
                })

                const expr2Type = traverseExpr(expr2.expr(), constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
                const paramType = traverseExpr(expr1.expr(), constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
        return traverseWindowFunctionCall(windowFunctionCall, constraints, parameters, dbSchema, withSchema, fromColumns);
    }
    if (simpleExpr instanceof SimpleExprCastContext) {
        const castType = simpleExpr.castType();
        if (castType.CHAR_SYMBOL()) {
            return freshVar(castType.text, 'char');
        }
    }

    throw Error('traverseSimpleExpr - not supported: ' + simpleExpr.constructor.name);
}

function traverseWindowFunctionCall(windowFunctionCall: WindowFunctionCallContext, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]) {
    if (windowFunctionCall.ROW_NUMBER_SYMBOL()
        || windowFunctionCall.RANK_SYMBOL()
        || windowFunctionCall.DENSE_RANK_SYMBOL()
        || windowFunctionCall.CUME_DIST_SYMBOL()
        || windowFunctionCall.PERCENT_RANK_SYMBOL()) {
        return freshVar(windowFunctionCall.text, 'bigint');
    }
    const expr = windowFunctionCall.expr();
    if (expr) {
        return traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
    }
    const exprWithParentheses = windowFunctionCall.exprWithParentheses();
    if (exprWithParentheses) {
        const expr = exprWithParentheses.expr();
        return traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
    }
    throw Error('No support for expression' + windowFunctionCall.constructor.name);
}

function traverseExprListParameters(exprList: ExprContext[], params: FunctionParams, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]) {
    return exprList.map((expr, paramIndex) => {
        const exprType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
        const paramType = params.kind == 'FixedLengthParams' ? params.paramsType[paramIndex] : freshVar(params.paramType, params.paramType);
        constraints.push({
            expression: expr.text,
            type1: exprType,
            type2: paramType,
            mostGeneralType: true
        })
        return paramType;
    })
}

function walkFunctionParameters(simpleExprFunction: SimpleExprFunctionContext, params: FunctionParams, constraints: Constraint[], parameters: TypeVar[], dbSchema: ColumnSchema[], withSchema: ColumnDef[], fromColumns: ColumnDef[]) {
    const functionName = getFunctionName(simpleExprFunction);
    const udfExprList = simpleExprFunction.functionCall().udfExprList()?.udfExpr();
    if (udfExprList) {
        const paramTypes = udfExprList
            .filter((undefined, paramIndex) => {
                return functionName == 'timestampdiff' ? paramIndex != 0 : true; //filter the first parameter of timestampdiff function
            })
            .map((inExpr, paramIndex) => {
                const expr = inExpr.expr();
                const exprType = traverseExpr(expr, constraints, parameters, dbSchema, withSchema, fromColumns);
                constraints.push({
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
            const inSumExprType = traverseExpr(inExpr, constraints, parameters, dbSchema, withSchema, fromColumns);
            constraints.push({
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

    const limitOptions = getLimitOptions(selectStatement);
    if (limitOptions.length == 1 && limitOptions[0].text == '1') {
        return false;
    }
    if (limitOptions.length == 2 && limitOptions[1].text == '1') {
        return false;
    }

    return true;
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

