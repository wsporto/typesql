import type { SchemaDef, ParameterDef, TypeSqlError, PreprocessedSql, MySqlDialect, NamedParamInfo } from './types';
import { extractQueryInfo } from './mysql-query-analyzer/parse';
import { type Either, isLeft, right, left } from 'fp-ts/lib/Either';
import type { ColumnInfo, ColumnSchema } from './mysql-query-analyzer/types';
import type { InferType, DbType } from './mysql-mapping';
import { explainSql, loadMysqlSchema } from './queryExectutor';

export function describeSql(dbSchema: ColumnSchema[], sql: string): SchemaDef {
	const { sql: processedSql, namedParameters } = preprocessSql(sql, 'mysql');
	const paramNames = namedParameters.map(param => param.paramName);
	const queryInfo = extractQueryInfo(sql, dbSchema);
	if (queryInfo.kind === 'Select') {
		const parametersDef = queryInfo.parameters.map((paramInfo, paramIndex) => {
			const paramDef: ParameterDef = {
				name: paramNames?.[paramIndex] ? paramNames[paramIndex] : `param${paramIndex + 1}`,
				columnType: paramInfo.type,
				notNull: paramInfo.notNull
			};
			return paramDef;
		});

		const schemaDef: SchemaDef = {
			sql: processedSql,
			queryType: 'Select',
			multipleRowsResult: queryInfo.multipleRowsResult,
			columns: queryInfo.columns,
			parameters: parametersDef
		};
		if (queryInfo.orderByColumns && queryInfo.orderByColumns.length > 0) {
			schemaDef.orderByColumns = queryInfo.orderByColumns;
		}
		if (queryInfo.nestedResultInfo) {
			schemaDef.nestedResultInfo = queryInfo.nestedResultInfo;
		}
		if (queryInfo.dynamicQuery) {
			schemaDef.dynamicSqlQuery = queryInfo.dynamicQuery;
		}
		return schemaDef;
	}
	if (queryInfo.kind === 'Insert') {
		const resultColumns: ColumnInfo[] = [
			{
				name: 'affectedRows',
				type: 'int',
				notNull: true
			},
			{
				name: 'insertId',
				type: 'int',
				notNull: true
			}
		];

		const parameters = paramNames ? addParameterNames(queryInfo.parameters, paramNames) : queryInfo.parameters;
		const verifiedParameters = parameters.map((param) => ({
			...param,
			columnType: verifyNotInferred(param.columnType)
		}));
		const schemaDef: SchemaDef = {
			sql: processedSql,
			queryType: 'Insert',
			multipleRowsResult: false,
			columns: resultColumns,
			parameters: verifiedParameters
		};
		return schemaDef;
	}
	if (queryInfo.kind === 'Update') {
		const resultColumns: ColumnInfo[] = [
			{
				name: 'affectedRows',
				type: 'int',
				notNull: true
			}
		];
		const schemaDef: SchemaDef = {
			sql: processedSql,
			queryType: 'Update',
			multipleRowsResult: false,
			columns: resultColumns,
			parameters: queryInfo.parameters,
			data: queryInfo.data
		};
		return schemaDef;
	}
	if (queryInfo.kind === 'Delete') {
		const resultColumns: ColumnInfo[] = [
			{
				name: 'affectedRows',
				type: 'int',
				notNull: true
			}
		];
		const parameters = paramNames ? addParameterNames(queryInfo.parameters, paramNames) : queryInfo.parameters;
		const schemaDef: SchemaDef = {
			sql: processedSql,
			queryType: 'Delete',
			multipleRowsResult: false,
			columns: resultColumns,
			parameters
		};
		return schemaDef;
	}

	throw Error('Not supported!');
}

function addParameterNames(parameters: ParameterDef[], namedParameters: string[]) {
	return parameters.map((param, paramIndex) => {
		const paramDef: ParameterDef = {
			...param,
			name: namedParameters?.[paramIndex] ? namedParameters[paramIndex] : param.name
		};
		return paramDef;
	});
}

export function verifyNotInferred(type: InferType): DbType | 'any' {
	if (type === '?' || type === 'any') return 'any';
	if (type === 'number') return 'double';
	return type;
}

export async function parseSql(client: MySqlDialect, sql: string): Promise<Either<TypeSqlError, SchemaDef>> {
	const { sql: processedSql } = preprocessSql(sql, 'mysql');
	const explainResult = await explainSql(client.client, processedSql);
	if (isLeft(explainResult)) {
		return explainResult;
	}
	const dbSchema = await loadMysqlSchema(client.client, client.schema);
	if (dbSchema.isErr()) {
		return left(dbSchema.error);
	}
	try {
		const result = describeSql(dbSchema.value, sql);
		return right(result);
	} catch (e: any) {
		const InvalidSqlError: TypeSqlError = {
			name: 'Invalid SQL',
			description: e.message
		};
		return left(InvalidSqlError);
	}
}

//http://dev.mysql.com/doc/refman/8.0/en/identifiers.html
//Permitted characters in unquoted identifiers: ASCII: [0-9,a-z,A-Z$_] (basic Latin letters, digits 0-9, dollar, underscore)
export function preprocessSql(sql: string, dialect: 'postgres' | 'mysql' | 'sqlite'): PreprocessedSql {
	const namedParamRegex = /:[a-zA-Z$_][a-zA-Z\d$_]*/g;
	const tempSql = sql.replace(/::([a-zA-Z0-9_]+)/g, (_, type) => `/*TYPECAST*/${type}`);

	const lines = tempSql.split('\n');
	let newSql = '';
	const paramMap: Record<string, number> = {};
	const namedParameters: NamedParamInfo[] = [];
	let paramIndex = 1;

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		if (!line.trim().startsWith('--')) {
			// Extract named params (:paramName)
			const matches = [...line.matchAll(namedParamRegex)];
			if (dialect === 'postgres') {
				const positionalParamRegex = /\$(\d+)/g;
				const positionalMatches = [...line.matchAll(positionalParamRegex)];
				for (const match of positionalMatches) {
					const paramNumber = parseInt(match[1], 10);
					namedParameters.push({
						paramName: `param${paramNumber}`,
						paramNumber: paramNumber
					});
				}
			}

			for (const match of matches) {
				const fullMatch = match[0];
				const paramName = fullMatch.slice(1);

				if (!paramMap[paramName]) {
					paramMap[paramName] = paramIndex++;
				}
				namedParameters.push({ paramName, paramNumber: paramMap[paramName] });
			}

			if (dialect === 'postgres') {
				// Replace :paramName with $number
				for (const param of Object.keys(paramMap)) {
					const regex = new RegExp(`:${param}\\b`, 'g');
					line = line.replace(regex, `$${paramMap[param]}`);
				}
			} else {
				// For mysql/sqlite, replace :paramName with '?'
				line = line.replace(namedParamRegex, '?');
			}
		}

		newSql += line;
		if (i !== lines.length - 1) newSql += '\n';
	}

	newSql = newSql.replace(/\/\*TYPECAST\*\/([a-zA-Z0-9_]+)/g, (_, type) => `::${type}`);

	return {
		sql: newSql,
		namedParameters,
	};
}

//https://stackoverflow.com/a/1695647
export function hasAnnotation(sql: string, annotation: string) {
	const regex = `-- ${annotation}`;
	return sql.match(new RegExp(regex)) != null;
}
