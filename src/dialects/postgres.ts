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
	1082: 'date',
	1560: 'bit',
	1700: 'numeric',
	1042: 'bpchar',
	1043: 'varchar',
	2950: 'uuid',
} as any;


export function mapColumnType(postgresType: PostgresType): TsType {
	switch (postgresType) {
		case 'bool':
			return 'boolean';
		case 'bool[]':
			return 'boolean[]';
		case 'bytea':
			return 'ArrayBuffer';
		case 'char':
			return 'string';
		case 'char[]':
			return 'string';
		case 'bpchar':
			return 'string';
		case 'bpchar[]':
			return 'string[]';
		case 'name':
			return 'string';
		case 'name[]':
			return 'string[]';
		case 'int8':
			return 'number';
		case 'int8[]':
			return 'number[]';
		case 'int2':
			return 'number';
		case 'int2[]':
			return 'number[]';
		case 'int4':
			return 'number';
		case 'int4[]':
			return 'number[]';
		case 'text':
			return 'string';
		case 'text[]':
			return 'string[]';
		case 'varchar':
			return 'string';
		case 'varchar[]':
			return 'string[]';
		case 'date':
			return 'Date';
		case 'date[]':
			return 'Date[]';
		case 'bit':
			return 'boolean';
		case 'bit[]':
			return 'boolean[]';
		case 'numeric':
			return 'string';
		case 'numeric[]':
			return 'string[]';
		case 'uuid':
			return 'string';
		case 'uuid[]':
			return 'string[]';
		case 'float4':
			return 'number';
		case 'float4[]':
			return 'number[]';
		case 'float8':
			return 'number';
		case 'float8[]':
			return 'number[]';
	}
}