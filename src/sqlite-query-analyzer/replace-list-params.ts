import { postgresTypes } from '../dialects/postgres';
import type { ParameterNameAndPosition } from '../types';

export function replaceListParams(sql: string, listParamPositions: ParameterNameAndPosition[]): string {
	if (listParamPositions.length === 0) {
		return sql;
	}
	let newSql = '';
	let start = 0;
	listParamPositions.forEach((param, index, array) => {
		newSql += sql.substring(start, param.paramPosition);
		newSql += `\${params.${param.name}.map(() => '?')}`;
		if (index === array.length - 1) {
			//last
			newSql += sql.substring(param.paramPosition + 1, sql.length);
		}
		start = param.paramPosition + 1;
	});
	return newSql;
}

export function replacePostgresParams(sql: string, paramsIndexes: boolean[], paramsNames: string[]) {
	const paramRegex = /\$(\d+)/g;

	const newSql = sql.replace(paramRegex, (match, index) => {
		const paramIndex = parseInt(index, 10) - 1; // Adjust to zero-based index

		if (paramsIndexes[paramIndex]) {
			return `\${generatePlaceholders(params.${paramsNames[paramIndex]})}`;
		} else {
			return match;
		}
	});
	return newSql;
}

export function replacePostgresParamsWithValues(sql: string, paramsIsList: boolean[], paramsTypes: number[]) {
	const paramRegex = /\$(\d+)/g;

	const newSql = sql.replace(paramRegex, (match, index) => {
		const paramIndex = parseInt(index, 10) - 1;
		return getValueForType(index, paramsTypes[paramIndex], paramsIsList[paramIndex]);
	});
	return newSql;
}

function getValueForType(paramIndex: number, typeOid: number, isList: boolean): string {
	switch (postgresTypes[typeOid]) {
		case 'int4':
			if (isList) {
				return '1, 2';
			}
			return `${paramIndex} + 1`;
		case 'text':
			if (isList) {
				return `'1', '2'`;
			}
			return `'${paramIndex + 1}'`;
		case 'date':
			return `'${formatDate(new Date())}'`;

	}
	return '1';
}

function formatDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}
