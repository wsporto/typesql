import { TsType } from '../mysql-mapping';
import { PostgresType } from '../sqlite-query-analyzer/types';

export function mapColumnType(postgresType: PostgresType): TsType {
	switch (postgresType) {
		case 'int4':
			return 'number';
		case 'int4[]':
			return 'number[]';
		case 'text':
			return 'string';
		case 'text[]':
			return 'string[]';
	}
}