import assert from 'node:assert';
import { describeQuery } from '../../src/postgres-query-analyzer/describe';
import { PostgresSchemaDef } from '../../src/postgres-query-analyzer/types';
import { createSchemaInfo, createTestClient } from './schema';

describe('postgres-infer-nullability-case-when', () => {

	const client = createTestClient();
	const schemaInfo = createSchemaInfo();

	after(async () => {
		await client.end(); // Close the connection
	});

	it('CASE WHEN value IS NULL THEN 1 ELSE value END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN value IS NULL THEN 1
					ELSE value
				END AS computed_value
			FROM mytable1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE WHEN value IS NULL THEN 1 ELSE mytable1.value END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN value IS NULL THEN 1
					ELSE mytable1.value
				END AS computed_value
			FROM mytable1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE WHEN m1.value IS NULL THEN 1 ELSE m1.value END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m1.value IS NULL THEN 1
					ELSE m1.value
				END AS computed_value
			FROM mytable1 m1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE WHEN m1.value IS NULL AND id > 10 THEN 1 ELSE m1.value END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m1.value IS NULL AND id > 10 THEN 1
					ELSE m1.value
				END AS computed_value
			FROM mytable1 m1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE WHEN m1.value IS NULL OR id > 10 THEN 1 ELSE m1.value END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m1.value IS NULL OR id > 10 THEN 1
					ELSE m1.value
				END AS computed_value
			FROM mytable1 m1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE WHEN m1.id IS NULL THEN 1 ELSE m1.value END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m1.id IS NULL THEN 1
					ELSE m1.value
				END AS computed_value
			FROM mytable1 m1
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`CASE WHEN m5.name IS NULL THEN 'a' ELSE m2.name	END AS computed_value`, async () => {
		const sql = `
			SELECT
				CASE
					WHEN m5.name IS NULL THEN 'a'
					ELSE m2.name
				END AS computed_value
			FROM mytable2 m2
			INNER JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`CASE WHEN m2.name IS NULL THEN 'a' ELSE m2.name	END AS computed_value`, async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.name IS NULL THEN 'a'
					ELSE m2.name
				END AS computed_value
			FROM mytable2 m2
			INNER JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`CASE WHEN m2.name IS NULL AND m5.name IS NULL THEN 'a' ELSE m2.name END AS computed_value`, async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.name IS NULL AND m5.name IS NULL THEN 'a'
					ELSE m2.name
				END AS computed_value
			FROM mytable2 m2
			INNER JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('CASE WHEN m2.name IS NULL THEN m5.name ELSE m2.name	END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.name IS NULL THEN m5.name
					ELSE m2.name
				END AS computed_value
			FROM mytable2 m2
			JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`CASE WHEN m2.name IS NULL AND m5.name IS NULL THEN 'unknown' WHEN m2.name IS NULL THEN m5.name ELSE m2.name	END AS computed_value`, async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.name IS NULL AND m5.name IS NULL THEN 'unknown'
					WHEN m2.name IS NULL THEN m5.name
					ELSE m2.name
				END AS computed_value
			FROM mytable2 m2
			JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`CASE WHEN m2.name IS NULL THEN 'a' ELSE CASE WHEN m2.id = 1 THEN 'a' ELSE m2.name END END AS computed_value`, async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.name IS NULL THEN 'a'
					ELSE CASE WHEN m2.id = 1 THEN 'a' ELSE m2.name END
				END AS computed_value
			FROM mytable2 m2
			JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it(`CASE WHEN m2.id = 1 THEN 'a' ELSE CASE ... END END AS computed_value`, async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.id = 1 THEN 'a'
					ELSE CASE WHEN m2.name is not null THEN 'a' ELSE m2.name END
				END AS computed_value
			FROM mytable2 m2
			JOIN mytable5 m5 ON m2.id = m5.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'text',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('LEFT JOIN - CASE WHEN m2.id IS NULL THEN 1 ELSE m2.id END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.id IS NULL THEN 1
					ELSE m2.id
				END AS computed_value
			FROM mytable1 m1
			LEFT JOIN mytable2 m2 ON m1.id = m2.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});

	it('LEFT JOIN - CASE WHEN m2.id = 1 THEN 1	ELSE m2.id END AS computed_value', async () => {
		const sql = `
			SELECT
				CASE
					WHEN m2.id = 1 THEN 1
					ELSE m2.id
				END AS computed_value
			FROM mytable1 m1
			LEFT JOIN mytable2 m2 ON m1.id = m2.id
			`;
		const actual = await describeQuery(client, sql, schemaInfo);
		const expected: PostgresSchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'computed_value',
					type: 'int4',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		if (actual.isErr()) {
			assert.fail(`Shouldn't return an error: ${actual.error.description}`);
		}
		assert.deepStrictEqual(actual.value, expected);
	});
});