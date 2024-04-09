import { isLeft } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "../mysql-query-analyzer/types";
import { parseSql } from "./parser";
import { TsDescriptor, capitalize, convertToCamelCaseName } from "../code-generator";
import CodeBlockWriter from "code-block-writer";
import { ParameterDef, SchemaDef, TsFieldDescriptor } from "../types";
import { SQLiteType } from "./types";

export async function generateTsCode(sql: string, queryName: string, sqliteDbSchema: ColumnSchema[]) {
    const queryInfo = parseSql(sql, sqliteDbSchema);
    if (isLeft(queryInfo)) {
        return 'invalid'
    }
    const tsDescriptor = createTsDescriptor(queryInfo.right);
    const code = generateCodeFromTsDescriptor(sql, queryName, tsDescriptor);
    return code;
}

function createTsDescriptor(queryInfo: SchemaDef): TsDescriptor {
    const tsDescriptor: TsDescriptor = {
        sql: "",
        queryType: "Select",
        multipleRowsResult: false,
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
    }
}

function generateCodeFromTsDescriptor(sql: string, queryName: string, tsDescriptor: TsDescriptor) {

    const writer = new CodeBlockWriter({
        useTabs: true
    });

    const camelCaseName = convertToCamelCaseName(queryName);
    const capitalizedName = capitalize(camelCaseName);

    const dataTypeName = capitalizedName + 'Data';
    const paramsTypeName = capitalizedName + 'Params';
    const resultTypeName = capitalizedName + 'Result';
    const dynamicParamsTypeName = capitalizedName + 'DynamicParams'
    const selectColumnsTypeName = capitalizedName + 'Select';
    const whereTypeName = capitalizedName + 'Where';
    const orderByTypeName = capitalizedName + 'OrderBy';

    writer.writeLine(`import { Database } from 'better-sqlite3';`);
    writer.blankLine();

    writer.write(`export type ${paramsTypeName} =`).block(() => {
        tsDescriptor.parameters.forEach((field) => {
            writer.write(`${field.name}: ${field.tsType};`);
        });
    });
    writer.blankLine();

    writer.write(`export type ${resultTypeName} =`).block(() => {
        tsDescriptor.columns.forEach((field, index) => {
            const optionalOp = field.notNull ? '' : '?';
            writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
        });
        writer.blankLine();
    });

    const functionArguments = `db: Database, params: ${paramsTypeName}`;
    writer.write(`export function ${camelCaseName}(${functionArguments}): ${resultTypeName}[]`).block(() => {
        const sqlSplit = sql.split('\n');
        writer.write('const sql = `').newLine();
        sqlSplit.forEach(sqlLine => {
            writer.indent().write(sqlLine).newLine();
        });
        writer.indent().write('`').newLine();
        writer.write('return db.prepare(sql)').newLine();
        writer.indent().write('.raw(true)').newLine();
        writer.indent().write('.all([params.param1])').newLine();
        writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data));`);
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