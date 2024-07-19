import { type Either, right } from 'fp-ts/lib/Either';
import type { DatabaseClient, TypeSqlError } from '../types';
import Database from 'libsql';

export function createLibSqlClient(url: string, attachList: string[], authToken: string): Either<TypeSqlError, DatabaseClient> {
	const opts = {
		authToken: authToken
	} as any;

	const db = new Database(url, opts);
	for (const attach of attachList) {
		db.exec(`attach database ${attach}`);
	}

	return right({
		type: 'libsql',
		client: db
	});
}
