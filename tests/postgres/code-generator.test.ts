import assert from 'node:assert';

import { readFileSync } from 'node:fs';
import { generateCode, generateCrud } from '../../src/code-generator2';
import { PgDielect } from '../../src/types';
import postgres from 'postgres';
import { loadDbSchema } from '../../src/drivers/postgres';
import { PostgresColumnSchema } from '../../src/drivers/types';

describe('postgres-code-generator', () => {

	let dbSchema: PostgresColumnSchema[] = [];

	const databaseClient = postgres({
		host: 'localhost',
		user: 'postgres',
		password: 'password',
		port: 5432,
		database: 'postgres',
	});
	const dialect: PgDielect = {
		type: 'pg',
		client: databaseClient
	}

	before(async function () {
		const dbSchemaResult = await await loadDbSchema(databaseClient);
		if (dbSchemaResult.isErr()) {
			assert.fail(`Shouldn't return an error: ${dbSchemaResult.error}`);
		}
		dbSchema = dbSchemaResult.value;
	});

	it('select01 - select id, name from mytable2 where id = ?', async () => {
		const sql = 'select id, name from mytable2 where id = $1';

		const actual = await generateCode(dialect, sql, 'select01');
		const expected = readFileSync('tests/postgres/expected-code/select01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select02 - select without parameters', async () => {
		const sql = 'select id from mytable1';

		const actual = await generateCode(dialect, sql, 'select02');
		const expected = readFileSync('tests/postgres/expected-code/select02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select03 - select with same parameter used twice', async () => {
		const sql = 'select id from mytable1 where id = :id or value = :id';

		const actual = await generateCode(dialect, sql, 'select03');
		const expected = readFileSync('tests/postgres/expected-code/select03.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select06 - SELECT id FROM mytable1 ORDER BY ?', async () => {
		const sql = `SELECT id
FROM mytable2
WHERE id IN (:ids)
AND name IN (:names)`;

		const actual = await generateCode(dialect, sql, 'select06');
		const expected = readFileSync('tests/postgres/expected-code/select06.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select06 - SELECT id FROM mytable2 WHERE name = $1 OR id in ($2) OR name = $3', async () => {
		const sql = `SELECT id 
FROM mytable2
WHERE name = $1
OR id in ($2)
OR name = $3`;

		const actual = await generateCode(dialect, sql, 'select06');
		const expected = readFileSync('tests/postgres/expected-code/select06-2.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select06-any - SELECT id FROM mytable1 ORDER BY ?', async () => {
		const sql = `SELECT id
FROM mytable2
WHERE id < ANY (:ids)
AND name = SOME (:names)
AND name <> :name`;

		const actual = await generateCode(dialect, sql, 'select06');
		const expected = readFileSync('tests/postgres/expected-code/select06-any.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select08 - boolean', async () => {
		const sql = `SELECT
	id,
	:param1::bool as param1,
	:param2::bool as param2
FROM mytable1 
WHERE :param1 is true OR (:param2 is true OR :param2::bool is null)`;

		const actual = await generateCode(dialect, sql, 'select08');
		const expected = readFileSync('tests/postgres/expected-code/select08.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('select-type-cast ', async () => {
		const sql = 'SELECT id::int2 FROM mytable1';

		const actual = await generateCode(dialect, sql, 'selectTypeCast');
		const expected = readFileSync('tests/postgres/expected-code/select-type-cast.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert01 - INSERT INTO mytable1(value) values(10)', async () => {
		const sql = 'INSERT INTO mytable1(value) values(10)';

		const actual = await generateCode(dialect, sql, 'insert01');
		const expected = readFileSync('tests/postgres/expected-code/insert01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert02 - select with same parameter used twice', async () => {
		const sql = 'INSERT INTO mytable1(value) values($1)';

		const actual = await generateCode(dialect, sql, 'insert02');
		const expected = readFileSync('tests/postgres/expected-code/insert02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('insert03 - INSERT INTO mytable1(value) VALUES(:value) RETURNING *', async () => {
		const sql = 'INSERT INTO mytable1(value) VALUES(:value) RETURNING *';

		const actual = await generateCode(dialect, sql, 'insert03');
		const expected = readFileSync('tests/postgres/expected-code/insert03.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('update01 - UPDATE mytable1 SET value=? WHERE id=?', async () => {
		const sql = 'UPDATE mytable1 SET value=$1 WHERE id=$2';

		const actual = await generateCode(dialect, sql, 'update01');
		const expected = readFileSync('tests/postgres/expected-code/update01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('delete01 - DELETE FROM mytable1 WHERE id=?', async () => {
		const sql = 'DELETE FROM mytable1 WHERE id=$1';

		const actual = await generateCode(dialect, sql, 'delete01');
		const expected = readFileSync('tests/postgres/expected-code/delete01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('crud-select01', async () => {
		const actual = await generateCrud(dialect, 'Select', 'mytable1', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-select01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update01', async () => {
		const actual = await generateCrud(dialect, 'Update', 'mytable1', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-update01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});
});
