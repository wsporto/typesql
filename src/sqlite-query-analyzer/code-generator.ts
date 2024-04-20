import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "../mysql-query-analyzer/types";
import { prepareAndParse } from "./parser";
import { TsDescriptor, capitalize, convertToCamelCaseName, removeDuplicatedParameters2 } from "../code-generator";
import CodeBlockWriter from "code-block-writer";
import { ParameterDef, SchemaDef, TsFieldDescriptor } from "../types";
import { SQLiteType } from "./types";
import { Database } from "better-sqlite3";

export function generateTsCode(db: Database, sql: string, queryName: string, sqliteDbSchema: ColumnSchema[]): Either<string, string> {
    const queryInfo = prepareAndParse(db, sql, sqliteDbSchema);
    if (isLeft(queryInfo)) {
        return left('//Invalid sql');
    }
    const tsDescriptor = createTsDescriptor(queryInfo.right);
    const code = generateCodeFromTsDescriptor(queryName, tsDescriptor);
    return right(code);
}

function createTsDescriptor(queryInfo: SchemaDef): TsDescriptor {
    const tsDescriptor: TsDescriptor = {
        sql: queryInfo.sql,
        queryType: queryInfo.queryType,
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns: queryInfo.columns.map(col => mapColumnToTsFieldDescriptor(col)),
        parameterNames: [],
        parameters: queryInfo.parameters.map(param => mapParameterToTsFieldDescriptor(param)),
        data: queryInfo.data?.map(param => mapParameterToTsFieldDescriptor(param)),
    }
    return tsDescriptor;
}

function mapParameterToTsFieldDescriptor(col: ParameterDef) {
    const tsDesc: TsFieldDescriptor = {
        name: col.name,
        tsType: mapColumnType(col.columnType as SQLiteType),
        notNull: col.notNull ? col.notNull : false
    }
    return tsDesc;
}

function mapColumnToTsFieldDescriptor(col: ColumnInfo) {
    const tsDesc: TsFieldDescriptor = {
        name: col.columnName,
        tsType: mapColumnType(col.type as SQLiteType),
        notNull: col.notNull ? col.notNull : false
    }
    return tsDesc;
}

function mapColumnType(sqliteType: SQLiteType) {
    switch (sqliteType) {
        case 'INTEGER':
            return 'number';
        case 'TEXT':
            return 'string';
        case 'NUMERIC':
            return 'number';
        case 'REAL':
            return 'number';
        case 'DATE':
            return 'Date';
        case 'BLOB':
            return 'any';
    }
}

function generateCodeFromTsDescriptor(queryName: string, tsDescriptor: TsDescriptor) {

    const writer = new CodeBlockWriter({
        useTabs: true
    });

    const camelCaseName = convertToCamelCaseName(queryName);
    const capitalizedName = capitalize(camelCaseName);

    const queryType = tsDescriptor.queryType;
    const sql = tsDescriptor.sql;
    const dataTypeName = capitalizedName + 'Data';
    const paramsTypeName = capitalizedName + 'Params';
    const resultTypeName = capitalizedName + 'Result';
    const dynamicParamsTypeName = capitalizedName + 'DynamicParams'
    const selectColumnsTypeName = capitalizedName + 'Select';
    const whereTypeName = capitalizedName + 'Where';
    const orderByTypeName = capitalizedName + 'OrderBy';
    const generateOrderBy = tsDescriptor.orderByColumns != null && tsDescriptor.orderByColumns.length > 0;
    const uniqueParams = removeDuplicatedParameters2(tsDescriptor.parameters);
    const uniqueUpdateParams = removeDuplicatedParameters2(tsDescriptor.data || []);

    writer.writeLine(`import { Database } from 'better-sqlite3';`);

    if (uniqueUpdateParams.length > 0) {
        writer.blankLine();
        writer.write(`export type ${dataTypeName} =`).block(() => {
            uniqueUpdateParams.forEach((field) => {
                const optionalOp = field.notNull ? '' : '?';
                writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
            });
        });
    }

    if (uniqueParams.length > 0) {
        writer.blankLine();
        writer.write(`export type ${paramsTypeName} =`).block(() => {
            uniqueParams.forEach((field) => {
                const optionalOp = field.notNull ? '' : '?';
                writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
            });
        });
    }

    writer.blankLine();
    writer.write(`export type ${resultTypeName} =`).block(() => {
        tsDescriptor.columns.forEach((field, index) => {
            const optionalOp = field.notNull ? '' : '?';
            writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
        });
    });
    writer.blankLine();

    let functionArguments = `db: Database`;
    functionArguments += queryType == 'Update' ? `, data: ${dataTypeName}` : '';
    functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? ', params: ' + paramsTypeName : '';

    const allParameters = (tsDescriptor.data?.map(param => toParamValue(param, 'data')) || [])
        .concat(tsDescriptor.parameters.map(param => toParamValue(param, 'params')));

    const queryParams = allParameters.length > 0 ? '[' + allParameters.join(', ') + ']' : '';

    const returnType = tsDescriptor.multipleRowsResult ? `${resultTypeName}[]` : `${resultTypeName} | null`;

    if (queryType == 'Select') {
        writer.write(`export function ${camelCaseName}(${functionArguments}): ${returnType}`).block(() => {
            const sqlSplit = sql.split('\n');
            writer.write('const sql = `').newLine();
            sqlSplit.forEach(sqlLine => {
                writer.indent().write(sqlLine).newLine();
            });
            writer.indent().write('`').newLine();
            writer.write('return db.prepare(sql)').newLine();
            writer.indent().write('.raw(true)').newLine();
            writer.indent().write(`.all(${queryParams})`).newLine();
            writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`);
        });
    }

    if (queryType == 'Insert' || queryType == 'Update' || queryType == 'Delete') {
        writer.write(`export function ${camelCaseName}(${functionArguments}): ${resultTypeName}`).block(() => {
            const sqlSplit = sql.split('\n');
            writer.write('const sql = `').newLine();
            sqlSplit.forEach(sqlLine => {
                writer.indent().write(sqlLine).newLine();
            });
            writer.indent().write('`').newLine();
            writer.write('return db.prepare(sql)').newLine();
            writer.indent().write(`.run(${queryParams}) as ${resultTypeName};`);
        });
    }

    if (queryType == 'Select') {
        writer.blankLine();
        writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
            writer.write(`const result: ${resultTypeName} = `).block(() => {
                tsDescriptor.columns.forEach((col, index) => {
                    const separator = index < tsDescriptor.columns.length - 1 ? ',' : ''
                    writer.writeLine(`${col.name}: data[${index}]${separator}`);
                })
            })
            writer.writeLine('return result;');
        });
    }

    return writer.toString();
}

function toParamValue(param: TsFieldDescriptor, paramVar: 'params' | 'data'): string {
    if (param.tsType == 'Date') {
        return paramVar + '.' + param.name + '.toISOString()';
    }
    return paramVar + '.' + param.name;
}
