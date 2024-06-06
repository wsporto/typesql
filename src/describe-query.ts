import { SchemaDef, ParameterDef, TypeSqlError, PreprocessedSql, MySqlDialect } from "./types";
import { extractQueryInfo } from "./mysql-query-analyzer/parse";
import { Either, isLeft, right, left } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "./mysql-query-analyzer/types";
import { InferType, DbType } from "./mysql-mapping";
import { explainSql, loadMysqlSchema } from "./queryExectutor";

export function describeSql(dbSchema: ColumnSchema[], sql: string): SchemaDef {
    const { sql: processedSql, namedParameters } = preprocessSql(sql);
    const queryInfo = extractQueryInfo(sql, dbSchema);
    if (queryInfo.kind == 'Select') {

        const parametersDef = queryInfo.parameters.map((paramInfo, paramIndex) => {
            const paramDef: ParameterDef = {
                name: namedParameters && namedParameters[paramIndex] ? namedParameters[paramIndex] : 'param' + (paramIndex + 1),
                columnType: paramInfo.type,
                notNull: paramInfo.notNull
            }
            return paramDef;
        })

        const schemaDef: SchemaDef = {
            sql: processedSql,
            queryType: 'Select',
            multipleRowsResult: queryInfo.multipleRowsResult,
            columns: queryInfo.columns,
            parameters: parametersDef,
        }
        if (queryInfo.orderByColumns && queryInfo.orderByColumns.length > 0) {
            schemaDef.orderByColumns = queryInfo.orderByColumns
        }
        if (queryInfo.nestedResultInfo) {
            schemaDef.nestedResultInfo = queryInfo.nestedResultInfo;
        }
        if (queryInfo.dynamicQuery) {
            schemaDef.dynamicSqlQuery = queryInfo.dynamicQuery;
        }
        return schemaDef;

    }
    if (queryInfo.kind == 'Insert') {
        const resultColumns: ColumnInfo[] = [
            {
                columnName: 'affectedRows',
                type: 'int',
                notNull: true
            },
            {
                columnName: 'insertId',
                type: 'int',
                notNull: true
            }
        ]

        const parameters = namedParameters ? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
        const verifiedParameters = parameters.map(param => ({ ...param, columnType: verifyNotInferred(param.columnType) }))
        const schemaDef: SchemaDef = {
            sql: processedSql,
            queryType: 'Insert',
            multipleRowsResult: false,
            columns: resultColumns,
            parameters: verifiedParameters,
        }
        return schemaDef;
    }
    if (queryInfo.kind == 'Update') {
        const resultColumns: ColumnInfo[] = [
            {
                columnName: 'affectedRows',
                type: 'int',
                notNull: true
            }
        ]
        const schemaDef: SchemaDef = {
            sql: processedSql,
            queryType: 'Update',
            multipleRowsResult: false,
            columns: resultColumns,
            parameters: queryInfo.parameters,
            data: queryInfo.data,
        }
        return schemaDef;
    }
    if (queryInfo.kind == 'Delete') {
        const resultColumns: ColumnInfo[] = [
            {
                columnName: 'affectedRows',
                type: 'int',
                notNull: true
            }
        ]
        const parameters = namedParameters ? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
        const schemaDef: SchemaDef = {
            sql: processedSql,
            queryType: 'Delete',
            multipleRowsResult: false,
            columns: resultColumns,
            parameters,
        }
        return schemaDef;

    }

    throw Error("Not supported!");
}

function addParameterNames(parameters: ParameterDef[], namedParameters: string[]) {
    return parameters.map((param, paramIndex) => {
        const paramDef: ParameterDef = {
            ...param,
            name: namedParameters && namedParameters[paramIndex] ? namedParameters[paramIndex] : param.name
        }
        return paramDef;
    })
}

export function verifyNotInferred(type: InferType): DbType | 'any' {
    if (type == '?' || type == 'any') return "any";
    if (type == 'number') return "double";
    return type;
}

export async function parseSql(client: MySqlDialect, sql: string): Promise<Either<TypeSqlError, SchemaDef>> {
    const { sql: processedSql } = preprocessSql(sql);
    const explainResult = await explainSql(client.client, processedSql);
    if (isLeft(explainResult)) {
        return explainResult;
    }
    const dbSchema = await loadMysqlSchema(client.client, client.schema);
    if (isLeft(dbSchema)) {
        return left(dbSchema.left);
    }
    try {
        const result = describeSql(dbSchema.right, sql);
        return right(result);
    }
    catch (e: any) {
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
    const lines = sql.split('\n');
    const regex = /:[a-zA-Z$_]+[a-zA-Z\d$_]*/g;
    let newSql = '';
    const allParameters: string[] = [];
    lines.forEach((line, index, array) => {
        let newLine = line;
        if (!line.trim().startsWith('--')) {
            const parameters: string[] = line.match(regex)?.map(param => param.slice(1)) || [];
            allParameters.push(...parameters);
            newLine = line.replace(regex, '?');
        }
        newSql += newLine;
        if (index != (array.length - 1)) {
            newSql += '\n';
        }
    })

    const processedSql: PreprocessedSql = {
        sql: newSql,
        namedParameters: allParameters
    }
    return processedSql;
}

//https://stackoverflow.com/a/1695647
export function hasAnnotation(sql: string, annotation: string) {
    const regex = `-- ${annotation}`;
    return sql.match(new RegExp(regex)) != null;
}