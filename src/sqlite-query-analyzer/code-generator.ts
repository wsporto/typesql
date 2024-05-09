import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "../mysql-query-analyzer/types";
import { parseSql } from "./parser";
import { TsDescriptor, capitalize, convertToCamelCaseName, generateRelationType, removeDuplicatedParameters2, renameInvalidNames, replaceOrderByParam } from "../code-generator";
import CodeBlockWriter from "code-block-writer";
import { LibSqlClient, ParameterDef, SQLiteClient, SQLiteDialect, SchemaDef, TsFieldDescriptor, TypeSqlError } from "../types";
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

export function generateTsCode(sql: string, queryName: string, sqliteDbSchema: ColumnSchema[], isCrud = false, client: SQLiteClient = 'sqlite'): Either<TypeSqlError, string> {
    const schemaDefResult = parseSql(sql, sqliteDbSchema);
    if (isLeft(schemaDefResult)) {
        return schemaDefResult;
    }
    const tsDescriptor = createTsDescriptor(schemaDefResult.right);
    const code = generateCodeFromTsDescriptor(client, queryName, tsDescriptor, isCrud);
    return right(code);
}

function createTsDescriptor(queryInfo: SchemaDef): TsDescriptor {
    const escapedColumnsNames = renameInvalidNames(queryInfo.columns.map(col => col.columnName));
    const tsDescriptor: TsDescriptor = {
        sql: queryInfo.sql,
        queryType: queryInfo.queryType,
        multipleRowsResult: queryInfo.multipleRowsResult,
        columns: queryInfo.columns.map((col, index) => mapColumnToTsFieldDescriptor({ ...col, columnName: escapedColumnsNames[index] })),
        parameterNames: [],
        parameters: queryInfo.parameters.map(param => mapParameterToTsFieldDescriptor(param)),
        data: queryInfo.data?.map(param => mapParameterToTsFieldDescriptor(param)),
        orderByColumns: queryInfo.orderByColumns
    }
    if (queryInfo.nestedInfo) {
        const nestedDescriptor2 = queryInfo.nestedInfo.map(relation => {
            const tsRelation: RelationType2 = {
                joinColumn: relation.joinColumn,
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

function generateCodeFromTsDescriptor(client: SQLiteClient, queryName: string, tsDescriptor: TsDescriptor, isCrud: boolean) {

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
    const isUpdateCrud = isCrud && queryType == 'Update';

    if (client == 'sqlite') {
        writer.writeLine(`import { Database } from 'better-sqlite3';`);
    }
    if (client == 'libsql') {
        writer.writeLine(`import { Client } from '@libsql/client';`);
    }

    if (uniqueUpdateParams.length > 0) {
        writer.blankLine();
        writer.write(`export type ${dataTypeName} =`).block(() => {
            uniqueUpdateParams.forEach((field, index) => {
                const optionalOp = field.notNull ? '' : '?';
                const orNull = field.notNull ? '' : ' | null';
                if (!isUpdateCrud) {
                    writer.writeLine(`${field.name}: ${field.tsType}${orNull};`);
                }
                else if (index % 2 != 0) {//updateCrud-> :nameSet, :name, valueSet, :value...
                    writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
                }
            });
        });
    }

    if (uniqueParams.length > 0 || generateOrderBy) {
        writer.blankLine();
        writer.write(`export type ${paramsTypeName} =`).block(() => {
            uniqueParams.forEach((field) => {
                const optionalOp = field.notNull ? '' : '?';
                writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
            });
            if (generateOrderBy) {
                writer.writeLine(`orderBy: [${orderByTypeName}, 'asc' | 'desc'][];`)
            }
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

    let functionArguments = client == 'sqlite' ? `db: Database` : 'client: Client';
    functionArguments += queryType == 'Update' ? `, data: ${dataTypeName}` : '';
    functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? ', params: ' + paramsTypeName : '';

    const allParameters = (tsDescriptor.data?.map((param, index) => {
        if (isUpdateCrud && index % 2 == 0) {
            const nextField = tsDescriptor.data![index + 1];
            return `data.${nextField.name} !== undefined ? 1 : 0`;
        }
        else {
            return 'data.' + toParamValue(param);
        }
    }) || [])
        .concat(tsDescriptor.parameters.map(param => 'params.' + toParamValue(param)));

    const queryParams = allParameters.length > 0 ? '[' + allParameters.join(', ') + ']' : '';

    const returnType = tsDescriptor.multipleRowsResult ? `${resultTypeName}[]` : `${resultTypeName} | null`;

    if (queryType == 'Select') {
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
        if (client == 'libsql') {
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
                writer.indent().write(`.then(res => res.rows)`).newLine();
                writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row))${tsDescriptor.multipleRowsResult ? '' : '[0]'});`);
            });
        }
    }

    if (queryType == 'Insert' || queryType == 'Update' || queryType == 'Delete') {
        if (client == 'sqlite') {
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
                writer.indent().write(`.then(res => res as unknown as ${resultTypeName});`);
            });
        }
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

function toParamValue(param: TsFieldDescriptor): string {
    if (param.tsType == 'Date') {
        return param.name + '.toISOString()';
    }
    return param.name;
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

        writer.writeLine(`const grouped = groupBy(selectResult.filter(r => r.${relation.joinColumn} != null), r => r.${relation.joinColumn});`)
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