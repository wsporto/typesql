import type { SchemaDef, ParameterDef, TypeSqlError, PreprocessedSql, MySqlDialect, PreprocessedPostgresSql, NamedParamInfo } from './types';
import { extractQueryInfo } from './mysql-query-analyzer/parse';
import { type Either, isLeft, right, left } from 'fp-ts/lib/Either';
import type { ColumnInfo, ColumnSchema } from './mysql-query-analyzer/types';
import type { InferType, DbType } from './mysql-mapping';
import { explainSql, loadMysqlSchema } from './queryExectutor';

export function describeSql(dbSchema: ColumnSchema[], sql: string): SchemaDef {
	const { sql: processedSql, namedParameters } = preprocessSql(sql, 'mysql');
	const queryInfo = extractQueryInfo(sql, dbSchema);
	if (queryInfo.kind === 'Select') {
		const parametersDef = queryInfo.parameters.map((paramInfo, paramIndex) => {
			const paramDef: ParameterDef = {
				name: namedParameters?.[paramIndex] ? namedParameters[paramIndex] : `param${paramIndex + 1}`,
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

		const parameters = namedParameters ? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
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
		const parameters = namedParameters ? addParameterNames(queryInfo.parameters, namedParameters) : queryInfo.parameters;
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
export function preprocessSql(sql: string, dialect: 'postgres' | 'mysql' | 'sqlite') {
	const regex = /:[a-zA-Z$_]+[a-zA-Z\d$_]*/g;
	let tempSql = sql.replace(/::([a-zA-Z0-9_]+)/g, (match, type) => `/*TYPECAST*/${type}`);
	const lines = tempSql.split('\n');
	let newSql = '';
	const allParameters: string[] = [];
	const paramMap: Record<string, number> = {}; // Map for tracking named parameters
	let paramIndex = 1; // For PostgreSQL, to track $1, $2, $3, ...
	lines.forEach((line, index, array) => {
		let newLine = line;
		if (!line.trim().startsWith('--')) {
			const parameters: string[] = line.match(regex)?.map((param) => param.slice(1)) || [];
			allParameters.push(...parameters);
			if (dialect == 'postgres') {
				parameters.forEach((param) => {
					// Check if the parameter has already been assigned an index
					if (!paramMap[param]) {
						paramMap[param] = paramIndex; // Assign new index for the named parameter
						paramIndex++;
					}

					// Replace the parameter with the assigned index
					newLine = newLine.replace(`:${param}`, `$${paramMap[param]}`);
				});
			}
			else {
				// Replace named parameters with `?` for MySQL and sqlite
				newLine = line.replace(regex, '?');
			}
		}
		newSql += newLine;
		if (index !== array.length - 1) {
			newSql += '\n';
		}
	});
	newSql = newSql.replace(/\/\*TYPECAST\*\/([a-zA-Z0-9_]+)/g, (_, type) => `::${type}`);

	const processedSql: PreprocessedSql = {
		sql: newSql,
		namedParameters: allParameters
	};
	return processedSql;
}

export function preprocessPostgresSql(sql: string): PreprocessedPostgresSql {
	const namedParamRegex = /:[a-zA-Z$_]+[a-zA-Z\d$_]*/g;
	const positionalParamRegex = /\$(\d+)/g;

	type NamedParamInfo = { paramName: string; paramNumber: number };
	const namedParameters: NamedParamInfo[] = [];

	// If SQL already contains $1, $2... → treat as positional, return as is
	if (positionalParamRegex.test(sql)) {
		sql.replace(positionalParamRegex, (_, num) => {
			const number = parseInt(num, 10);
			namedParameters.push({
				paramName: `param${number}`,
				paramNumber: number
			});
			return _;
		});
		return {
			sql,
			namedParameters
		};
	}

	// Otherwise, replace :paramName with $1, $2...
	let tempSql = sql.replace(/::([a-zA-Z0-9_]+)/g, (_, type) => `/*TYPECAST*/${type}`);
	const lines = tempSql.split('\n');
	let newSql = '';
	const paramMap: Record<string, number> = {};
	let paramIndex = 1;

	lines.forEach((line, index, array) => {
		let newLine = line;
		if (!line.trim().startsWith('--')) {
			const matches = [...line.matchAll(namedParamRegex)];
			matches.forEach((match) => {
				const fullMatch = match[0];  // e.g. ":userId"
				const param = fullMatch.slice(1); // remove `:`
				if (!paramMap[param]) {
					paramMap[param] = paramIndex++;
				}
				const assignedNumber = paramMap[param];

				namedParameters.push({
					paramName: param,
					paramNumber: assignedNumber
				});

				newLine = newLine.replace(fullMatch, `$${assignedNumber}`);
			});
		}
		newSql += newLine;
		if (index !== array.length - 1) {
			newSql += '\n';
		}
	});

	// Restore typecasts
	newSql = newSql.replace(/\/\*TYPECAST\*\/([a-zA-Z0-9_]+)/g, (_, type) => `::${type}`);

	return {
		sql: newSql,
		namedParameters
	};
}

//https://stackoverflow.com/a/1695647
export function hasAnnotation(sql: string, annotation: string) {
	const regex = `-- ${annotation}`;
	return sql.match(new RegExp(regex)) != null;
}
