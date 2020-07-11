import { parseSql } from "./parser";
import { SchemaDef, CamelCaseName, TsFieldDescriptor } from "./types";
import fs from "fs";
import path, { parse } from "path";
import { DbClient } from "./queryExectutor";
import camelCase from "camelcase";
import { isLeft } from "fp-ts/lib/Either";
import { none, Option, some, isNone } from "fp-ts/lib/Option";
import { converToTsType, MySqlType } from "./mysql-database";

export function generateTsDescriptor(queryInfo: SchemaDef) : TsDescriptor {
    
    const columns = queryInfo.columns.map( col => {
        const tsDesc : TsFieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.dbtype),
            notNull: col.notNull? col.notNull : false 
        }
        return tsDesc;
    })
    const parameters = queryInfo.parameters.map( col => {
        const arraySymbol = col.list? '[]' : '';

        const tsDesc : TsFieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.columnType) + arraySymbol,
            notNull: false
        }
        return tsDesc;
    })

    const data = queryInfo.data?.map( col => {

        const tsDesc : TsFieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.columnType),
            notNull: false
        }
        return tsDesc;
    })

    //TODO - should return queryInfo.parameterNames always
    const parameterNames = queryInfo.parameterNames? queryInfo.parameterNames : queryInfo.parameters.map( param => param.name);
    
    return {
        sql: queryInfo.sql,
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns,
        orderByColumns: queryInfo.orderByColumns,
        parameters,
        data,
        parameterNames
    };


}

export function generateReturnName(name: CamelCaseName, isMultiResult: boolean) {
    const capitalizedName = capitalize(name);
    return `${capitalizedName}Result` + (isMultiResult? '[]' : '');
}

function generateOrderByTypeName(queryName: CamelCaseName) {
    const capitalizedName = capitalize(queryName);
    return `${capitalizedName}OrderBy`;
}

function generateParamsTypeName(queryName: CamelCaseName) {
    const capitalizedName = capitalize(queryName);
    return `${capitalizedName}Params`;
}

function generateDataTypeName(queryName: CamelCaseName) {
    const capitalizedName = capitalize(queryName);
    return `${capitalizedName}Data`;
}

export function generateParamsType(queryName:CamelCaseName, params: TsFieldDescriptor[], includeOrderByParam: boolean) {
    if(params.length == 0 && !includeOrderByParam) {
        return '';
    }
    
    const orderByTypeName = generateOrderByTypeName(queryName);
    const paramsStrTemp = params.map( actual => {
        return `${actual.name}${ actual.notNull? '': '?'}: ${actual.tsType};`;
    }).join('\n');
    const paramsStr = includeOrderByParam? paramsStrTemp + ( `\norderBy: [${orderByTypeName}, ...${orderByTypeName}[]];` ) : paramsStrTemp;
    const paramTypeName = generateParamsTypeName(queryName);

    const paramsType = `
    export type ${paramTypeName} = {
        ${paramsStr.trim()}
    }
    `
    return paramsType;
}

export function generateDataType(queryName: CamelCaseName, dataParams: TsFieldDescriptor[] | undefined) {
    const dataParamsStr = dataParams?.map( (actual) => {
        return `${actual.name}${actual.notNull? '': '?'}: ${actual.tsType};`;
    }).join('\n');

    const dataTypeName = generateDataTypeName(queryName);

    const dataType = dataParams? `
    export type ${dataTypeName} = {
        ${dataParamsStr}
    }
    `
    :
    ''
    return dataType;
}

export function generateReturnType(queryName: CamelCaseName, dataParams: TsFieldDescriptor[] | undefined) {
    const capitalizedName = capitalize(queryName);
    const dataParamsStr = dataParams?.map( (actual) => {
        return `${actual.name}${actual.notNull? '': '?'}: ${actual.tsType};`;
    }).join('\n');

    const dataType = dataParams? `
    export type ${capitalizedName}Data = {
        ${dataParamsStr}
    }
    `
    :
    ''
    return dataType;
}

export function generateOrderByType(queryName: CamelCaseName, orderByColumns: string[] | undefined) {
    const orderByColumnsType = orderByColumns?.map(col => `'${col}'`).join( ' | ' );
    const orderByTypeName = generateOrderByTypeName(queryName);

    const orderByType = orderByColumns? `
     export type ${orderByTypeName} = {
        column: ${orderByColumnsType};
        direction: 'asc' | 'desc';
     }
     `
    :
    '';
    return orderByType;
}

export function generateOrderByFunction(queryName: CamelCaseName, orderByColumns: string[] | undefined) {
    const orderByTypeName = generateOrderByTypeName(queryName);
    return orderByColumns? `
    function escapeOrderBy(connection: Connection, orderBy: ${orderByTypeName}[]) {
        return orderBy.map( order => \`\${connection.escapeId(order.column)} \${order.direction == 'desc' ? 'desc' : 'asc' }\`).join(', '); 
    }
    `
    :
    '';
}

export function generateFunction(camelCaseName: CamelCaseName, tsDescriptor: TsDescriptor) {

    const resultStr = generateReturnName(camelCaseName, tsDescriptor.multipleRowsResult);

    let functionParams = '';
    if(tsDescriptor.data && tsDescriptor.data.length > 0) functionParams += ', data: ' + generateDataTypeName(camelCaseName);
    if(tsDescriptor.parameters.length > 0) functionParams += ', params: ' + generateParamsTypeName(camelCaseName);

    let paramValues = '';
    if(tsDescriptor.parameterNames.length > 0) {
        paramValues = tsDescriptor.parameterNames.map( param => 'params.' + param).join(', ');
    }
    else {
        const allParameters : string[] = [];
        if(tsDescriptor.data) allParameters.push(...tsDescriptor.data.map(param => 'data.' + param.name));
        if(tsDescriptor.parameters) allParameters.push(...tsDescriptor.parameters.map(param => 'params.' + param.name));
        paramValues += allParameters.join(', ');
    }
    if(paramValues != '') paramValues = ', [' + paramValues + ']';

    const mainFunction = `
    export async function ${camelCaseName}(connection: Connection${functionParams}) : Promise<${resultStr}> {
    const sql = \`
    ${replaceOrderByParam(tsDescriptor.sql)}
    \`;
    return connection.query(sql${paramValues})
        .then( res => res[0] as ${resultStr} );
    }
    `
    return mainFunction;
}

function mapColumnType(columnType: MySqlType | MySqlType[] | '?') : string {
    if(columnType == '?') return '?';
    const types = ([] as MySqlType[]).concat(columnType);
    const mappedTypes = types.map( type => converToTsType(type));
    return mappedTypes.join(' | '); // number | string

}

function generateTsContent(tsDescriptorOption: Option<TsDescriptor>, queryName: string) {
    
    if(isNone(tsDescriptorOption)) {
        return '//Invalid sql';
    }

    const tsDescriptor = tsDescriptorOption.value;
    
    const camelCaseName = convertToCamelCaseName(queryName);
    const dataType = generateDataType(camelCaseName, tsDescriptor.data);
    const returnType = generateReturnType(camelCaseName, tsDescriptor.columns);
    const includeOrderByParams = (tsDescriptor.orderByColumns && tsDescriptor.orderByColumns.length > 0) || false;
    const paramsType = generateParamsType(camelCaseName, tsDescriptor.parameters, includeOrderByParams);
    const orderByType = generateOrderByType(camelCaseName, tsDescriptor.orderByColumns);
    const orderByFunction = generateOrderByFunction(camelCaseName, tsDescriptor.orderByColumns);
    const mainFunction = generateFunction(camelCaseName, tsDescriptor);

    const template = `
    import { Connection } from 'mysql2/promise';
    
    ${paramsType}

    ${dataType}

    ${orderByType}

    ${returnType}

    ${mainFunction}

    ${orderByFunction}
   
    `
    return template;
}

function replaceOrderByParam(sql: string) {
    const patern = /(.*order\s+by\s*)(\?)(.*$)/i;
    const newSql = sql.replace(patern, "$1${escapeOrderBy(connection, params.orderBy)} $3");
    return newSql;
}

function writeTsFile(filePath:string, tsContent: string) {
    fs.writeFileSync(filePath, tsContent);
}

function capitalize(name: CamelCaseName) {
    if(name.length == 0) return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function convertToCamelCaseName(name: string) : CamelCaseName {
    const camelCaseStr = camelCase(name) as CamelCaseName;
    return camelCaseStr;
}

export async function generateTsFile(client: DbClient, sqlFile: string) {

    const fileName = parse(sqlFile).name;
    const dirPath = parse(sqlFile).dir;

    const queryName = convertToCamelCaseName(sqlFile);
    console.log("camelcase=", queryName);
    const tsFilePath = path.resolve(dirPath, fileName) + ".ts";

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    const queryInfo = await parseSql(client, sqlContent);
    const tsDescriptor = isLeft(queryInfo) ? none : some(generateTsDescriptor(queryInfo.right));
    const tsContent = generateTsContent(tsDescriptor, queryName);
    writeTsFile(tsFilePath, tsContent);
}

export type TsDescriptor = {
    sql: string;
    multipleRowsResult: boolean;
    columns: TsFieldDescriptor[];
    parameters: TsFieldDescriptor[];
    data?: TsFieldDescriptor[];
    parameterNames: string[];
    orderByColumns? : string[];
}

