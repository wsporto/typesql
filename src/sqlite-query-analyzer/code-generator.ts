import { type Either, isLeft, left, right } from 'fp-ts/lib/Either';
import type { ColumnInfo, ColumnSchema } from '../mysql-query-analyzer/types';
import { parseSql } from './parser';
import {
	type TsDescriptor,
	capitalize,
	convertToCamelCaseName,
	generateRelationType,
	getOperator,
	hasDateColumn,
	hasStringColumn,
	removeDuplicatedParameters2,
	renameInvalidNames,
	replaceOrderByParam,
	writeTypeBlock
} from '../code-generator';
import CodeBlockWriter from 'code-block-writer';
import type {
	BunDialect,
	LibSqlClient,
	ParameterDef,
	QueryType,
	SQLiteClient,
	SQLiteDialect,
	SchemaDef,
	TsFieldDescriptor,
	TsParameterDescriptor,
	TypeSqlError
} from '../types';
import type { SQLiteType } from './types';
import type { Field2 } from './sqlite-describe-nested-query';
import { type RelationType2, type TsField2, mapToTsRelation2 } from '../ts-nested-descriptor';
import { preprocessSql } from '../describe-query';
import { explainSql } from './query-executor';
import { mapToDynamicParams, mapToDynamicResultColumns, mapToDynamicSelectColumns } from '../ts-dynamic-query-descriptor';
import { EOL } from 'node:os';
import type { TsType } from '../mysql-mapping';

type ExecFunctionParams = {
	functionName: string;
	returnType: string;
	resultTypeName: string;
	paramsTypeName: string;
	dataTypeName: string;
	sql: string;
	multipleRowsResult: boolean;
	parameters: string[];
	columns: TsFieldDescriptor[];
	queryType: 'Select' | 'Insert' | 'Update' | 'Delete';
	returning: boolean;
	orderBy: boolean;
}

type MapFunctionParams = {
	resultTypeName: string;
	columns: TsFieldDescriptor[];
}

export function validateAndGenerateCode(
	client: SQLiteDialect | LibSqlClient | BunDialect,
	sql: string,
	queryName: string,
	sqliteDbSchema: ColumnSchema[],
	isCrud = false
): Either<TypeSqlError, string> {
	const { sql: processedSql } = preprocessSql(sql);
	const explainSqlResult = explainSql(client.client, processedSql);
	if (isLeft(explainSqlResult)) {
		return left({
			name: 'Invalid sql',
			description: explainSqlResult.left.description
		});
	}
	const code = generateTsCode(sql, queryName, sqliteDbSchema, client.type, isCrud);
	return code;
}

function mapToColumnInfo(col: ColumnSchema, checkOptional: boolean) {
	const defaultValue = col.columnKey === 'PRI' && col.column_type === 'INTEGER' ? 'AUTOINCREMENT' : col.defaultValue;
	const columnInfo: ColumnInfo = {
		columnName: col.column,
		notNull: col.notNull,
		type: col.column_type,
		table: col.table,
		optional: checkOptional && (!col.notNull || defaultValue != null)
	};
	return columnInfo;
}

export function generateCrud(client: SQLiteClient, queryType: QueryType, tableName: string, dbSchema: ColumnSchema[]) {
	const columns = dbSchema.filter((col) => col.table === tableName);

	const columnInfo = columns.map((col) => mapToColumnInfo(col, queryType === 'Insert' || queryType === 'Update'));
	const keys = columns.filter((col) => col.columnKey === 'PRI');
	if (keys.length === 0) {
		keys.push(...columns.filter((col) => col.columnKey === 'UNI'));
	}
	const keyColumnInfo = keys.map((key) => mapToColumnInfo(key, false)).map((col) => mapColumnToTsParameterDescriptor(col, client));

	const resultColumns = mapColumns(client, queryType, columnInfo, false);
	const params = columnInfo.map((col) => mapColumnToTsParameterDescriptor(col, client));

	const tsDescriptor: TsDescriptor = {
		sql: '',
		queryType,
		multipleRowsResult: false,
		columns: resultColumns,
		parameterNames: [],
		parameters: queryType === 'Insert' ? params : keyColumnInfo,
		data: queryType === 'Update' ? params.filter((param) => param.name !== keyColumnInfo[0]?.name) : []
	};

	const queryName = getQueryName(queryType, tableName);

	const code = generateCodeFromTsDescriptor(client, queryName, tsDescriptor, true, tableName);
	return code;
}

function getQueryName(queryType: QueryType, tableName: string) {
	const camelCaseName = convertToCamelCaseName(tableName);
	const captitalizedName = capitalize(camelCaseName);
	switch (queryType) {
		case 'Select':
			return `selectFrom${captitalizedName}`;
		case 'Insert':
			return `insertInto${captitalizedName}`;
		case 'Update':
			return `update${captitalizedName}`;
		case 'Delete':
			return `deleteFrom${captitalizedName}`;
	}
}

export function generateTsCode(
	sql: string,
	queryName: string,
	sqliteDbSchema: ColumnSchema[],
	client: SQLiteClient,
	isCrud = false
): Either<TypeSqlError, string> {
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
		parameters: queryInfo.parameters.map((param) => mapParameterToTsFieldDescriptor(param, client)),
		data: queryInfo.data?.map((param) => mapParameterToTsFieldDescriptor(param, client)),
		orderByColumns: queryInfo.orderByColumns
	};
	if (queryInfo.nestedInfo) {
		const nestedDescriptor2 = queryInfo.nestedInfo.map((relation) => {
			const tsRelation: RelationType2 = {
				groupIndex: relation.groupIndex,
				name: relation.name,
				fields: relation.fields.map((field) => mapFieldToTsField(queryInfo.columns, field, client)),
				relations: relation.relations.map((relation) => mapToTsRelation2(relation))
			};
			return tsRelation;
		});
		tsDescriptor.nestedDescriptor2 = nestedDescriptor2;
	}
	tsDescriptor.dynamicQuery2 = queryInfo.dynamicSqlQuery2;
	return tsDescriptor;
}

function mapColumns(client: SQLiteClient, queryType: SchemaDef['queryType'], columns: ColumnInfo[], returning = false) {

	const resultColumns = getInsertUpdateResult(client);
	if (queryType === 'Insert' && !returning) {
		return resultColumns;
	}
	if (queryType === 'Update' || queryType === 'Delete') {
		return [resultColumns[0]];
	}

	const escapedColumnsNames = renameInvalidNames(columns.map((col) => col.columnName));
	return columns.map((col, index) => mapColumnToTsFieldDescriptor({ ...col, columnName: escapedColumnsNames[index] }, client));
}

function getInsertUpdateResult(client: SQLiteClient) {
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
	];

	const d1InsertColumns: TsFieldDescriptor[] = [
		{
			name: 'changes',
			tsType: 'number',
			notNull: true
		},
		{
			name: 'last_row_id',
			tsType: 'number',
			notNull: true
		}
	];

	switch (client) {
		case 'better-sqlite3':
		case 'bun:sqlite':
			return sqliteInsertColumns;
		case 'libsql':
			return libSqlInsertColumns;
		case 'd1':
			return d1InsertColumns
	}
}

function mapFieldToTsField(columns: ColumnInfo[], field: Field2, client: SQLiteClient): TsField2 {
	const tsField: TsField2 = {
		name: field.name,
		index: field.index,
		tsType: mapColumnType(columns[field.index].type as SQLiteType, client),
		notNull: false
	};
	return tsField;
}

function mapParameterToTsFieldDescriptor(col: ParameterDef, client: SQLiteClient): TsParameterDescriptor {
	const tsDesc: TsParameterDescriptor = {
		name: col.name,
		tsType: mapColumnType(col.columnType as SQLiteType, client),
		notNull: col.notNull ? col.notNull : false,
		toDriver: parameterToDriver(col)
	};
	return tsDesc;
}

function parameterToDriver(param: ParameterDef): string {
	if (param.columnType === 'DATE') {
		return `${param.name}?.toISOString().split('T')[0]`
	}
	if (param.columnType === 'DATE_TIME') {
		return `${param.name}?.toISOString().split('.')[0].replace('T', ' ')`
	}
	return param.name;
}

function columnToDriver(col: ColumnInfo): string {
	if (col.type === 'DATE') {
		return `${col.columnName}?.toISOString().split('T')[0]`
	}
	if (col.type === 'DATE_TIME') {
		return `${col.columnName}?.toISOString().split('.')[0].replace('T', ' ')`
	}
	return col.columnName;
}

function mapColumnToTsFieldDescriptor(col: ColumnInfo, client: SQLiteClient) {
	const tsDesc: TsFieldDescriptor = {
		name: col.columnName,
		tsType: mapColumnType(col.type as SQLiteType, client),
		notNull: col.notNull,
		optional: col.optional
	};
	return tsDesc;
}

function mapColumnToTsParameterDescriptor(col: ColumnInfo, client: SQLiteClient): TsParameterDescriptor {
	const tsDesc: TsParameterDescriptor = {
		name: col.columnName,
		tsType: mapColumnType(col.type as SQLiteType, client),
		notNull: col.notNull,
		optional: col.optional,
		toDriver: columnToDriver(col)
	};
	return tsDesc;
}

function mapColumnType(sqliteType: SQLiteType, client: SQLiteClient): TsType {
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
		case 'DATE_TIME':
			return 'Date';
		case 'BLOB':
			return client === 'better-sqlite3' ? 'Uint8Array' : 'ArrayBuffer';
		case 'BOOLEAN':
			return 'boolean';
	}
	if (sqliteType.startsWith('ENUM')) {
		const enumValues = sqliteType.substring(sqliteType.indexOf('(') + 1, sqliteType.indexOf(')'));
		return enumValues.split(',').join(' | ') as TsType;
	}
	return 'any';
}

function generateCodeFromTsDescriptor(client: SQLiteClient, queryName: string, tsDescriptor: TsDescriptor, isCrud = false, tableName = '') {
	const writer = new CodeBlockWriter({
		useTabs: true
	});

	const camelCaseName = convertToCamelCaseName(queryName);
	const capitalizedName = capitalize(camelCaseName);

	const queryType = tsDescriptor.queryType;
	const sql = tsDescriptor.sql;
	const dataTypeName = `${capitalizedName}Data`;
	const paramsTypeName = `${capitalizedName}Params`;
	const resultTypeName = `${capitalizedName}Result`;
	const dynamicParamsTypeName = `${capitalizedName}DynamicParams`;
	const selectColumnsTypeName = `${capitalizedName}Select`;
	const whereTypeName = `${capitalizedName}Where`;
	const orderByTypeName = `${capitalizedName}OrderBy`;
	const generateOrderBy = tsDescriptor.orderByColumns != null && tsDescriptor.orderByColumns.length > 0;
	const uniqueParams = removeDuplicatedParameters2(tsDescriptor.parameters);
	const uniqueUpdateParams = removeDuplicatedParameters2(tsDescriptor.data || []);

	const orderByField = generateOrderBy ? `orderBy: [${orderByTypeName}, 'asc' | 'desc'][]` : undefined;
	const paramsTypes = removeDuplicatedParameters2(
		tsDescriptor.dynamicQuery2 == null ? tsDescriptor.parameters : mapToDynamicParams(tsDescriptor.parameters)
	);

	let functionArguments = client === 'better-sqlite3' || client === 'bun:sqlite'
		? 'db: Database'
		: client === 'd1'
			? 'db: D1Database'
			: 'client: Client | Transaction';
	functionArguments += queryType === 'Update' ? `, data: ${dataTypeName}` : '';
	if (tsDescriptor.dynamicQuery2 == null) {
		functionArguments += tsDescriptor.parameters.length > 0 || generateOrderBy ? `, params: ${paramsTypeName}` : '';
	} else {
		functionArguments += `, ${orderByField ? 'params' : 'params?'}: ${dynamicParamsTypeName}`;
	}

	const orNull = queryType === 'Select' ? ' | null' : '';
	const returnType = tsDescriptor.multipleRowsResult ? `${resultTypeName}[]` : `${resultTypeName}${orNull}`;

	const allParameters = (tsDescriptor.data?.map((param) => fromDriver('data', param)) || []).concat(
		tsDescriptor.parameters.map((param) => fromDriver('params', param))
	);

	const queryParamsWithoutBrackets = allParameters.length > 0 ? `${allParameters.join(', ')}` : '';
	const queryParams = queryParamsWithoutBrackets !== '' ? `[${queryParamsWithoutBrackets}]` : '';
	const isDynamicQuery = tsDescriptor.dynamicQuery2 != null;

	writeImports(writer, client, isDynamicQuery);
	if (tsDescriptor.dynamicQuery2 != null) {
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
		});
		writer.blankLine();
		writeTypeBlock(writer, paramsTypes, paramsTypeName, false, tsDescriptor.dynamicQuery2 ? undefined : orderByField);
		const resultTypes = tsDescriptor.dynamicQuery2 == null ? tsDescriptor.columns : mapToDynamicResultColumns(tsDescriptor.columns);
		writeTypeBlock(writer, resultTypes, resultTypeName, false);
		const selectFields = mapToDynamicSelectColumns(tsDescriptor.columns);
		writeTypeBlock(writer, selectFields, selectColumnsTypeName, false);
		writer.write('const selectFragments = ').inlineBlock(() => {
			tsDescriptor.dynamicQuery2?.select.forEach((fragment, index) => {
				const field = tsDescriptor.columns[index].name;
				writer.writeLine(`${field}: \`${fragment.fragmentWitoutAlias}\`,`);
			});
		});
		writer.write(' as const;');
		writer.blankLine();
		writer.writeLine(`const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;`);
		writer.writeLine('type NumericOperator = typeof NumericOperatorList[number];');
		if (hasStringColumn(tsDescriptor.columns)) {
			writer.writeLine(`type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';`);
		}
		writer.writeLine(`type SetOperator = 'IN' | 'NOT IN';`);
		writer.writeLine(`type BetweenOperator = 'BETWEEN';`);
		writer.blankLine();
		writer.write(`export type ${whereTypeName} =`).indent(() => {
			tsDescriptor.columns.forEach((col) => {
				writer.writeLine(`| ['${col.name}', ${getOperator(col.tsType)}, ${col.tsType} | null]`);
				writer.writeLine(`| ['${col.name}', SetOperator, ${col.tsType}[]]`);
				writer.writeLine(`| ['${col.name}', BetweenOperator, ${col.tsType} | null, ${col.tsType} | null]`);
			});
		});
		writer.blankLine();
		const asyncModified = client === 'libsql' || client === 'd1' ? 'async ' : '';
		const returnTypeModifier = client === 'libsql' || client === 'd1' ? `Promise<${returnType}>` : returnType;
		writer.write(`export ${asyncModified}function ${camelCaseName}(${functionArguments}): ${returnTypeModifier}`).block(() => {
			writer.write('const where = whereConditionsToObject(params?.where);').newLine();
			if (orderByField != null) {
				writer.writeLine('const orderBy = orderByToObject(params.orderBy);');
			}
			writer.write('const paramsValues: any = [];').newLine();
			const hasCte = (tsDescriptor.dynamicQuery2?.with.length || 0) > 0;
			if (hasCte) {
				writer.writeLine('const withClause = [];');
				tsDescriptor.dynamicQuery2?.with.forEach((withFragment, index, array) => {
					const selectConditions = withFragment.dependOnFields.map(
						(fieldIndex) => `params.select.${tsDescriptor.columns[fieldIndex].name}`
					);
					if (selectConditions.length > 0) {
						selectConditions.unshift('params?.select == null');
					}
					const whereConditions = withFragment.dependOnFields.map((fieldIndex) => `where.${tsDescriptor.columns[fieldIndex].name} != null`);
					const orderByConditions = withFragment.dependOnOrderBy?.map((orderBy) => `orderBy['${orderBy}'] != null`) || [];
					const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
					const paramValues = withFragment.parameters.map((paramIndex) => {
						const param = tsDescriptor.parameters[paramIndex];
						return fromDriver('params?.params?', param);
					});
					if (allConditions.length > 0) {
						writer.write(`if (${allConditions.join(`${EOL}\t|| `)})`).block(() => {
							writer.write(`withClause.push(\`${withFragment.fragment}\`);`);
							paramValues.forEach((paramValues) => {
								writer.writeLine(`paramsValues.push(${paramValues});`);
							});
						});
					}
					else {
						writer.write(`withClause.push(\`${withFragment.fragment}\`);`);
						paramValues.forEach((paramValues) => {
							writer.writeLine(`paramsValues.push(${paramValues});`);
						});
					}

				});
				writer.write(`let sql = 'WITH ' + withClause.join(',' + EOL) + EOL + 'SELECT';`).newLine();
			} else {
				writer.write(`let sql = 'SELECT';`).newLine();
			}
			tsDescriptor.dynamicQuery2?.select.forEach((select, index) => {
				writer.write(`if (params?.select == null || params.select.${tsDescriptor.columns[index].name})`).block(() => {
					writer.writeLine(`sql = appendSelect(sql, \`${select.fragment}\`);`);
					select.parameters.forEach((param) => {
						writer.writeLine(`paramsValues.push(params?.params?.${param} ?? null);`);
					});
				});
			});

			tsDescriptor.dynamicQuery2?.from.forEach((from, index) => {
				if (index === 0) {
					writer.writeLine(`sql += EOL + \`${from.fragment}\`;`);
				} else {
					const selectConditions = from.dependOnFields.map((fieldIndex) => `params.select.${tsDescriptor.columns[fieldIndex].name}`);
					if (selectConditions.length > 0) {
						selectConditions.unshift('params?.select == null');
					}
					const whereConditions = from.dependOnFields.map((fieldIndex) => `where.${tsDescriptor.columns[fieldIndex].name} != null`);
					const orderByConditions = from.dependOnOrderBy?.map((orderBy) => `orderBy['${orderBy}'] != null`) || [];
					const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
					const paramValues = from.parameters.map((paramIndex) => {
						const param = tsDescriptor.parameters[paramIndex];
						return fromDriver('params?.params?', param);
					});
					if (allConditions.length > 0) {
						writer.write(`if (${allConditions.join(`${EOL}\t|| `)})`).block(() => {
							writer.write(`sql += EOL + \`${from.fragment}\`;`);
							paramValues.forEach((paramValues) => {
								writer.writeLine(`paramsValues.push(${paramValues});`);
							});
						});
					}
					else {
						writer.write(`sql += EOL + \`${from.fragment}\`;`);
						paramValues.forEach((paramValues) => {
							writer.writeLine(`paramsValues.push(${paramValues});`);
						});
					}

				}
			});
			writer.writeLine('sql += EOL + `WHERE 1 = 1`;');
			tsDescriptor.dynamicQuery2?.where.forEach((fragment) => {
				const paramValues = fragment.parameters.map((paramIndex) => {
					const param = tsDescriptor.parameters[paramIndex];
					return `${fromDriver('params?.params?', param)} ?? null`
				});
				writer.writeLine(`sql += EOL + \`${fragment.fragment}\`;`);
				paramValues.forEach((paramValues) => {
					writer.writeLine(`paramsValues.push(${paramValues});`);
				});
			});
			writer.write('params?.where?.forEach(condition => ').inlineBlock(() => {
				writer.writeLine('const where = whereCondition(condition);');
				tsDescriptor.dynamicQuery2?.select.forEach((select, index) => {
					if (select.parameters.length > 0) {
						writer.write(`if (condition[0] == '${tsDescriptor.columns[index].name}')`).block(() => {
							select.parameters.forEach((param) => {
								writer.writeLine(`paramsValues.push(params?.params?.${param} ?? null);`);
							});
						});
					}
				});
				writer.write('if (where?.hasValue)').block(() => {
					writer.writeLine(`sql += EOL + 'AND ' + where.sql;`);
					writer.write('paramsValues.push(...where.values);');
				});
			});
			writer.write(');').newLine();
			if (tsDescriptor.orderByColumns) {
				writer.writeLine('sql += EOL + `ORDER BY ${escapeOrderBy(params.orderBy)}`;');
			}
			const limitOffset = tsDescriptor.dynamicQuery2?.limitOffset;
			if (limitOffset) {
				writer.writeLine(`sql += EOL + \`${limitOffset.fragment}\`;`);
				limitOffset.parameters.forEach((param) => {
					writer.writeLine(`paramsValues.push(params?.params?.${param} ?? null);`);
				});
			}
			if (client === 'better-sqlite3') {
				writer.write('return db.prepare(sql)').newLine();
				writer.indent().write('.raw(true)').newLine();
				writer.indent().write('.all(paramsValues)').newLine();
				writer
					.indent()
					.write(`.map(data => mapArrayTo${resultTypeName}(data, params?.select))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`);
			}
			if (client === 'bun:sqlite') {
				writer.write('return db.prepare(sql)').newLine();
				writer.indent().write('.values(paramsValues)').newLine();
				writer
					.indent()
					.write(`.map(data => mapArrayTo${resultTypeName}(data, params?.select))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`);
			}
			if (client === 'd1') {
				writer.write('return db.prepare(sql)').newLine();
				writer.indent().write('.bind(...paramsValues)').newLine();
				writer.indent().write('.raw()').newLine();
				writer
					.indent()
					.write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row, params?.select)))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`);
			}
			if (client === 'libsql') {
				writer.write('return client.execute({ sql, args: paramsValues })').newLine();
				writer.indent().write('.then(res => res.rows)').newLine();
				writer
					.indent()
					.write(
						`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row, params?.select)))${tsDescriptor.multipleRowsResult ? '' : '[0]'};`
					);
			}
		});
		writer.blankLine();
		writer.write(`function mapArrayTo${resultTypeName}(data: any, select?: ${selectColumnsTypeName})`).block(() => {
			writer.writeLine(`const result = {} as ${resultTypeName};`);
			writer.writeLine('let rowIndex = -1;');
			tsDescriptor.columns.forEach((tsField) => {
				writer.write(`if (select == null || select.${tsField.name})`).block(() => {
					writer.writeLine('rowIndex++;');
					writer.writeLine(`result.${tsField.name} = ${toDriver('data[rowIndex]', tsField)};`);
				});
			});
			writer.write('return result;');
		});
		writer.blankLine();
		writer.write('function appendSelect(sql: string, selectField: string)').block(() => {
			writer.write(`if (sql.toUpperCase().endsWith('SELECT'))`).block(() => {
				writer.writeLine('return sql + EOL + selectField;');
			});
			writer.write('else').block(() => {
				writer.writeLine(`return sql + ', ' + EOL + selectField;`);
			});
		});
		writer.blankLine();
		writer.write(`function whereConditionsToObject(whereConditions?: ${whereTypeName}[])`).block(() => {
			writer.writeLine('const obj = {} as any;');
			writer.write('whereConditions?.forEach(condition => ').inlineBlock(() => {
				writer.writeLine('const where = whereCondition(condition);');
				writer.write('if (where?.hasValue) ').block(() => {
					writer.writeLine('obj[condition[0]] = true;');
				});
			});
			writer.write(');');
			writer.writeLine('return obj;');
		});
		if (orderByField != null) {
			writer.blankLine();
			writer.write(`function orderByToObject(orderBy: ${dynamicParamsTypeName}['orderBy'])`).block(() => {
				writer.writeLine('const obj = {} as any;');
				writer.write('orderBy?.forEach(order => ').inlineBlock(() => {
					writer.writeLine('obj[order[0]] = true;');
				});
				writer.write(');');
				writer.writeLine('return obj;');
			});
		}
		writer.blankLine();
		writer.write('type WhereConditionResult = ').block(() => {
			writer.writeLine('sql: string;');
			writer.writeLine('hasValue: boolean;');
			writer.writeLine('values: any[];');
		});
		writer.blankLine();
		writer.write(`function whereCondition(condition: ${whereTypeName}): WhereConditionResult | undefined `).block(() => {
			writer.blankLine();
			writer.writeLine('const selectFragment = selectFragments[condition[0]];');
			writer.writeLine('const operator = condition[1];');
			writer.blankLine();
			if (hasStringColumn(tsDescriptor.columns)) {
				writer.write(`if (operator == 'LIKE') `).block(() => {
					writer.write('return ').block(() => {
						writer.writeLine("sql: `${selectFragment} LIKE concat('%', ?, '%')`,");
						writer.writeLine('hasValue: condition[2] != null,');
						writer.writeLine('values: [condition[2]]');
					});
				});
			}
			writer.write(`if (operator == 'BETWEEN') `).block(() => {
				if (hasDateColumn(tsDescriptor.columns)) {
					writer.writeLine('const value1 = isDate(condition[2]) ? condition[2]?.toISOString() : condition[2];');
					writer.writeLine('const value2 = isDate(condition[3]) ? condition[3]?.toISOString() : condition[3];');
					writer.writeLine(`const param = isDate(condition[2]) && isDate(condition[3]) ? 'date(?)' : '?';`);
					writer.write('return ').block(() => {
						writer.writeLine('sql: `${selectFragment} BETWEEN ${param} AND ${param}`,');
						writer.writeLine('hasValue: value1 != null && value2 != null,');
						writer.writeLine('values: [value1, value2]');
					});
				} else {
					writer.write('return ').block(() => {
						writer.writeLine('sql: `${selectFragment} BETWEEN ? AND ?`,');
						writer.writeLine('hasValue: condition[2] != null && condition[3] != null,');
						writer.writeLine('values: [condition[2], condition[3]]');
					});
				}
			});
			writer.write(`if (operator == 'IN' || operator == 'NOT IN') `).block(() => {
				if (hasDateColumn(tsDescriptor.columns)) {
					writer.write('return ').block(() => {
						writer.writeLine(
							"sql: `${selectFragment} ${operator} (${condition[2]?.map(value => isDate(value) ? 'date(?)' : '?').join(', ')})`,"
						);
						writer.writeLine('hasValue: condition[2] != null && condition[2].length > 0,');
						writer.writeLine('values: condition[2].map(value => isDate(value) ? value.toISOString() : value)');
					});
				} else {
					writer.write('return ').block(() => {
						writer.writeLine("sql: `${selectFragment} ${operator} (${condition[2]?.map(_ => '?').join(', ')})`,");
						writer.writeLine('hasValue: condition[2] != null && condition[2].length > 0,');
						writer.writeLine('values: condition[2]');
					});
				}
			});
			writer.write('if (NumericOperatorList.includes(operator)) ').block(() => {
				if (hasDateColumn(tsDescriptor.columns)) {
					writer.writeLine('const value = isDate(condition[2]) ? condition[2]?.toISOString() : condition[2];');
					writer.writeLine(`const param = isDate(condition[2]) ? 'date(?)' : '?';`);
					writer.write('return ').block(() => {
						writer.writeLine('sql: `${selectFragment} ${operator} ${param}`,');
						writer.writeLine('hasValue: value != null,');
						writer.writeLine('values: [value]');
					});
				} else {
					writer.write('return ').block(() => {
						writer.writeLine('sql: `${selectFragment} ${operator} ?`,');
						writer.writeLine('hasValue: condition[2] != null,');
						writer.writeLine('values: [condition[2]]');
					});
				}
			});
		});
		if (hasDateColumn(tsDescriptor.columns)) {
			writer.blankLine();
			writer.write('function isDate(value: any): value is Date').block(() => {
				writer.writeLine('return value instanceof Date;');
			});
		}
	}
	if (tsDescriptor.dynamicQuery2 == null) {
		if (uniqueUpdateParams.length > 0) {
			writer.blankLine();
			writer.write(`export type ${dataTypeName} =`).block(() => {
				uniqueUpdateParams.forEach((field) => {
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
					writer.writeLine(`orderBy: [${orderByTypeName}, 'asc' | 'desc'][];`);
				}
			});
		}

		writer.blankLine();
		writer.write(`export type ${resultTypeName} =`).block(() => {
			tsDescriptor.columns.forEach((field) => {
				const optionalOp = field.notNull ? '' : '?';
				writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
			});
		});
		writer.blankLine();
	}

	if (isCrud) {
		const crudFunction =
			client === 'libsql' || client === 'd1'
				? `async function ${camelCaseName}(${functionArguments}): Promise<${returnType}>`
				: `function ${camelCaseName}(${functionArguments}): ${returnType}`;
		writer.write(`export ${crudFunction}`).block(() => {
			const idColumn = tsDescriptor.parameters[0].name;
			writeExecuteCrudBlock(
				client,
				queryType,
				tableName,
				tsDescriptor.columns,
				idColumn,
				client === 'bun:sqlite' || client === 'd1' ? queryParamsWithoutBrackets : queryParams,
				paramsTypeName,
				dataTypeName,
				resultTypeName,
				writer
			);
		});
		if (client !== 'd1' && (queryType === 'Select' || tsDescriptor.returning)) {
			writer.blankLine();
			writeMapFunction(writer, { resultTypeName, columns: tsDescriptor.columns });
		}
		if (client === 'libsql' && queryType !== 'Select' && !tsDescriptor.returning) {
			writer.blankLine();
			writeMapFunctionByName(writer, { resultTypeName, columns: tsDescriptor.columns });
		}
	}

	const executeFunctionParams: ExecFunctionParams = {
		functionName: camelCaseName,
		returnType,
		resultTypeName,
		dataTypeName,
		sql: replaceOrderByParam(sql),
		multipleRowsResult: tsDescriptor.multipleRowsResult,
		parameters: allParameters,
		columns: tsDescriptor.columns,
		queryType,
		paramsTypeName,
		returning: tsDescriptor.returning || false,
		orderBy: (tsDescriptor.orderByColumns?.length || 0) > 0
	}

	if (tsDescriptor.dynamicQuery2 == null && !isCrud) {
		writeExecFunction(writer, client, executeFunctionParams);
	}
	if (tsDescriptor.orderByColumns) {
		const orderByType = tsDescriptor.dynamicQuery2 == null ? paramsTypeName : dynamicParamsTypeName;
		if (orderByField != null) {
			writer.blankLine();
			writer.write('const orderByFragments = ').inlineBlock(() => {
				tsDescriptor.orderByColumns?.forEach((col) => {
					writer.writeLine(`'${col}': \`${col}\`,`);
				});
			});
			writer.write(' as const;');
		}
		writer.blankLine();
		writer.writeLine(`export type ${orderByTypeName} = keyof typeof orderByFragments;`);
		writer.blankLine();
		writer.write(`function escapeOrderBy(orderBy: ${orderByType}['orderBy']): string`).block(() => {
			writer.writeLine(
				`return orderBy.map(order => \`\${orderByFragments[order[0]]} \${order[1] == 'desc' ? 'desc' : 'asc'}\`).join(', ');`
			);
		});
	}

	if (tsDescriptor.nestedDescriptor2) {
		const relations = tsDescriptor.nestedDescriptor2;
		relations.forEach((relation) => {
			const relationType = generateRelationType(capitalizedName, relation.name);
			writer.blankLine();
			writer.write(`export type ${relationType} = `).block(() => {
				const uniqueNameFields = renameInvalidNames(relation.fields.map((f) => f.name));
				relation.fields.forEach((field, index) => {
					writer.writeLine(`${uniqueNameFields[index]}: ${field.tsType};`);
				});
				relation.relations.forEach((field) => {
					const nestedRelationType = generateRelationType(capitalizedName, field.tsType);
					const nullableOperator = field.notNull ? '' : '?';
					writer.writeLine(`${field.name}${nullableOperator}: ${nestedRelationType};`);
				});
			});
		});
		writer.blankLine();

		relations.forEach((relation, index) => {
			const relationType = generateRelationType(capitalizedName, relation.name);
			if (index === 0) {
				if (client === 'better-sqlite3' || client === 'bun:sqlite') {
					writer.write(`export function ${camelCaseName}Nested(${functionArguments}): ${relationType}[]`).block(() => {
						const params = tsDescriptor.parameters.length > 0 ? ', params' : '';
						writer.writeLine(`const selectResult = ${camelCaseName}(db${params});`);
						writer.write('if (selectResult.length == 0)').block(() => {
							writer.writeLine('return [];');
						});
						writer.writeLine(`return collect${relationType}(selectResult);`);
					});
				} else if (client === 'libsql' || client === 'd1') {
					writer.write(`export async function ${camelCaseName}Nested(${functionArguments}): Promise<${relationType}[]>`).block(() => {
						const params = tsDescriptor.parameters.length > 0 ? ', params' : '';
						const functionParam = client === 'libsql' ? `client${params}` : `db${params}`;
						writer.writeLine(`const selectResult = await ${camelCaseName}(${functionParam});`);
						writer.write('if (selectResult.length == 0)').block(() => {
							writer.writeLine('return [];');
						});
						writer.writeLine(`return collect${relationType}(selectResult);`);
					});
				}
			}
			writeCollectFunction(writer, relation, tsDescriptor.columns, capitalizedName, resultTypeName);
		});

		writer.blankLine();
		writer.write('const groupBy = <T, Q>(array: T[], predicate: (value: T, index: number, array: T[]) => Q) =>').block(() => {
			writer
				.write('return array.reduce((map, value, index, array) => ')
				.inlineBlock(() => {
					writer.writeLine('const key = predicate(value, index, array);');
					writer.writeLine('map.get(key)?.push(value) ?? map.set(key, [value]);');
					writer.writeLine('return map;');
				})
				.write(', new Map<Q, T[]>());');
		});
	}

	return writer.toString();
}

function writeExecuteCrudBlock(
	client: SQLiteClient,
	queryType: QueryType,
	tableName: string,
	columns: TsFieldDescriptor[],
	idColumn: string,
	queryParams: string,
	paramTypeName: string,
	dataTypeName: string,
	resultTypeName: string,
	writer: CodeBlockWriter
) {
	switch (queryType) {
		case 'Select':
			return writeExecutSelectCrudBlock(client, tableName, idColumn, columns, queryParams, resultTypeName, writer);
		case 'Insert':
			return writeExecuteInsertCrudBlock(client, tableName, paramTypeName, resultTypeName, writer);
		case 'Update':
			return writeExecuteUpdateCrudBlock(client, tableName, idColumn, dataTypeName, resultTypeName, writer);
		case 'Delete':
			return writeExecutDeleteCrudBlock(client, tableName, idColumn, queryParams, resultTypeName, writer);
	}
}

function writeExecutSelectCrudBlock(
	client: SQLiteClient,
	tableName: string,
	idColumn: string,
	columns: TsFieldDescriptor[],
	queryParams: string,
	resultTypeName: string,
	writer: CodeBlockWriter
) {
	writer.blankLine();
	writer.writeLine('const sql = `SELECT');
	columns.forEach((col, index) => {
		const separator = index < columns.length - 1 ? ',' : '';
		writer.indent(2).write(`${col.name}${separator}`).newLine();
	});
	writer.indent().write(`FROM ${tableName}`).newLine();
	writer.indent().write(`WHERE ${idColumn} = ?\``).newLine();
	writer.blankLine();
	if (client === 'better-sqlite3') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write('.raw(true)').newLine();
		writer.indent().write(`.all(${queryParams})`).newLine();
		writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data))[0];`);
	}
	else if (client === 'bun:sqlite') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.values(${queryParams})`).newLine();
		writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data))[0];`);
	}
	else if (client === 'd1') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.bind(${queryParams})`).newLine();
		writer.indent().write('.first();').newLine();
	} else {
		writer.write(`return client.execute({ sql, args: ${queryParams} })`).newLine();
		writer.indent().write('.then(res => res.rows)').newLine();
		writer.indent().write(`.then(rows => mapArrayTo${resultTypeName}(rows[0]));`);
	}
}

function writeExecuteInsertCrudBlock(
	client: SQLiteClient,
	tableName: string,
	paramTypeName: string,
	resultTypeName: string,
	writer: CodeBlockWriter
) {
	writer.blankLine();
	writer.writeLine(`const keys = Object.keys(params) as Array<keyof ${paramTypeName}>;`);
	writer.writeLine('const columns = keys.filter(key => params[key] !== undefined);');
	writer.writeLine('const values = columns.map(col => params[col]!);');
	writer.blankLine();
	writer.writeLine('const sql = columns.length == 0');
	writer.indent().write(`? \`INSERT INTO ${tableName} DEFAULT VALUES\``).newLine();
	writer.indent().write(`: \`INSERT INTO ${tableName}(\${columns.join(',')}) VALUES(\${columns.map(_ => '?').join(',')})\``).newLine();
	writer.blankLine();
	if (client === 'better-sqlite3') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.run(values) as ${resultTypeName};`);
	} else if (client === 'bun:sqlite') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.run(...values) as ${resultTypeName};`);
	} else if (client === 'd1') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write('.bind(...values)').newLine();
		writer.indent().write('.run()').newLine();
		writer.indent().write('.then(res => res.meta);')
	} else {
		writer.write('return client.execute({ sql, args: values })').newLine();
		writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`).newLine();
	}
}

function writeExecuteUpdateCrudBlock(
	client: SQLiteClient,
	tableName: string,
	idColumn: string,
	paramTypeName: string,
	resultTypeName: string,
	writer: CodeBlockWriter
) {
	writer.blankLine();
	writer.writeLine(`const keys = Object.keys(data) as Array<keyof ${paramTypeName}>;`);
	writer.writeLine('const columns = keys.filter(key => data[key] !== undefined);');
	writer.writeLine(`const values = columns.map(col => data[col]!).concat(params.${idColumn});`);
	writer.blankLine();
	writer.writeLine('const sql = `');
	writer.indent().write(`UPDATE ${tableName}`).newLine();
	writer.indent().write(`SET \${columns.map(col => \`\${col} = ?\`).join(', ')}`).newLine();
	writer.indent().write(`WHERE ${idColumn} = ?\``).newLine();
	writer.blankLine();
	if (client === 'better-sqlite3') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.run(values) as ${resultTypeName};`);
	} else if (client === 'bun:sqlite') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.run(...values) as ${resultTypeName};`);
	} else if (client === 'd1') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.bind(params.${idColumn})`).newLine();
		writer.indent().write('.run()').newLine();
		writer.indent().write('.then(res => res.meta);')
	} else {
		writer.write('return client.execute({ sql, args: values })').newLine();
		writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`).newLine();
	}
}

function writeExecutDeleteCrudBlock(
	client: SQLiteClient,
	tableName: string,
	idColumn: string,
	queryParams: string,
	resultTypeName: string,
	writer: CodeBlockWriter
) {
	writer.blankLine();
	writer.writeLine('const sql = `DELETE');
	writer.indent().write(`FROM ${tableName}`).newLine();
	writer.indent().write(`WHERE ${idColumn} = ?\``).newLine();
	writer.blankLine();
	if (client === 'better-sqlite3') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.run(${queryParams}) as ${resultTypeName};`).newLine();
	} else if (client === 'bun:sqlite') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.run(${queryParams}) as ${resultTypeName};`).newLine();
	} else if (client === 'd1') {
		writer.write('return db.prepare(sql)').newLine();
		writer.indent().write(`.bind(${queryParams})`).newLine();
		writer.indent().write('.run()').newLine();
		writer.indent().write('.then(res => res.meta);')
	} else {
		writer.write(`return client.execute({ sql, args: ${queryParams} })`).newLine();
		writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`).newLine();
	}
}

function toDriver(variableData: string, param: TsFieldDescriptor) {
	if (param.tsType === 'Date') {
		if (param.notNull) {
			return `new Date(${variableData})`;
		}
		return `${variableData} != null ? new Date(${variableData}) : ${variableData}`;
	}
	if (param.tsType === 'boolean') {
		return `${variableData} != null ? Boolean(${variableData}) : ${variableData}`;
	}
	return variableData;
}

function fromDriver(variableName: string, param: TsParameterDescriptor): string {
	if (param.tsType === 'Date') {
		return `${variableName}.${param.toDriver}`;
	}
	if (param.tsType === 'boolean') {
		const variable = `${variableName}.${param.name}`;
		return `${variable} != null ? Number(${variable}) : ${variable}`;
	}
	if (param.tsType?.endsWith('[]')) {
		return `...${variableName}.${param.name}`;
	}
	return `${variableName}.${param.name}`;
}
function writeCollectFunction(
	writer: CodeBlockWriter,
	relation: RelationType2,
	columns: TsFieldDescriptor[],
	capitalizedName: string,
	resultTypeName: string
) {
	const relationType = generateRelationType(capitalizedName, relation.name);
	const collectFunctionName = `collect${relationType}`;
	writer.blankLine();
	writer.write(`function ${collectFunctionName}(selectResult: ${resultTypeName}[]): ${relationType}[]`).block(() => {
		const groupBy = columns[relation.groupIndex].name;
		writer.writeLine(`const grouped = groupBy(selectResult.filter(r => r.${groupBy} != null), r => r.${groupBy});`);
		writer
			.write('return [...grouped.values()].map(row => (')
			.inlineBlock(() => {
				relation.fields.forEach((field, index) => {
					const uniqueNameFields = renameInvalidNames(relation.fields.map((f) => f.name));
					const separator = ',';
					const fieldName = columns[field.index].name;
					writer.writeLine(`${uniqueNameFields[index]}: row[0].${fieldName}!${separator}`);
				});
				relation.relations.forEach((fieldRelation) => {
					const relationType = generateRelationType(capitalizedName, fieldRelation.name);
					const cardinality = fieldRelation.list ? '' : '[0]';
					writer.writeLine(`${fieldRelation.name}: collect${relationType}(row)${cardinality},`);
				});
			})
			.write('))');
	});
}

function writeImports(writer: CodeBlockWriter, client: SQLiteClient, isDynamicQuery: boolean) {
	switch (client) {
		case 'better-sqlite3':
			writer.writeLine(`import type { Database } from 'better-sqlite3';`);
			if (isDynamicQuery) {
				writer.writeLine(`import { EOL } from 'os';`);
			}
			return;
		case 'libsql':
			writer.writeLine(`import type { Client, Transaction } from '@libsql/client';`);
			if (isDynamicQuery) {
				writer.writeLine(`import { EOL } from 'os';`);
			}
			return;
		case 'bun:sqlite':
			writer.writeLine(`import type { Database } from 'bun:sqlite';`);
			if (isDynamicQuery) {
				writer.writeLine(`import { EOL } from 'os';`);
			}
			return;
		case 'd1':
			writer.writeLine(`import type { D1Database } from '@cloudflare/workers-types';`);
			if (isDynamicQuery) {
				writer.writeLine(`const EOL = '\\n';`);
			}
			return;
		default:
			return client satisfies never;
	}
}

function writeExecFunction(writer: CodeBlockWriter, client: SQLiteClient, params: ExecFunctionParams) {
	const {
		functionName,
		returnType,
		sql,
		multipleRowsResult,
		parameters,
		columns,
		queryType,
		returning,
		paramsTypeName,
		resultTypeName,
		dataTypeName,
		orderBy
	} = params;

	let restParameters = queryType === 'Update' ? `, data: ${dataTypeName}` : '';
	const dynamicQuery = false;
	if (!dynamicQuery) {
		restParameters += parameters.length > 0 || orderBy ? `, params: ${paramsTypeName}` : '';
	}
	const queryParametersWithoutBrackes = parameters.join(', ');
	const queryParams = queryParametersWithoutBrackes != '' ? `[${queryParametersWithoutBrackes}]` : '';

	const mapFunctionParams: MapFunctionParams = {
		resultTypeName,
		columns
	}

	switch (client) {
		case 'better-sqlite3':
			const betterSqliteArgs = 'db: Database' + restParameters;
			if (queryType === 'Select') {
				writer.write(`export function ${functionName}(${betterSqliteArgs}): ${returnType}`).block(() => {
					writeSql(writer, sql);
					writer.write('return db.prepare(sql)').newLine();
					writer.indent().write('.raw(true)').newLine();
					writer.indent().write(`.all(${queryParams})`).newLine();
					writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data))${multipleRowsResult ? '' : '[0]'};`);
				});
				writer.blankLine();
				writeMapFunction(writer, mapFunctionParams);
			}
			if (queryType === 'Update' || queryType === 'Delete' || (queryType === 'Insert' && !returning)) {
				writer.write(`export function ${functionName}(${betterSqliteArgs}): ${resultTypeName}`).block(() => {
					writeSql(writer, sql);
					writer.write('return db.prepare(sql)').newLine();
					writer.indent().write(`.run(${queryParams}) as ${resultTypeName};`);
				});
			}

			return;
		case 'libsql':
			const libSqlArgs = 'client: Client | Transaction' + restParameters;
			writer.write(`export async function ${functionName}(${libSqlArgs}): Promise<${returnType}>`).block(() => {
				writeSql(writer, sql);
				const executeParams = queryParametersWithoutBrackes !== '' ? `{ sql, args: [${queryParametersWithoutBrackes}] }` : 'sql';

				writer.write(`return client.execute(${executeParams})`).newLine();

				if (queryType === 'Select') {
					writer.indent().write('.then(res => res.rows)').newLine();
					if (multipleRowsResult) {
						writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row)));`);
					} else {
						writer.indent().write(`.then(rows => mapArrayTo${resultTypeName}(rows[0]));`);
					}
				}
				if (queryType === 'Insert') {
					if (returning) {
						writer.indent().write('.then(res => res.rows)').newLine();
						writer.indent().write(`.then(rows => mapArrayTo${resultTypeName}(rows[0]));`);
					}
				}
				if (queryType === 'Update' || queryType === 'Delete' || (queryType === 'Insert' && !returning)) {
					writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`);
				}
			});
			writer.blankLine();
			if (queryType === 'Select' || returning) {
				writeMapFunction(writer, mapFunctionParams);
			}
			else {
				writeMapFunctionByName(writer, mapFunctionParams);
			}
			return;
		case 'bun:sqlite':
			const bunArgs = 'db: Database' + restParameters;
			if (queryType === 'Select') {
				writer.write(`export function ${functionName}(${bunArgs}): ${returnType}`).block(() => {
					writeSql(writer, sql);
					writer.write('return db.prepare(sql)').newLine();
					writer.indent().write(`.values(${queryParametersWithoutBrackes})`).newLine();
					writer.indent().write(`.map(data => mapArrayTo${resultTypeName}(data))${multipleRowsResult ? '' : '[0]'};`);
				});
				writer.blankLine();
				writeMapFunction(writer, mapFunctionParams);
			}
			if (queryType === 'Update' || queryType === 'Delete' || (queryType === 'Insert' && !returning)) {
				writer.write(`export function ${functionName}(${bunArgs}): ${resultTypeName}`).block(() => {
					writeSql(writer, sql);
					writer.write('return db.prepare(sql)').newLine();
					writer.indent().write(`.run(${queryParametersWithoutBrackes}) as ${resultTypeName};`);
				});
			}
			return;
		case 'd1':
			const d1Args = 'db: D1Database' + restParameters;
			writer.write(`export async function ${functionName}(${d1Args}): Promise<${returnType}>`).block(() => {
				writeSql(writer, sql);
				writer.write('return db.prepare(sql)').newLine();
				if (queryParametersWithoutBrackes !== '') {
					writer.indent().write(`.bind(${queryParametersWithoutBrackes})`).newLine();
				}

				if (queryType === 'Select') {
					writer.indent().write('.raw({ columnNames: false })').newLine();
					if (multipleRowsResult) {
						writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row)));`);
					} else {
						writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row))[0]);`);
					}
				}
				if (queryType === 'Insert' || queryType === 'Update' || queryType === 'Delete') {
					if (returning) {
						writer.indent().write('.raw({ columnNames: false })').newLine();
						writer.indent().write(`.then(rows => rows.map(row => mapArrayTo${resultTypeName}(row))[0]);`);
					} else {
						writer.indent().write('.run()').newLine();
						writer.indent().write(`.then(res => res.meta);`);
					}
				}
			});
			if (queryType === 'Select' || returning) {
				writer.blankLine();
				writeMapFunction(writer, mapFunctionParams);
			}
			return;
		default:
			return client satisfies never;
	}
}

function writeSql(writer: CodeBlockWriter, sql: string) {
	const sqlSplit = sql.split('\n');
	writer.write('const sql = `').newLine();
	sqlSplit.forEach((sqlLine) => {
		writer.indent().write(sqlLine).newLine();
	});
	writer.indent().write('`').newLine();
}

function writeMapFunction(writer: CodeBlockWriter, params: MapFunctionParams): void {
	const { resultTypeName, columns } = params;
	writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
		writer.write(`const result: ${resultTypeName} = `).block(() => {
			columns.forEach((col, index) => {
				const separator = index < columns.length - 1 ? ',' : '';
				writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
			});
		});
		writer.writeLine('return result;');
	});
}

function writeMapFunctionByName(writer: CodeBlockWriter, params: MapFunctionParams): void {
	const { resultTypeName, columns } = params;
	writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
		writer.write(`const result: ${resultTypeName} = `).block(() => {
			columns.forEach((col, index) => {
				const separator = index < columns.length - 1 ? ',' : '';
				writer.writeLine(`${col.name}: data.${col.name}${separator}`);
			});
		});
		writer.writeLine('return result;');
	});
}
