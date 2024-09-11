import { type Either, right } from 'fp-ts/lib/Either';
import type { DatabaseClient, TypeSqlError } from '../types';
import Database from 'libsql';

export function createLibSqlClient(url: string, attachList: string[], loadExtensions: string[], authToken: string): Either<TypeSqlError, DatabaseClient> {
	const opts = {
		authToken: authToken
	} as any;

	const db = new Database(url, opts);
	for (const attach of attachList) {
		db.exec(`attach database ${attach}`);
	}
	for (const extension of loadExtensions) {
		db.loadExtension(extension);
	}

	return right({
		type: 'libsql',
		client: db
	});
}
