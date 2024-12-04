import { ParameterDef, SchemaDef, TypeSqlError } from '../types';
import { PostgresColumnSchema, DescribeQueryColumn, DescribeQueryResult, PostgresType } from '../drivers/types';
import { postgresDescribe, postgresAnalyze, loadDbSchema } from '../drivers/postgres';
import { Sql } from 'postgres';
import { ColumnInfo } from '../mysql-query-analyzer/types';
import { parseSql } from './parser';
import { replacePostgresParams } from '../sqlite-query-analyzer/replace-list-params';
import { ok, Result, ResultAsync } from 'neverthrow';

const postgresTypes: PostgresType = {
	23: 'int4',
	25: 'text'
}

function describeQueryRefine(sql: string, schema: PostgresColumnSchema[], postgresDescribeResult: DescribeQueryResult, namedParameters: string[]): Result<SchemaDef, string> {

	const columnNullability = transformToNullabilityMapping(schema);
	const traverseResult = parseSql(sql);
	const paramNames = postgresDescribeResult.parameters.map((_, index) => namedParameters[index] ? namedParameters[index] : `param${index + 1}`);

	const newSql = replacePostgresParams(sql, traverseResult.parameterList, paramNames);

	const descResult: SchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: postgresDescribeResult.multipleRowsResult,
		columns: postgresDescribeResult.columns.map(col => mapToColumnInfo(col, postgresTypes, columnNullability)),
		parameters: postgresDescribeResult.parameters.map((param, index) => mapToParamDef(paramNames[index], param, traverseResult.parameterList[index]))
	}
	return ok(descResult);
}

export type NullabilityMapping = {
	[key: string]: boolean;  // key is "oid-column_name" and value is the is_nullable boolean
};

export const transformToNullabilityMapping = (schema: PostgresColumnSchema[]): NullabilityMapping => {
	return schema.reduce((mapping, column) => {
		const key = `${column.oid}-${column.column_name}`;
		mapping[key] = !column.is_nullable;
		return mapping;
	}, {} as NullabilityMapping);
};

function mapToColumnInfo(col: DescribeQueryColumn, posgresTypes: PostgresType, nullabilityMapping: NullabilityMapping): ColumnInfo {
	return {
		columnName: col.name,
		notNull: !!nullabilityMapping[`${col.tableId}-${col.name}`],
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
	const schemaTask = loadDbSchema(postgres);
	const analyzeTask = postgresDescribe(postgres, sql)
		.andThen(describeResult => postgresAnalyze(postgres, sql, describeResult.parameters.length)
			.map(analyzeResult => {
				const rows = parseQueryPlan(analyzeResult);
				const result: DescribeQueryResult = {
					...describeResult,
					multipleRowsResult: rows > 1,
				}
				return result
			})
		);
	return ResultAsync.combine([schemaTask, analyzeTask])
		.andThen(([schema, analyzeResult]) => describeQueryRefine(sql, schema, analyzeResult, namedParameters))
		.mapErr(err => {
			return {
				name: 'error',
				description: err
			}
		});
}

function parseQueryPlan(queryPlan: string): number {
	const regex = /rows=(\d+)/;
	const match = queryPlan.match(regex);
	if (match) {
		return parseInt(match[1], 10); // match[1] is the captured number after 'rows='
	}
	return 100;
}