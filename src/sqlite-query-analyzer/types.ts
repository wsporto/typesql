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
	| 'bool'
	| 'bool[]'
	| 'bytea'
	| 'char'
	| 'char[]'
	| 'bpchar'
	| 'bpchar[]'
	| 'name'
	| 'name[]'
	| 'int4'
	| 'int4[]'
	| 'int8'
	| 'int8[]'
	| 'int2'
	| 'int2[]'
	| 'text'
	| 'text[]'
	| 'varchar'
	| 'varchar[]'
	| 'date'
	| 'date[]'
	| 'bit'
	| 'bit[]'
	| 'numeric'
	| 'numeric[]'
	| 'uuid'
	| 'uuid[]'
	| 'float4'
	| 'float4[]'
	| 'float8'
	| 'float8[]'
	| 'timestamp'
	| 'timestamp[]'
	| 'timestamptz'
	| 'timestamptz[]';
