import CodeBlockWriter from 'code-block-writer';
import { capitalize, convertToCamelCaseName, generateRelationType, removeDuplicatedParameters2, renameInvalidNames, TsDescriptor } from './mysql2';
import { CrudQueryType, PgDielect, QueryType, TsFieldDescriptor, TsParameterDescriptor, TypeSqlError } from '../types';
import { describeQuery } from '../postgres-query-analyzer/describe';
import { mapColumnType } from '../dialects/postgres';
import { JsonArrayType, JsonFieldType, JsonMapType, JsonObjType, JsonType, PostgresType } from '../sqlite-query-analyzer/types';
import { okAsync, ResultAsync } from 'neverthrow';
import { getQueryName, mapPostgrsFieldToTsField, writeCollectFunction } from './sqlite';
import { mapToTsRelation2, RelationType2 } from '../ts-nested-descriptor';
import { EOL } from 'node:os';
import { PostgresColumnInfo, PostgresParameterDef, PostgresSchemaDef } from '../postgres-query-analyzer/types';
import { PostgresSchemaInfo } from '../schema-info';
import { PostgresColumnSchema } from '../drivers/types';
import { writeBuildOrderByBlock, writeBuildSqlFunction, writeDynamicQueryOperators, writeMapToResultFunction, writeWhereConditionFunction } from './shared/codegen-util';



export function generateCode(client: PgDielect, sql: string, queryName: string, schemaInfo: PostgresSchemaInfo): ResultAsync<string, TypeSqlError> {
	if (isEmptySql(sql)) {
		return okAsync('');
	}
	return _describeQuery(client, sql, schemaInfo)
		.map(schemaDef => generateTsCode(queryName, schemaDef, client.type))
}

function isEmptySql(sql: string) {
	if (sql.trim() === '') {
		return true;
	}
	const lines = sql.split('\n');
	return lines.every(line => line.trim() === '' || line.trim().startsWith('//'))
}

function _describeQuery(databaseClient: PgDielect, sql: string, dbSchema: PostgresSchemaInfo): ResultAsync<PostgresSchemaDef, TypeSqlError> {
	return describeQuery(databaseClient.client, sql, dbSchema);
}

export function createCodeBlockWriter() {
	const writer = new CodeBlockWriter({
		useTabs: true,
		newLine: EOL as '\n' | '\r\n'
	});
	return writer;
}

function generateTsCode(queryName: string, schemaDef: PostgresSchemaDef, client: 'pg'): string {

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
		writeDynamicQueryOperators(writer, whereTypeName, tsDescriptor.columns);
		writer.blankLine();
		let functionArguments = 'client: pg.Client | pg.Pool | pg.PoolClient';
		// if (params.data.length > 0) {
		// 	functionParams += `, data: ${dataType}`;
		// }
		functionArguments += `, params?: ${dynamicParamsTypeName}`;
		writer.write(`export async function ${camelCaseName}(${functionArguments}): Promise<${resultTypeName}[]>`).block(() => {
			// if (orderByField != null) {
			// 	writer.writeLine('const orderBy = orderByToObject(params.orderBy);');
			// }
			writer.blankLine();
			writer.writeLine('const { sql, paramsValues } = buildSql(params);');
			writer.write(`return client.query({ text: sql, rowMode: 'array', values: paramsValues })`).newLine();
			writer.indent().write(`.then(res => res.rows.map(row => mapArrayTo${resultTypeName}(row, params?.select)));`)
		});
		writer.blankLine();
		writeBuildSqlFunction(writer, {
			dynamicParamsTypeName,
			columns: tsDescriptor.columns,
			parameters: tsDescriptor.parameters,
			dynamicQueryInfo,
			selectColumnsTypeName,
			placeHolderType: 'numbered',
			hasOrderBy: tsDescriptor.orderByColumns != null,
			toDrive: (variable, param) => `${variable}.${param.name}`
		})

		writer.blankLine();
		writeMapToResultFunction(writer, {
			columns: tsDescriptor.columns,
			resultTypeName,
			selectColumnsTypeName,
			fromDriver: (variable, _param) => variable
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
		writeWhereConditionFunction(writer, whereTypeName, tsDescriptor.columns);
	}

	if (tsDescriptor.nestedDescriptor2) {
		const relations = tsDescriptor.nestedDescriptor2;
		relations.forEach((relation) => {
			const relationType = generateRelationType(capitalizedName, relation.name);
			writer.blankLine();
			writer.write(`export type ${relationType} = `).block(() => {
				const uniqueNameFields = renameInvalidNames(relation.fields.map((f) => f.name));
				relation.fields.forEach((field, index) => {
					const nullable = field.notNull ? '' : ' | null';
					writer.writeLine(`${uniqueNameFields[index]}: ${field.tsType}${nullable};`);
				});
				relation.relations.forEach((field) => {
					const nestedRelationType = generateRelationType(capitalizedName, field.tsType);
					const nullable = field.notNull ? '' : ' | null';
					writer.writeLine(`${field.name}: ${nestedRelationType}${nullable};`);
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
			orderByTypeName: orderByTypeName,
			orderByColumns: tsDescriptor.orderByColumns || [],
			generateNested: tsDescriptor.nestedDescriptor2 != null,
			nestedType: tsDescriptor.nestedDescriptor2 ? tsDescriptor.nestedDescriptor2[0].name : '',
		}
		codeWriter.writeExecFunction(writer, execFunctionParams);
	}

	if (tsDescriptor.nestedDescriptor2) {
		const relations = tsDescriptor.nestedDescriptor2;
		relations.forEach((relation) => {
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
			writer.writeLine(`orderBy: ${orderByTypeName}[];`);
		}
	});
}

function writeResultType(writer: CodeBlockWriter, resultTypeName: string, columns: TsFieldDescriptor[]) {
	writer.write(`export type ${resultTypeName} =`).block(() => {
		columns.forEach((field) => {
			const optionalOp = field.optional ? '?' : '';
			const nullable = field.notNull ? '' : ' | null';
			writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${nullable};`);
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
				const nullable = field.type.notNull ? '' : ' | null';
				const jsonTypeName = createJsonType(typeName, field.key);
				writer.writeLine(`${field.key}: ${jsonTypeName}Type${nullable};`);
			} else if (isJsonArrayType(field.type)) {
				const jsonParentName = createJsonType(typeName, field.key);
				const jsonTypeName = createJsonArrayType(jsonParentName, field.type);
				writer.writeLine(`${field.key}: ${jsonTypeName};`);
			} else if (isJsonFieldType(field.type)) {
				const nullable = field.type.notNull ? '' : ' | null';
				writer.writeLine(`${field.key}: ${mapColumnType(field.type.type, true)}${nullable};`);
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
	if (schemaDef.orderByColumns) {
		tsDescriptor.orderByColumns = schemaDef.orderByColumns;
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
		optional: dynamicQuery ? true : false,
		notNull: dynamicQuery ? true : col.notNull
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
	orderByTypeName: string;
	orderByColumns: string[];
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
	const { functionName, paramsType, dataType, returnType, parameters, orderByTypeName, orderByColumns, generateNested, nestedType } = params;
	let functionParams = params.queryType === 'Copy' ? 'client: pg.Client | pg.PoolClient' : 'client: pg.Client | pg.Pool | pg.PoolClient'
	if (params.data.length > 0) {
		functionParams += `, data: ${dataType}`;
	}
	if (parameters.length > 0 || orderByColumns.length > 0) {
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
	if (orderByColumns.length > 0) {
		writer.blankLine();
		writeBuildOrderByBlock(writer, orderByColumns, orderByTypeName);
	}

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
		if (param.notNull && !param.optional) {
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

export function generateCrud(queryType: CrudQueryType, tableName: string, dbSchema: PostgresColumnSchema[]) {

	const queryName = getQueryName(queryType, tableName);
	const camelCaseName = convertToCamelCaseName(queryName);
	const capitalizedName = capitalize(camelCaseName);
	const dataTypeName = `${capitalizedName}Data`;
	const resultTypeName = `${capitalizedName}Result`;
	const paramsTypeName = `${capitalizedName}Params`;

	const writer = createCodeBlockWriter();

	const allColumns = dbSchema.filter((col) => col.table === tableName);
	const keyColumns = allColumns.filter((col) => col.column_key === 'PRI');
	if (keyColumns.length === 0) {
		keyColumns.push(...allColumns.filter((col) => col.column_key === 'UNI'));
	}
	const keys = keyColumns.map(col => ({ ...mapPostgresColumnSchemaToTsFieldDescriptor(col), optional: false }));
	const nonKeys = allColumns.filter(col => col.column_key !== 'PRI').map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col));


	const codeWriter = getCodeWriter('pg');
	codeWriter.writeImports(writer, queryType);
	const uniqueDataParams = queryType === 'Update' ? nonKeys.map(col => ({ ...col, optional: true })) : [];
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
	const columns = allColumns.map(col => ({ ...mapPostgresColumnSchemaToTsFieldDescriptor(col), optional: false }));
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
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool | pg.PoolClient, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
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
	const { tableName, queryName, paramsTypeName, resultTypeName, nonKeys } = crudParamters;
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool | pg.PoolClient, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
		const hasOptional = nonKeys.some(field => field.optional);
		if (hasOptional) {
			writer.writeLine(`const insertColumns = [${nonKeys.map(col => `'${col.name}'`).join(', ')}] as const;`)
			writer.writeLine('const columns: string[] = [];');
			writer.writeLine('const placeholders: string[] = [];');
			writer.writeLine('const values: unknown[] = [];');
			writer.blankLine();
			writer.writeLine('let parameterNumber = 1;');
			writer.blankLine();
			writer.write('for (const column of insertColumns)').block(() => {
				writer.writeLine('const value = params[column];');
				writer.write('if (value !== undefined)').block(() => {
					writer.writeLine('columns.push(column);');
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
		writer.indent().write(`.then(res => res.rows[0] ?? null);`);
	})
	return writer.toString();
}

function writeCrudUpdate(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { tableName, queryName, dataTypeName, paramsTypeName, resultTypeName, nonKeys, keys } = crudParamters;
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool | pg.PoolClient, data: ${dataTypeName}, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
		writer.writeLine(`const updateColumns = [${nonKeys.map(col => `'${col.name}'`).join(', ')}] as const;`);
		writer.writeLine('const updates: string[] = [];');
		writer.writeLine('const values: unknown[] = [];');
		writer.writeLine('let parameterNumber = 1;');
		writer.blankLine();
		writer.write('for (const column of updateColumns)').block(() => {
			writer.writeLine('const value = data[column];');
			writer.write('if (value !== undefined)').block(() => {
				writer.writeLine('updates.push(`${column} = $${parameterNumber++}`);');
				writer.writeLine('values.push(value);');
			})
		})
		writer.writeLine('if (updates.length === 0) return null;');
		const keyName = keys[0];
		writer.writeLine(`values.push(params.${keyName});`);
		writer.blankLine();
		writer.writeLine(`const sql = \`UPDATE ${tableName} SET \${updates.join(', ')} WHERE ${keyName} = \$\${parameterNumber} RETURNING *\`;`);

		writer.writeLine('return client.query({ text: sql, values })');
		writer.indent().write('.then(res => res.rows[0] ?? null);');
	})
	return writer.toString();
}

function writeCrudDelete(writer: CodeBlockWriter, crudParamters: CrudParameters): string {
	const { tableName, queryName, paramsTypeName, resultTypeName, columns, keys } = crudParamters;
	const keyName = keys[0];
	writer.write(`export async function ${queryName}(client: pg.Client | pg.Pool | pg.PoolClient, params: ${paramsTypeName}): Promise<${resultTypeName} | null>`).block(() => {
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

export function mapPostgresColumnSchemaToTsFieldDescriptor(col: PostgresColumnSchema): TsFieldDescriptor {
	return {
		name: col.column_name,
		notNull: !col.is_nullable,
		optional: col.column_default,
		tsType: mapColumnType(col.type),
	}
}
