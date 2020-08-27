import { SchemaDef, CamelCaseName, TsFieldDescriptor } from "./types";
import fs from "fs";
import path, { parse } from "path";
import { DbClient } from "./queryExectutor";
import camelCase from "camelcase";
import { isLeft } from "fp-ts/lib/Either";
import { none, Option, some, isNone } from "fp-ts/lib/Option";
import { converToTsType, MySqlType } from "./mysql-mapping";
import { parseSql } from "./describe-query";

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
            notNull: col.notNull? col.notNull : false
        }
        return tsDesc;
    })

    const data = queryInfo.data?.map( col => {

        const tsDesc : TsFieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.columnType),
            notNull: col.notNull? col.notNull : false
        }
        return tsDesc;
    })
   
    return {
        sql: queryInfo.sql,
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns,
        orderByColumns: queryInfo.orderByColumns,
        parameters,
        data
    };
}

export function generateReturnName(name: CamelCaseName) {
    const capitalizedName = capitalize(name);
    return `${capitalizedName}Result`;
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
    const paramsStrTemp = paramsToString(params);
    const paramsStr = includeOrderByParam? paramsStrTemp + ( `\n\torderBy: [${orderByTypeName}, ...${orderByTypeName}[]];` ) : paramsStrTemp;
    const paramTypeName = generateParamsTypeName(queryName);

    let codeBlock = `export type ${paramTypeName} = {`;
    codeBlock += '\n';
    codeBlock += paramsStr;
    codeBlock += '\n';
    codeBlock += '}';

    
    return codeBlock;
}

function paramsToString(params: TsFieldDescriptor[]) {
    const uniqueFields = new Map();
    return params.map( actual => {
        if(!uniqueFields.get(actual.name)) {
            uniqueFields.set(actual.name, 1);
            return `\t${actual.name}${ actual.notNull? '': '?'}: ${actual.tsType};`;
        }
        
    }).join('\n');
}

export function generateDataType(queryName: CamelCaseName, dataParams: TsFieldDescriptor[]) {
    
    const dataParamsStr = paramsToString(dataParams);
    const dataTypeName = generateDataTypeName(queryName);

    let codeBlock = `export type ${dataTypeName} = {`;
    codeBlock += '\n';
    codeBlock += dataParamsStr;
    codeBlock += '\n';
    codeBlock += '}';

    return codeBlock;
}

export function generateReturnType(queryName: CamelCaseName, dataParams: TsFieldDescriptor[]) {
    
    const dataParamsStr = paramsToString(dataParams);
    const returnTypeName = generateReturnName(queryName);

    let codeBlock = `export type ${returnTypeName} = {`;
    codeBlock += '\n';
    codeBlock += dataParamsStr;
    codeBlock += '\n';
    codeBlock += '}';
    
    return codeBlock;
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

export function generateFunction(camelCaseName: CamelCaseName, tsDescriptor: TsDescriptor, target: 'node' | 'deno') {

    const resultStr = generateReturnName(camelCaseName);

    let functionParams = '';
    if(tsDescriptor.data && tsDescriptor.data.length > 0) functionParams += ', data: ' + generateDataTypeName(camelCaseName);
    if(tsDescriptor.parameters.length > 0) functionParams += ', params: ' + generateParamsTypeName(camelCaseName);

    const allParameters : string[] = [];
    if(tsDescriptor.data) allParameters.push(...tsDescriptor.data.map(param => 'data.' + param.name));
    if(tsDescriptor.parameters) allParameters.push(...tsDescriptor.parameters.map(param => 'params.' + param.name));
    let paramValues = allParameters.join(', ');

    if(paramValues != '') paramValues = ', [' + paramValues + ']';

    const functionReturn = resultStr + (tsDescriptor.multipleRowsResult? '[]' : ''); 

    const mainFunction = target == 'node'?
        getMainNodeFunction(camelCaseName, functionParams, functionReturn, tsDescriptor.sql, paramValues):
        getMainDenoFunction(camelCaseName, functionParams, functionReturn, tsDescriptor.sql, paramValues);
    return mainFunction;
}

function getMainNodeFunction(camelCaseName: string, functionParams: string, functionReturn: string, sql: string, paramValues: string) {
    const mainFuncion = `export async function ${camelCaseName}(connection: Connection${functionParams}) : Promise<${functionReturn}> {
        const sql = \`
        ${replaceOrderByParam(sql)}
        \`;
        return connection.query(sql${paramValues})
            .then( res => res[0] as ${functionReturn} );
    }
        `
    return mainFuncion;
}

function getMainDenoFunction(camelCaseName: string, functionParams: string, functionReturn: string, sql: string, paramValues: string) {
    const mainFuncion = `export async function ${camelCaseName}(client: Client${functionParams}) : Promise<${functionReturn}> {
        const sql = \`
        ${replaceOrderByParam(sql)}
        \`;
        return client.query(sql${paramValues})
            .then( res => res as ${functionReturn} );
    }
        `
    return mainFuncion;
}

function mapColumnType(columnType: MySqlType | MySqlType[] | '?') : string {
    if(columnType == '?') return '?';
    const types = ([] as MySqlType[]).concat(columnType);
    const mappedTypes = types.map( type => converToTsType(type));
    return mappedTypes.join(' | '); // number | string

}

function generateTsContent(tsDescriptorOption: Option<TsDescriptor>, queryName: string, target: 'node' | 'deno') {
    
    if(isNone(tsDescriptorOption)) {
        return '//Invalid sql';
    }

    const tsDescriptor = tsDescriptorOption.value;
    
    const camelCaseName = convertToCamelCaseName(queryName);
    const dataType = tsDescriptor.data? generateDataType(camelCaseName, tsDescriptor.data) : '';
    const returnType = generateReturnType(camelCaseName, tsDescriptor.columns);
    const includeOrderByParams = (tsDescriptor.orderByColumns && tsDescriptor.orderByColumns.length > 0) || false;
    const paramsType = generateParamsType(camelCaseName, tsDescriptor.parameters, includeOrderByParams);
    const orderByType = generateOrderByType(camelCaseName, tsDescriptor.orderByColumns);
    const orderByFunction = generateOrderByFunction(camelCaseName, tsDescriptor.orderByColumns);
    const mainFunction = generateFunction(camelCaseName, tsDescriptor, target);

    let generatedCode = getImportDeclaration(target);
    generatedCode += addCodeBlock(paramsType);
    generatedCode += addCodeBlock(dataType);
    generatedCode += addCodeBlock(orderByType);
    generatedCode += addCodeBlock(returnType);
    generatedCode += addCodeBlock(mainFunction);
    generatedCode += addCodeBlock(orderByFunction);
    return generatedCode;
}

function getImportDeclaration(target: 'node' | 'deno') {
    return target == 'node'?
        `import { Connection } from 'mysql2/promise';` :
        `import { Client } from "https://deno.land/x/mysql/mod.ts";`
}

function addCodeBlock(codeBlock: string) {
    return codeBlock !=  '' ? '\n\n' + codeBlock : '';
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

//TODO - pass dbSchema instead of connection
export async function generateTsFile(client: DbClient, sqlFile: string, target: 'node' | 'deno') {

    const fileName = parse(sqlFile).name;
    const dirPath = parse(sqlFile).dir;

    const queryName = convertToCamelCaseName(fileName);
    const tsFilePath = path.resolve(dirPath, fileName) + ".ts";

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    const queryInfo = await parseSql(client, sqlContent);
    
    if(isLeft(queryInfo)) {
        console.error('ERROR: ', queryInfo.left.description);
        console.error('at ', sqlFile);
    }
    const tsDescriptor = isLeft(queryInfo) ? none : some(generateTsDescriptor(queryInfo.right));
    const tsContent = generateTsContent(tsDescriptor, queryName, target);
    writeTsFile(tsFilePath, tsContent);
}

export type TsDescriptor = {
    sql: string;
    multipleRowsResult: boolean;
    columns: TsFieldDescriptor[];
    parameters: TsFieldDescriptor[];
    data?: TsFieldDescriptor[];
    orderByColumns? : string[];
}

