import { TsType } from '../mysql-mapping';
import { PostgresType } from '../sqlite-query-analyzer/types';

export const postgresTypes = {
	16: 'bool',
	17: 'bytea',
	18: 'char',
	19: 'name',
	20: 'int8',
	21: 'int2',
	23: 'int4',
	25: 'text',
	29: 'varchar',
	36: 'uuid',
	700: 'float4',
	701: 'float8',
	1001: '_bytea',
	1082: 'date',
	1560: 'bit',
	1700: 'numeric',
	1042: 'bpchar',
	1043: 'varchar',
	2950: 'uuid',
	1114: 'timestamp',
	1184: 'timestamptz',
	1000: '_bool',
	1002: '_char',
	1003: '_name',
	1005: '_int2',
	1007: '_int4',
	1009: '_text',
	1014: '_bpchar',
	1015: '_varchar',
	1016: '_int8',
	1021: '_float4',
	1022: '_float8',
	1115: '_timestamp',
	1182: '_date',
	1185: '_timestamptz',
	1231: '_numeric',
	1561: '_bit',
	2951: '_uuid'
} as any;


export function mapColumnType(postgresType: PostgresType): TsType {
	if (postgresType.startsWith('enum(')) {
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
			return 'ArrayBuffer';
		case '_bytea':
		case 'bytea[]':
			return 'ArrayBuffer[]';
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
			return 'Date';
		case '_date':
		case 'date[]':
			return 'Date[]';
		case 'bit':
			return 'boolean';
		case '_bit':
		case 'bit[]':
			return 'boolean[]';
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
			return 'Date'
		case '_timestamp':
		case 'timestamp[]':
			return 'Date[]';
		case 'timestamptz':
			return 'Date';
		case '_timestamptz':
		case 'timestamptz[]':
			return 'Date[]';
	}
}