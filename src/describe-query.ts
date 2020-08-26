import { ColumnDef, SchemaDef, ParameterDef, InvalidSqlError, PreprocessedSql } from "./types";
import { extractQueryInfo } from "./mysql-query-analyzer/parse";
import { DbClient } from "./queryExectutor";
import { Either, isLeft, right } from "fp-ts/lib/Either";
import { ColumnSchema } from "./mysql-query-analyzer/types";

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
            multipleRowsResult: true,
            columns: columnDef,
            parameters: parametersDef,
        }
        if(queryInfo.orderByColumns && queryInfo.orderByColumns.length > 0) {
            schemaDef.orderByColumns = queryInfo.orderByColumns
        }
        return schemaDef;

    }
    if( queryInfo.kind == 'Insert') {
        const parameters = namedParameters? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
        const schemaDef: SchemaDef = {
            sql: sql,
            multipleRowsResult: false,
            columns: [],
            parameters,
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
        const updateParamNamesNames = namedParameters? namedParameters.slice(0, queryInfo.data.length) : [];
        const whereParametersNames = namedParameters? namedParameters.slice(queryInfo.data.length) : [];

        const schemaDef: SchemaDef = {
            sql: sql,
            multipleRowsResult: false,
            columns: resultColumns,
            parameters: addParameterNames(queryInfo.parameters, whereParametersNames),
            data: queryInfo.data,
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

export async function parseSql(client: DbClient, sql: string) : Promise<Either<InvalidSqlError, SchemaDef>> {
    const {sql: processedSql, namedParameters} = preprocessSql(sql);
    const explainResult = await client.explainSql(processedSql);
        if(isLeft(explainResult)) {
        return explainResult;
    }
    const dbSchema = await client.loadDbSchema();
    const result = describeSql(dbSchema, processedSql, namedParameters);
    return right(result);
}

export function preprocessSql(sql: string) {
    const regex = /:[a-zA-Z\d]+/g;
    const namedParameters : string[] = sql.match(regex)?.map( param => param.slice(1) ) || [];
    const newSql = sql.replace(regex, '?');
    const processedSql : PreprocessedSql = {
        sql: newSql,
        namedParameters
    }
    return processedSql;
}