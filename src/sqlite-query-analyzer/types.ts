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

export type JsonPropertyDef = {
	key: string;
	type: JsonType;
};


export type JsonObjType = { name: 'json', properties: JsonPropertyDef[] };
export type JsonArrayType = { name: 'json[]', properties: JsonType[] };
export type JsonMapType = { name: 'json_map', type: JsonType };
export type JsonFieldType = { name: 'json_field', type: PostgresSimpleType, notNull: boolean };
export type JsonType = JsonObjType | JsonArrayType | JsonFieldType | JsonMapType;

export type PostgresType =
	| PostgresSimpleType
	| JsonType

export type PostgresSimpleType =
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
	| 'timestamptz[]'
	| `enum(${string})`
	| 'tsvector'
	| 'tsvector[]'
	| 'tsquery'
	| 'tsquery[]'
	| 'json'
	| '_json'
	| 'json[]'
	| 'jsonb'
	| '_jsonb'
	| 'jsonb[]'
	| 'record'
	| '_record'
	| 'unknown'
	| 'null'

