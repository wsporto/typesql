import MySQLParser, { SqlMode, QueryContext, QuerySpecificationContext, SelectStatementContext, SubqueryContext } from 'ts-mysql-parser';
import { RuleContext } from "antlr4ts";
import { ParseTree } from "antlr4ts/tree";
import { analiseTree, Constraint, Type, TypeVar, analiseQuerySpecification, unionTypeResult, getInsertColumns, analiseInsertStatement, analiseUpdateStatement } from './collect-constraints';
import { ColumnSchema, TypeInferenceResult, QueryInfoResult, ColumnInfo, ParameterInfo, ColumnDef, InsertInfoResult, UpdateInfoResult } from './types';
import { getColumnsFrom, getColumnNames } from './select-columns';
import { inferParamNullability, inferParamNullabilityQuery } from './infer-param-nullability';
import { inferNotNull } from './infer-column-nullability';
import { MySqlType } from '../mysql-mapping';
import { ParameterDef } from '../types';


const parser = new MySQLParser({
  version: '8.0.0',
  mode: SqlMode.NoMode
})

export function parse(sql: string) : QueryContext {
    const parseResult = parser.parse(sql);
    if(parseResult.parserError) {
        throw new Error('Parser error' + parseResult.parserError)
    }

    return parseResult.tree as QueryContext;
}

export type SubstitutionHash = {
    [index: number]: TypeVar
}

export function unify(constraints: Constraint[], substitutions: SubstitutionHash) {
    for (const constraint of constraints) {
        unifyOne(constraint, substitutions);
    }
}

function unifyOne(constraint: Constraint, substitutions: SubstitutionHash) {
    const ty1 = substitute(constraint.type1, substitutions);
    const ty2 = substitute(constraint.type2, substitutions);

    if(ty1.kind == 'TypeOperator' && ty2.kind == 'TypeOperator') {

        ty1.types.forEach((t, i) => {
            const newConstr : Constraint = {
                expression: 'list',
                type1: ty1.types[i],
                type2: ty2.types[i],
                strict: true
            }
            unifyOne(newConstr, substitutions)
        })
    }

    else if(ty1.kind == 'TypeVar' && ty2.kind == 'TypeVar') {
        if(ty1.id == ty2.id) return;
        if(ty1.type != '?') {
            
            if(ty2.type != '?') {
                const bestType = getBestPossibleType(ty1.type, ty2.type, constraint.mostGeneralType, constraint.sum) as MySqlType;
                ty1.type = bestType;
                ty2.type = bestType;
                setSubstitution(ty1, ty2, substitutions);
                setSubstitution(ty2, ty1, substitutions);
                // substitutions[ty2.id] = ty1;
                // substitutions[ty1.id] = ty2;
            }
            else {
                
                const numberTypes = ['number', 'tinyint', 'int', 'bigint', 'decimal', 'double'];
                if(constraint.sum && constraint.mostGeneralType && numberTypes.indexOf(ty1.type) >= 0) {
                    //In the expression ty1 + ?, ty2 = double
                    ty1.type = 'double';   
                    ty2.type = 'double'; 
                }
                substitutions[ty2.id] = ty1;
            }
            
            if(ty2.list) {
                substitutions[ty2.id].list = true;
            }
        }
        else {
            //THEN ? ELSE id; ? will be double; or ? will be int if commented
            // const numberTypes = ['number', 'tinyint', 'int', 'bigint', 'decimal', 'double']
            // if(!constraint.strict && numberTypes.indexOf(ty2.type) >= 0) {
            //     ty2.type = 'number';
            // }
            const exactValueNumbers = ['int', 'bigint', 'decimal'];
            if( constraint.functionName &&  (exactValueNumbers.indexOf(ty2.type) >=0)) {
                ty2.type = 'decimal';
            }

            const aproximatedValues = ['float', 'double'];
            if( constraint.functionName &&  (aproximatedValues.indexOf(ty2.type) >=0)) {
                ty2.type = 'double';
            } 

            substitutions[ty1.id] = ty2;
            ty1.type = ty2.type
            ty2.list = ty1.list;
            
        }
    }
    else if(ty1.kind == 'TypeVar' && ty2.kind == 'TypeOperator') {
        ty2.types.forEach( t => {
            const newContraint : Constraint = {
                ...constraint,
                type1: ty1,
                type2: {...t, list: true} as TypeVar
            }
            unifyOne(newContraint, substitutions);
        })
    }
    if(ty1.kind == 'TypeOperator' && ty2.kind == 'TypeVar') {
        const newConstraint : Constraint = {
            ...constraint,
            type1: ty2,
            type2: ty1
        }
        unifyOne(newConstraint, substitutions);
    }
}

function setSubstitution(ty1: TypeVar, ty2: TypeVar, substitutions: SubstitutionHash) {

    const subs = substitutions[ty1.id];
    substitutions[ty1.id] = ty2;
    if(subs && subs.id != ty2.id) {
        subs.type = ty2.type;
        setSubstitution(subs, ty2, substitutions);
    }
}

function getBestPossibleType(type1: string, type2: string, max?:boolean, sum?: 'sum') : string {
    if( sum && max && type1 == 'number' && type2 == 'int' ||  type1 == 'int' && type2 == 'number') return 'double';
    // if( sum && type1 == 'number' && type2 == 'bigint' ||  type1 == 'bigint' && type2 == 'number') return 'double';
    if( sum && max && type1 == 'int' && type2 == 'int') return 'bigint';
    if( sum && max && ((type1 == 'int' && type2 == 'double') || type1 == 'double' && type2 == 'int' )) return 'double';
    if( sum && max && ((type1 == 'bigint' && type2 == 'double') || type1 == 'double' && type2 == 'bigint' )) return 'double';
    //if( sum && (type1 == 'decimal' && type2 == 'number') || type1 == 'number' && type2 == 'decimal' ) return 'double';

    const order : string[] = ['number', 'tinyint', 'int', 'bigint', 'decimal', 'float', 'double'];
    const indexType1 = order.indexOf(type1);
    const indexType2 = order.indexOf(type2);
    if(indexType1 != -1 && indexType2 != -1) {
        const index = max? Math.max(indexType1, indexType2) : Math.min(indexType1, indexType2);
        return order[index];
    } 
    const order2 : string[] = ['varchar'];
    const indexStrType1 = order2.indexOf(type1);
    const indexStrType2 = order2.indexOf(type2);
    if(indexStrType1 != -1 && indexStrType2 != -1) {
        const index = max? Math.max(indexStrType1, indexStrType2) : Math.min(indexStrType1, indexStrType2);
        return order2[index];
    } 
    throw Error ('Type mismatch: ' + type1 + ' and ' + type2);
}


export function substitute(type: Type, substitutions: SubstitutionHash) : Type {
    if(type.kind == 'TypeVar' && type.type != '?') {
        return type;
    }
    if(type.kind == 'TypeVar' && type.type == '?') {
        const subs = substitutions[type.id];
        if(subs) {
            if(type.list && subs.kind == 'TypeVar') subs.list;
            return substitute( subs, substitutions)
        }
        
        return type;
    } 
    return type;
}

export function infer(tree: RuleContext, dbSchema: ColumnSchema[]) : TypeInferenceResult {
    const typeInferenceResult =  analiseTree(tree, dbSchema);
    return typeInferenceResult;
}

export function parseAndInfer(sql: string, dbSchema: ColumnSchema[]) : TypeInferenceResult {
    return infer(parse(sql), dbSchema); 
}

export function parseAndInferParamNullability(sql: string) : boolean[] {
    const queryContext = parse(sql);
    return inferParamNullabilityQuery(queryContext); 
}

export function extractQueryInfoFromQuerySpecification(querySpec: QuerySpecificationContext, dbSchema: ColumnSchema[], parentFromColumns: ColumnDef[]) : QueryInfoResult {
    const fromColumns = getColumnsFrom(querySpec, dbSchema).concat(parentFromColumns);
    const inferResult = analiseQuerySpecification(querySpec, dbSchema, fromColumns);
    // console.log("inferResult=", inferResult);
    const columnNullability = inferNotNull(querySpec, dbSchema);
    const selectedColumns = getColumnNames(querySpec, fromColumns);
    const columnResult = selectedColumns.map( (col, index)=> {
        const columnType = inferResult.columns[index];
        const columnNotNull = columnNullability[index];
        const colInfo: ColumnInfo = {
            columnName: col,
            type: columnType,
            notNull: columnNotNull
        }
        return colInfo;
    })

    const paramInference = inferParamNullability(querySpec);
    const parametersResult = inferResult.parameters.map( (param, index) => {
        const paramInfo : ParameterInfo = {
            type: param,
            notNull: paramInference[index]
        }
        return paramInfo;
    });

    const queryResult : QueryInfoResult = {
        kind: 'Select',
        columns: columnResult,
        parameters: parametersResult
    }
    return queryResult;
}

function extractOrderByColumns(selectStatement: SelectStatementContext) {
    return selectStatement.queryExpression()?.orderClause()?.orderList().orderExpression().map( orderExpr => orderExpr.text) || [];
}


export function extractQueryInfo(sql: string, dbSchema: ColumnSchema[]): QueryInfoResult | InsertInfoResult | UpdateInfoResult {

    const tree = parse(sql);
    if (tree instanceof QueryContext) {
        const selectStatement = tree.simpleStatement()?.selectStatement();
        if(selectStatement) {
            
            const querySpec = getQuerySpecificationsFromSelectStatement(selectStatement);
            const mainQueryResult = analiseQuery(querySpec, dbSchema, []);
            
            const orderByColumns = extractOrderByColumns(selectStatement);
            if(orderByColumns.length > 0) {
                const fromColumns = getColumnsFrom(querySpec[0], dbSchema).map( col => col.columnName);
                const selectColumns = mainQueryResult.columns.map( col => col.columnName);
                const allOrderByColumns = Array.from(new Set(fromColumns.concat(selectColumns)));
                const resultWithOrderBy: QueryInfoResult = {
                    ...mainQueryResult,
                    orderByColumns: allOrderByColumns
                }
                return resultWithOrderBy;
            }
            
            return mainQueryResult;
        }
        const insertStatement = tree.simpleStatement()?.insertStatement();
        if(insertStatement) {
            const insertColumns = getInsertColumns(insertStatement, dbSchema);
            const typeInfer = analiseInsertStatement(insertStatement, insertColumns);
            return typeInfer;
        }
        const updateStatement = tree.simpleStatement()?.updateStatement();
        if(updateStatement) {
            const typeInfer = analiseUpdateStatement(updateStatement, dbSchema);
            return typeInfer;
        }
        
    }
    throw Error('Not supported');
}

export function analiseQuery(querySpec: QuerySpecificationContext[], dbSchema: ColumnSchema[], parentFromColumns: ColumnDef[]) : QueryInfoResult {

    const mainQueryResult = extractQueryInfoFromQuerySpecification(querySpec[0], dbSchema, parentFromColumns);
            
    for (let queryIndex = 1; queryIndex < querySpec.length; queryIndex++) { //union (if have any)
        const unionResult = extractQueryInfoFromQuerySpecification(querySpec[queryIndex], dbSchema, parentFromColumns);
        const notNullColumns = inferNotNull(querySpec[queryIndex], dbSchema);

        mainQueryResult.columns.forEach( (field, fieldIndex) => {
            const unionField = unionResult.columns[fieldIndex];
            field.notNull = field.notNull && notNullColumns[fieldIndex]; //if all the fields at the fieldIndex is null
            field.type = unionTypeResult(field.type, unionField.type);
        }) 
        mainQueryResult.parameters.push(...unionResult.parameters);
    }
    return mainQueryResult;
}

export function getQuerySpecificationsFromSelectStatement(selectStatement: SelectStatementContext | SubqueryContext ) : QuerySpecificationContext[] {
    const result : QuerySpecificationContext[] = [];
    collectQuerySpecifications(selectStatement, result);
    return result;
}

function collectQuerySpecifications(tree: ParseTree, result: QuerySpecificationContext[]) {
    for (let i = 0; i < tree.childCount; i++) {
        const child = tree.getChild(i);
        if(child instanceof QuerySpecificationContext) {
            result.push(child);
        }
        else {
            collectQuerySpecifications(child, result);
        }
    }
}

