import { ParameterDef, SchemaDef, TypeSqlError } from '../types';
import { PostgresColumnSchema, DescribeQueryColumn, DescribeQueryResult, PostgresType, PostgresDescribe } from '../drivers/types';
import { postgresDescribe, postgresAnalyze, loadDbSchema } from '../drivers/postgres';
import { Sql } from 'postgres';
import { ColumnInfo } from '../mysql-query-analyzer/types';
import { parseSql, PostgresTraverseResult } from './parser';
import { replacePostgresParams, replacePostgresParamsWithValues } from '../sqlite-query-analyzer/replace-list-params';
import { ok, Result, ResultAsync, okAsync } from 'neverthrow';

export const postgresTypes: PostgresType = {
	23: 'int4',
	25: 'text',
	700: 'float4'
}

function describeQueryRefine(sql: string, schema: PostgresColumnSchema[], postgresDescribeResult: DescribeQueryResult, traverseResult: PostgresTraverseResult, namedParameters: string[]): Result<SchemaDef, string> {

	const paramNames = postgresDescribeResult.parameters.map((_, index) => namedParameters[index] ? namedParameters[index] : `param${index + 1}`);

	const newSql = replacePostgresParams(sql, traverseResult.parameterList, paramNames);

	const descResult: SchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: postgresDescribeResult.multipleRowsResult,
		columns: getColumnsForQuery(traverseResult, postgresDescribeResult),
		parameters: traverseResult.queryType === 'Update'
			? getParamtersForWhere(traverseResult, postgresDescribeResult, paramNames)
			: getParamtersForQuery(traverseResult, postgresDescribeResult, paramNames)
	}
	if (traverseResult.queryType === 'Update') {
		descResult.data = getDataForQuery(traverseResult, postgresDescribeResult, paramNames);
	}
	return ok(descResult);
}

export type NullabilityMapping = {
	[key: string]: boolean;  // key is "oid-column_name" and value is the is_nullable boolean
};

function mapToColumnInfo(col: DescribeQueryColumn, posgresTypes: PostgresType, notNull: boolean): ColumnInfo {
	return {
		columnName: col.name,
		notNull: notNull,
		type: posgresTypes[col.typeId] as any,
		table: col.tableId == 0 ? '' : 'table'
	}
}

function mapToParamDef(paramName: string, paramType: number, notNull: boolean, isList: boolean): ParameterDef {
	const arrayType = isList ? '[]' : ''
	return {
		name: paramName,
		notNull,
		columnType: `${postgresTypes[paramType]}${arrayType}` as any
	}
}

export function describeQuery(postgres: Sql, sql: string, namedParameters: string[]): ResultAsync<SchemaDef, TypeSqlError> {
	return loadDbSchema(postgres)
		.andThen(dbSchema => {
			const parseResult = parseSql(sql, dbSchema);
			return postgresDescribe(postgres, sql)
				.andThen(describeResult => getMultipleRowInfo(postgres, sql, describeResult, parseResult))
				.andThen(analyzeResult => describeQueryRefine(sql, dbSchema, analyzeResult, parseResult, namedParameters));
		}).mapErr(err => {
			return {
				name: 'error',
				description: err
			}
		});
}

function getMultipleRowInfo(postgres: Sql, sql: string, describeResult: PostgresDescribe, parseResult: PostgresTraverseResult): ResultAsync<DescribeQueryResult, string> {
	if (parseResult.queryType === 'Select') {
		const newSql = replacePostgresParamsWithValues(sql, parseResult.parameterList, describeResult.parameters);
		return postgresAnalyze(postgres, newSql).map(analyzeResult => {
			const singleRow = isSingleRow(analyzeResult);
			const result: DescribeQueryResult = {
				...describeResult,
				multipleRowsResult: !singleRow
			}
			return result;
		});
	}
	const result: DescribeQueryResult = {
		...describeResult,
		multipleRowsResult: false
	}
	return okAsync(result);
}

function isSingleRow(queryPlans: string[]): boolean {
	const parseResult = queryPlans
		.map(queryPlan => parseSingleQueryPlan(queryPlan))
		.filter(rows => rows != null)
		.every(value => value === 1);
	return parseResult;
}

function parseSingleQueryPlan(queryPlan: string): number | null {
	const regex = /rows=(\d+)/;
	const match = queryPlan.match(regex);
	if (match) {
		return parseInt(match[1], 10); // match[1] is the captured number after 'rows='
	}
	return null;
}

function getColumnsForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: DescribeQueryResult): ColumnInfo[] {
	return postgresDescribeResult.columns.map((col, index) => mapToColumnInfo(col, postgresTypes, traverseResult.columnsNullability[index]))
}

function getParamtersForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: DescribeQueryResult, paramNames: string[]): ParameterDef[] {
	return postgresDescribeResult.parameters
		.map((param, index) => mapToParamDef(paramNames[index], param, traverseResult.parametersNullability[index] ?? true, traverseResult.parameterList[index]))
}

function getParamtersForWhere(traverseResult: PostgresTraverseResult, postgresDescribeResult: DescribeQueryResult, paramNames: string[]): ParameterDef[] {
	const indexOffset = traverseResult.parametersNullability.length;
	return postgresDescribeResult.parameters.slice(indexOffset)
		.map((param, index) => mapToParamDef(paramNames[index + indexOffset], param, traverseResult.whereParamtersNullability?.[index] ?? true, traverseResult.parameterList[index + indexOffset]))
}

function getDataForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: DescribeQueryResult, paramNames: string[]): ParameterDef[] {
	return postgresDescribeResult.parameters.slice(0, traverseResult.parametersNullability.length)
		.map((param, index) => mapToParamDef(paramNames[index], param, traverseResult.parametersNullability[index] ?? true, traverseResult.parameterList[index]))
}