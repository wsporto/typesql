import { parseSql as _parseSql } from '@wsporto/typesql-parser/postgres';
import { traverseSmt } from './traverse';
import { QueryType } from '../types';

export type PostgresTraverseResult = {
	queryType: QueryType;
	columnsNullability: boolean[];
	parameterList: boolean[];
}

export function parseSql(sql: string): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt());

	return traverseResult;
}
