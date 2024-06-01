import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "../mysql-query-analyzer/types";
import { parseSql } from "./parser";
import { TsDescriptor, capitalize, convertToCamelCaseName, generateRelationType, removeDuplicatedParameters2, renameInvalidNames, replaceOrderByParam } from "../code-generator";
import CodeBlockWriter from "code-block-writer";
import { LibSqlClient, ParameterDef, QueryType, SQLiteClient, SQLiteDialect, SchemaDef, TsFieldDescriptor, TypeSqlError } from "../types";
import { SQLiteType } from "./types";
import { Field2 } from "./sqlite-describe-nested-query";
import { RelationType2, TsField2, mapToTsRelation2 } from "../ts-nested-descriptor";
import { preprocessSql } from "../describe-query";
import { explainSql } from "./query-executor";

export function validateAndGenerateCode(client: SQLiteDialect | LibSqlClient, sql: string, queryName: string, sqliteDbSchema: ColumnSchema[], isCrud = false): Either<TypeSqlError, string> {
    const { sql: processedSql } = preprocessSql(sql);
    const explainSqlResult = explainSql(client.client, processedSql);
    if (isLeft(explainSqlResult)) {
        return left({
            name: 'Invalid sql',
            description: explainSqlResult.left.description
        });
    }
    const code = generateTsCode(sql, queryName, sqliteDbSchema, isCrud, client.type);
    return code;
}

function mapToColumnInfo(col: ColumnSchema) {
    const defaultValue = col.columnKey == 'PRI' && col.column_type == 'INTEGER' ? 'AUTOINCREMENT' : col.defaultValue;
    const columnInfo: ColumnInfo = {
        columnName: col.column,
        notNull: col.notNull,
        type: col.column_type,
        table: col.table,
        defaultValue: defaultValue
    }
    return columnInfo;
}

export function generateCrud(client: SQLiteClient = 'sqlite', queryType: QueryType, tableName: string, dbSchema: ColumnSchema[]) {

    const columns = dbSchema.filter(col => col.table == tableName);

    const columnInfo = columns.map(col => mapToColumnInfo(col));
    const keys = columns.filter(col => col.columnKey == 'PRI');
    if (keys.length == 0) {
        keys.push(...columns.filter(col => col.columnKey == 'UNI'));
    }
    const keyColumnInfo = keys.map(key => mapToColumnInfo(key)).map(col => mapColumnToTsFieldDescriptor(col));

    const resultColumns = mapColumns(client, queryType, columnInfo, false);
    const params = columnInfo.map(col => mapColumnToTsFieldDescriptor(col));

    const tsDescriptor: TsDescriptor = {
        sql: '',
        queryType,
        multipleRowsResult: false,
        columns: resultColumns,
        parameterNames: [],
        parameters: queryType == 'Insert' ? params : keyColumnInfo,
        data: queryType == 'Update' ? params.filter(param => param.name != keyColumnInfo[0]?.name) : []
    }

    const queryName = getQueryName(queryType, tableName);

    const code = generateCodeFromTsDescriptor(client, queryName, tsDescriptor, true, tableName);
    return code;
}

function getQueryName(queryType: QueryType, tableName: string) {
    const camelCaseName = convertToCamelCaseName(tableName);
    const captitalizedName = capitalize(camelCaseName);
    switch (queryType) {
        case "Select":
            return 'selectFrom' + captitalizedName;
        case "Insert":
            return 'insertInto' + captitalizedName;
        case "Update":
            return 'update' + captitalizedName;
        case "Delete":
            return 'deleteFrom' + captitalizedName;
    }
}

export function generateTsCode(sql: string, queryName: string, sqliteDbSchema: ColumnSchema[], isCrud = false, client: SQLiteClient = 'sqlite'): Either<TypeSqlError, string> {
    const schemaDefResult = parseSql(sql, sqliteDbSchema);
    if (isLeft(schemaDefResult)) {
        return schemaDefResult;
    }
    const tsDescriptor = createTsDescriptor(schemaDefResult.right, client);
    const code = generateCodeFromTsDescriptor(client, queryName, tsDescriptor, isCrud);
    return right(code);
}

function createTsDescriptor(queryInfo: SchemaDef, client: SQLiteClient): TsDescriptor {
    const tsDescriptor: TsDescriptor = {
        sql: queryInfo.sql,
        queryType: queryInfo.queryType,
        multipleRowsResult: queryInfo.multipleRowsResult,
        returning: queryInfo.returning,
        columns: mapColumns(client, queryInfo.queryType, queryInfo.columns, queryInfo.returning),
        parameterNames: [],
        parameters: queryInfo.parameters.map(param => mapParameterToTsFieldDescriptor(param)),
        data: queryInfo.data?.map(param => mapParameterToTsFieldDescriptor(param)),
        orderByColumns: queryInfo.orderByColumns
    }
    if (queryInfo.nestedInfo) {
        const nestedDescriptor2 = queryInfo.nestedInfo.map(relation => {
            const tsRelation: RelationType2 = {
                groupIndex: relation.groupIndex,
                name: relation.name,
                fields: relation.fields.map(field => mapFieldToTsField(queryInfo.columns, field)),
                relations: relation.relations.map(relation => mapToTsRelation2(relation))
            }
            return tsRelation;
        });
        tsDescriptor.nestedDescriptor2 = nestedDescriptor2;
    }
    return tsDescriptor;
}

function mapColumns(client: SQLiteClient, queryType: SchemaDef['queryType'], columns: ColumnInfo[], returning: boolean = false) {
    const sqliteInsertColumns: TsFieldDescriptor[] = [
        {
            name: 'changes',
            tsType: 'number',
            notNull: true
        },
        {
            name: 'lastInsertRowid',
            tsType: 'number',
            notNull: true
        }
    ];

    const libSqlInsertColumns: TsFieldDescriptor[] = [
        {
            name: 'rowsAffected',
            tsType: 'number',
            notNull: true
        },
        {
            name: 'lastInsertRowid',
            tsType: 'number',
            notNull: true
        }
    ]

    if (queryType == 'Insert' && !returning) {
        return client == 'sqlite' ? sqliteInsertColumns : libSqlInsertColumns;
    }
    if (queryType == 'Update' || queryType == 'Delete') {
        return client == 'sqlite' ? [sqliteInsertColumns[0]] : [libSqlInsertColumns[0]]
    }

    const escapedColumnsNames = renameInvalidNames(columns.map(col => col.columnName));
    return columns.map((col, index) => mapColumnToTsFieldDescriptor({ ...col, columnName: escapedColumnsNames[index] }))
}

function mapFieldToTsField(columns: ColumnInfo[], field: Field2): TsField2 {
    const tsField: TsField2 = {
        name: field.name,
        index: field.index,
        tsType: mapColumnType(columns[field.index].type as SQLiteType),
        notNull: false
    }
    return tsField;
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
        notNull: col.notNull,
        defaultValue: col.defaultValue
    }
    return tsDesc;
}

function mapColumnType(sqliteType: SQLiteType) {
    switch (sqliteType) {
        case 'INTEGER':
            return 'number';
        case 'INTEGER[]':
            return 'number[]';
        case 'TEXT':
            return 'string';
        case 'TEXT[]':
            return 'string[]';
        case 'NUMERIC':
            return 'number';
        case 'NUMERIC[]':
            return 'number[]';
        case 'REAL':
            return 'number';
        case 'REAL[]':
            return 'number[]';
        case 'DATE':
            return 'Date';
        case 'BLOB':
            return 'any';
    }
}

function generateCodeFromTsDescriptor(client: SQLiteClient, queryName: string, tsDescriptor: TsDescriptor, isCrud: boolean = false, tableName: string = '') {

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

    if (client == 'sqlite') {
        writer.writeLine(`import { Database } from 'better-sqlite3';`);
    }
    if (client == 'libsql') {
        writer.writeLine(`import { Client, Transaction } from '@libsql/client';`);
    }

    if (uniqueUpdateParams.length > 0) {
        writer.blankLine();
        writer.write(`export type ${dataTypeName} =`).block(() => {
            uniqueUpdateParams.forEach(field => {
                const optionalOp = isCrud && (!field.notNull || field.defaultValue != null) ? '?' : '';
                const orNull = field.notNull ? '' : ' | null';
                writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
            });
        });
    }

    if (uniqueParams.length > 0 || generateOrderBy) {
        writer.blankLine();
        writer.write(`export type ${paramsTypeName} =`).block(() => {
            uniqueParams.forEach((field) => {
                const optionalOp = queryType == 'Insert' && (!field.notNull || field.defaultValue != null) ? '?' : '';
                const orNull = field.notNull ? '' : ' | null';
                writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
            });
            if (generateOrderBy) {
                writer.writeLine(`orderBy: [${orderByTypeName}, 'asc' | 'desc'][];`)
            }
        });
    }

    writer.blankLine();
    writer.write(`export type ${resultTypeName} =`).block(() => {
        tsDescriptor.columns.forEach(field => {
            const optionalOp = field.notNull ? '' : '?';
            writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
        });
    });
    writer.blankLine();

    let functionArguments = client == 'sqlite' ? `db: Database` : 'client: Client | Transaction';
    functionArguments += queryType == 'Update' ? `, data: ${dataTypeName}` : '';
    functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? ', params: ' + paramsTypeName : '';

    const allParameters = (tsDescriptor.data?.map((param) => toParamValue('data', param)) || [])
        .concat(tsDescriptor.parameters.map(param => toParamValue('params', param)));

    const queryParams = allParameters.length > 0 ? '[' + allParameters.join(', ') + ']' : '';

    const orNull = queryType == 'Select' ? ' | null' : '';
    const returnType = tsDescriptor.multipleRowsResult ? `${resultTypeName}[]` : `${resultTypeName}${orNull}`;

    if (isCrud) {
        const crudFunction = client == 'libsql'
            ? `async function ${camelCaseName}(${functionArguments}): Promise<${returnType}>`
            : `function ${camelCaseName}(${functionArguments}): ${returnType}`
        writer.write(`export ${crudFunction}`).block(() => {
            const idColumn = tsDescriptor.parameters[0].name;
            writeExecuteCrudBlock(client, queryType, tableName, tsDescriptor.columns, idColumn, queryParams, paramsTypeName, dataTypeName, resultTypeName, writer);
        });
    }

    if (!isCrud && (queryType == 'Select' || (queryType == 'Insert' && tsDescriptor.returning))) {
        if (client == 'sqlite') {
            writer.write(`export function ${camelCaseName}(${functionArguments}): ${returnType}`).block(() => {
                const processedSql = tsDescriptor.orderByColumns ? replaceOrderByParam(sql) : sql;
                const sqlSplit = processedSql.split('\n');
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
        if (!isCrud && client == 'libsql') {
            writer.write(`export async function ${camelCaseName}(${functionArguments}): Promise<${returnType}>`).block(() => {
                const processedSql = tsDescriptor.orderByColumns ? replaceOrderByParam(sql) : sql;
                const sqlSplit = processedSql.split('\n');
                writer.write('const sql = `').newLine();
                sqlSplit.forEach(sqlLine => {
                    writer.indent().write(sqlLine).newLine();
                });
                writer.indent().write('`').newLine();
                const executeParams = queryParams != '' ? `{ sql, args: ${queryParams} }` : 'sql';

                writer.write(`return client.execute(${executeParams})`).newLine();

                if (queryType == 'Select') {
                    writer.indent().write(`.then(res => res.rows)`).newLine();
                    if (tsDescriptor.multipleRowsResult) {
                        writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row)));`);
                    }
                    else {
                        writer.indent().write(`.then(rows => mapArrayTo${resultTypeName}(rows[0]));`);
                    }
                }
                if (queryType == 'Insert') {
                    if (tsDescriptor.returning) {
                        writer.indent().write(`.then(res => res.rows)`).newLine();
                        writer.indent().write(`.then(rows => mapArrayTo${resultTypeName}(rows[0]));`);
                    }
                    else {
                        writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`);
                    }
                }
            });
        }
    }

    if (!isCrud && (queryType == 'Update' || queryType == 'Delete' || (queryType == 'Insert' && !tsDescriptor.returning))) {
        if (client == 'sqlite') {
            writer.write(`export function ${camelCaseName}(${functionArguments}): ${resultTypeName}`).block(() => {
                writeExecuteBlock(sql, queryParams, resultTypeName, writer);
            });
        }
        if (client == 'libsql') {
            writer.write(`export async function ${camelCaseName}(${functionArguments}): Promise<${resultTypeName}>`).block(() => {
                const sqlSplit = sql.split('\n');
                writer.write('const sql = `').newLine();
                sqlSplit.forEach(sqlLine => {
                    writer.indent().write(sqlLine).newLine();
                });
                writer.indent().write('`').newLine();
                const executeParams = queryParams != '' ? `{ sql, args: ${queryParams} }` : 'sql';
                writer.write(`return client.execute(${executeParams})`).newLine();
                writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`);
            });
        }
    }

    if (queryType == 'Select' || tsDescriptor.returning) {
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
    else if (client == 'libsql' && !tsDescriptor.returning) {
        writer.blankLine();
        writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
            writer.write(`const result: ${resultTypeName} = `).block(() => {
                tsDescriptor.columns.forEach((col, index) => {
                    const separator = index < tsDescriptor.columns.length - 1 ? ',' : ''
                    writer.writeLine(`${col.name}: data.${col.name}${separator}`);
                })
            })
            writer.writeLine('return result;');
        });
    }
    if (tsDescriptor.orderByColumns) {
        writer.blankLine();
        writer.writeLine(`const orderByFragments = [${tsDescriptor.orderByColumns.map(orderBy => `'${orderBy}'`)}] as const;`);
        writer.blankLine();
        writer.writeLine(`export type ${orderByTypeName} = typeof orderByFragments[number];`);
        writer.blankLine();
        writer.write(`function escapeOrderBy(orderBy: ${paramsTypeName}['orderBy']): string`).block(() => {
            writer.writeLine(`return orderBy.map(order => \`\${escapeSQL(order[0])} \${order[1] == 'desc' ? 'desc' : 'asc'}\`).join(', ');`)
        });
        writer.blankLine();
        writer.write(`export function escapeSQL(value: string)`).block(() => {
            writer.writeLine(`return '"' + String(value).replace(/"/g, '""') + '"';`)
        })
    }

    if (tsDescriptor.nestedDescriptor2) {
        const relations = tsDescriptor.nestedDescriptor2;
        relations.forEach((relation) => {
            const relationType = generateRelationType(capitalizedName, relation.name);
            writer.blankLine();
            writer.write(`export type ${relationType} = `).block(() => {
                const uniqueNameFields = renameInvalidNames(relation.fields.map(f => f.name));
                relation.fields.forEach((field, index) => {
                    writer.writeLine(`${uniqueNameFields[index]}: ${field.tsType};`);
                })
                relation.relations.forEach(field => {
                    const nestedRelationType = generateRelationType(capitalizedName, field.tsType);
                    const nullableOperator = field.notNull ? '' : '?'
                    writer.writeLine(`${field.name}${nullableOperator}: ${nestedRelationType};`);
                })
            })

        })
        writer.blankLine();

        relations.forEach((relation, index) => {
            const relationType = generateRelationType(capitalizedName, relation.name);
            if (index == 0) {
                if (client == 'sqlite') {
                    writer.write(`export function ${camelCaseName}Nested(${functionArguments}): ${relationType}[]`).block(() => {
                        const params = tsDescriptor.parameters.length > 0 ? ', params' : '';
                        writer.writeLine(`const selectResult = ${camelCaseName}(db${params});`);
                        writer.write('if (selectResult.length == 0)').block(() => {
                            writer.writeLine('return [];')
                        });
                        writer.writeLine(`return collect${relationType}(selectResult);`)
                    })
                }
                else if (client == 'libsql') {
                    writer.write(`export async function ${camelCaseName}Nested(${functionArguments}): Promise<${relationType}[]>`).block(() => {
                        const params = tsDescriptor.parameters.length > 0 ? ', params' : '';
                        writer.writeLine(`const selectResult = await ${camelCaseName}(client${params});`);
                        writer.write('if (selectResult.length == 0)').block(() => {
                            writer.writeLine('return [];')
                        });
                        writer.writeLine(`return collect${relationType}(selectResult);`)
                    })
                }
            }
            writeCollectFunction(writer, relation, tsDescriptor.columns, capitalizedName, resultTypeName);
        })

        writer.blankLine();
        writer.write('const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) =>').block(() => {
            writer.write('return array.reduce((map, value, index, array) => ').inlineBlock(() => {
                writer.writeLine('const key = predicate(value, index, array);');
                writer.writeLine('map.get(key)?.push(value) ?? map.set(key, [value]);');
                writer.writeLine('return map;');
            }).write(', new Map<Q, T[]>());');
        })
    }

    return writer.toString();
}

function writeExecuteBlock(sql: string, queryParams: string, resultTypeName: string, writer: CodeBlockWriter) {
    const sqlSplit = sql.split('\n');
    writer.write('const sql = `').newLine();
    sqlSplit.forEach(sqlLine => {
        writer.indent().write(sqlLine).newLine();
    });
    writer.indent().write('`').newLine();
    writer.write('return db.prepare(sql)').newLine();
    writer.indent().write(`.run(${queryParams}) as ${resultTypeName};`);
}

function writeExecuteCrudBlock(client: SQLiteClient, queryType: QueryType, tableName: string, columns: TsFieldDescriptor[], idColumn: string, queryParams: string, paramTypeName: string, dataTypeName: string, resultTypeName: string, writer: CodeBlockWriter) {
    switch (queryType) {
        case "Select":
            return writeExecutSelectCrudBlock(client, tableName, idColumn, columns, queryParams, resultTypeName, writer);
        case "Insert":
            return writeExecuteInsertCrudBlock(client, tableName, paramTypeName, resultTypeName, writer);
        case "Update":
            return writeExecuteUpdateCrudBlock(client, tableName, idColumn, dataTypeName, resultTypeName, writer);
        case "Delete":
            return writeExecutDeleteCrudBlock(client, tableName, idColumn, queryParams, resultTypeName, writer);
    }
}

function writeExecutSelectCrudBlock(client: SQLiteClient, tableName: string, idColumn: string, columns: TsFieldDescriptor[], queryParams: string, resultTypeName: string, writer: CodeBlockWriter) {
    writer.blankLine();
    writer.writeLine('const sql = `SELECT');
    columns.forEach((col, index) => {
        const separator = index < columns.length - 1 ? ',' : '';
        writer.indent(2).write(`${col.name}${separator}`).newLine();
    })
    writer.indent().write(`FROM ${tableName}`).newLine();
    writer.indent().write(`WHERE ${idColumn} = ?\``).newLine();
    writer.blankLine();
    if (client == 'sqlite') {
        writer.write('return db.prepare(sql)').newLine();
        writer.indent().write('.raw(true)').newLine();
        writer.indent().write(`.all(${queryParams})`).newLine();
        writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data))[0];`);
    }
    else {
        writer.write(`return client.execute({ sql, args: ${queryParams} })`).newLine();
        writer.indent().write(`.then(res => res.rows)`).newLine();
        writer.indent().write(`.then(rows => mapArrayTo${resultTypeName}(rows[0]));`);
    }
}

function writeExecuteInsertCrudBlock(client: SQLiteClient, tableName: string, paramTypeName: string, resultTypeName: string, writer: CodeBlockWriter) {
    writer.blankLine();
    writer.writeLine(`const keys = Object.keys(params) as Array<keyof ${paramTypeName}>;`);
    writer.writeLine(`const columns = keys.filter(key => params[key] !== undefined);`);
    writer.writeLine(`const values = columns.map(col => params[col]!);`);
    writer.blankLine();
    writer.writeLine('const sql = columns.length == 0');
    writer.indent().write(`? \`INSERT INTO ${tableName} DEFAULT VALUES\``).newLine();
    writer.indent().write(`: \`INSERT INTO ${tableName}(\${columns.join(',')}) VALUES(\${columns.map(_ => '?').join(',')})\``).newLine();
    writer.blankLine();
    if (client == 'sqlite') {
        writer.write('return db.prepare(sql)').newLine();
        writer.indent().write(`.run(values) as ${resultTypeName};`);
    }
    else {
        writer.write(`return client.execute({ sql, args: values })`).newLine();
        writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`).newLine();
    }
}

function writeExecuteUpdateCrudBlock(client: SQLiteClient, tableName: string, idColumn: string, paramTypeName: string, resultTypeName: string, writer: CodeBlockWriter) {

    writer.blankLine();
    writer.writeLine(`const keys = Object.keys(data) as Array<keyof ${paramTypeName}>;`);
    writer.writeLine(`const columns = keys.filter(key => data[key] !== undefined);`);
    writer.writeLine(`const values = columns.map(col => data[col]!).concat(params.${idColumn});`);
    writer.blankLine();
    writer.writeLine('const sql = `');
    writer.indent().write(`UPDATE ${tableName}`).newLine();
    writer.indent().write(`SET \${columns.map(col => \`\${col} = ?\`).join(', ')}`).newLine();
    writer.indent().write(`WHERE ${idColumn} = ?\``).newLine();
    writer.blankLine();
    if (client == 'sqlite') {
        writer.write('return db.prepare(sql)').newLine();
        writer.indent().write(`.run(values) as ${resultTypeName};`);
    }
    else {
        writer.write(`return client.execute({ sql, args: values })`).newLine();
        writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`).newLine();
    }

}

function writeExecutDeleteCrudBlock(client: SQLiteClient, tableName: string, idColumn: string, queryParams: string, resultTypeName: string, writer: CodeBlockWriter) {
    writer.blankLine();
    writer.writeLine('const sql = `DELETE');
    writer.indent().write(`FROM ${tableName}`).newLine();
    writer.indent().write(`WHERE ${idColumn} = ?\``).newLine();
    writer.blankLine();
    if (client == 'sqlite') {
        writer.write('return db.prepare(sql)').newLine();
        writer.indent().write(`.run(${queryParams}) as ${resultTypeName};`).newLine();
    }
    else {
        writer.write(`return client.execute({ sql, args: ${queryParams} })`).newLine();
        writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`).newLine();
    }
}

function toParamValue(variableName: string, param: TsFieldDescriptor): string {
    if (param.tsType == 'Date') {
        return `${variableName}.${param.name}.toISOString()`;
    }
    if (param.tsType?.endsWith("[]")) {
        return `...${variableName}.${param.name}`;
    }
    return `${variableName}.${param.name}`;
}
function writeCollectFunction(
    writer: CodeBlockWriter,
    relation: RelationType2,
    columns: TsFieldDescriptor[],
    capitalizedName: string,
    resultTypeName: string) {

    const relationType = generateRelationType(capitalizedName, relation.name);
    const collectFunctionName = `collect${relationType}`;
    writer.blankLine();
    writer.write(`function ${collectFunctionName}(selectResult: ${resultTypeName}[]): ${relationType}[]`).block(() => {

        const groupBy = columns[relation.groupIndex].name;
        writer.writeLine(`const grouped = groupBy(selectResult.filter(r => r.${groupBy} != null), r => r.${groupBy});`)
        writer.write(`return [...grouped.values()].map(row => (`).inlineBlock(() => {
            relation.fields.forEach((field, index) => {
                const uniqueNameFields = renameInvalidNames(relation.fields.map(f => f.name));
                const separator = ',';
                const fieldName = columns[field.index].name;
                writer.writeLine(`${uniqueNameFields[index]}: row[0].${fieldName}!` + separator);
            })
            relation.relations.forEach(fieldRelation => {
                const relationType = generateRelationType(capitalizedName, fieldRelation.name);
                const cardinality = fieldRelation.list ? '' : '[0]'
                writer.writeLine(`${fieldRelation.name}: collect${relationType}(row)${cardinality},`);
            })
        }).write('))');
    })
}