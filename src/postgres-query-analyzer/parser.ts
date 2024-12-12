import { parseSql as _parseSql } from '@wsporto/typesql-parser/postgres';
import { PostgresTraverseResult, traverseSmt } from './traverse';
import { PostgresColumnSchema } from '../drivers/types';
import { Result, err, ok } from 'neverthrow';


export function parseSql(sql: string, dbSchema: PostgresColumnSchema[]): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt(), dbSchema);

	return traverseResult;
}

export function safeParseSql(sql: string, dbSchema: PostgresColumnSchema[]): Result<PostgresTraverseResult, string> {
	try {
		console.log("will parse")
		const result = parseSql(sql, dbSchema);
		return ok(result);
	}
	catch (e) {
		return err('Invalid Sql');
	}
}
