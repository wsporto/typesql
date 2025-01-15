import { ok, Result } from 'neverthrow';
import type { DatabaseClient, TypeSqlError } from '../types';
import Database from 'libsql';

export function createLibSqlClient(url: string, attachList: string[], loadExtensions: string[], authToken: string): Result<DatabaseClient, TypeSqlError> {
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

	return ok({
		type: 'libsql',
		client: db
	});
}
