import { ColumnDef, SchemaDef, ParameterDef, TypeSqlError, PreprocessedSql } from "./types";
import { extractQueryInfo } from "./mysql-query-analyzer/parse";
import { DbClient } from "./queryExectutor";
import { Either, isLeft, right, left } from "fp-ts/lib/Either";
import { ColumnSchema } from "./mysql-query-analyzer/types";
import { MySqlType, InferType } from "./mysql-mapping";

export function describeSql(dbSchema: ColumnSchema[], sql: string, namedParameters?: string[]) : SchemaDef {
    const queryInfo = extractQueryInfo(sql, dbSchema);
    if(queryInfo.kind == 'Select') {
        const columnDef = queryInfo.columns.map( colInfo => {
            const colDef : ColumnDef = {
                name: colInfo.columnName,
                dbtype: colInfo.type,
                notNull: colInfo.notNull
            }
            return colDef;
        })
    
        const parametersDef = queryInfo.parameters.map( (paramInfo, paramIndex) => {
            const paramDef : ParameterDef = {
                name: namedParameters && namedParameters[paramIndex]? namedParameters[paramIndex] : 'param' + (paramIndex + 1),
                columnType: paramInfo.type,
                notNull: paramInfo.notNull
            }
            return paramDef;
        })
    
        const schemaDef: SchemaDef = {
            sql,
            queryType: 'Select',
            multipleRowsResult: queryInfo.multipleRowsResult,
            columns: columnDef,
            parameters: parametersDef,
        }
        if(queryInfo.orderByColumns && queryInfo.orderByColumns.length > 0) {
            schemaDef.orderByColumns = queryInfo.orderByColumns
        }
        return schemaDef;

    }
    if( queryInfo.kind == 'Insert') {
        const resultColumns : ColumnDef[] = [
            {
                name: 'affectedRows',
                dbtype: 'int',
                notNull: true
            },
            {
                name: 'insertId',
                dbtype: 'int',
                notNull: true
            }
        ]

        const parameters = namedParameters? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
        const verifiedParameters = parameters.map( param => ({...param, columnType: verifyNotInferred(param.columnType)}))
        const schemaDef: SchemaDef = {
            sql: sql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: resultColumns,
            parameters: verifiedParameters,
        }
        return schemaDef;
    }
    if(queryInfo.kind == 'Update') {
        const resultColumns : ColumnDef[] = [
            {
                name: 'affectedRows',
                dbtype: 'int',
                notNull: true
            },
            {
                name: 'insertId',
                dbtype: 'int',
                notNull: true
            }
        ]
        const whereParametersNames = namedParameters? namedParameters.slice(queryInfo.data.length) : [];

        const schemaDef: SchemaDef = {
            sql: sql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns: resultColumns,
            parameters: addParameterNames(queryInfo.parameters, whereParametersNames),
            data: queryInfo.data,
        }
        return schemaDef;
    }
    if(queryInfo.kind == 'Delete') {
        const resultColumns : ColumnDef[] = [
            {
                name: 'affectedRows',
                dbtype: 'int',
                notNull: true
            }
        ]
        const parameters = namedParameters? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
        const schemaDef: SchemaDef = {
            sql: sql,
            queryType: 'Delete',
            multipleRowsResult: false,
            columns: resultColumns,
            parameters,
        }
        return schemaDef;

    }
    
    throw Error ("Not supported!");
}

function addParameterNames(parameters: ParameterDef[], namedParameters: string[]) {
    return parameters.map( (param, paramIndex) => {
        const paramDef : ParameterDef = {
            ...param,
            name: namedParameters && namedParameters[paramIndex]? namedParameters[paramIndex] : param.name
        }
        return paramDef;
    })
}

export function verifyNotInferred(type: InferType) : MySqlType {
    if(type == '?' || type == 'any') return "varchar";
    if(type == 'number') return "double";
    return type;
}

export async function parseSql(client: DbClient, sql: string) : Promise<Either<TypeSqlError, SchemaDef>> {
    const {sql: processedSql, namedParameters} = preprocessSql(sql);
    const explainResult = await client.explainSql(processedSql);
        if(isLeft(explainResult)) {
        return explainResult;
    }
    const dbSchema = await client.loadDbSchema();
    if(isLeft(dbSchema)) {
        return left(dbSchema.left);
    } 
    try {
        const result = describeSql(dbSchema.right, processedSql, namedParameters);
        return right(result);
    }
    catch(e) {
        const InvalidSqlError: TypeSqlError = {
            name: 'Invalid SQL',
            description: e.message,
        }
        return left(InvalidSqlError);
    }
    
    
}

//http://dev.mysql.com/doc/refman/8.0/en/identifiers.html
//Permitted characters in unquoted identifiers: ASCII: [0-9,a-z,A-Z$_] (basic Latin letters, digits 0-9, dollar, underscore)
export function preprocessSql(sql: string) {
    const regex = /:[a-zA-Z$_]+[a-zA-Z\d$_]*/g;
    const namedParameters : string[] = sql.match(regex)?.map( param => param.slice(1) ) || [];
    const newSql = sql.replace(regex, '?');
    const processedSql : PreprocessedSql = {
        sql: newSql,
        namedParameters
    }
    return processedSql;
}