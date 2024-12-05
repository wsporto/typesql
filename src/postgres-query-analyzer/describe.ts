import { ParameterDef, SchemaDef, TypeSqlError } from '../types';
import { PostgresColumnSchema, DescribeQueryColumn, DescribeQueryResult, PostgresType } from '../drivers/types';
import { postgresDescribe, postgresAnalyze, loadDbSchema } from '../drivers/postgres';
import { Sql } from 'postgres';
import { ColumnInfo } from '../mysql-query-analyzer/types';
import { parseSql, PostgresTraverseResult } from './parser';
import { replacePostgresParams, replacePostgresParamsWithValues } from '../sqlite-query-analyzer/replace-list-params';
import { ok, Result, ResultAsync } from 'neverthrow';

export const postgresTypes: PostgresType = {
	23: 'int4',
	25: 'text'
}

function describeQueryRefine(sql: string, schema: PostgresColumnSchema[], postgresDescribeResult: DescribeQueryResult, namedParameters: string[]): Result<SchemaDef, string> {

	const traverseResult = parseSql(sql, schema);
	const columnNullability = traverseResult.columnsNullability;
	const paramNames = postgresDescribeResult.parameters.map((_, index) => namedParameters[index] ? namedParameters[index] : `param${index + 1}`);

	const newSql = replacePostgresParams(sql, traverseResult.parameterList, paramNames);

	const descResult: SchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: postgresDescribeResult.multipleRowsResult,
		columns: getColumnsForQuery(traverseResult, postgresDescribeResult),
		parameters: postgresDescribeResult.parameters.map((param, index) => mapToParamDef(paramNames[index], param, traverseResult.parameterList[index]))
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

function mapToParamDef(paramName: string, paramType: number, isList: boolean): ParameterDef {
	const arrayType = isList ? '[]' : ''
	return {
		name: paramName,
		notNull: true,
		columnType: `${postgresTypes[paramType]}${arrayType}` as any
	}
}

export function describeQuery(postgres: Sql, sql: string, namedParameters: string[]): ResultAsync<SchemaDef, TypeSqlError> {
	return loadDbSchema(postgres)
		.andThen(dbSchema => {
			return postgresDescribe(postgres, sql)
				.andThen(describeResult => {
					const parseResult = parseSql(sql, dbSchema);
					const newSql = replacePostgresParamsWithValues(sql, parseResult.parameterList, describeResult.parameters);
					return postgresAnalyze(postgres, newSql).map(analyzeResult => {
						const singleRow = isSingleRow(analyzeResult);
						const result: DescribeQueryResult = {
							...describeResult,
							multipleRowsResult: !singleRow,
						}
						return result;
					});
				}).andThen(analyzeResult => describeQueryRefine(sql, dbSchema, analyzeResult, namedParameters));
		}).mapErr(err => {
			return {
				name: 'error',
				description: err
			}
		});
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
	if (traverseResult.queryType === 'Insert') {
		return getColumnsForInsert();
	}
	return postgresDescribeResult.columns.map((col, index) => mapToColumnInfo(col, postgresTypes, traverseResult.columnsNullability[index]))
}

function getColumnsForInsert(): ColumnInfo[] {
	const columns: ColumnInfo[] = [
		{
			columnName: 'rowCount',
			type: 'int4',
			notNull: true
		}
	]
	return columns;
}
