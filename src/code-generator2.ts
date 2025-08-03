import CodeBlockWriter from 'code-block-writer';
import { capitalize, convertToCamelCaseName, generateRelationType, getOperator, hasStringColumn, removeDuplicatedParameters2, renameInvalidNames, TsDescriptor } from './code-generator';
import { CrudQueryType, PgDielect, QueryType, TsFieldDescriptor, TsParameterDescriptor, TypeSqlError } from './types';
import { describeQuery } from './postgres-query-analyzer/describe';
import { ColumnSchema } from './mysql-query-analyzer/types';
import { mapColumnType } from './dialects/postgres';
import { JsonArrayType, JsonFieldType, JsonMapType, JsonObjType, JsonType, PostgresType } from './sqlite-query-analyzer/types';
import { preprocessSql } from './describe-query';
import { okAsync, ResultAsync } from 'neverthrow';
import { getQueryName, mapPostgrsFieldToTsField, writeCollectFunction } from './sqlite-query-analyzer/code-generator';
import { mapToTsRelation2, RelationType2 } from './ts-nested-descriptor';
import { EOL } from 'node:os';
import { PostgresColumnInfo, PostgresParameterDef, PostgresSchemaDef } from './postgres-query-analyzer/types';



export function generateCode(client: PgDielect, sql: string, queryName: string): ResultAsync<string, TypeSqlError> {
	if (isEmptySql(sql)) {
		return okAsync('');
	}
	const { sql: processedSql, namedParameters } = preprocessSql(sql, 'postgres');
	return _describeQuery(client, processedSql, namedParameters)
		.map(schemaDef => generateTsCode(processedSql, queryName, schemaDef, client.type))
}

function isEmptySql(sql: string) {
	if (sql.trim() === '') {
		return true;
	}
	const lines = sql.split('\n');
	return lines.every(line => line.trim() === '' || line.trim().startsWith('//'))
}

function _describeQuery(databaseClient: PgDielect, sql: string, namedParameters: string[]): ResultAsync<PostgresSchemaDef, TypeSqlError> {
	return describeQuery(databaseClient.client, sql, namedParameters);
}

export function createCodeBlockWriter() {
	const writer = new CodeBlockWriter({
		useTabs: true,
		newLine: EOL as '\n' | '\r\n'
	});
	return writer;
}

function generateTsCode(
	sqlOld: string,
	queryName: string,
	schemaDef: PostgresSchemaDef,
	client: 'pg',
	isCrud = false
): string {

	const { sql } = schemaDef;

	const writer = createCodeBlockWriter();

	const camelCaseName = convertToCamelCaseName(queryName);
	const capitalizedName = capitalize(camelCaseName);
	const dataTypeName = `${capitalizedName}Data`;
	const resultTypeName = `${capitalizedName}Result`;
	const paramsTypeName = `${capitalizedName}Params`;
	const orderByTypeName = `${capitalizedName}OrderBy`;
	const dynamicParamsTypeName = `${capitalizedName}DynamicParams`;
	const selectColumnsTypeName = `${capitalizedName}Select`;
	const whereTypeName = `${capitalizedName}Where`;

	const tsDescriptor = createTsDescriptor(capitalizedName, schemaDef);
	const uniqueParams = removeDuplicatedParameters2(tsDescriptor.parameters);
	const generateOrderBy = tsDescriptor.orderByColumns != null && tsDescriptor.orderByColumns.length > 0;

	const codeWriter = getCodeWriter(client);
	codeWriter.writeImports(writer, schemaDef.queryType);
	if (tsDescriptor.dynamicQuery2) {
		writer.writeLine(`import { EOL } from 'os';`);
	}
	const uniqueDataParams = removeDuplicatedParameters2(tsDescriptor.data || []);
	if (uniqueDataParams.length > 0) {
		writer.blankLine();
		writeDataType(writer, dataTypeName, uniqueDataParams);
	}
	if (uniqueParams.length > 0 || generateOrderBy) {
		writer.blankLine();
		writeParamsType(writer, paramsTypeName, uniqueParams, generateOrderBy, orderByTypeName)
	}
	if (schemaDef.queryType !== 'Copy') {
		writer.blankLine();
		writeResultType(writer, resultTypeName, tsDescriptor.columns);
		const flatten = schemaDef.columns.flatMap(col => flattenJsonTypes(createJsonType(capitalizedName, col.name), col.type));
		flatten.forEach(type => {
			writer.blankLine();
			writeJsonTypes(writer, type.typeName, type.type);
		});
	}
	const dynamicQueryInfo = tsDescriptor.dynamicQuery2;
	if (dynamicQueryInfo) {
		writer.blankLine();
		writer.write(`export type ${dynamicParamsTypeName} = `).block(() => {
			writer.writeLine(`select?: ${selectColumnsTypeName};`);
			if (tsDescriptor.parameters.length > 0) {
				writer.writeLine(`params: ${paramsTypeName};`);
			}
			writer.writeLine(`where?: ${whereTypeName}[];`);
			// if (orderByField) {
			// 	writer.writeLine(`${orderByField};`);
			// }
		});
		writer.blankLine();
		writer.write(`export type ${selectColumnsTypeName} =`).block(() => {
			tsDescriptor.columns.forEach((tsField) => {
				writer.writeLine(`${tsField.name}?: boolean;`);
			});
		});
		writer.blankLine();
		writer.write('const selectFragments = ').inlineBlock(() => {
			dynamicQueryInfo.select.forEach((fragment, index) => {
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
			for (const col of tsDescriptor.columns) {
				writer.writeLine(`| ['${col.name}', ${getOperator(col.tsType)}, ${col.tsType} | null]`);
				writer.writeLine(`| ['${col.name}', SetOperator, ${col.tsType}[]]`);
				writer.writeLine(`| ['${col.name}', BetweenOperator, ${col.tsType} | null, ${col.tsType} | null]`);
			}
		});
		writer.blankLine();
		let functionArguments = 'client: pg.Client | pg.Pool';
		// if (params.data.length > 0) {
		// 	functionParams += `, data: ${dataType}`;
		// }
		functionArguments += `, params?: ${dynamicParamsTypeName}`;
		writer.writeLine('let currentIndex: number;');
		writer.write(`export async function ${camelCaseName}(${functionArguments}): Promise<${resultTypeName}[]>`).block(() => {
			writer.writeLine(`currentIndex = ${tsDescriptor.parameters.length};`);
			writer.writeLine('const where = whereConditionsToObject(params?.where);');
			// if (orderByField != null) {
			// 	writer.writeLine('const orderBy = orderByToObject(params.orderBy);');
			// }
			writer.writeLine('const paramsValues: any = [];');
			if (dynamicQueryInfo.with.length > 0) {
				writer.writeLine(`let withClause = '';`);
				dynamicQueryInfo.with.forEach((withFragment) => {
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
						return `params?.params?.${param.name}`;
					});
					if (allConditions.length > 0) {
						writer.write(`if (${allConditions.join(`${EOL}\t|| `)})`).block(() => {
							writer.writeLine(`if (withClause !== '') withClause += ',' + EOL;`);
							writer.write(`withClause += \`${withFragment.fragment}\`;`);
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
			}
			writer.writeLine(`let sql = 'SELECT';`);
			if (dynamicQueryInfo.with.length > 0) {
				writer.write('if (withClause)').block(() => {
					writer.writeLine(`sql = 'WITH' + EOL + withClause + EOL + sql;`);
				})
			}

			dynamicQueryInfo.select.forEach((select, index) => {
				writer.write(`if (params?.select == null || params.select.${tsDescriptor.columns[index].name})`).block(() => {
					writer.writeLine(`sql = appendSelect(sql, \`${select.fragment}\`);`);
					select.parameters.forEach((param) => {
						writer.writeLine(`paramsValues.push(params?.params?.${param} ?? null);`);
					});
				});
			});
			dynamicQueryInfo.from.forEach((from) => {
				const selectConditions = from.dependOnFields.map((fieldIndex) => `params.select.${tsDescriptor.columns[fieldIndex].name}`);
				if (selectConditions.length > 0) {
					selectConditions.unshift('params?.select == null');
				}
				const whereConditions = from.dependOnFields.map((fieldIndex) => `where.${tsDescriptor.columns[fieldIndex].name} != null`);
				const orderByConditions = from.dependOnOrderBy?.map((orderBy) => `orderBy['${orderBy}'] != null`) || [];
				const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
				const paramValues = from.parameters.map((paramIndex) => {
					const param = tsDescriptor.parameters[paramIndex];
					return `params?.params?.${param.name}`;
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
					writer.writeLine(`sql += EOL + \`${from.fragment}\`;`);
					paramValues.forEach((paramValues) => {
						writer.writeLine(`paramsValues.push(${paramValues});`);
					});
				}
			});
			writer.writeLine('sql += EOL + `WHERE 1 = 1`;');
			dynamicQueryInfo.where.forEach((fragment) => {
				const paramValues = fragment.parameters.map((paramIndex) => {
					const param = tsDescriptor.parameters[paramIndex];
					return `params?.params?.${param.name} ?? null`;
				});
				writer.writeLine(`sql += EOL + \`${fragment.fragment}\`;`);
				paramValues.forEach((paramValues) => {
					writer.writeLine(`paramsValues.push(${paramValues});`);
				});
			});
			writer.write('params?.where?.forEach(condition => ').inlineBlock(() => {
				writer.writeLine('const where = whereCondition(condition);');
				dynamicQueryInfo.select.forEach((select, index) => {
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
			writer.write(`return client.query({ text: sql, rowMode: 'array', values: paramsValues })`).newLine();
			writer.indent().write(`.then(res => res.rows.map(row => mapArrayTo${resultTypeName}(row, params?.select)));`)
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
				writer.writeLine('obj[condition[0]] = true;');
			});
			writer.write(');');
			writer.writeLine('return obj;');
		});
		// if (orderByField != null) {
		// 	writer.blankLine();
		// 	writer.write(`function orderByToObject(orderBy: ${dynamicParamsTypeName}['orderBy'])`).block(() => {
		// 		writer.writeLine('const obj = {} as any;');
		// 		writer.write('orderBy?.forEach(order => ').inlineBlock(() => {
		// 			writer.writeLine('obj[order[0]] = true;');
		// 		});
		// 		writer.write(');');
		// 		writer.writeLine('return obj;');
		// 	});
		// }
		writer.blankLine();
		writer.write('type WhereConditionResult = ').block(() => {
			writer.writeLine('sql: string;');
			writer.writeLine('hasValue: boolean;');
			writer.writeLine('values: any[];');
		});
		writer.blankLine();
		writer.write(`function whereCondition(condition: ${whereTypeName}): WhereConditionResult | null `).block(() => {
			writer.blankLine();
			writer.writeLine('const selectFragment = selectFragments[condition[0]];');
			writer.writeLine('const operator = condition[1];');
			writer.blankLine();
			if (hasStringColumn(tsDescriptor.columns)) {
				writer.write(`if (operator == 'LIKE') `).block(() => {
					writer.write('return ').block(() => {
						writer.writeLine("sql: `${selectFragment} LIKE ${placeholder()}`,");
						writer.writeLine('hasValue: condition[2] != null,');
						writer.writeLine('values: [condition[2]]');
					});
				});
			}
			writer.write(`if (operator == 'BETWEEN') `).block(() => {
				writer.write('return ').block(() => {
					writer.writeLine('sql: `${selectFragment} BETWEEN ${placeholder()} AND ${placeholder()}`,');
					writer.writeLine('hasValue: condition[2] != null && condition[3] != null,');
					writer.writeLine('values: [condition[2], condition[3]]');
				});
			});
			writer.write(`if (operator == 'IN' || operator == 'NOT IN') `).block(() => {
				writer.write('return ').block(() => {
					writer.writeLine("sql: `${selectFragment} ${operator} (${condition[2]?.map(_ => placeholder()).join(', ')})`,");
					writer.writeLine('hasValue: condition[2] != null && condition[2].length > 0,');
					writer.writeLine('values: condition[2]');
				});
			});
			writer.write('if (NumericOperatorList.includes(operator)) ').block(() => {
				writer.write('return ').block(() => {
					writer.writeLine('sql: `${selectFragment} ${operator} ${placeholder()}`,');
					writer.writeLine('hasValue: condition[2] != null,');
					writer.writeLine('values: [condition[2]]');
				});
			});
			writer.writeLine('return null;');
		});
		writer.blankLine();
		writer.write('function placeholder(): string').block(() => {
			writer.writeLine('return `$${++currentIndex}`;');
		})
	}

	if (tsDescriptor.nestedDescriptor2) {
		const relations = tsDescriptor.nestedDescriptor2;
		relations.forEach((relation) => {
			const relationType = generateRelationType(capitalizedName, relation.name);
			writer.blankLine();
			writer.write(`export type ${relationType} = `).block(() => {
				const uniqueNameFields = renameInvalidNames(relation.fields.map((f) => f.name));
				relation.fields.forEach((field, index) => {
					const nullableOperator = field.notNull ? '' : ' | null';
					writer.writeLine(`${uniqueNameFields[index]}: ${field.tsType}${nullableOperator};`);
				});
				relation.relations.forEach((field) => {
					const nestedRelationType = generateRelationType(capitalizedName, field.tsType);
					const nullableOperator = field.notNull ? '' : '?';
					writer.writeLine(`${field.name}${nullableOperator}: ${nestedRelationType};`);
				});
			});
		});
	}
	if (!dynamicQueryInfo) {
		writer.blankLine();
		const execFunctionParams: ExecFunctionParameters = {
			sql,
			queryType: tsDescriptor.queryType,
			multipleRowsResult: tsDescriptor.multipleRowsResult,
			functionName: queryName,
			paramsType: paramsTypeName,
			dataType: dataTypeName,
			returnType: resultTypeName,
			columns: tsDescriptor.columns,
			parameters: tsDescriptor.parameters,
			data: tsDescriptor.data || [],
			returning: schemaDef.returning || false,
			generateNested: tsDescriptor.nestedDescriptor2 != null,
			nestedType: tsDescriptor.nestedDescriptor2 ? tsDescriptor.nestedDescriptor2[0].name : ''
		}
		codeWriter.writeExecFunction(writer, execFunctionParams);
	}

	if (tsDescriptor.nestedDescriptor2) {
		const relations = tsDescriptor.nestedDescriptor2;
		relations.forEach((relation, index) => {
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

type FlattenType = {
	typeName: string;
	type: JsonObjType;
}

const isJsonType = (t: PostgresType): t is JsonType => {
	return typeof t === 'object' && t !== null && 'name' in t;
};
const isJsonObjType = (t: JsonType): t is JsonObjType => t.name === 'json';
const isJsonMapType = (t: JsonType): t is JsonMapType => t.name === 'json_map';
const isJsonArrayType = (t: JsonType): t is JsonArrayType => t.name === 'json[]';
const isJsonFieldType = (t: JsonType): t is JsonFieldType => t.name === 'json_field';

function flattenJsonTypes(parentName: string, type: PostgresType): FlattenType[] {
	const result: FlattenType[] = [];
	const visit = (typeName: string, t: PostgresType) => {
		if (!isJsonType(t)) {
			return;
		}
		if (isJsonObjType(t)) {
			result.push({ typeName, type: t });
			for (const prop of t.properties) {
				visit(createJsonType(typeName, prop.key), prop.type);
			}
		} else if (isJsonMapType(t)) {
			visit(typeName, t.type);
		} else if (isJsonArrayType(t)) {
			for (const itemType of t.properties) {
				visit(typeName, itemType);
			}
		}
	}
	visit(parentName, type);
	return result;
}

function writeDataType(writer: CodeBlockWriter, dataTypeName: string, params: TsFieldDescriptor[]) {
	writer.write(`export type ${dataTypeName} =`).block(() => {
		params.forEach((field) => {
			const optionalOp = field.optional ? '?' : '';
			const orNull = field.notNull ? '' : ' | null';
			writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
		});
	});
}

function writeParamsType(writer: CodeBlockWriter, paramsTypeName: string, params: TsFieldDescriptor[], generateOrderBy: boolean, orderByTypeName: string) {
	writer.write(`export type ${paramsTypeName} =`).block(() => {
		params.forEach((field) => {
			const optionalOp = field.optional ? '?' : '';
			const orNull = field.notNull ? '' : ' | null';
			writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
		});
		if (generateOrderBy) {
			writer.writeLine(`orderBy: [${orderByTypeName}, 'asc' | 'desc'][];`);
		}
	});
}

function writeResultType(writer: CodeBlockWriter, resultTypeName: string, columns: TsFieldDescriptor[]) {
	writer.write(`export type ${resultTypeName} =`).block(() => {
		columns.forEach((field) => {
			const optionalOp = field.notNull ? '' : '?';
			writer.writeLine(`${field.name}${optionalOp}: ${field.tsType};`);
		});
	});
}

function createJsonType(capitalizedName: string, columnName: string) {
	const jsonType = capitalize(convertToCamelCaseName(columnName));
	const fullName = `${capitalizedName}${jsonType}`;
	return fullName;
}

function writeJsonTypes(writer: CodeBlockWriter, typeName: string, type: JsonObjType) {
	writer.write(`export type ${typeName}Type =`).block(() => {
		type.properties.forEach((field) => {
			if (isJsonObjType(field.type)) {
				const optionalOp = field.type.notNull ? '' : '?';
				const jsonTypeName = createJsonType(typeName, field.key);
				writer.writeLine(`${field.key}${optionalOp}: ${jsonTypeName}Type;`);
			} else if (isJsonArrayType(field.type)) {
				const jsonParentName = createJsonType(typeName, field.key);
				const jsonTypeName = createJsonArrayType(jsonParentName, field.type);
				writer.writeLine(`${field.key}: ${jsonTypeName};`);
			} else if (isJsonFieldType(field.type)) {
				const optionalOp = field.type.notNull ? '' : '?';
				writer.writeLine(`${field.key}${optionalOp}: ${mapColumnType(field.type.type, true)};`);
			}
		});
	});
}

function createTsDescriptor(capitalizedName: string, schemaDef: PostgresSchemaDef) {
	const tsDescriptor: TsDescriptor = {
		columns: getColumnsForQuery(capitalizedName, schemaDef),
		parameters: schemaDef.parameters.map((param) => mapParameterToTsFieldDescriptor(param)),
		sql: '',
		queryType: schemaDef.queryType,
		multipleRowsResult: schemaDef.multipleRowsResult,
		parameterNames: [],
		data: schemaDef.data?.map(param => mapParameterToTsFieldDescriptor(param))
	}
	if (schemaDef.nestedInfo) {
		const nestedDescriptor2 = schemaDef.nestedInfo.map((relation) => {
			const tsRelation: RelationType2 = {
				groupIndex: relation.groupIndex,
				name: relation.name,
				fields: relation.fields.map((field) => mapPostgrsFieldToTsField(schemaDef.columns, field)),
				relations: relation.relations.map((relation) => mapToTsRelation2(relation))
			};
			return tsRelation;
		});
		tsDescriptor.nestedDescriptor2 = nestedDescriptor2;
	}
	if (schemaDef.dynamicSqlQuery2) {
		tsDescriptor.dynamicQuery2 = schemaDef.dynamicSqlQuery2;
	}
	return tsDescriptor;
}

function createJsonArrayType(name: string, type: JsonArrayType) {
	const typeNames = type.properties.flatMap(p => {
		if (isJsonFieldType(p)) {
			const baseType = mapColumnType(p.type, true)
			if (!p.notNull) {
				return [baseType, 'null'];
			}
			return [baseType];
		}
		return createTsType(name, p);
	});
	const uniqTypeNames = [...new Set(typeNames)];
	const unionTypes = uniqTypeNames.join(' | ');
	return uniqTypeNames.length === 1 ? `${unionTypes}[]` : `(${unionTypes})[]`;
}

function createJsonMapType(name: string, type: JsonMapType) {
	const valueType = isJsonFieldType(type.type) ? mapColumnType(type.type.type, true) : `${name}Type`;
	return `Record<string, ${valueType} | undefined>`;
}

function createTsType(name: string, type: PostgresType): string {
	if (isJsonType(type)) {
		if (isJsonObjType(type)) {
			return `${name}Type`;
		}
		else if (isJsonArrayType(type)) {
			return createJsonArrayType(name, type);
		}
		else if (isJsonMapType(type)) {
			return createJsonMapType(name, type);
		}
	}
	return mapColumnType(type);
}

function mapColumnInfoToTsFieldDescriptor(capitalizedName: string, col: PostgresColumnInfo, dynamicQuery: boolean): TsFieldDescriptor {
	const typeName = createJsonType(capitalizedName, col.name);
	const tsField: TsFieldDescriptor = {
		name: col.name,
		tsType: createTsType(typeName, col.type),
		notNull: dynamicQuery ? false : col.notNull
	}
	return tsField;
}

function mapParameterToTsFieldDescriptor(param: PostgresParameterDef): TsParameterDescriptor {
	const tsDesc: TsParameterDescriptor = {
		name: param.name,
		tsType: mapColumnType(param.type),
		notNull: param.notNull ? param.notNull : false,
		toDriver: '',
		isArray: param.type.startsWith('_')
	};
	return tsDesc;
}

function getCodeWriter(client: 'pg'): CodeWriter {
	return postgresCodeWriter;
}

type CodeWriter = {
	writeImports: (writer: CodeBlockWriter, queryType: QueryType) => void;
	writeExecFunction: (writer: CodeBlockWriter, params: ExecFunctionParameters) => void;
}

type ExecFunctionParameters = {
	sql: string;
	queryType: TsDescriptor['queryType'],
	multipleRowsResult: boolean;
	functionName: string;
	returnType: string;
	paramsType: string;
	dataType: string;
	columns: TsFieldDescriptor[];
	parameters: TsParameterDescriptor[];
	data: TsParameterDescriptor[];
	returning: boolean;
	generateNested: boolean;
	nestedType: string;
}

const postgresCodeWriter: CodeWriter = {
	writeImports: function (writer: CodeBlockWriter, queryType: QueryType): void {
		writer.writeLine(`import pg from 'pg';`);
		if (queryType === 'Copy') {
			writer.writeLine(`import { from as copyFrom } from 'pg-copy-streams';`);
			writer.writeLine(`import { pipeline } from 'stream/promises';`);
			writer.writeLine(`import { Readable } from 'stream';`);
		}
	},
	writeExecFunction: function (writer: CodeBlockWriter, params: ExecFunctionParameters): void {
		if (params.queryType === 'Copy') {
			_writeCopyFunction(writer, params);
		}
		else {
			_writeExecFunction(writer, params);
		}
	}
}

function _writeCopyFunction(writer: CodeBlockWriter, params: ExecFunctionParameters) {
	const { functionName, paramsType } = params;
	let functionParams = `client: pg.Client | pg.PoolClient, values: ${paramsType}[]`;
	writer.write(`export async function ${functionName}(${functionParams}): Promise<void>`).block(() => {
		writeSql(writer, params.sql);
		writer.writeLine('const csv = jsonToCsv(values);');
		writer.blankLine();
		writer.writeLine('const sourceStream = Readable.from(csv);');
		writer.writeLine('const stream = client.query(copyFrom(sql));');
		writer.writeLine('await pipeline(sourceStream, stream)');
	});
	writer.blankLine();
	writer.write(`function jsonToCsv(values: ${paramsType}[]): string`).block(() => {
		writer.writeLine('return values');
		writer.indent().write('.map(value =>').newLine();
		writer.indent(2).write('Object.values(value)').newLine();
		writer.indent(3).write('.map(val => escapeValue(val))').newLine();
		writer.indent(3).write(`.join(',')`).newLine();
		writer.indent().write(')').newLine();
		writer.indent().write(`.join('\\n');`).newLine();
	});
	writer.blankLine();
	writer.write(`function escapeValue(val: any): string`).block(() => {
		writer.writeLine(`return val != null ? JSON.stringify(val).replace(/\\n/g, '\\\\n') : '';`);
	});
}

function _writeExecFunction(writer: CodeBlockWriter, params: ExecFunctionParameters) {
	const { functionName, paramsType, dataType, returnType, parameters, generateNested, nestedType } = params;
	let functionParams = params.queryType === 'Copy' ? 'client: pg.Client | pg.PoolClient' : 'client: pg.Client | pg.Pool';
	if (params.data.length > 0) {
		functionParams += `, data: ${dataType}`;
	}
	if (parameters.length > 0) {
		functionParams += `, params: ${paramsType}`;
	}
	const allParamters = [...params.data.map(param => paramToDriver(param, 'data')),
	...parameters.map(param => paramToDriver(param, 'params')),
	...parameters.filter(param => isList(param)).map(param => `...params.${param.name}.slice(1)`)];
	const paramValues = allParamters.length > 0 ? `, values: [${allParamters.join(', ')}]` : '';
	const orNull = params.queryType === 'Select' ? ' | null' : '';
	const functionReturnType = params.multipleRowsResult ? `${returnType}[]` : `${returnType}${orNull}`;
	const hasListParams = parameters.some(param => !param.isArray && param.tsType.endsWith('[]'));
	if (hasListParams) {
		writer.writeLine('let currentIndex: number;');
	}
	writer.write(`export async function ${functionName}(${functionParams}): Promise<${functionReturnType}>`).block(() => {
		if (hasListParams) {
			writer.writeLine(`currentIndex = ${params.data.length + params.parameters.length};`);
		}
		writeSql(writer, params.sql);
		if (params.queryType === 'Select' || params.returning) {
			writer.write(`return client.query({ text: sql, rowMode: 'array'${paramValues} })`).newLine();
			if (params.multipleRowsResult) {
				writer.indent().write(`.then(res => res.rows.map(row => mapArrayTo${returnType}(row)));`)
			}
			else if (params.returning) {
				writer.indent().write(`.then(res => mapArrayTo${returnType}(res.rows[0]));`)
			}
			else {
				writer.indent().write(`.then(res => res.rows.length > 0 ? mapArrayTo${returnType}(res.rows[0]) : null);`)
			}
		}
		else {
			writer.write(`return client.query({ text: sql${paramValues} })`).newLine();
			writer.indent().write(`.then(res => mapArrayTo${returnType}(res));`)
		}
	});

	if (hasListParams) {
		writer.blankLine();
		writer.write(`function generatePlaceholders(param: string, paramsArray: any[]): string`).block(() => {
			writer.write('return paramsArray').newLine();
			writer.indent().write('.map((_, index) => {').newLine();
			writer.indent(2).write(`if (index === 0) {`).newLine();
			writer.indent(3).write(`return param`).newLine();
			writer.indent(2).write(`}`).newLine();
			writer.indent(2).write('currentIndex++;').newLine();
			writer.indent(2).write('return `$${currentIndex}`;').newLine();
			writer.indent().write('})');
			writer.newLine();
			writer.indent().write(`.join(', ');`);
		})
	}
	writer.blankLine();
	writer.write(`function mapArrayTo${returnType}(data: any) `).block(() => {
		writer.write(`const result: ${returnType} = `).block(() => {
			params.columns.forEach((col, index) => {
				const separator = index < params.columns.length - 1 ? ',' : '';
				if (params.queryType === 'Select' || params.returning) {
					writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
				}
				else {
					writer.writeLine(`${col.name}: data.${col.name}${separator}`);
				}
			});
		});
		writer.writeLine('return result;');
	});

	if (generateNested) {
		writer.blankLine();
		const relationType = generateRelationType(functionName, nestedType);
		writer.write(`export async function ${functionName}Nested(${functionParams}): Promise<${relationType}[]>`).block(() => {
			const params = parameters.length > 0 ? ', params' : '';
			writer.writeLine(`const selectResult = await ${functionName}(client${params});`);
			writer.write('if (selectResult.length == 0)').block(() => {
				writer.writeLine('return [];');
			});
			writer.writeLine(`return collect${relationType}(selectResult);`);
		});
	}
}

function writeSql(writer: CodeBlockWriter, sql: string) {
	const sqlSplit = sql.trimEnd().split('\n');
	writer.write('const sql = `').newLine();
	sqlSplit.forEach((sqlLine) => {
		writer.indent().write(sqlLine.trimEnd()).newLine();
	});
	writer.indent().write('`').newLine();
}

function getFunctionReturnType(queryType: QueryType, multipleRowsResult: boolean, returnType: string): string {
	if (queryType === 'Copy') {
		return 'void';
	}
	if (multipleRowsResult) {
		return `${returnType}[]`;
	}
	const orNull = queryType === 'Select' ? ' | null' : '';
	return `${returnType}${orNull}`;
}

function getColumnsForQuery(capitalizedName: string, schemaDef: PostgresSchemaDef): TsFieldDescriptor[] {
	if (schemaDef.queryType === 'Select' || schemaDef.returning) {
		const columns = schemaDef.columns.map(col => mapColumnInfoToTsFieldDescriptor(capitalizedName, col, schemaDef.dynamicSqlQuery2 != null))
		const escapedColumnsNames = renameInvalidNames(schemaDef.columns.map((col) => col.name));
		return columns.map((col, index) => ({ ...col, name: escapedColumnsNames[index] }));
	}
	if (schemaDef.queryType === 'Copy') {
		return [];
	}
	const columns: TsFieldDescriptor[] = [
		{
			name: 'rowCount',
			tsType: 'number',
			notNull: true
		}
	]
	return columns;
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

function paramToDriver(param: TsParameterDescriptor, objName: string): any {
	if (!param.tsType.endsWith('[]')) {
		return `${objName}.${param.name}`;
	}
	return param.isArray ? `[...${objName}.${param.name}]` : `${objName}.${param.name}[0]`;
}

function isList(param: TsParameterDescriptor) {
	return param.tsType.endsWith('[]') && !param.isArray;
}

export function generateCrud(client: 'pg', queryType: CrudQueryType, tableName: string, dbSchema: ColumnSchema[]) {

	const queryName = getQueryName(queryType, tableName);
	const camelCaseName = convertToCamelCaseName(queryName);
	const capitalizedName = capitalize(camelCaseName);
	const dataTypeName = `${capitalizedName}Data`;
	const resultTypeName = `${capitalizedName}Result`;
	const paramsTypeName = `${capitalizedName}Params`;

	const writer = createCodeBlockWriter();

	const allColumns = dbSchema.filter((col) => col.table === tableName);
	const keyColumns = allColumns.filter((col) => col.columnKey === 'PRI');
	if (keyColumns.length === 0) {
		keyColumns.push(...allColumns.filter((col) => col.columnKey === 'UNI'));
	}
	const keys = keyColumns.map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col));
	const nonKeys = allColumns.filter(col => col.columnKey !== 'PRI').map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col));


	const codeWriter = getCodeWriter(client);
	codeWriter.writeImports(writer, queryType);
	const uniqueDataParams = queryType === 'Update' ? nonKeys : [];
	if (uniqueDataParams.length > 0) {
		writer.blankLine();
		writeDataType(writer, dataTypeName, uniqueDataParams);
	}
	const uniqueParams = queryType === 'Insert' ? nonKeys : keys;
	if (uniqueParams.length > 0) {
		writer.blankLine();
		writeParamsType(writer, paramsTypeName, uniqueParams, false, '');
	}
	writer.blankLine();
	const columns = allColumns.map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col))
	writeResultType(writer, resultTypeName, columns);
	writer.blankLine();

	const crudParameters: CrudParameters = {
		queryType,
		tableName,
		queryName,
		dataTypeName,
		paramsTypeName,
		resultTypeName,
		columns,
		nonKeys: nonKeys,
		keys: keys.map(col => col.name)
	}

	const result = writeCrud(writer, crudParameters);

	return result;
}

type CrudParameters = {
	queryType: CrudQueryType;
	tableName: string;
	queryName: string;
	dataTypeName: string;
	paramsTypeName: string;
	resultTypeName: string;
	columns: TsFieldDescriptor[];
	nonKeys: TsFieldDescriptor[];
	keys: string[]
}

function writeCrud(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { queryType } = crudParamters;
	switch (queryType) {
		case 'Select':
			return writeCrudSelect(writer, crudParamters);
		case 'Insert':
			return writeCrudInsert(writer, crudParamters);
		case 'Update':
			return writeCrudUpdate(writer, crudParamters);
		case 'Delete':
			return writeCrudDelete(writer, crudParamters);
	}
}

function writeCrudSelect(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { tableName, queryName, paramsTypeName, resultTypeName, columns, keys } = crudParamters;
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
		writer.writeLine('const sql = `');
		writer.indent().write('SELECT').newLine();
		columns.forEach((col, columnIndex) => {
			writer.indent(2).write(col.name);
			writer.conditionalWrite(columnIndex < columns.length - 1, ',');
			writer.newLine();
		});
		writer.indent().write(`FROM ${tableName}`).newLine();
		const keyName = keys[0];
		writer.indent().write(`WHERE ${keyName} = $1`).newLine();
		writer.indent().write('`').newLine();
		writer.writeLine(`return client.query({ text: sql, rowMode: 'array', values: [params.${keyName}] })`);
		writer.indent(1).write(`.then(res => res.rows.length > 0 ? mapArrayTo${resultTypeName}(res.rows[0]) : null);`).newLine();
	})

	writer.blankLine();
	writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
		writer.write(`const result: ${resultTypeName} = `).block(() => {
			columns.forEach((col, index) => {
				const separator = index < columns.length - 1 ? ',' : '';
				writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
			});
		});
		writer.writeLine('return result;');
	});
	return writer.toString();
}

function writeCrudInsert(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { tableName, queryName, dataTypeName, paramsTypeName, resultTypeName, columns, nonKeys, keys } = crudParamters;
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
		const hasOptional = nonKeys.some(field => field.optional);
		if (hasOptional) {
			writer.blankLine();
			writer.writeLine('const columns: string[] = [];');
			writer.writeLine('const placeholders: string[] = [];');
			writer.writeLine('const values: unknown[] = [];');
			writer.blankLine();
			writer.writeLine('let parameterNumber = 1;');
			writer.blankLine();
			writer.write('for (const key of Object.keys(params))').block(() => {
				writer.writeLine('const value = params[key as keyof InsertIntoRolesParams];');
				writer.write('if (value !== undefined)').block(() => {
					writer.writeLine('columns.push(key);');
					writer.writeLine('placeholders.push(`$${parameterNumber++}`);');
					writer.writeLine('values.push(value);');
				})
			})
			writer.blankLine();
			writer.writeLine('const sql = columns.length === 0');
			writer.indent().write('? `INSERT INTO roles DEFAULT VALUES RETURNING *`').newLine();
			writer.indent().write(': `INSERT INTO roles (${columns.join(\', \')})').newLine();
			writer.indent().write(`VALUES(\${placeholders.join(', ')})`).newLine();
			writer.indent().write('RETURNING *`').newLine();
			writer.blankLine();
			writer.writeLine(`return client.query({ text: sql, values })`);
		}
		else {
			writer.writeLine('const sql = `');
			writer.indent().write(`INSERT INTO ${tableName} (${nonKeys.map(field => field.name).join(',')})`).newLine();
			writer.indent().write(`VALUES (${nonKeys.map((_, index) => `$${index + 1}`).join(',')})`).newLine();
			writer.indent().write('RETURNING *').newLine();
			writer.indent().write('`').newLine();
			writer.writeLine(`return client.query({ text: sql, values: [${nonKeys.map(col => `params.${col.name}`)}] })`);
		}
		writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`);
	})

	writer.blankLine();
	writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
		writer.write(`const result: ${resultTypeName} = `).block(() => {
			columns.forEach((col, index) => {
				const separator = index < columns.length - 1 ? ',' : '';
				writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
			});
		});
		writer.writeLine('return result;');
	});
	return writer.toString();
}

function writeCrudUpdate(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { tableName, queryName, dataTypeName, paramsTypeName, resultTypeName, columns, nonKeys, keys } = crudParamters;
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool, data: ${dataTypeName}, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
		writer.writeLine(`let sql = 'UPDATE ${tableName} SET';`);
		writer.writeLine('const values: any[] = [];');
		nonKeys.forEach((col, index) => {
			writer.write(`if (data.${col.name} !== undefined)`).block(() => {
				writer.conditionalWriteLine(index > 0, `if (values.length > 0) sql += ',';`);
				writer.writeLine(`sql += ' ${col.name} = $${index + 1}';`);
				writer.writeLine(`values.push(data.${col.name});`);
			})
		})
		const keyName = keys[0];
		writer.writeLine(`sql += ' WHERE ${keyName} = $${nonKeys.length + 1} RETURNING *';`);
		writer.writeLine(`values.push(params.${keyName});`);
		writer.write('if (values.length > 0)').block(() => {
			writer.writeLine('return client.query({ text: sql, values })');
			writer.indent().write(`.then(res => res.rows.length > 0 ? mapArrayTo${resultTypeName}(res) : null);`);
		})
		writer.writeLine('return null;');
	})

	writer.blankLine();
	writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
		writer.write(`const result: ${resultTypeName} = `).block(() => {
			columns.forEach((col, index) => {
				const separator = index < columns.length - 1 ? ',' : '';
				writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
			});
		});
		writer.writeLine('return result;');
	});
	return writer.toString();
}

function writeCrudDelete(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { tableName, queryName, paramsTypeName, resultTypeName, columns, keys } = crudParamters;
	const keyName = keys[0];
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
		writer.writeLine('const sql = `');
		writer.indent().write(`DELETE FROM ${tableName} WHERE ${keyName} = $1`).newLine();
		writer.indent().write('`').newLine();
		writer.writeLine(`return client.query({ text: sql, rowMode: 'array', values: [params.${keyName}] })`);
		writer.indent(1).write(`.then(res => res.rows.length > 0 ? mapArrayTo${resultTypeName}(res.rows[0]) : null);`).newLine();
	})

	writer.blankLine();
	writer.write(`function mapArrayTo${resultTypeName}(data: any) `).block(() => {
		writer.write(`const result: ${resultTypeName} = `).block(() => {
			columns.forEach((col, index) => {
				const separator = index < columns.length - 1 ? ',' : '';
				writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
			});
		});
		writer.writeLine('return result;');
	});
	return writer.toString();
}

export function mapPostgresColumnSchemaToTsFieldDescriptor(col: ColumnSchema): TsFieldDescriptor {
	return {
		name: col.column,
		notNull: col.notNull,
		optional: col.defaultValue != null,
		tsType: mapColumnType(col.column_type as PostgresType),
	}
}
