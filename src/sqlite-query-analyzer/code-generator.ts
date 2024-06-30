import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ColumnInfo, ColumnSchema } from "../mysql-query-analyzer/types";
import { parseSql } from "./parser";
import { TsDescriptor, capitalize, convertToCamelCaseName, generateRelationType, getOperator, hasDateColumn, hasStringColumn, removeDuplicatedParameters2, renameInvalidNames, replaceOrderByParam, writeTypeBlock } from "../code-generator";
import CodeBlockWriter from "code-block-writer";
import { LibSqlClient, ParameterDef, QueryType, SQLiteClient, SQLiteDialect, SchemaDef, TsFieldDescriptor, TypeSqlError } from "../types";
import { SQLiteType } from "./types";
import { Field2 } from "./sqlite-describe-nested-query";
import { RelationType2, TsField2, mapToTsRelation2 } from "../ts-nested-descriptor";
import { preprocessSql } from "../describe-query";
import { explainSql } from "./query-executor";
import { mapToDynamicParams, mapToDynamicResultColumns, mapToDynamicSelectColumns } from '../ts-dynamic-query-descriptor';
import { EOL } from 'os';

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

function mapToColumnInfo(col: ColumnSchema, checkOptional: boolean) {
    const defaultValue = col.columnKey == 'PRI' && col.column_type == 'INTEGER' ? 'AUTOINCREMENT' : col.defaultValue;
    const columnInfo: ColumnInfo = {
        columnName: col.column,
        notNull: col.notNull,
        type: col.column_type,
        table: col.table,
        optional: checkOptional && (!col.notNull || defaultValue != null)
    }
    return columnInfo;
}

export function generateCrud(client: SQLiteClient = 'sqlite', queryType: QueryType, tableName: string, dbSchema: ColumnSchema[]) {

    const columns = dbSchema.filter(col => col.table == tableName);

    const columnInfo = columns.map(col => mapToColumnInfo(col, queryType == 'Insert' || queryType == 'Update'));
    const keys = columns.filter(col => col.columnKey == 'PRI');
    if (keys.length == 0) {
        keys.push(...columns.filter(col => col.columnKey == 'UNI'));
    }
    const keyColumnInfo = keys.map(key => mapToColumnInfo(key, false)).map(col => mapColumnToTsFieldDescriptor(col, client));

    const resultColumns = mapColumns(client, queryType, columnInfo, false);
    const params = columnInfo.map(col => mapColumnToTsFieldDescriptor(col, client));

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
        parameters: queryInfo.parameters.map(param => mapParameterToTsFieldDescriptor(param, client)),
        data: queryInfo.data?.map(param => mapParameterToTsFieldDescriptor(param, client)),
        orderByColumns: queryInfo.orderByColumns
    }
    if (queryInfo.nestedInfo) {
        const nestedDescriptor2 = queryInfo.nestedInfo.map(relation => {
            const tsRelation: RelationType2 = {
                groupIndex: relation.groupIndex,
                name: relation.name,
                fields: relation.fields.map(field => mapFieldToTsField(queryInfo.columns, field, client)),
                relations: relation.relations.map(relation => mapToTsRelation2(relation))
            }
            return tsRelation;
        });
        tsDescriptor.nestedDescriptor2 = nestedDescriptor2;
    }
    tsDescriptor.dynamicQuery2 = queryInfo.dynamicSqlQuery2;
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
    return columns.map((col, index) => mapColumnToTsFieldDescriptor({ ...col, columnName: escapedColumnsNames[index] }, client))
}

function mapFieldToTsField(columns: ColumnInfo[], field: Field2, client: SQLiteClient): TsField2 {
    const tsField: TsField2 = {
        name: field.name,
        index: field.index,
        tsType: mapColumnType(columns[field.index].type as SQLiteType, client),
        notNull: false
    }
    return tsField;
}

function mapParameterToTsFieldDescriptor(col: ParameterDef, client: SQLiteClient) {
    const tsDesc: TsFieldDescriptor = {
        name: col.name,
        tsType: mapColumnType(col.columnType as SQLiteType, client),
        notNull: col.notNull ? col.notNull : false
    }
    return tsDesc;
}

function mapColumnToTsFieldDescriptor(col: ColumnInfo, client: SQLiteClient) {
    const tsDesc: TsFieldDescriptor = {
        name: col.columnName,
        tsType: mapColumnType(col.type as SQLiteType, client),
        notNull: col.notNull,
        optional: col.optional
    }
    return tsDesc;
}

function mapColumnType(sqliteType: SQLiteType, client: SQLiteClient) {
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
            return client == 'sqlite' ? 'Uint8Array' : 'ArrayBuffer';
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


    const orderByField = generateOrderBy ? `orderBy: [${orderByTypeName}, 'asc' | 'desc'][]` : undefined;
    const paramsTypes = removeDuplicatedParameters2(tsDescriptor.dynamicQuery2 == null ? tsDescriptor.parameters : mapToDynamicParams(tsDescriptor.parameters));

    let functionArguments = client == 'sqlite' ? `db: Database` : 'client: Client | Transaction';
    functionArguments += queryType == 'Update' ? `, data: ${dataTypeName}` : '';
    if (tsDescriptor.dynamicQuery2 == null) {
        functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? ', params: ' + paramsTypeName : '';
    }
    else {
        functionArguments += `, ${orderByField ? 'params' : 'params?'}: ${dynamicParamsTypeName}`;
    }

    const orNull = queryType == 'Select' ? ' | null' : '';
    const returnType = tsDescriptor.multipleRowsResult ? `${resultTypeName}[]` : `${resultTypeName}${orNull}`;

    const allParameters = (tsDescriptor.data?.map((param) => fromDriver('data', param)) || [])
        .concat(tsDescriptor.parameters.map(param => fromDriver('params', param)));

    const queryParams = allParameters.length > 0 ? '[' + allParameters.join(', ') + ']' : '';

    if (client == 'sqlite') {
        writer.writeLine(`import type { Database } from 'better-sqlite3';`);
    }
    if (client == 'libsql') {
        writer.writeLine(`import type { Client, Transaction } from '@libsql/client';`);
    }
    if (tsDescriptor.dynamicQuery2 != null) {
        writer.writeLine(`import { EOL } from 'os';`);

        writer.blankLine();

        writer.write(`export type ${dynamicParamsTypeName} = `).block(() => {
            writer.writeLine(`select?: ${selectColumnsTypeName};`);
            if (paramsTypes.length > 0) {
                writer.writeLine(`params?: ${paramsTypeName};`);
            }
            writer.writeLine(`where?: ${whereTypeName}[];`);
            if (orderByField) {
                writer.writeLine(`${orderByField};`);
            }
        })
        writer.blankLine();
        writeTypeBlock(writer, paramsTypes, paramsTypeName, false, tsDescriptor.dynamicQuery2 ? undefined : orderByField);
        const resultTypes = tsDescriptor.dynamicQuery2 == null ? tsDescriptor.columns : mapToDynamicResultColumns(tsDescriptor.columns);
        writeTypeBlock(writer, resultTypes, resultTypeName, false);
        const selectFields = mapToDynamicSelectColumns(tsDescriptor.columns);
        writeTypeBlock(writer, selectFields, selectColumnsTypeName, false);
        writer.write(`const selectFragments = `).inlineBlock(() => {
            tsDescriptor.dynamicQuery2?.select.forEach((fragment, index) => {
                const field = tsDescriptor.columns[index].name;
                writer.writeLine(`${field}: \`${fragment.fragmentWitoutAlias}\`,`);
            });
        })
        writer.write(' as const;');
        writer.blankLine();
        writer.writeLine(`const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;`);
        writer.writeLine(`type NumericOperator = typeof NumericOperatorList[number];`);
        if (hasStringColumn(tsDescriptor.columns)) {
            writer.writeLine(`type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';`);
        }
        writer.writeLine(`type SetOperator = 'IN' | 'NOT IN';`);
        writer.writeLine(`type BetweenOperator = 'BETWEEN';`);
        writer.blankLine();
        writer.write(`export type ${whereTypeName} =`).indent(() => {
            tsDescriptor.columns.forEach(col => {
                writer.writeLine(`| ['${col.name}', ${getOperator(col.tsType)}, ${col.tsType} | null]`);
                writer.writeLine(`| ['${col.name}', SetOperator, ${col.tsType}[]]`);
                writer.writeLine(`| ['${col.name}', BetweenOperator, ${col.tsType} | null, ${col.tsType} | null]`);
            })
        });
        writer.blankLine();
        const asyncModified = client == 'libsql' ? 'async ' : '';
        const returnTypeModifier = client == 'libsql' ? `Promise<${returnType}>` : returnType;
        writer.write(`export ${asyncModified}function ${camelCaseName}(${functionArguments}): ${returnTypeModifier}`).block(() => {
            writer.write('const where = whereConditionsToObject(params?.where);').newLine();
            if (orderByField != null) {
                writer.writeLine(`const orderBy = orderByToObject(params.orderBy);`)
            }
            writer.write('const paramsValues: any = [];').newLine();
            const hasCte = (tsDescriptor.dynamicQuery2?.with.length || 0) > 0;
            if (hasCte) {
                writer.writeLine(`let withClause = '';`);
                tsDescriptor.dynamicQuery2?.with.forEach((withFragment, index) => {
                    const selectConditions = withFragment.dependOnFields.map(fieldIndex => 'params.select.' + tsDescriptor.columns[fieldIndex].name);
                    if (selectConditions.length > 0) {
                        selectConditions.unshift('params?.select == null');
                    }
                    const whereConditions = withFragment.dependOnFields.map(fieldIndex => 'where.' + tsDescriptor.columns[fieldIndex].name + ' != null');
                    const orderByConditions = withFragment.dependOnOrderBy?.map(orderBy => 'orderBy[\'' + orderBy + '\'] != null') || [];
                    const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
                    const paramValues = withFragment.parameters.map(param => 'params?.params?.' + param);
                    writer.write(`if (${allConditions.join(EOL + '\t|| ')})`).block(() => {
                        writer.write(`withClause += EOL + \`${withFragment.fragment}\`;`);
                        paramValues.forEach(paramValues => {
                            writer.writeLine(`paramsValues.push(${paramValues});`);
                        })
                    })
                })
                writer.write(`let sql = 'WITH ' + withClause + EOL + 'SELECT';`).newLine();
            }
            else {
                writer.write(`let sql = 'SELECT';`).newLine();
            }
            tsDescriptor.dynamicQuery2?.select.forEach((select, index) => {
                writer.write(`if (params?.select == null || params.select.${tsDescriptor.columns[index].name})`).block(() => {
                    writer.writeLine(`sql = appendSelect(sql, \`${select.fragment}\`);`)
                    select.parameters.forEach(param => {
                        writer.writeLine(`paramsValues.push(params?.params?.${param} ?? null);`)
                    })
                });
            })

            tsDescriptor.dynamicQuery2?.from.forEach((from, index) => {
                if (index == 0) {
                    writer.writeLine(`sql += EOL + \`${from.fragment}\`;`);
                }
                else {
                    const selectConditions = from.dependOnFields.map(fieldIndex => 'params.select.' + tsDescriptor.columns[fieldIndex].name);
                    if (selectConditions.length > 0) {
                        selectConditions.unshift('params?.select == null');
                    }
                    const whereConditions = from.dependOnFields.map(fieldIndex => 'where.' + tsDescriptor.columns[fieldIndex].name + ' != null');
                    const orderByConditions = from.dependOnOrderBy?.map(orderBy => 'orderBy[\'' + orderBy + '\'] != null') || [];
                    const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
                    const paramValues = from.parameters.map(param => 'params?.params?.' + param);
                    writer.write(`if (${allConditions.join(EOL + '\t|| ')})`).block(() => {
                        writer.write(`sql += EOL + \`${from.fragment}\`;`);
                        paramValues.forEach(paramValues => {
                            writer.writeLine(`paramsValues.push(${paramValues});`);
                        })
                    })
                }
            })
            writer.writeLine(`sql += EOL + \`WHERE 1 = 1\`;`);
            tsDescriptor.dynamicQuery2?.where.forEach(fragment => {
                const paramValues = fragment.parameters.map(param => 'params?.params?.' + param + ' ?? null');
                writer.writeLine(`sql += EOL + \`${fragment.fragment}\`;`);
                paramValues.forEach(paramValues => {
                    writer.writeLine(`paramsValues.push(${paramValues});`);
                })
            })
            writer.write(`params?.where?.forEach(condition => `).inlineBlock(() => {
                writer.writeLine(`const where = whereCondition(condition);`)
                tsDescriptor.dynamicQuery2?.select.forEach((select, index) => {
                    if (select.parameters.length > 0) {
                        writer.write(`if (condition[0] == '${tsDescriptor.columns[index].name}')`).block(() => {
                            select.parameters.forEach(param => {
                                writer.writeLine(`paramsValues.push(params?.params?.${param} ?? null);`);
                            })
                        })
                    }
                });
                writer.write(`if (where?.hasValue)`).block(() => {
                    writer.writeLine(`sql += EOL + 'AND ' + where.sql;`)
                    writer.write(`paramsValues.push(...where.values);`)
                })
            })
            writer.write(');').newLine();
            if (tsDescriptor.orderByColumns) {
                writer.writeLine('sql += EOL + `ORDER BY ${escapeOrderBy(params.orderBy)}`;')
            }
            if (client == 'sqlite') {
                writer.write('return db.prepare(sql)').newLine();
                writer.indent().write('.raw(true)').newLine();
                writer.indent().write(`.all(paramsValues)`).newLine();
                writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data, params?.select))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`);
            }
            if (client == 'libsql') {
                writer.write('return client.execute({ sql, args: paramsValues })').newLine();
                writer.indent().write('.then(res => res.rows)').newLine();
                writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row, params?.select)))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`);
            }

        });
        writer.blankLine();
        writer.write(`function mapArrayTo${resultTypeName}(data: any, select?: ${selectColumnsTypeName})`).block(() => {
            writer.writeLine(`const result = {} as ${resultTypeName};`);
            writer.writeLine(`let rowIndex = -1;`);
            tsDescriptor.columns.forEach((tsField) => {
                writer.write(`if (select == null || select.${tsField.name})`).block(() => {
                    writer.writeLine(`rowIndex++;`);
                    writer.writeLine(`result.${tsField.name} = ${toDriver('data[rowIndex]', tsField)};`);
                })
            })
            writer.write('return result;');
        })
        writer.blankLine();
        writer.write(`function appendSelect(sql: string, selectField: string)`).block(() => {
            writer.write(`if (sql == 'SELECT')`).block(() => {
                writer.writeLine(`return sql + EOL + selectField;`);
            })
            writer.write(`else`).block(() => {
                writer.writeLine(`return sql + ', ' + EOL + selectField;`);
            })
        })
        writer.blankLine();
        writer.write(`function whereConditionsToObject(whereConditions?: ${whereTypeName}[])`).block(() => {
            writer.writeLine(`const obj = {} as any;`);
            writer.write(`whereConditions?.forEach(condition => `).inlineBlock(() => {
                writer.writeLine(`const where = whereCondition(condition);`)
                writer.write(`if (where?.hasValue) `).block(() => {
                    writer.writeLine(`obj[condition[0]] = true;`);
                })
            });
            writer.write(');');
            writer.writeLine(`return obj;`);
        })
        if (orderByField != null) {
            writer.blankLine();
            writer.write(`function orderByToObject(orderBy: ${dynamicParamsTypeName}['orderBy'])`).block(() => {
                writer.writeLine(`const obj = {} as any;`);
                writer.write(`orderBy?.forEach(order => `).inlineBlock(() => {
                    writer.writeLine(`obj[order[0]] = true;`);
                });
                writer.write(');');
                writer.writeLine(`return obj;`);
            })
        }
        writer.blankLine();
        writer.write(`type WhereConditionResult = `).block(() => {
            writer.writeLine('sql: string;');
            writer.writeLine('hasValue: boolean;');
            writer.writeLine('values: any[];');
        })
        writer.blankLine();
        writer.write(`function whereCondition(condition: ${whereTypeName}): WhereConditionResult | undefined `).block(() => {
            writer.blankLine();
            writer.writeLine('const selectFragment = selectFragments[condition[0]];');
            writer.writeLine('const operator = condition[1];');
            writer.blankLine();
            if (hasStringColumn(tsDescriptor.columns)) {
                writer.write(`if (operator == 'LIKE') `).block(() => {
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} LIKE concat(\'%\', ?, \'%\')`,');
                        writer.writeLine('hasValue: condition[2] != null,');
                        writer.writeLine('values: [condition[2]]');
                    });
                });
            }
            writer.write(`if (operator == 'BETWEEN') `).block(() => {
                if (hasDateColumn(tsDescriptor.columns)) {
                    writer.writeLine(`const value1 = isDate(condition[2]) ? condition[2]?.toISOString() : condition[2];`);
                    writer.writeLine(`const value2 = isDate(condition[3]) ? condition[3]?.toISOString() : condition[3];`);
                    writer.writeLine(`const param = isDate(condition[2]) && isDate(condition[3]) ? 'date(?)' : '?';`);
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} BETWEEN ${param} AND ${param}`,');
                        writer.writeLine('hasValue: value1 != null && value2 != null,');
                        writer.writeLine('values: [value1, value2]');
                    });
                }
                else {
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} BETWEEN ? AND ?`,');
                        writer.writeLine('hasValue: condition[2] != null && condition[3] != null,');
                        writer.writeLine('values: [condition[2], condition[3]]');
                    });
                }

            });
            writer.write(`if (operator == 'IN' || operator == 'NOT IN') `).block(() => {
                if (hasDateColumn(tsDescriptor.columns)) {
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} ${operator} (${condition[2]?.map(value => isDate(value) ? \'date(?)\' : \'?\').join(\', \')})`,');
                        writer.writeLine('hasValue: condition[2] != null && condition[2].length > 0,');
                        writer.writeLine('values: condition[2].map(value => isDate(value) ? value.toISOString() : value)');
                    });
                } else {
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} ${operator} (${condition[2]?.map(_ => \'?\').join(\', \')})`,');
                        writer.writeLine('hasValue: condition[2] != null && condition[2].length > 0,');
                        writer.writeLine('values: condition[2]');
                    });
                }
            });
            writer.write(`if (NumericOperatorList.includes(operator)) `).block(() => {
                if (hasDateColumn(tsDescriptor.columns)) {
                    writer.writeLine(`const value = isDate(condition[2]) ? condition[2]?.toISOString() : condition[2];`);
                    writer.writeLine(`const param = isDate(condition[2]) ? 'date(?)' : '?';`);
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} ${operator} ${param}`,');
                        writer.writeLine('hasValue: value != null,');
                        writer.writeLine('values: [value]');
                    });
                }
                else {
                    writer.write(`return `).block(() => {
                        writer.writeLine('sql: `${selectFragment} ${operator} ?`,');
                        writer.writeLine('hasValue: condition[2] != null,');
                        writer.writeLine('values: [condition[2]]');
                    });
                }
            });
        })
        if (hasDateColumn(tsDescriptor.columns)) {
            writer.blankLine();
            writer.write(`function isDate(value: any): value is Date`).block(() => {
                writer.writeLine(`return value instanceof Date;`);
            })
        }
    }
    if (tsDescriptor.dynamicQuery2 == null) {
        if (uniqueUpdateParams.length > 0) {
            writer.blankLine();
            writer.write(`export type ${dataTypeName} =`).block(() => {
                uniqueUpdateParams.forEach(field => {
                    const optionalOp = field.optional ? '?' : '';
                    const orNull = field.notNull ? '' : ' | null';
                    writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
                });
            });
        }

        if (uniqueParams.length > 0 || generateOrderBy) {
            writer.blankLine();
            writer.write(`export type ${paramsTypeName} =`).block(() => {
                uniqueParams.forEach((field) => {
                    const optionalOp = field.optional ? '?' : '';
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
    }

    if (isCrud) {
        const crudFunction = client == 'libsql'
            ? `async function ${camelCaseName}(${functionArguments}): Promise<${returnType}>`
            : `function ${camelCaseName}(${functionArguments}): ${returnType}`
        writer.write(`export ${crudFunction}`).block(() => {
            const idColumn = tsDescriptor.parameters[0].name;
            writeExecuteCrudBlock(client, queryType, tableName, tsDescriptor.columns, idColumn, queryParams, paramsTypeName, dataTypeName, resultTypeName, writer);
        });
    }

    if (tsDescriptor.dynamicQuery2 == null && !isCrud && (queryType == 'Select' || (queryType == 'Insert' && tsDescriptor.returning))) {
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

    if ((queryType == 'Select' || tsDescriptor.returning) && tsDescriptor.dynamicQuery2 == null) {
        writer.blankLine();
        writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
            writer.write(`const result: ${resultTypeName} = `).block(() => {
                tsDescriptor.columns.forEach((col, index) => {
                    const separator = index < tsDescriptor.columns.length - 1 ? ',' : ''
                    writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
                })
            })
            writer.writeLine('return result;');
        });
    }
    else if (client == 'libsql' && !tsDescriptor.returning && tsDescriptor.dynamicQuery2 == null) {
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
        const orderByType = tsDescriptor.dynamicQuery2 == null ? paramsTypeName : dynamicParamsTypeName;
        if (orderByField != null) {
            writer.blankLine();
            writer.write(`const orderByFragments = `).inlineBlock(() => {
                tsDescriptor.orderByColumns?.forEach((col) => {
                    writer.writeLine(`'${col}': \`${col}\`,`);
                });
            })
            writer.write(' as const;');
        }
        writer.blankLine();
        writer.writeLine(`export type ${orderByTypeName} = keyof typeof orderByFragments;`);
        writer.blankLine();
        writer.write(`function escapeOrderBy(orderBy: ${orderByType}['orderBy']): string`).block(() => {
            writer.writeLine(`return orderBy.map(order => \`\${orderByFragments[order[0]]} \${order[1] == 'desc' ? 'desc' : 'asc'}\`).join(', ');`)
        });
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

function toDriver(variableData: string, param: TsFieldDescriptor) {
    if (param.tsType == 'Date') {
        if (param.notNull) {
            return `new Date(${variableData})`;
        }
        else {
            return `${variableData} != null ? new Date(${variableData}) : ${variableData}`
        }
    }
    return variableData;
}

function fromDriver(variableName: string, param: TsFieldDescriptor): string {
    if (param.tsType == 'Date') {
        return `${variableName}.${param.name}?.toISOString()`;
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