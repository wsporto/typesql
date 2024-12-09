import { parseSql as _parseSql } from '@wsporto/typesql-parser/postgres';
import { PostgresTraverseResult, traverseSmt } from './traverse';
import { PostgresColumnSchema } from '../drivers/types';


export function parseSql(sql: string, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt(), dbSchema);

	return traverseResult;
}
