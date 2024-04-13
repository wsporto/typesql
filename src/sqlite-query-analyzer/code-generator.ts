import { isLeft } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "../mysql-query-analyzer/types";
import { parseSql } from "./parser";
import { TsDescriptor, capitalize, convertToCamelCaseName, removeDuplicatedParameters2 } from "../code-generator";
import CodeBlockWriter from "code-block-writer";
import { ParameterDef, SchemaDef, TsFieldDescriptor } from "../types";
import { SQLiteType } from "./types";

export function generateTsCode(sql: string, queryName: string, sqliteDbSchema: ColumnSchema[]) {
    const queryInfo = parseSql(sql, sqliteDbSchema);
    if (isLeft(queryInfo)) {
        return 'invalid'
    }
    const tsDescriptor = createTsDescriptor(queryInfo.right);
    const code = generateCodeFromTsDescriptor(queryName, tsDescriptor);
    return code;
}

function createTsDescriptor(queryInfo: SchemaDef): TsDescriptor {
    const tsDescriptor: TsDescriptor = {
        sql: queryInfo.sql,
        queryType: "Select",
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns: queryInfo.columns.map(col => mapColumnToTsFieldDescriptor(col)),
        parameterNames: [],
        parameters: queryInfo.parameters.map(param => mapParameterToTsFieldDescriptor(param))
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
            return 'number'
    }
}

function generateCodeFromTsDescriptor(queryName: string, tsDescriptor: TsDescriptor) {

    const writer = new CodeBlockWriter({
        useTabs: true
    });

    const camelCaseName = convertToCamelCaseName(queryName);
    const capitalizedName = capitalize(camelCaseName);

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

    writer.writeLine(`import { Database } from 'better-sqlite3';`);

    if (uniqueParams.length > 0) {
        writer.blankLine();
        writer.write(`export type ${paramsTypeName} =`).block(() => {
            uniqueParams.forEach((field) => {
                writer.writeLine(`${field.name}: ${field.tsType};`);
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
    functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? ', params: ' + paramsTypeName : '';

    const queryParams = tsDescriptor.parameters.length > 0 ? '[' + tsDescriptor.parameters.map(param => 'params.' + param.name).join(', ') + ']' : '';

    const returnType = tsDescriptor.multipleRowsResult ? `${resultTypeName}[]` : `${resultTypeName} | null`;

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

    return writer.toString();
}