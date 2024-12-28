import { parseSql as _parseSql } from '@wsporto/typesql-parser/postgres';
import { PostgresTraverseResult, traverseSmt } from './traverse';
import { PostgresColumnSchema } from '../drivers/types';
import { Result, err, ok } from 'neverthrow';


export function parseSql(sql: string, dbSchema: PostgresColumnSchema[], gererateNested = false): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt(), dbSchema, gererateNested);

	return traverseResult;
}

export function safeParseSql(sql: string, dbSchema: PostgresColumnSchema[], gererateNested: boolean): Result<PostgresTraverseResult, string> {
	try {
		const result = parseSql(sql, dbSchema, gererateNested);
		return ok(result);
	}
	catch (e) {
		const error = e as Error;
		return err(error.message);
	}
}
