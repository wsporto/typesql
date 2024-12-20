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
	| '_bool'
	| 'bool[]'
	| 'bytea'
	| 'bytea[]'
	| '_bytea'
	| 'char'
	| '_char'
	| 'char[]'
	| 'bpchar'
	| '_bpchar'
	| 'bpchar[]'
	| 'name'
	| '_name'
	| 'name[]'
	| 'int4'
	| '_int4'
	| 'int4[]'
	| 'int8'
	| '_int8'
	| 'int8[]'
	| 'int2'
	| '_int2'
	| 'int2[]'
	| 'text'
	| '_text'
	| 'text[]'
	| 'varchar'
	| '_varchar'
	| 'varchar[]'
	| 'date'
	| '_date'
	| 'date[]'
	| 'bit'
	| '_bit'
	| 'bit[]'
	| 'numeric'
	| '_numeric'
	| 'numeric[]'
	| 'uuid'
	| '_uuid'
	| 'uuid[]'
	| 'float4'
	| '_float4'
	| 'float4[]'
	| 'float8'
	| '_float8'
	| 'float8[]'
	| 'timestamp'
	| '_timestamp'
	| 'timestamp[]'
	| 'timestamptz'
	| '_timestamptz'
	| 'timestamptz[]';
