import { mapColumnType, postgresTypes } from '../dialects/postgres';
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
			return `\${generatePlaceholders('${match}', params.${paramsNames[paramIndex]})}`;
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
		return getValueForType(paramIndex, paramsTypes[paramIndex], paramsIsList[paramIndex]);
	});
	return newSql;
}

function getValueForType(paramIndex: number, typeOid: number, isList: boolean): string {
	const type = postgresTypes[typeOid];
	const tsType = mapColumnType(type);
	switch (tsType) {
		case 'number':
			if (isList) {
				return '1, 2';
			}
			return `${paramIndex + 1}`;
		case 'number[]':
			return 'ARRAY[1, 2]'
		case 'string':
			if (isList) {
				return `'1', '2'`;
			}
			return `'${paramIndex + 1}'`;
		case 'string[]':
			return `ARRAY['1', '2']`;
		case 'Date':
			const date1 = new Date();
			const date2 = new Date();
			date2.setDate(date2.getDate() + 1);
			if (isList) {
				return `'${formatDate(date1)}', '${formatDate(date2)}'`;
			}
			return `'${formatDate(new Date())}'`;
		case 'Date[]':
			const date3 = new Date();
			const date4 = new Date();
			date4.setDate(date4.getDate() + 1);
			return `ARRAY['${formatDate(date3)}', '${formatDate(date4)}']`;
		case 'boolean':
			if (isList) {
				return 'true, true';
			}
			return 'true';
		case 'boolean[]':
			return 'ARRAY[true, true]';
	}
	return '1';
}

function formatDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}
