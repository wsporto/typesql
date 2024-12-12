import CodeBlockWriter from 'code-block-writer';
import { capitalize, convertToCamelCaseName, removeDuplicatedParameters2, TsDescriptor } from './code-generator';
import { ParameterDef, PgDielect, SchemaDef, TsFieldDescriptor, TsParameterDescriptor, TypeSqlError } from './types';
import { describeQuery } from './postgres-query-analyzer/describe';
import { ColumnInfo } from './mysql-query-analyzer/types';
import { mapColumnType } from './dialects/postgres';
import { PostgresType } from './sqlite-query-analyzer/types';
import { preprocessSql } from './describe-query';
import { okAsync, ResultAsync } from 'neverthrow';



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
		writer.write(`export type ${dataTypeName} =`).block(() => {
			uniqueDataParams.forEach((field) => {
				const optionalOp = field.optional ? '?' : '';
				const orNull = field.notNull ? '' : ' | null';
				writer.writeLine(`${field.name}${optionalOp}: ${field.tsType}${orNull};`);
			});
			if (generateOrderBy) {
				writer.writeLine(`orderBy: [${orderByTypeName}, 'asc' | 'desc'][];`);
			}
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
		data: tsDescriptor.data || []
	}
	codeWriter.writeExecFunction(writer, execFunctionParams);

	return writer.toString();
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
		const allParamters = [...params.data.map(param => paramToDriver(param, 'data')), ...parameters.map(param => paramToDriver(param, 'params'))];
		const paramValues = allParamters.length > 0 ? `, values: [${allParamters.join(', ')}]` : '';
		const orNull = params.queryType === 'Insert' || params.queryType === 'Update' || params.queryType === 'Delete' ? '' : ' | null';
		const functionReturnType = params.multipleRowsResult ? `${returnType}[]` : `${returnType}${orNull}`;
		const hasListParams = parameters.some(param => !param.isArray && param.tsType.endsWith('[]'));
		if (hasListParams) {
			writer.writeLine('let currentIndex: number;');
		}
		writer.write(`export async function ${functionName}(${functionParams}): Promise<${functionReturnType}>`).block(() => {
			if (hasListParams) {
				writer.writeLine('currentIndex = 0;');
			}
			writeSql(writer, params.sql);
			if (params.queryType === 'Insert' || params.queryType === 'Update' || params.queryType === 'Delete') {
				writer.write(`return client.query({ text: sql${paramValues} })`).newLine();
				writer.indent().write(`.then(res => mapArrayTo${returnType}(res));`)
			}
			else {
				writer.write(`return client.query({ text: sql, rowMode: 'array'${paramValues} })`).newLine();
				if (params.multipleRowsResult) {
					writer.indent().write(`.then(res => res.rows.map(row => mapArrayTo${returnType}(row)));`)
				}
				else {
					writer.indent().write(`.then(res => res.rows.length > 0 ? mapArrayTo${returnType}(res.rows[0]) : null);`)
				}
			}
		});

		if (hasListParams) {
			writer.blankLine();
			writer.write(`function generatePlaceholders(paramsArray: any[]): string`).block(() => {
				writer.write('return paramsArray').newLine();
				writer.indent().write('.map(() => {').newLine();
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
					if (params.queryType === 'Insert' || params.queryType === 'Update' || params.queryType === 'Delete') {
						writer.writeLine(`${col.name}: data.${col.name}${separator}`);
					}
					else {
						writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
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
			const listParam = `...${objName}.${param.name}`;
			return param.isArray ? `[${listParam}]` : listParam;
		}
	}
}

function getColumnsForQuery(schemaDef: SchemaDef): TsFieldDescriptor[] {
	if (schemaDef.queryType === 'Insert' || schemaDef.queryType === 'Update' || schemaDef.queryType === 'Delete') {
		const columns: TsFieldDescriptor[] = [
			{
				name: 'rowCount',
				tsType: 'number',
				notNull: true
			}
		]
		return columns;
	}
	return schemaDef.columns.map(col => mapColumnInfoToTsFieldDescriptor(col))
}

