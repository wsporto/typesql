import { SchemaDef, CamelCaseName, TsFieldDescriptor, ParameterDef } from "./types";
import fs from "fs";
import path, { parse } from "path";
import { DbClient } from "./queryExectutor";
import camelCase from "camelcase";
import { isLeft } from "fp-ts/lib/Either";
import { none, Option, some, isNone } from "fp-ts/lib/Option";
import { converToTsType, MySqlType } from "./mysql-mapping";
import { parseSql } from "./describe-query";
import CodeBlockWriter from "code-block-writer";
import { NestedTsDescriptor, createNestedTsDescriptor } from "./ts-nested-descriptor";

export function generateTsCode(tsDescriptor: TsDescriptor, fileName: string, target: 'node' | 'deno'): string {
    const writer = new CodeBlockWriter();

    const camelCaseName = convertToCamelCaseName(fileName);
    const capitalizedName = capitalize(camelCaseName);

    const dataTypeName = capitalizedName + 'Data';
    const paramsTypeName = capitalizedName + 'Params';
    const resultTypeName = capitalizedName + 'Result';
    const orderByTypeName = capitalizedName + 'OrderBy';
    const generateOrderBy = tsDescriptor.orderByColumns != null && tsDescriptor.orderByColumns.length > 0;

    // Import declarations
    if (target == 'deno') {
        writer.writeLine(`import { Client } from "https://deno.land/x/mysql/mod.ts";`);
    }
    else {
        if (tsDescriptor.nestedDescriptor) {
            writer.writeLine(`import groupBy from 'lodash.groupby';`);
        }
        writer.writeLine(`import type { Connection } from 'mysql2/promise';`);
    }
    writer.blankLine();

    if (tsDescriptor.data) {
        writeTypeBlock(writer, tsDescriptor.data, dataTypeName);
    }

    const orderByField = generateOrderBy ? `orderBy: [${orderByTypeName}, ...${orderByTypeName}[]]` : undefined;
    writeTypeBlock(writer, tsDescriptor.parameters, paramsTypeName, orderByField);
    writeTypeBlock(writer, tsDescriptor.columns, resultTypeName)

    let functionReturnType = resultTypeName;
    functionReturnType += tsDescriptor.multipleRowsResult ? '[]' : tsDescriptor.queryType == 'Select' ? ' | null' : '';

    let functionArguments = target == 'deno' ? 'client: Client' : 'connection: Connection';
    functionArguments += tsDescriptor.data && tsDescriptor.data.length > 0 ? ', data: ' + dataTypeName : '';
    functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? ', params: ' + paramsTypeName : '';

    const allParameters = tsDescriptor.data?.map(field => 'data.' + field.name) || [];
    allParameters.push(...tsDescriptor.parameterNames.map(paramName => 'params.' + paramName));

    const queryParams = allParameters.length > 0 ? ', [' + allParameters.join(', ') + ']' : '';

    const escapedBackstick = scapeBackStick(tsDescriptor.sql);
    const processedSql = replaceOrderByParam(escapedBackstick);
    const sqlSplit = processedSql.split('\n');

    writer.write(`export async function ${camelCaseName}(${functionArguments}) : Promise<${functionReturnType}>`).block(() => {
        writer.writeLine('const sql = `');
        sqlSplit.forEach(sqlLine => {
            writer.indent().write(sqlLine);
            writer.newLine();
        });
        writer.indent().write('`');
        writer.blankLine();
        if (target == 'deno') {
            writer.writeLine(`return client.query(sql${queryParams})`);
            const singleRowSlect = tsDescriptor.multipleRowsResult === false && tsDescriptor.queryType == 'Select';
            writer.indent().write(`.then( res => res${singleRowSlect ? '[0]' : ''} );`);
        }
        else {
            writer.writeLine(`return connection.query(sql${queryParams})`);
            writer.indent().write(`.then( res => res[0] as ${resultTypeName}${tsDescriptor.multipleRowsResult || tsDescriptor.queryType == 'Select' ? '[]' : ''} )`);
            if (tsDescriptor.queryType == 'Select' && tsDescriptor.multipleRowsResult == false) {
                writer.newLine();
                writer.indent().write(`.then( res => res[0] );`);
            }
            else {
                writer.write(';');
            }
        }

    })

    if (generateOrderBy) {
        const orderByColumnsType = tsDescriptor.orderByColumns?.map(col => `"${col}"`).join(' | ');
        writer.blankLine();
        writer.write(`export type ${orderByTypeName} = `).block(() => {
            writer.writeLine(`column: ${orderByColumnsType};`);
            writer.writeLine(`direction: 'asc' | 'desc';`);
        })
        writer.blankLine();
        writer.write(`function escapeOrderBy(orderBy: ${orderByTypeName}[]) : string`).block(() => {
            writer.writeLine(`return orderBy.map( order => \`\\\`\${order.column}\\\` \${order.direction == 'desc' ? 'desc' : 'asc' }\`).join(', ');`);
        })
    }

    if (tsDescriptor.nestedDescriptor) {
        const relations = tsDescriptor.nestedDescriptor.relations;
        relations.forEach((relation) => {
            const relationType = generateRelationType(capitalizedName, relation.name);
            writer.blankLine();
            writer.write(`export type ${relationType} = `).block(() => {
                relation.fields.forEach(field => {
                    if (field.type == 'field') {
                        writer.writeLine(`${field.name}: ${field.tsType};`);
                    }
                    if (field.type == 'relation') {
                        const nestedRelationType = generateRelationType(capitalizedName, field.tsType);
                        writer.writeLine(`${field.name}: ${nestedRelationType};`);
                    }
                })
            })
        })
        relations.forEach((relation, index) => {
            const relationType = generateRelationType(capitalizedName, relation.name);
            if (index == 0) { //first
                writer.blankLine();
                writer.write(`export async function ${camelCaseName}Nested(${functionArguments}): Promise<${relationType}[]>`).block(() => {
                    const params = tsDescriptor.parameters.length > 0 ? ', params' : '';
                    writer.writeLine(`const selectResult = await ${camelCaseName}(connection${params});`);
                    writer.write('if (selectResult.length == 0)').block(() => {
                        writer.writeLine('return [];')
                    });
                    writer.writeLine(`return collect${relationType}(selectResult);`)
                })
            }
            const collectFunctionName = `collect${relationType}`;
            const mapFunctionName = `mapTo${relationType}`;
            writer.blankLine();
            writer.write(`function ${collectFunctionName}(selectResult: ${resultTypeName}[]): ${relationType}[]`).block(() => {
                writer.writeLine(`const grouped = groupBy(selectResult.filter(r => r.${relation.fields[0].name} != null), r => r.${relation.fields[0].name});`)
                writer.writeLine(`return Object.values(grouped).map(r => ${mapFunctionName}(r))`)
            })
            writer.blankLine();
            writer.write(`function ${mapFunctionName}(selectResult: ${resultTypeName}[]): ${relationType}`).block(() => {
                writer.writeLine(`const firstRow = selectResult[0];`)
                writer.write(`const result: ${relationType} = `).block(() => {
                    relation.fields.forEach((field, index) => {
                        const separator = relation.fields.length > 1 && index != relation.fields.length - 1 ? ',' : '';
                        if (field.type == 'field') {
                            writer.writeLine(`${field.name}: firstRow.${field.name}!` + separator);
                        }
                        if (field.type == 'relation') {
                            const nestedRelationType = generateRelationType(capitalizedName, field.name);
                            writer.writeLine(`${field.name}: collect${nestedRelationType}(selectResult)` + separator);
                        }
                    })
                })
                writer.writeLine('return result;')
            })
        })

    }

    return writer.toString();
}

function generateRelationType(capitalizedName: string, relationName: string) {
    return capitalizedName + 'Nested' + relationName.toUpperCase();
}

function writeTypeBlock(writer: CodeBlockWriter, fields: TsFieldDescriptor[], typeName: string, extraField?: string) {
    const writeBlockCond = fields.length > 0 || extraField != null;
    if (writeBlockCond) {
        writer.write(`export type ${typeName} =`).block(() => {
            fields.forEach(tsField => {
                writer.writeLine(tsFieldToStr(tsField) + ';');
            })
            if (extraField) {
                writer.write(extraField + ';')
            }
        });
        writer.blankLine();
    }

}

function tsFieldToStr(tsField: TsFieldDescriptor) {
    return tsField.name + (tsField.notNull ? ': ' : '?: ') + tsField.tsType;
}

export function generateTsDescriptor(queryInfo: SchemaDef): TsDescriptor {

    const escapedColumnsNames = renameInvalidNames(queryInfo.columns.map(col => col.columnName));
    const columns = queryInfo.columns.map((col, columnIndex) => {
        const tsDesc: TsFieldDescriptor = {
            name: escapedColumnsNames[columnIndex],
            tsType: mapColumnType(col.type),
            notNull: col.notNull ? col.notNull : false
        }
        return tsDesc;
    })
    const parameterNames = queryInfo.parameters.map(p => p.name);
    const uniqueParams = removeDuplicatedParameters(queryInfo.parameters);
    const escapedParametersNames = renameInvalidNames(uniqueParams.map(col => col.name));
    const parameters = uniqueParams.map((col, paramIndex) => {
        const arraySymbol = col.list ? '[]' : '';

        const tsDesc: TsFieldDescriptor = {
            name: escapedParametersNames[paramIndex],
            tsType: mapColumnType(col.columnType) + arraySymbol,
            notNull: col.notNull ? col.notNull : false
        }
        return tsDesc;
    })

    const escapedDataNames = queryInfo.data ? renameInvalidNames(queryInfo.data.map(col => col.name)) : [];
    const data = queryInfo.data?.map((col, dataIndex) => {

        const tsDesc: TsFieldDescriptor = {
            name: escapedDataNames[dataIndex],
            tsType: mapColumnType(col.columnType),
            notNull: col.notNull ? col.notNull : false
        }
        return tsDesc;
    })

    const result: TsDescriptor = {
        sql: queryInfo.sql,
        queryType: queryInfo.queryType,
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns,
        orderByColumns: queryInfo.orderByColumns,
        parameterNames,
        parameters,
        data,
    };
    if (queryInfo.nestedResultInfo) {
        const nestedDescriptor = createNestedTsDescriptor(queryInfo.columns, queryInfo.nestedResultInfo);
        result.nestedDescriptor = nestedDescriptor;
    }
    return result;
}

export function removeDuplicatedParameters(parameters: ParameterDef[]): ParameterDef[] {
    const columnsCount: Map<string, ParameterDef> = new Map();
    parameters.forEach(param => {
        const dupParam = columnsCount.get(param.name);
        if (dupParam != null) { //duplicated - two parameter null and notNull, resturn the null param (notNull == false)
            if (param.notNull == false) {
                columnsCount.set(param.name, param);
            }
            // return param;
        }
        else {
            columnsCount.set(param.name, param);
        }
    })
    return [...columnsCount.values()];
}

export function renameInvalidNames(columnNames: string[]): string[] {
    const columnsCount: Map<string, number> = new Map();
    return columnNames.map(columnName => {
        if (columnsCount.has(columnName)) {
            const count = columnsCount.get(columnName)! + 1;
            columnsCount.set(columnName, count);
            const newName = columnName + '_' + count;
            return escapeInvalidTsField(newName);

        }
        else {
            columnsCount.set(columnName, 1);
            return escapeInvalidTsField(columnName);
        }
    })
}

function scapeBackStick(sql: string) {
    const pattern = /`/g;
    return sql.replace(pattern, "\\`");
}

export function escapeInvalidTsField(columnName: string) {
    const validPattern = /^[a-zA-Z0-9_$]+$/g;
    if (!validPattern.test(columnName)) {
        return `"${columnName}"`;
    }
    return columnName;
}

function mapColumnType(columnType: MySqlType | MySqlType[] | 'any'): string {
    if (columnType == 'any') return 'any';
    const types = ([] as MySqlType[]).concat(columnType);
    const mappedTypes = types.map(type => converToTsType(type));
    return mappedTypes.join(' | '); // number | string

}

function generateTsContent(tsDescriptorOption: Option<TsDescriptor>, queryName: string, target: 'node' | 'deno') {

    if (isNone(tsDescriptorOption)) {
        return '//Invalid sql';
    }
    return generateTsCode(tsDescriptorOption.value, queryName, target);
}

export function replaceOrderByParam(sql: string) {
    const patern = /(.*order\s+by\s*)(\?)(.\n$)*/i;
    const newSql = sql.replace(patern, "$1${escapeOrderBy(params.orderBy)}$3");
    return newSql;
}

export function writeFile(filePath: string, tsContent: string) {
    fs.writeFileSync(filePath, tsContent);
}

function capitalize(name: CamelCaseName) {
    if (name.length == 0) return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function convertToCamelCaseName(name: string): CamelCaseName {
    const camelCaseStr = camelCase(name) as CamelCaseName;
    return camelCaseStr;
}

//TODO - pass dbSchema instead of connection
export async function generateTsFile(client: DbClient, sqlFile: string, target: 'node' | 'deno') {

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    const fileName = parse(sqlFile).name;
    const dirPath = parse(sqlFile).dir;
    const queryName = convertToCamelCaseName(fileName);

    const tsContent = await generateTsFileFromContent(client, sqlFile, queryName, sqlContent, target);

    const tsFilePath = path.resolve(dirPath, fileName) + ".ts";

    writeFile(tsFilePath, tsContent);
}

export async function generateTsFileFromContent(client: DbClient, filePath: string, queryName: string, sqlContent: string, target: 'node' | 'deno') {
    const queryInfo = await parseSql(client, sqlContent);

    if (isLeft(queryInfo)) {
        console.error('ERROR: ', queryInfo.left.description);
        console.error('at ', filePath);
    }

    const tsDescriptor = isLeft(queryInfo) ? none : some(generateTsDescriptor(queryInfo.right));
    const tsContent = generateTsContent(tsDescriptor, queryName, target);
    return tsContent;
}

export type TsDescriptor = {
    sql: string;
    queryType: 'Select' | 'Insert' | 'Update' | 'Delete';
    multipleRowsResult: boolean;
    columns: TsFieldDescriptor[];
    parameterNames: string[];
    parameters: TsFieldDescriptor[];
    data?: TsFieldDescriptor[];
    orderByColumns?: string[];
    nestedDescriptor?: NestedTsDescriptor;
}