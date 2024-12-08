import { parseSql as _parseSql } from '@wsporto/typesql-parser/postgres';
import { traverseSmt } from './traverse';
import { QueryType } from '../types';
import { PostgresColumnSchema } from '../drivers/types';

export type PostgresTraverseResult = {
	queryType: QueryType;
	columnsNullability: boolean[];
	parametersNullability: boolean[];
	whereParamtersNullability?: boolean[];
	parameterList: boolean[];
	limit?: number;
}

export function parseSql(sql: string, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt(), dbSchema);

	return traverseResult;
}
