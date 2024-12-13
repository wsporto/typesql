import { ParameterDef, SchemaDef, TypeSqlError } from '../types';
import { DescribeQueryColumn, PostgresType, PostgresDescribe } from '../drivers/types';
import { postgresDescribe, loadDbSchema } from '../drivers/postgres';
import { Sql } from 'postgres';
import { ColumnInfo } from '../mysql-query-analyzer/types';
import { safeParseSql } from './parser';
import { replacePostgresParams } from '../sqlite-query-analyzer/replace-list-params';
import { ok, Result, ResultAsync, err } from 'neverthrow';
import { postgresTypes } from '../dialects/postgres';
import { PostgresTraverseResult } from './traverse';

function describeQueryRefine(sql: string, postgresDescribeResult: PostgresDescribe, traverseResult: PostgresTraverseResult, namedParameters: string[]): Result<SchemaDef, string> {

	const paramNames = postgresDescribeResult.parameters.map((_, index) => namedParameters[index] ? namedParameters[index] : `param${index + 1}`);

	const newSql = replacePostgresParams(sql, traverseResult.parameterList, paramNames);

	const descResult: SchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: traverseResult.multipleRowsResult,
		columns: getColumnsForQuery(traverseResult, postgresDescribeResult),
		parameters: traverseResult.queryType === 'Update'
			? getParamtersForWhere(traverseResult, postgresDescribeResult, paramNames)
			: getParamtersForQuery(traverseResult, postgresDescribeResult, paramNames)
	}
	if (traverseResult.queryType === 'Update') {
		descResult.data = getDataForQuery(traverseResult, postgresDescribeResult, paramNames);
	}
	if (traverseResult.returning) {
		descResult.returning = traverseResult.returning;
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
		type: posgresTypes[col.typeId] as any ?? '?',
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
			const parseResult = safeParseSql(sql, dbSchema);
			if (parseResult.isErr()) {
				return err(parseResult.error)
			}
			return postgresDescribe(postgres, sql)
				.andThen(analyzeResult => describeQueryRefine(sql, analyzeResult, parseResult.value, namedParameters));
		}).mapErr(err => {
			return {
				name: 'error',
				description: err
			}
		});
}

function getColumnsForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe): ColumnInfo[] {
	return postgresDescribeResult.columns.map((col, index) => mapToColumnInfo(col, postgresTypes, traverseResult.columnsNullability[index]))
}

function getParamtersForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, paramNames: string[]): ParameterDef[] {
	return postgresDescribeResult.parameters
		.map((param, index) => mapToParamDef(paramNames[index], param, traverseResult.parametersNullability[index] ?? true, traverseResult.parameterList[index]))
}

function getParamtersForWhere(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, paramNames: string[]): ParameterDef[] {
	const indexOffset = traverseResult.parametersNullability.length;
	return postgresDescribeResult.parameters.slice(indexOffset)
		.map((param, index) => mapToParamDef(paramNames[index + indexOffset], param, traverseResult.whereParamtersNullability?.[index] ?? true, traverseResult.parameterList[index + indexOffset]))
}

function getDataForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, paramNames: string[]): ParameterDef[] {
	return postgresDescribeResult.parameters.slice(0, traverseResult.parametersNullability.length)
		.map((param, index) => mapToParamDef(paramNames[index], param, traverseResult.parametersNullability[index] ?? true, traverseResult.parameterList[index]))
}
