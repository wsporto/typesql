import CodeBlockWriter from 'code-block-writer';
import { capitalize, convertToCamelCaseName, removeDuplicatedParameters2, TsDescriptor } from './code-generator';
import { ParameterDef, PgDielect, QueryType, SchemaDef, TsFieldDescriptor, TsParameterDescriptor, TypeSqlError } from './types';
import { describeQuery } from './postgres-query-analyzer/describe';
import { ColumnInfo, ColumnSchema } from './mysql-query-analyzer/types';
import { mapColumnType, postgresTypes } from './dialects/postgres';
import { PostgresType } from './sqlite-query-analyzer/types';
import { preprocessSql } from './describe-query';
import { okAsync, ResultAsync } from 'neverthrow';
import { PostgresColumnSchema } from './drivers/types';
import { getQueryName } from './sqlite-query-analyzer/code-generator';



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

function _describeQuery(databaseClient: PgDielect, sql: string, namedParameters: string[]): ResultAsync<SchemaDef, TypeSqlError> {
	return describeQuery(databaseClient.client, sql, namedParameters);
}

function generateTsCode(
	sqlOld: string,
	queryName: string,
	dbSchema: SchemaDef,
	client: 'pg',
	isCrud = false
): string {

	const { sql } = dbSchema;

	const writer = new CodeBlockWriter({
		useTabs: true
	});

	const camelCaseName = convertToCamelCaseName(queryName);
	const capitalizedName = capitalize(camelCaseName);
	const dataTypeName = `${capitalizedName}Data`;
	const resultTypeName = `${capitalizedName}Result`;
	const paramsTypeName = `${capitalizedName}Params`;
	const orderByTypeName = `${capitalizedName}OrderBy`;

	const tsDescriptor = createTsDescriptor(dbSchema);
	const uniqueParams = removeDuplicatedParameters2(tsDescriptor.parameters);
	const generateOrderBy = tsDescriptor.orderByColumns != null && tsDescriptor.orderByColumns.length > 0;

	const codeWriter = getCodeWriter(client);
	codeWriter.writeImports(writer);
	const uniqueDataParams = removeDuplicatedParameters2(tsDescriptor.data || []);
	if (uniqueDataParams.length > 0) {
		writer.blankLine();
		writeDataType(writer, dataTypeName, uniqueDataParams);
	}
	if (uniqueParams.length > 0 || generateOrderBy) {
		writer.blankLine();
		writeParamsType(writer, paramsTypeName, uniqueParams, generateOrderBy, orderByTypeName)
	}
	writer.blankLine();
	writeResultType(writer, resultTypeName, tsDescriptor.columns);
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
		returning: dbSchema.returning || false
	}
	codeWriter.writeExecFunction(writer, execFunctionParams);

	return writer.toString();
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

function createTsDescriptor(schemaDef: SchemaDef) {
	const tsDescriptor: TsDescriptor = {
		columns: getColumnsForQuery(schemaDef),
		parameters: schemaDef.parameters.map((param) => mapParameterToTsFieldDescriptor(param)),
		sql: '',
		queryType: schemaDef.queryType,
		multipleRowsResult: schemaDef.multipleRowsResult,
		parameterNames: [],
		data: schemaDef.data?.map(param => mapParameterToTsFieldDescriptor(param))
	}
	return tsDescriptor;
}

function mapColumnInfoToTsFieldDescriptor(col: ColumnInfo): TsFieldDescriptor {
	const tsField: TsFieldDescriptor = {
		name: col.columnName,
		tsType: mapColumnType(col.type as PostgresType),
		notNull: col.notNull
	}
	return tsField;
}

function mapParameterToTsFieldDescriptor(param: ParameterDef): TsParameterDescriptor {
	const tsDesc: TsParameterDescriptor = {
		name: param.name,
		tsType: mapColumnType(param.columnType as PostgresType),
		notNull: param.notNull ? param.notNull : false,
		toDriver: '',
		isArray: param.columnType.startsWith('_')
	};
	return tsDesc;
}

function getCodeWriter(client: 'pg'): CodeWriter {
	return postgresCodeWriter;
}

type CodeWriter = {
	writeImports: (writer: CodeBlockWriter) => void;
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
}

const postgresCodeWriter: CodeWriter = {
	writeImports: function (writer: CodeBlockWriter): void {
		writer.writeLine(`import pg from 'pg';`);
	},

	writeExecFunction: function (writer: CodeBlockWriter, params: ExecFunctionParameters): void {
		const { functionName, paramsType, dataType, returnType, parameters } = params;
		let functionParams = 'client: pg.Client | pg.Pool';
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
		function writeSql(writer: CodeBlockWriter, sql: string) {
			const sqlSplit = sql.split('\n');
			writer.write('const sql = `').newLine();
			sqlSplit.forEach((sqlLine) => {
				writer.indent().write(sqlLine).newLine();
			});
			writer.indent().write('`').newLine();
		}
	}
}

function getColumnsForQuery(schemaDef: SchemaDef): TsFieldDescriptor[] {
	if (schemaDef.queryType === 'Select' || schemaDef.returning) {
		return schemaDef.columns.map(col => mapColumnInfoToTsFieldDescriptor(col))
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

export function generateCrud(client: 'pg', queryType: QueryType, tableName: string, dbSchema: ColumnSchema[]) {

	const queryName = getQueryName(queryType, tableName);
	const camelCaseName = convertToCamelCaseName(queryName);
	const capitalizedName = capitalize(camelCaseName);
	const dataTypeName = `${capitalizedName}Data`;
	const resultTypeName = `${capitalizedName}Result`;
	const paramsTypeName = `${capitalizedName}Params`;

	const writer = new CodeBlockWriter({
		useTabs: true
	});

	const allColumns = dbSchema.filter((col) => col.table === tableName);
	const keys = allColumns.filter((col) => col.columnKey === 'PRI');
	if (keys.length === 0) {
		keys.push(...allColumns.filter((col) => col.columnKey === 'UNI'));
	}
	const nonKeys = allColumns.filter(col => col.columnKey !== 'PRI');

	const codeWriter = getCodeWriter(client);
	codeWriter.writeImports(writer);
	const uniqueDataParams = queryType === 'Update' ? nonKeys.map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col)) : [];
	if (uniqueDataParams.length > 0) {
		writer.blankLine();
		writeDataType(writer, dataTypeName, uniqueDataParams);
	}
	const uniqueParams = queryType === 'Insert' ? nonKeys.map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col)) : keys.map(col => mapPostgresColumnSchemaToTsFieldDescriptor(col));
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
		nonKeys: nonKeys.map(col => col.column),
		keys: keys.map(col => col.column)
	}

	const result = writeCrud(writer, crudParameters);

	return result;
}

type CrudParameters = {
	queryType: QueryType;
	tableName: string;
	queryName: string;
	dataTypeName: string;
	paramsTypeName: string;
	resultTypeName: string;
	columns: TsFieldDescriptor[];
	nonKeys: string[];
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
		writer.writeLine('const sql = `');
		writer.indent().write(`INSERT INTO ${tableName} (${nonKeys.join(',')})`).newLine();
		writer.indent().write(`VALUES (${nonKeys.map((_, index) => `$${index + 1}`).join(',')})`).newLine();
		writer.indent().write('RETURNING *').newLine();
		writer.indent().write('`').newLine();
		writer.writeLine(`return client.query({ text: sql, values: [${nonKeys.map(col => `params.${col}`)}] })`);
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
		writer.writeLine('let update = false;');
		nonKeys.forEach((col, index) => {
			writer.write(`if (data.${col} !== undefined)`).block(() => {
				writer.writeLine(`sql += ' ${col} = $${index + 1}';`)
				writer.writeLine(`values.push(data.${col});`);
				writer.writeLine('update = true;');
			})
		})
		const keyName = keys[0];
		writer.writeLine(`sql += ' WHERE ${keyName} = $${nonKeys.length + 1} RETURNING *';`);
		writer.writeLine(`values.push(params.${keyName});`);
		writer.write('if (update)').block(() => {
			writer.writeLine('return client.query({ text: sql, values })');
			writer.indent().write(`.then(res => mapArrayTo${resultTypeName}(res));`);
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
		tsType: mapColumnType(col.column_type as PostgresType),
	}
}
