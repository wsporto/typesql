import assert from 'node:assert';

import { readFileSync } from 'node:fs';
import { generateCode } from '../../src/code-generator2';
import { PgDielect } from '../../src/types';
import postgres from 'postgres';

describe('postgres-code-generator', () => {

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
		const sql = 'select id from mytable1 where id = :id or id = :id';

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
});
