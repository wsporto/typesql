import { Either, right } from "fp-ts/lib/Either";
import { DatabaseClient, TypeSqlError } from "../types";
import Database from "libsql";

export function createLibSqlClient(url: string, attachList: string[], authToken: string): Either<TypeSqlError, DatabaseClient> {

	const opts = {
		authToken: authToken,
	} as any;

	const db = new Database(url, opts);
	attachList.forEach(attach => {
		db.exec(`attach database ${attach}`);
	})

	return right({
		type: 'libsql',
		client: db
	});
}