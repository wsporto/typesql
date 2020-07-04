import { parseSql } from "./parser";
import { SchemaDef } from "./types";
import fs from "fs";
import path, { parse } from "path";
import { DbClient } from "./queryExectutor";
import camelCase from "camelcase";

function generateTsDescriptor(queryInfo: SchemaDef) : TsDescriptor {
    
    const columns = queryInfo.columns.map( col => {
        const tsDesc : FieldDescriptor = {
            name: col.name,
            tsType: typesMapping[col.dbtype],
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
    
    return {
        columns,
        parameters
    };


}

function mapColumnType(columnType: string | string[]) : string {
    const types = ([] as string[]).concat(columnType);
    const mappedTypes = types.map( type => typesMapping[type]);
    return mappedTypes.join(' | '); // number | string

}

function generateTsContent(tsDescriptor: TsDescriptor, sqlContext: string, queryName: string) {
    const capitalizedName = capitalize(queryName);

    console.log("generateTsContent=", tsDescriptor)
    const paramsStr = tsDescriptor.parameters.reduce( (total, actual) => {
        return total + `\t ${actual.name} : ${actual.tsType};\n`;
    }, '');

    const columnsStr = tsDescriptor.columns.reduce( (total, actual) => {
        const optional = actual.notNull? '' : '?';
        return total + `\t ${actual.name}${optional} : ${actual.tsType};\n`;
    }, '');

    let paramValues = tsDescriptor.parameters.map( param => 'params.' + param.name).join(', ');
    if(tsDescriptor.parameters.length > 0) paramValues = ', [' + paramValues + ']';


    const template = `
    import { Connection } from 'mysql2/promise';
    export type ${capitalizedName}Params = {
        ${paramsStr}
    }

    export type ${capitalizedName}Result = {
        ${columnsStr}
    }

    export async function ${queryName}(connection: Connection${tsDescriptor.parameters.length > 0 ? ', params: ' + capitalizedName + 'Params' : ''}) : Promise<${capitalizedName}Result[]> {
        const sql = \`
        ${sqlContext}
        \`;
        return connection.query(sql${paramValues})
            .then( res => res[0] as ${capitalizedName}Result[] );
    }
    `

    return template;
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

    const sqlContext = fs.readFileSync(sqlFile, 'utf8');
    const queryInfo = await parseSql(client, sqlContext);
    const tsDescriptor = generateTsDescriptor(queryInfo);
    const tsContent = generateTsContent(tsDescriptor, sqlContext, queryName);
    writeTsFile(tsFilePath, tsContent);
}



type TsDescriptor = {
    columns: FieldDescriptor[];
    parameters: FieldDescriptor[];
}

type FieldDescriptor = {
    name: string;
    tsType: string;
    notNull: boolean;
}

type TypeDef = {
    [a: string] : string
}

const typesMapping: TypeDef = {
    'decimal': 'number',
    'tinyint': 'number',
    'smallint': 'number',
    'int': 'number',
    'float': 'number',
    'double': 'number',
    'null': 'undefined',
    'timestamp': 'number',
    'bigint': 'number',
    'mediumint': 'number',
    'varchar': 'string'
}