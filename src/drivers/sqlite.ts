import { TsType } from '../mysql-mapping';
import { SQLiteType } from '../sqlite-query-analyzer/types';
import { SQLiteClient } from '../types';

function mapColumnType(sqliteType: SQLiteType, client: SQLiteClient): TsType {
	switch (sqliteType) {
		case 'INTEGER':
			return 'number';
		case 'INTEGER[]':
			return 'number[]';
		case 'TEXT':
			return 'string';
		case 'TEXT[]':
			return 'string[]';
		case 'NUMERIC':
			return 'number';
		case 'NUMERIC[]':
			return 'number[]';
		case 'REAL':
			return 'number';
		case 'REAL[]':
			return 'number[]';
		case 'DATE':
			return 'Date';
		case 'DATE_TIME':
			return 'Date';
		case 'BLOB':
			return client === 'better-sqlite3' ? 'Uint8Array' : 'ArrayBuffer';
		case 'BOOLEAN':
			return 'boolean';
	}
	if (sqliteType.startsWith('ENUM')) {
		const enumValues = sqliteType.substring(sqliteType.indexOf('(') + 1, sqliteType.indexOf(')'));
		return enumValues.split(',').join(' | ') as TsType;
	}
	return 'any';
}

export type SQLiteTypeMapper = {
	mapColumnType: (sqliteType: SQLiteType, client: SQLiteClient) => TsType;
}

export const mapper: SQLiteTypeMapper = {
	mapColumnType
};