import { TypeSqlError } from '../types';
import { DescribeParameters, DescribeQueryColumn, PostgresDescribe, PostgresTypeHash } from '../drivers/types';
import { postgresDescribe, EnumMap, EnumResult, CheckConstraintResult } from '../drivers/postgres';
import { Sql } from 'postgres';
import { safeParseSql } from './parser';
import { replacePostgresParams } from '../sqlite-query-analyzer/replace-list-params';
import { ok, Result, ResultAsync, err } from 'neverthrow';
import { postgresTypes } from '../dialects/postgres';
import { NotNullInfo, PostgresTraverseResult } from './traverse';
import { describeNestedQuery } from '../sqlite-query-analyzer/sqlite-describe-nested-query';
import { isLeft } from 'fp-ts/lib/Either';
import { hasAnnotation, preprocessSql } from '../describe-query';
import { describeDynamicQuery2 } from '../describe-dynamic-query';
import { PostgresColumnInfo, PostgresParameterDef, PostgresSchemaDef } from './types';
import { JsonType, PostgresEnumType, PostgresType } from '../sqlite-query-analyzer/types';
import { PostgresSchemaInfo } from '../schema-info';

function describeQueryRefine(describeParameters: DescribeParameters): Result<PostgresSchemaDef, TypeSqlError> {
	const { sql, postgresDescribeResult, namedParameters, schemaInfo } = describeParameters;
	const { columns: dbSchema, enumTypes, userFunctions, checkConstraints } = schemaInfo;
	const generateNestedInfo = hasAnnotation(sql, '@nested');
	const generateDynamicQueryInfo = hasAnnotation(sql, '@dynamicQuery');

	const parseResult = safeParseSql(sql, dbSchema, checkConstraints, userFunctions, { collectNestedInfo: generateNestedInfo, collectDynamicQueryInfo: generateDynamicQueryInfo });
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

	const descResult: PostgresSchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: traverseResult.multipleRowsResult,
		columns: getColumnsForQuery(traverseResult, postgresDescribeResult, enumTypes, checkConstraints),
		parameters: traverseResult.queryType === 'Update'
			? getParamtersForWhere(traverseResult, postgresDescribeResult, enumTypes, paramNames)
			: getParamtersForQuery(traverseResult, postgresDescribeResult, enumTypes, paramNames)
	}
	if (traverseResult.queryType === 'Update') {
		descResult.data = getDataForQuery(traverseResult, postgresDescribeResult, enumTypes, paramNames);
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

function mapToColumnInfo(col: DescribeQueryColumn, posgresTypes: PostgresTypeHash, enumTypes: EnumMap, checkConstraints: CheckConstraintResult, colInfo: NotNullInfo): PostgresColumnInfo {
	const constraintKey = `[${colInfo.schema}][${colInfo.table}][${colInfo.column_name}]`;
	return {
		name: col.name,
		notNull: !colInfo.is_nullable,
		type: createType(col.typeId, posgresTypes, enumTypes.get(col.typeId), checkConstraints[constraintKey], colInfo.jsonType),
		table: colInfo.table
	}
}

function createType(typeId: number, postgresTypes: PostgresTypeHash, enumType: EnumResult[] | undefined, checkConstraint: PostgresEnumType | undefined, jsonType: JsonType | undefined): PostgresType {
	if (enumType) {
		return createEnumType(enumType!);
	}
	if (checkConstraint) {
		return checkConstraint;
	}
	if (jsonType) {
		return jsonType;
	}
	return postgresTypes[typeId] ?? 'unknown';
}

function createEnumType(enumList: EnumResult[]): PostgresEnumType {
	const enumListStr = enumList.map(col => `'${col.enumlabel}'`).join(',');
	return `enum(${enumListStr})`;
}

function mapToParamDef(postgresTypes: PostgresTypeHash, enumTypes: EnumMap, paramName: string, paramType: number, checkConstraint: PostgresEnumType | undefined, notNull: boolean, isList: boolean): PostgresParameterDef {
	const arrayType = isList ? '[]' : ''
	return {
		name: paramName,
		notNull,
		type: `${createType(paramType, postgresTypes, enumTypes.get(paramType), checkConstraint, undefined)}${arrayType}` as any
	}
}

export function describeQuery(postgres: Sql, sql: string, schemaInfo: PostgresSchemaInfo): ResultAsync<PostgresSchemaDef, TypeSqlError> {
	const { sql: preprocessed, namedParameters } = preprocessSql(sql, 'postgres');
	return postgresDescribe(postgres, preprocessed).andThen(analyzeResult => {

		const describeParameters: DescribeParameters = {
			sql: preprocessed,
			postgresDescribeResult: analyzeResult,
			namedParameters,
			schemaInfo
		}
		return describeQueryRefine(describeParameters);
	});
}

function getColumnsForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, checkConstraints: CheckConstraintResult): PostgresColumnInfo[] {
	return postgresDescribeResult.columns.map((col, index) => mapToColumnInfo(col, postgresTypes, enumTypes, checkConstraints, traverseResult.columns[index]))
}

function getParamtersForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, paramNames: string[]): PostgresParameterDef[] {
	const namedParametersIndexes = createIndexToNameMap(paramNames);
	if (traverseResult.queryType === 'Copy') {
		return getColumnsForCopyStmt(traverseResult);
	}
	return postgresDescribeResult.parameters
		.map((paramType, index) => {
			const paramName = namedParametersIndexes.get(index)!;
			const indexes = paramNames.flatMap((name, index) => name === paramName ? [index] : []);
			const notNull = indexes.every(index => traverseResult.parametersNullability[index]?.isNotNull);
			const paramList = indexes.every(index => traverseResult.parameterList[index]);
			const paramCheckConstraint = indexes.map(i => traverseResult.parametersNullability[i]?.checkConstraint).find(Boolean);
			const paramResult = mapToParamDef(postgresTypes, enumTypes, paramName, paramType, paramCheckConstraint, notNull, paramList);
			return paramResult;
		})
}

function getColumnsForCopyStmt(traverseResult: PostgresTraverseResult): PostgresParameterDef[] {
	return traverseResult.columns.map(col => {
		const result: PostgresParameterDef = {
			name: col.column_name,
			type: col.type ?? 'unknown',
			notNull: !col.is_nullable
		}
		return result;
	});
}

function getParamtersForWhere(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, paramNames: string[]): PostgresParameterDef[] {
	const indexOffset = traverseResult.parametersNullability.length;
	return postgresDescribeResult.parameters.slice(indexOffset)
		.map((paramType, index) => mapToParamDef(postgresTypes, enumTypes, paramNames[index + indexOffset], paramType, traverseResult.whereParamtersNullability?.[index]?.checkConstraint, traverseResult.whereParamtersNullability?.[index].isNotNull ?? true, traverseResult.parameterList[index + indexOffset]))
}

function getDataForQuery(traverseResult: PostgresTraverseResult, postgresDescribeResult: PostgresDescribe, enumTypes: EnumMap, paramNames: string[]): PostgresParameterDef[] {
	return postgresDescribeResult.parameters.slice(0, traverseResult.parametersNullability.length)
		.map((paramType, index) => mapToParamDef(postgresTypes, enumTypes, paramNames[index], paramType, traverseResult.parametersNullability[index]?.checkConstraint, traverseResult.parametersNullability[index].isNotNull ?? true, traverseResult.parameterList[index]))
}
