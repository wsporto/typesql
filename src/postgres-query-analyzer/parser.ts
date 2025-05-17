import { parseSql as _parseSql } from '@wsporto/typesql-parser/postgres';
import { defaultOptions, PostgresTraverseResult, traverseSmt } from './traverse';
import { PostgresColumnSchema } from '../drivers/types';
import { Result, err, ok } from 'neverthrow';
import { CheckConstraintResult } from '../drivers/postgres';

export function parseSql(sql: string, dbSchema: PostgresColumnSchema[], checkConstraints: CheckConstraintResult, options = defaultOptions()): PostgresTraverseResult {
	const parser = _parseSql(sql);

	const traverseResult = traverseSmt(parser.stmt(), dbSchema, checkConstraints, options);

	return traverseResult;
}

export function safeParseSql(sql: string, dbSchema: PostgresColumnSchema[], checkConstraints: CheckConstraintResult, options = defaultOptions()): Result<PostgresTraverseResult, string> {
	try {
		const result = parseSql(sql, dbSchema, checkConstraints, options);
		return ok(result);
	}
	catch (e) {
		const error = e as Error;
		return err(error.message);
	}
}
