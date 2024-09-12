import assert from 'assert';
import { isLeft } from 'fp-ts/lib/Either';
import { createSqliteClient, explainSql } from '../../src/sqlite-query-analyzer/query-executor';
import { createLibSqlClient } from '../../src/drivers/libsql';
import { SchemaDef } from '../../src/types';
import { parseSql } from '../../src/sqlite-query-analyzer/parser';
import { sqliteDbSchema } from '../mysql-query-analyzer/create-schema';

describe('load-extension', () => {
	it('better-sqlite3 - load_extension uuid4', () => {

		const client = createSqliteClient('better-sqlite3', './mydb.db', [], ['./tests/ext/uuid.dll']);
		if (isLeft(client)) {
			assert.fail(`Shouldn't return an Error`);
		}

		const clientType = client.right.type;
		if (clientType != 'better-sqlite3') {
			assert.fail(`Shouldn't return an Error`);
		}
		const explainSqlResult = explainSql(client.right.client, 'SELECT uuid4()');

		if (isLeft(explainSqlResult)) {
			assert.fail(`Shouldn't return an Error`);
		}
		assert.deepStrictEqual(explainSqlResult.right, true);
	});

	it('bun:sqlite - load_extension uuid4', () => {

		const client = createSqliteClient('bun:sqlite', './mydb.db', [], ['./tests/ext/uuid.dll']);
		if (isLeft(client)) {
			assert.fail(`Shouldn't return an Error`);
		}

		const clientType = client.right.type;
		if (clientType != 'bun:sqlite') {
			assert.fail(`Shouldn't return an Error`);
		}
		const explainSqlResult = explainSql(client.right.client, 'SELECT uuid4()');

		if (isLeft(explainSqlResult)) {
			assert.fail(`Shouldn't return an Error`);
		}
		assert.deepStrictEqual(explainSqlResult.right, true);
	});

	it('libsql - load_extension uuid4', () => {

		//C:\dev\typesql\tests\ext\uuid.dll
		const client = createLibSqlClient('./mydb.db', [], ['./tests/ext/uuid.dll'], 'authtoken');
		if (isLeft(client)) {
			assert.fail(`Shouldn't return an Error`);
		}

		const clientType = client.right.type;
		if (clientType != 'libsql') {
			assert.fail(`Shouldn't return an Error`);
		}
		const explainSqlResult = explainSql(client.right.client, 'SELECT uuid4()');

		if (isLeft(explainSqlResult)) {
			assert.fail(`Shouldn't return an Error`);
		}
		assert.deepStrictEqual(explainSqlResult.right, true);
	});

	it('select uuid4() as uuid4, uuid7() as uuid7', () => {
		const sql = 'select uuid4() as uuid4, uuid7() as uuid7';

		const actual = parseSql(sql, sqliteDbSchema);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					columnName: 'uuid4',
					type: 'TEXT',
					notNull: true,
					table: ''
				},
				{
					columnName: 'uuid7',
					type: 'TEXT',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});