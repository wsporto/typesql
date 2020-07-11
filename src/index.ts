import { parseSql } from "./parser";
import { SchemaDef } from "./types";
import fs from "fs";
import path, { parse } from "path";
import { DbClient } from "./queryExectutor";
import camelCase from "camelcase";
import { isLeft } from "fp-ts/lib/Either";
import { none, Option, some, isSome, isNone } from "fp-ts/lib/Option";
import { converToTsType, MySqlType, TsType } from "./mysql-database";

function generateTsDescriptor(queryInfo: SchemaDef) : TsDescriptor {
    
    const columns = queryInfo.columns.map( col => {
        const tsDesc : FieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.dbtype),
            notNull: col.notNull? col.notNull : false 
        }
        return tsDesc;
    })
    const parameters = queryInfo.parameters.map( col => {
        const arraySymbol = col.list? '[]' : '';

        const tsDesc : FieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.columnType) + arraySymbol,
            notNull: false
        }
        return tsDesc;
    })

    const data = queryInfo.data?.map( col => {

        const tsDesc : FieldDescriptor = {
            name: col.name,
            tsType: mapColumnType(col.columnType),
            notNull: false
        }
        return tsDesc;
    })

    //TODO - should return queryInfo.parameterNames always
    const parameterNames = queryInfo.parameterNames? queryInfo.parameterNames : queryInfo.parameters.map( param => param.name);
    
    return {
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns,
        orderByColumns: queryInfo.orderByColumns,
        parameters,
        data,
        parameterNames
    };


}

function mapColumnType(columnType: MySqlType | MySqlType[] | '?') : string {
    if(columnType == '?') return '?';
    const types = ([] as MySqlType[]).concat(columnType);
    const mappedTypes = types.map( type => converToTsType(type));
    return mappedTypes.join(' | '); // number | string

}

function generateTsContent(tsDescriptorOption: Option<TsDescriptor>, sqlContext: string, queryName: string) {
    
    if(isNone(tsDescriptorOption)) {
        return '//Invalid sql';
    }

    const tsDescriptor = tsDescriptorOption.value;
    
    const capitalizedName = capitalize(queryName);

    console.log("generateTsContent=", tsDescriptor)
    const paramsStrTemp = tsDescriptor.parameters.reduce( (total, actual) => {
        return total + `\t ${actual.name} : ${actual.tsType};\n`;
    }, '');

    const orderByTypeName = `${capitalizedName}OrderBy`;

    const paramsStr = paramsStrTemp + (tsDescriptor.orderByColumns? `orderBy: [${orderByTypeName}, ...${orderByTypeName}[]];` : '');

    const dataParamsStr = tsDescriptor.data?.reduce( (total, actual) => {
        return total + `\t ${actual.name} : ${actual.tsType};\n`;
    }, '');

    const columnsStr = tsDescriptor.columns.reduce( (total, actual) => {
        const optional = actual.notNull? '' : '?';
        return total + `\t ${actual.name}${optional} : ${actual.tsType};\n`;
    }, '');

    const allParameters = (tsDescriptor.data? tsDescriptor.data : []).concat(tsDescriptor.parameters)

    //TODO - should return queryInfo.parameterNames always
    let paramValues = tsDescriptor.parameterNames? tsDescriptor.parameterNames.map( param => 'params.' + param).join(', '):
        allParameters.map( param => 'params.' + param.name).join(', ');

    if(allParameters.length > 0) paramValues = ', [' + paramValues + ']';

    const resultStr = `${capitalizedName}Result` + (tsDescriptor.multipleRowsResult? '[]' : '');

    const orderByColumns = tsDescriptor.orderByColumns?.map(col => `'${col}'`).join( ' | ' );

    const orderByType = tsDescriptor.orderByColumns? `
     export type ${orderByTypeName} = {
        column: ${orderByColumns};
        direction: 'asc' | 'desc';
     }
     `
    :
    '';

    const orderByFunction = tsDescriptor.orderByColumns? `
    function escapeOrderBy(connection: Connection, orderBy: ${orderByTypeName}[]) {
        return orderBy.map( order => \`\${connection.escapeId(order.column)} \${order.direction == 'desc' ? 'desc' : 'asc' }\`).join(', '); 
    }
    `
    :
    '';


    const dataType = tsDescriptor.data? `
    export type ${capitalizedName}Data = {
        ${dataParamsStr}
    }
    `
    :
    ''

    const template = `
    import { Connection } from 'mysql2/promise';
    export type ${capitalizedName}Params = {
        ${paramsStr}
    }

    ${dataType}

    ${orderByType}

    export type ${capitalizedName}Result = {
        ${columnsStr}
    }

    export async function ${queryName}(connection: Connection${tsDescriptor.parameters.length > 0 || tsDescriptor.orderByColumns? 
            ', params: ' + capitalizedName + 'Params' : ''}) : Promise<${resultStr}> {
        const sql = \`
        ${replaceOrderByParam(sqlContext)}
        \`;
        return connection.query(sql${paramValues})
            .then( res => res[0] as ${resultStr} );
    }

    ${orderByFunction}
   
    `

    return template;
}

function replaceOrderByParam(sql: string) {
    const patern = /(.*order\s+by\s*)(\?)(.*$)/i;
    const newSql = sql.replace(patern, "$1${escapeOrderBy(connection, params.orderBy)} $3");
    console.log("sql:", sql);
    console.log("newSql:", newSql);
    return newSql;
}

function writeTsFile(filePath:string, tsContent: string) {
    fs.writeFileSync(filePath, tsContent);
}

function capitalize(name: string) {
    if(name.length == 0) return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function generateTsFile(client: DbClient, sqlFile: string) {

    const fileName = parse(sqlFile).name;
    const dirPath = parse(sqlFile).dir;

    const queryName = camelCase(fileName);
    console.log("camelcase=", queryName);
    const tsFilePath = path.resolve(dirPath, fileName) + ".ts";

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    const queryInfo = await parseSql(client, sqlContent);
    const tsDescriptor = isLeft(queryInfo) ? none : some(generateTsDescriptor(queryInfo.right));
    const tsContent = generateTsContent(tsDescriptor, sqlContent, queryName);
    writeTsFile(tsFilePath, tsContent);
}

type TsDescriptor = {
    multipleRowsResult: boolean;
    columns: FieldDescriptor[];
    parameters: FieldDescriptor[];
    data?: FieldDescriptor[];
    parameterNames: string[];
    orderByColumns? : string[];
}

type FieldDescriptor = {
    name: string;
    tsType: string;
    notNull: boolean;
}