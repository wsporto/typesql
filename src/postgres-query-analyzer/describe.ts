import { ParameterDef, SchemaDef, TypeSqlError } from '../types';
import { DescribeParameters, DescribeQueryColumn, PostgresColumnSchema, PostgresDescribe, PostgresType } from '../drivers/types';
import { postgresDescribe, loadDbSchema, loadEnums, EnumMap, EnumResult, loadCheckConstraints, CheckConstraintResult } from '../drivers/postgres';
import { Sql } from 'postgres';
import { ColumnInfo } from '../mysql-query-analyzer/types';
import { safeParseSql } from './parser';
import { replacePostgresParams } from '../sqlite-query-analyzer/replace-list-params';
import { ok, Result, ResultAsync, err } from 'neverthrow';
import { postgresTypes } from '../dialects/postgres';
import { NotNullInfo, PostgresTraverseResult } from './traverse';
import { describeNestedQuery } from '../sqlite-query-analyzer/sqlite-describe-nested-query';
import { isLeft } from 'fp-ts/lib/Either';
import { hasAnnotation } from '../describe-query';
import { describeDynamicQuery2 } from '../describe-dynamic-query';

function describeQueryRefine(describeParameters: DescribeParameters): Result<SchemaDef, TypeSqlError> {
	const { sql, dbSchema, postgresDescribeResult, enumsTypes, checkConstraints, namedParameters } = describeParameters;
	const generateNestedInfo = hasAnnotation(sql, '@nested');
	const generateDynamicQueryInfo = hasAnnotation(sql, '@dynamicQuery');

	const parseResult = safeParseSql(sql, dbSchema, { collectNestedInfo: generateNestedInfo, collectDynamicQueryInfo: generateDynamicQueryInfo });
	if (parseResult.isErr()) {
		return err({
			name: 'ParserError',
			description: parseResult.error
		})
	}
	const traverseResult = parseResult.value;
	const paramNames = namedParameters.length > 0 ? namedParameters : Array.from({ length: traverseResult.parameterList.length }).map((_, index) => `param${index + 1}`);
	//replace list parameters
	const newSql = replacePostgresParams(sql, traverseResult.parameterList, paramNames);

	const descResult: SchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: traverseResult.multipleRowsResult,
		columns: getColumnsForQuery(traverseResult, postgresDescribeResult, enumsTypes, checkConstraints),
		parameters: traverseResult.queryType === 'Update'
			? getParamtersForWhere(traverseResult, postgresDescribeResult, enumsTypes, paramNames)
			: getParamtersForQuery(traverseResult, postgresDescribeResult, enumsTypes, paramNames)
	}
	if (traverseResult.queryType === 'Update') {
		descResult.data = getDataForQuery(traverseResult, postgresDescribeResult, enumsTypes, paramNames);
	}
	if (traverseResult.returning) {
		descResult.returning = traverseResult.returning;
	}
	if (traverseResult.relations) {
		const nestedResult = describeNestedQuery(descResult.columns, traverseResult.relations || []);
		if (isLeft(nestedResult)) {
			return err({
				name: 'ParserError',
				description: 'Error during nested query result: ' + nestedResult.left.description
			})
		}
		descResult.nestedInfo = nestedResult.right;
	}
	if (traverseResult.dynamicQueryInfo) {
		const dynamicSqlQueryInfo = describeDynamicQuery2(traverseResult.dynamicQueryInfo, namedParameters, []);
		descResult.dynamicSqlQuery2 = dynamicSqlQueryInfo;
	}
	return ok(descResult);
}

function createIndexToNameMap(names: string[]): Map<number, string> {
	const indexToName = new Map<number, string>();
	const nameToIndex = new Map<string, number>();

	let currentIndex = 0;

	for (const name of names) {
		if (!nameToIndex.has(name)) {
			nameToIndex.set(name, currentIndex);
			indexToName.set(currentIndex, name);
			currentIndex++;
		}
	}

	return indexToName;
}

type TableNameHash = { [oid: number]: string }
function transformToMap(dbSchema: PostgresColumnSchema[]): TableNameHash {
	const hash = dbSchema.reduce((acc, { oid, table_name }) => {
		acc[oid] = table_name;
		return acc;
	}, {} as TableNameHash);
	return hash;
}

export type NullabilityMapping = {
	[key: string]: boolean;  // key is "oid-column_name" and value is the is_nullable boolean
};

function mapToColumnInfo(col: DescribeQueryColumn, posgresTypes: PostgresType, enumTypes: EnumMap, checkConstraints: CheckConstraintResult, colInfo: NotNullInfo): ColumnInfo {
	const constraintKey = `[${colInfo.table_schema}][${colInfo.table_name}][${colInfo.column_name}]`;
	return {
		columnName: col.name,
		notNull: !colInfo.is_nullable,
		type: createType(col.typeId, posgresTypes, enumTypes.get(col.typeId), checkConstraints[constraintKey]) as any ?? '?',
		table: colInfo.table_name
	}
}

function createType(typeId: number, postgresTypes: PostgresType, enumType?: EnumResult[], checkConstraint?: string) {
	if (enumType) {
		return createEnumType(enumType!);
	}
	if (checkConstraint) {
		return checkConstraint;
	}
	return postgresTypes[typeId];
}

function createEnumType(enumList: EnumResult[]) {
	const enumListStr = enumList.map(col => `'${col.enumlabel}'`).join(',');
	return `enum(${enumListStr})`;
}

function mapToParamDef(postgresTypes: PostgresType, enumTypes: EnumMap, paramName: string, paramType: number, notNull: boolean, isList: boolean): ParameterDef {
	const arrayType = isList ? '[]' : ''
	return {
		name: paramName,
		notNull,
		columnType: `${createType(paramType, postgresTypes, enumTypes.get(paramType))}${arrayType}` as any
	}
}

export function describeQuery(postgres: Sql, sql: string, namedParameters: string[]): ResultAsync<SchemaDef, TypeSqlError> {
	return ResultAsync.combine([loadDbSchema(postgres), loadEnums(postgres), loadCheckConstraints(postgres)])
		.andThen(([dbSchema, enumsTypes, checkConstraints]) => {
			return postgresDescribe(postgres, sql)
				.andThen(analyzeResult => {
					const describeParameters: DescribeParameters = {
						sql,
						postgresDescribeResult: analyzeResult,
						dbSchema,
						enumsTypes,
						checkConstraints,
						namedParameters
					}
					return describeQueryRefine(describeParameters);
				});
		})
}

function getColumnsForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, checkConstraints: CheckConstraintResult): ColumnInfo[] {
	return postgresDescribeResult.columns.map((col, index) => mapToColumnInfo(col, postgresTypes, enumTypes, checkConstraints, traverseResult.columns[index]))
}

function getParamtersForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, paramNames: string[]): ParameterDef[] {
	const namedParametersIndexes = createIndexToNameMap(paramNames);
	if (traverseResult.queryType === 'Copy') {
		return getColumnsForCopyStmt(traverseResult);
	}
	return postgresDescribeResult.parameters
		.map((param, index) => {
			const paramName = namedParametersIndexes.get(index)!;
			const indexes = paramNames.flatMap((name, index) => name === paramName ? [index] : []);
			const notNull = indexes.every(index => traverseResult.parametersNullability[index]);
			const paramList = indexes.every(index => traverseResult.parameterList[index]);
			const paramResult = mapToParamDef(postgresTypes, enumTypes, paramName, param, notNull, paramList);
			return paramResult;
		})
}

function getColumnsForCopyStmt(traverseResult: PostgresTraverseResult): ParameterDef[] {
	return traverseResult.columns.map(col => {
		const result: ParameterDef = {
			name: col.column_name,
			columnType: col.type_id ? postgresTypes[col.type_id] as any ?? '?' : '?',
			notNull: !col.is_nullable
		}
		return result;
	});
}

function getParamtersForWhere(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, paramNames: string[]): ParameterDef[] {
	const indexOffset = traverseResult.parametersNullability.length;
	return postgresDescribeResult.parameters.slice(indexOffset)
		.map((param, index) => mapToParamDef(postgresTypes, enumTypes, paramNames[index + indexOffset], param, traverseResult.whereParamtersNullability?.[index] ?? true, traverseResult.parameterList[index + indexOffset]))
}

function getDataForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, paramNames: string[]): ParameterDef[] {
	return postgresDescribeResult.parameters.slice(0, traverseResult.parametersNullability.length)
		.map((param, index) => mapToParamDef(postgresTypes, enumTypes, paramNames[index], param, traverseResult.parametersNullability[index] ?? true, traverseResult.parameterList[index]))
}
