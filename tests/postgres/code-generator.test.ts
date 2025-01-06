import assert from 'node:assert';

import { readFileSync } from 'node:fs';
import { generateCode, generateCrud } from '../../src/code-generator2';
import { PgDielect } from '../../src/types';
import postgres from 'postgres';
import { loadDbSchema, mapToColumnSchema } from '../../src/drivers/postgres';
import { ColumnSchema } from '../../src/mysql-query-analyzer/types';

describe('postgres-code-generator', () => {

	let dbSchema: ColumnSchema[] = [];

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
		dbSchema = dbSchemaResult.value.map(col => mapToColumnSchema(col));
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

	it('crud-select01', () => {
		const actual = generateCrud('pg', 'Select', 'mytable1', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-select01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-insert01', () => {
		const actual = generateCrud('pg', 'Insert', 'mytable1', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-insert01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update01', () => {
		const actual = generateCrud('pg', 'Update', 'mytable1', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-update01.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-update02', () => {
		const actual = generateCrud('pg', 'Update', 'mytable2', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-update02.ts.txt', 'utf-8').replace(/\r/gm, '');
		assert.deepStrictEqual(actual, expected);
	});

	it('crud-delete01', () => {
		const actual = generateCrud('pg', 'Delete', 'mytable1', dbSchema);
		const expected = readFileSync('tests/postgres/expected-code/crud-delete01.ts.txt', 'utf-8').replace(/\r/gm, '');

		assert.deepStrictEqual(actual, expected);
	});

	it('nested01 - FROM users u INNER JOIN posts p', async () => {
		const sql = `-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title
FROM users u
INNER JOIN posts p on p.fk_user = u.id`;

		const actual = await generateCode(dialect, sql, 'nested01');
		const expected = readFileSync('tests/postgres/expected-code/nested01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('nested02 - self relation', async () => {
		const sql = `-- @nested
SELECT
	c.id,
	a1.*,
	a2.*
FROM clients as c
INNER JOIN addresses as a1 ON a1.id = c.primaryAddress
LEFT JOIN addresses as a2 ON a2.id = c.secondaryAddress
WHERE c.id = :clientId`;

		const actual = await generateCode(dialect, sql, 'nested02');
		const expected = readFileSync('tests/postgres/expected-code/nested02-clients-with-addresses.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('nested03 - many to many', async () => {
		const sql = `-- @nested
SELECT
	s.id as surveyId,
	s.name as surveyName,
	u.id as userId,
	u.name as userName
FROM surveys s
INNER JOIN participants p on p.fk_survey = s.id
INNER JOIN users u on u.id = p.fk_user`;

		const actual = await generateCode(dialect, sql, 'nested03');
		const expected = readFileSync('tests/postgres/expected-code/nested03-many-to-many.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('dynamic-query-01', async () => {
		const sql = `-- @dynamicQuery
	SELECT m1.id, m1.value, m2.name, m2.descr as description
	FROM mytable1 m1
	INNER JOIN mytable2 m2 on m1.id = m2.id`;

		const actual = await generateCode(dialect, sql, 'dynamic-query-01');
		const expected = readFileSync('tests/postgres/expected-code/dynamic-query01.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('dynamic-query-02', async () => {
		const sql = `-- @dynamicQuery
SELECT m1.id, m2.name
FROM mytable1 m1
INNER JOIN ( -- derivated table
	SELECT id, name from mytable2 m 
	WHERE m.name = :subqueryName
) m2 on m2.id = m1.id`;

		const actual = await generateCode(dialect, sql, 'derivated-table');
		const expected = readFileSync('tests/postgres/expected-code/dynamic-query02.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('dynamic-query-03', async () => {
		const sql = `-- @dynamicQuery
	SELECT t1.id, t1.value
	FROM mytable1 t1`;

		const actual = await generateCode(dialect, sql, 'dynamic-query-03');
		const expected = readFileSync('tests/postgres/expected-code/dynamic-query03.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('dynamic-query-04', async () => {
		const sql = `-- @dynamicQuery
	SELECT 
		*
	FROM mytable1 m1
	INNER JOIN mytable2 m2 on m2.id = m1.id`;

		const actual = await generateCode(dialect, sql, 'dynamic-query-04');
		const expected = readFileSync('tests/postgres/expected-code/dynamic-query04.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('dynamic-query-05', async () => {
		const sql = `-- @dynamicQuery
WITH 
	cte as (
		select id, name from mytable2
	)
SELECT 
	m1.id,
	m2.name
FROM mytable1 m1
INNER JOIN cte m2 on m2.id = m1.id`;

		const actual = await generateCode(dialect, sql, 'dynamic-query-05');
		const expected = readFileSync('tests/postgres/expected-code/dynamic-query05.ts.txt', 'utf-8').replace(/\r/gm, '');

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});

