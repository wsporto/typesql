import { NamedParamWithType, TypeSqlError } from '../types';
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
import { hasAnnotation, preprocessPostgresSql } from '../describe-query';
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
	const paramWithTypes = namedParameters.map(param => {
		const paramTypeOid = postgresDescribeResult.parameters[param.paramNumber - 1];
		return {
			...param,
			typeOid: paramTypeOid
		} satisfies NamedParamWithType
	});

	//replace list parameters
	const newSql = replacePostgresParams(sql, traverseResult.parameterList, namedParameters.map(param => param.paramName));

	const descResult: PostgresSchemaDef = {
		sql: newSql,
		queryType: traverseResult.queryType,
		multipleRowsResult: traverseResult.multipleRowsResult,
		columns: getColumnsForQuery(traverseResult, postgresDescribeResult, enumTypes, checkConstraints),
		parameters: traverseResult.queryType === 'Update'
			? getParamtersForWhere(traverseResult, enumTypes, paramWithTypes)
			: getParamtersForQuery(traverseResult, enumTypes, paramWithTypes)
	}
	if (traverseResult.queryType === 'Update') {
		descResult.data = getDataForQuery(traverseResult, enumTypes, paramWithTypes);
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
		const dynamicSqlQueryInfo = describeDynamicQuery2(traverseResult.dynamicQueryInfo, namedParameters.map(param => param.paramName), []);
		descResult.dynamicSqlQuery2 = dynamicSqlQueryInfo;
	}
	return ok(descResult);
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

function mapToParamDef(postgresTypes: PostgresTypeHash, enumTypes: EnumMap, paramName: string, paramTypeOid: number, checkConstraint: PostgresEnumType | undefined, notNull: boolean, isList: boolean): PostgresParameterDef {
	const arrayType = isList ? '[]' : ''
	return {
		name: paramName,
		notNull,
		type: `${createType(paramTypeOid, postgresTypes, enumTypes.get(paramTypeOid), checkConstraint, undefined)}${arrayType}` as any
	}
}

export function describeQuery(postgres: Sql, sql: string, schemaInfo: PostgresSchemaInfo): ResultAsync<PostgresSchemaDef, TypeSqlError> {
	const { sql: preprocessed, namedParameters } = preprocessPostgresSql(sql);
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

function getParamtersForQuery(traverseResult: PostgresTraverseResult, enumTypes: EnumMap, params: NamedParamWithType[]): PostgresParameterDef[] {
	if (traverseResult.queryType === 'Copy') {
		return getColumnsForCopyStmt(traverseResult);
	}
	return transformToParamDefList(traverseResult, enumTypes, params, false);
}

function transformToParamDefList(traverseResult: PostgresTraverseResult, enumTypes: EnumMap, params: NamedParamWithType[], whereParam: boolean): PostgresParameterDef[] {
	const offset = whereParam ? traverseResult.parametersNullability.length : 0;
	const parametersNullability = traverseResult.parametersNullability.concat(traverseResult.whereParamtersNullability || []);
	const paramMap = groupByParamNumber(params.slice(offset));
	return Object.values(paramMap).map(group => {
		const notNull = group.every(param => parametersNullability[param.index + offset]?.isNotNull);
		const paramList = group.every(param => traverseResult.parameterList[param.index + offset]);
		const paramCheckConstraint = group.map(param => parametersNullability[param.index + offset]?.checkConstraint).find(Boolean);
		const paramResult = mapToParamDef(postgresTypes, enumTypes, group[0].paramName, group[0].typeOid, paramCheckConstraint, notNull, paramList);
		return paramResult;
	})
}

type NamedParamWithTypeAndIndex = NamedParamWithType & { index: number };
function groupByParamNumber(params: NamedParamWithType[]): Record<number, NamedParamWithTypeAndIndex[]> {
	return params.reduce((acc, param, index) => {
		const withIndex: NamedParamWithTypeAndIndex = { ...param, index };

		if (!acc[param.paramNumber]) {
			acc[param.paramNumber] = [];
		}
		acc[param.paramNumber].push(withIndex);

		return acc;
	}, {} as Record<number, NamedParamWithTypeAndIndex[]>);
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

function getParamtersForWhere(traverseResult: PostgresTraverseResult, enumTypes: EnumMap, params: NamedParamWithType[]): PostgresParameterDef[] {
	return transformToParamDefList(traverseResult, enumTypes, params, true);
}

function getDataForQuery(traverseResult: PostgresTraverseResult, enumTypes: EnumMap, params: NamedParamWithType[]): PostgresParameterDef[] {
	const dataParams = params.slice(0, traverseResult.parametersNullability.length);
	return transformToParamDefList(traverseResult, enumTypes, dataParams, false);
}
