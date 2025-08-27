import { PostgresTypeHash } from '../drivers/types';
import { TsType } from '../mysql-mapping';
import { PostgresSimpleType, PostgresType } from '../sqlite-query-analyzer/types';

// select oid || ': ''' || typname || ''',' from pg_type order by oid;
export const postgresTypes: PostgresTypeHash = {
	16: 'bool',
	17: 'bytea',
	18: 'char',
	19: 'name',
	20: 'int8',
	21: 'int2',
	22: 'int2vector',
	23: 'int4',
	24: 'regproc',
	25: 'text',
	26: 'oid',
	27: 'tid',
	28: 'xid',
	29: 'cid',
	30: 'oidvector',
	114: 'json',
	142: 'xml',
	143: '_xml',
	194: 'pg_node_tree',
	199: '_json',
	// 269: 'table_am_handler',
	// 325: 'index_am_handler',
	600: 'point',
	601: 'lseg',
	602: 'path',
	603: 'box',
	604: 'polygon',
	628: 'line',
	629: '_line',
	650: 'cidr',
	651: '_cidr',
	700: 'float4',
	701: 'float8',
	705: 'unknown',
	718: 'circle',
	719: '_circle',
	774: 'macaddr8',
	775: '_macaddr8',
	790: 'money',
	791: '_money',
	829: 'macaddr',
	869: 'inet',
	1000: '_bool',
	1001: '_bytea',
	1002: '_char',
	1003: '_name',
	1005: '_int2',
	1006: '_int2vector',
	1007: '_int4',
	1008: '_regproc',
	1009: '_text',
	1010: '_tid',
	1011: '_xid',
	1012: '_cid',
	1013: '_oidvector',
	1014: '_bpchar',
	1015: '_varchar',
	1016: '_int8',
	1017: '_point',
	1018: '_lseg',
	1019: '_path',
	1020: '_box',
	1021: '_float4',
	1022: '_float8',
	1027: '_polygon',
	1028: '_oid',
	1033: 'aclitem',
	1034: '_aclitem',
	1040: '_macaddr',
	1041: '_inet',
	1042: 'bpchar',
	1043: 'varchar',
	1082: 'date',
	1083: 'time',
	1114: 'timestamp',
	1115: '_timestamp',
	1182: '_date',
	1183: '_time',
	1184: 'timestamptz',
	1185: '_timestamptz',
	1186: 'interval',
	1187: '_interval',
	1231: '_numeric',
	1263: '_cstring',
	1266: 'timetz',
	1270: '_timetz',
	1560: 'bit',
	1561: '_bit',
	1562: 'varbit',
	1563: '_varbit',
	1700: 'numeric',
	// 1790: 'refcursor',
	// 2201: '_refcursor',
	// 2202: 'regprocedure',
	// 2203: 'regoper',
	// 2204: 'regoperator',
	// 2205: 'regclass',
	// 2206: 'regtype',
	// 2207: '_regprocedure',
	// 2208: '_regoper',
	// 2209: '_regoperator',
	// 2210: '_regclass',
	// 2211: '_regtype',
	2249: 'record',
	2275: 'cstring',
	// 2276: 'any',
	2277: 'anyarray',
	// 2278: 'void',
	// 2279: 'trigger',
	// 2280: 'language_handler',
	// 2281: 'internal',
	// 2282: 'opaque',
	// 2283: 'anyelement',
	2287: '_record',
	// 2776: 'anynonarray',
	// 2949: '_txid_snapshot',
	2950: 'uuid',
	2951: '_uuid',
	// 2970: 'txid_snapshot',
	// 3115: 'fdw_handler',
	// 3310: 'tsm_handler',
	// 3500: 'anyenum',
	3614: 'tsvector',
	3615: 'tsquery',
	// 3642: 'gtsvector',
	3643: '_tsvector',
	// 3644: '_gtsvector',
	3645: '_tsquery',
	// 3734: 'regconfig',
	// 3735: '_regconfig',
	// 3769: 'regdictionary',
	// 3770: '_regdictionary',
	3802: 'jsonb',
	3807: '_jsonb',
	// 3831: 'anyrange',
	// 3838: 'event_trigger',
	3904: 'int4range',
	3905: '_int4range',
	3906: 'numrange',
	3907: '_numrange',
	3908: 'tsrange',
	3909: '_tsrange',
	3910: 'tstzrange',
	3911: '_tstzrange',
	3912: 'daterange',
	3913: '_daterange',
	3926: 'int8range',
	3927: '_int8range',
	4072: 'jsonpath',
	4073: '_jsonpath',
	// 4089: 'regnamespace',
	// 4090: '_regnamespace',
	// 4096: 'regrole',
	// 4097: '_regrole',
	16670: 'vector',
	16676: '_vector'
};

function isEnumType(type: PostgresSimpleType): type is `enum(${string})` {
	return type.startsWith('enum(');
}

function mapColumnType(postgresType: PostgresType, json = false): TsType {
	const tsType = _mapColumnType(postgresType, json);
	if (tsType == null) {
		return 'any';
	}
	return tsType;
}

export function _mapColumnType(postgresType: PostgresType, json = false): TsType {
	if (typeof postgresType === 'object') {
		return 'any';
	}
	if (isEnumType(postgresType)) {
		const enumValues = postgresType.substring(postgresType.indexOf('(') + 1, postgresType.indexOf(')'));
		return enumValues.split(',').join(' | ') as TsType;
	}
	switch (postgresType) {
		case 'bool':
			return 'boolean';
		case '_bool':
		case 'bool[]':
			return 'boolean[]';
		case 'bytea':
			return json ? 'string' : 'ArrayBuffer';
		case '_bytea':
		case 'bytea[]':
			return json ? 'string[]' : 'ArrayBuffer[]';
		case 'char':
			return 'string';
		case '_char':
		case 'char[]':
			return 'string[]';
		case 'bpchar':
			return 'string';
		case '_bpchar':
		case 'bpchar[]':
			return 'string[]';
		case 'name':
			return 'string';
		case '_name':
		case 'name[]':
			return 'string[]';
		case 'int8':
			return 'string';
		case '_int8':
		case 'int8[]':
			return 'string[]';
		case 'int2':
			return 'number';
		case '_int2':
		case 'int2[]':
			return 'number[]';
		case 'int4':
			return 'number';
		case '_int4':
		case 'int4[]':
			return 'number[]';
		case 'text':
			return 'string';
		case '_text':
		case 'text[]':
			return 'string[]';
		case 'varchar':
			return 'string';
		case '_varchar':
		case 'varchar[]':
			return 'string[]';
		case 'date':
			return json ? 'string' : 'Date';
		case '_date':
		case 'date[]':
			return json ? 'string[]' : 'Date';
		case 'bit':
			return 'boolean';
		case '_bit':
		case 'bit[]':
			return 'boolean[]';
		case 'varbit':
			return 'string';
		case '_varbit':
		case 'varbit[]':
			return 'string';
		case 'numeric':
			return 'string';
		case '_numeric':
		case 'numeric[]':
			return 'string[]';
		case 'uuid':
			return 'string';
		case '_uuid':
		case 'uuid[]':
			return 'string[]';
		case 'float4':
			return 'number';
		case '_float4':
		case 'float4[]':
			return 'number[]';
		case 'float8':
			return 'number';
		case '_float8':
		case 'float8[]':
			return 'number[]'
		case 'timestamp':
		case 'timestamptz':
			return json ? 'string' : 'Date'
		case '_timestamp':
		case 'timestamp[]':
		case '_timestamptz':
		case 'timestamptz[]':
			return json ? 'string[]' : 'Date[]';
		case 'time':
		case 'timetz':
			return 'string';
		case '_time':
		case 'time[]':
		case '_timetz':
		case 'timetz[]':
			return 'string[]';
		case 'interval':
			return 'string';
		case '_interval':
		case 'interval[]':
			return 'string[]';
		case 'tsvector':
		case 'tsquery':
		case 'jsonpath':
		case 'vector':
			return 'string';
		case '_tsvector':
		case 'tsvector[]':
		case '_tsquery':
		case 'tsquery[]':
		case '_jsonpath':
		case 'jsonpath[]':
		case '_vector':
		case 'vector[]':
			return 'string[]';
		case 'json':
		case 'jsonb':
			return 'any';
		case '_json':
		case 'json[]':
		case '_jsonb':
		case 'jsonb[]':
			return 'any[]';
		case 'record':
		case '_record':
		case 'int2vector':
			return 'string';
		case '_int2vector':
		case 'int2vector[]':
			return 'string[]';
		case 'regproc':
			return 'string';
		case '_regproc':
		case 'regproc[]':
			return 'string';
		case 'oid':
		case 'tid':
		case 'xid':
		case 'cid':
		case 'oidvector':
		case 'xml':
		case 'point':
		case 'lseg':
		case 'path':
		case 'box':
		case 'polygon':
		case 'line':
		case 'cidr':
		case 'circle':
		case 'macaddr8':
		case 'money':
		case 'macaddr':
		case 'inet':
		case 'int4range':
		case 'int8range':
		case 'daterange':
		case 'numrange':
		case 'tsrange':
		case 'tstzrange':
		case 'aclitem':
		case 'cstring':
		case 'anyarray':
		case 'pg_node_tree':
			return 'string';
		case '_oid':
		case 'oid[]':
		case '_tid':
		case 'tid[]':
		case '_xid':
		case 'xid[]':
		case '_cid':
		case 'cid[]':
		case '_oidvector':
		case 'oidvector[]':
		case '_xml':
		case 'xml[]':
		case '_point':
		case 'point[]':
		case '_lseg':
		case 'lseg[]':
		case '_path':
		case 'path[]':
		case '_box':
		case 'box[]':
		case '_polygon':
		case 'polygon[]':
		case '_line':
		case 'line[]':
		case '_cidr':
		case 'cidr[]':
		case '_circle':
		case 'circle[]':
		case '_macaddr8':
		case 'macaddr8[]':
		case '_money':
		case 'money[]':
		case '_macaddr':
		case 'macaddr[]':
		case '_inet':
		case 'inet[]':
		case '_int4range':
		case 'int4range[]':
		case '_int8range':
		case 'int8range[]':
		case '_numrange':
		case 'numrange[]':
		case '_daterange':
		case 'daterange[]':
		case '_tsrange':
		case 'tsrange[]':
		case '_tstzrange':
		case 'tstzrange[]':
		case '_aclitem':
		case 'aclitem[]':
		case '_cstring':
		case 'cstring[]':
		case 'anyarray[]':
		case 'pg_node_tree[]':
			return 'string[]';
		case 'unknown':
		case 'null': //pseudo type
			return 'any';
	}
}

export type PostgresTypeMapper = {
	mapColumnType: (postgresType: PostgresType, json?: boolean) => TsType;
}

export const mapper: PostgresTypeMapper = {
	mapColumnType
};
