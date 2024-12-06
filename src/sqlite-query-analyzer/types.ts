export type EnumMap = {
	[table: string]: EnumColumnMap;
}

export type EnumColumnMap = {
	[columnName: string]: EnumType;
}

export type EnumType = `ENUM(${string})`;

export type SQLiteType =
	| 'INTEGER'
	| 'INTEGER[]'
	| 'TEXT'
	| 'TEXT[]'
	| 'NUMERIC'
	| 'NUMERIC[]'
	| 'REAL'
	| 'REAL[]'
	| 'DATE'
	| 'DATE_TIME'
	| 'BLOB'
	| 'BOOLEAN'
	| EnumType
	| 'any';

export type PostgresType =
	| 'int4'
	| 'int4[]'
	| 'text'
	| 'text[]'
	| 'float4'
	| 'float4[]';
