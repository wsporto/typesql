import CodeBlockWriter from 'code-block-writer';
import { capitalize, convertToCamelCaseName, removeDuplicatedParameters2, TsDescriptor } from './code-generator';
import { ParameterDef, PgDielect, SchemaDef, TsFieldDescriptor, TsParameterDescriptor, TypeSqlError } from './types';
import { TaskEither, map } from 'fp-ts/lib/TaskEither';
import { describeQuery } from './postgres-query-analyzer/describe';
import { pipe } from 'fp-ts/lib/function';
import { ColumnInfo } from './mysql-query-analyzer/types';
import { mapColumnType } from './dialects/postgres';
import { PostgresType } from './sqlite-query-analyzer/types';
import { preprocessSql } from './describe-query';



export function generateCode(client: PgDielect, sql: string, queryName: string): TaskEither<TypeSqlError, string> {
	const { sql: processedSql, namedParameters } = preprocessSql(sql, 'postgres');
	return pipe(
		_describeQuery(client, processedSql, namedParameters),
		map(schemaDef => generateTsCode(processedSql, queryName, schemaDef, client.type))
	)
}

function _describeQuery(databaseClient: PgDielect, sql: string, namedParameters: string[]): TaskEither<TypeSqlError, SchemaDef> {
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
	const resultTypeName = `${capitalizedName}Result`;
	const paramsTypeName = `${capitalizedName}Params`;
	const orderByTypeName = `${capitalizedName}OrderBy`;

	const tsDescriptor = createTsDescriptor(dbSchema);
	const uniqueParams = removeDuplicatedParameters2(tsDescriptor.parameters);
	const generateOrderBy = tsDescriptor.orderByColumns != null && tsDescriptor.orderByColumns.length > 0;

	const codeWriter = getCodeWriter(client);
	codeWriter.writeImports(writer);
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
		multipleRowsResult: tsDescriptor.multipleRowsResult,
		functionName: queryName,
		paramsType: paramsTypeName,
		returnType: resultTypeName,
		columns: tsDescriptor.columns,
		parameters: tsDescriptor.parameters
	}
	codeWriter.writeExecFunction(writer, execFunctionParams);

	return writer.toString();
}

function createTsDescriptor(schemaDef: SchemaDef) {
	const tsDescriptor: TsDescriptor = {
		columns: schemaDef.columns.map(col => mapColumnInfoToTsFieldDescriptor(col)),
		parameters: schemaDef.parameters.map((param) => mapParameterToTsFieldDescriptor(param)),
		sql: '',
		queryType: 'Select',
		multipleRowsResult: schemaDef.multipleRowsResult,
		parameterNames: []
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
		toDriver: ''
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
	multipleRowsResult: boolean;
	functionName: string;
	returnType: string;
	paramsType: string;
	columns: TsFieldDescriptor[];
	parameters: TsFieldDescriptor[];
}

const postgresCodeWriter: CodeWriter = {
	writeImports: function (writer: CodeBlockWriter): void {
		writer.writeLine(`import { Client } from 'pg'`);
	},

	writeExecFunction: function (writer: CodeBlockWriter, params: ExecFunctionParameters): void {
		const { functionName, paramsType, returnType, parameters } = params;
		const functionParams = parameters.length > 0 ? `client: Client, params: ${paramsType}` : 'client: Client';
		const paramValues = parameters.length > 0 ? `, values: [${parameters.map(param => paramToDriver(param, 'params')).join(', ')}]` : '';
		const functionReturnType = params.multipleRowsResult ? `${returnType}[]` : `${returnType} | null`;
		writer.write(`export async function ${functionName}(${functionParams}): Promise<${functionReturnType}>`).block(() => {
			writeSql(writer, params.sql);
			writer.write(`return client.query({ text: sql, rowMode: 'array'${paramValues} })`).newLine();
			if (params.multipleRowsResult) {
				writer.indent().write(`.then(res => res.rows.map(row => mapArrayTo${returnType}(row)));`)
			}
			else {
				writer.indent().write(`.then(res => res.rows.length > 0 ? mapArrayTo${returnType}(res.rows[0]) : null);`)
			}
		});

		const hasListParams = parameters.some(param => param.tsType.endsWith('[]'));
		if (hasListParams) {
			writer.blankLine();
			writer.writeLine('let currentIndex = 0;');
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
					writer.writeLine(`${col.name}: ${toDriver(`data[${index}]`, col)}${separator}`);
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

		function paramToDriver(param: TsFieldDescriptor, objName: string): any {
			return param.tsType.endsWith('[]') ? `...${objName}.${param.name}` : `${objName}.${param.name}`;
		}
	}
}
