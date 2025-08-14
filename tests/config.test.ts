import assert from 'node:assert';
import path from 'path';
import { TypeSqlConfig } from '../src/types';
import { resolveConfig, resolveEnvVars } from '../src/load-config';

describe('resolveConfig', () => {
  const fakeConfigPath = '/project/src/sql/typesql.json';
  const configDir = path.dirname(fakeConfigPath);

  it('resolves relative databaseUri and sqlDir paths', () => {
    const input: TypeSqlConfig = {
      databaseUri: './mydb.db',
      sqlDir: './sql',
      client: 'bun:sqlite',
      includeCrudTables: []
    };

    const actual = resolveConfig(fakeConfigPath, input);
    const expected: TypeSqlConfig = {
      databaseUri: path.resolve(configDir, './mydb.db'),
      sqlDir: path.resolve(configDir, './sql'),
      client: 'bun:sqlite',
      includeCrudTables: []
    };

    assert.deepStrictEqual(actual, expected);
  });

  it('does not resolve absolute databaseUri', () => {
    const absPath = '/var/data/mydb.db';
    const input: TypeSqlConfig = {
      databaseUri: absPath,
      sqlDir: './sql',
      client: 'bun:sqlite',
      includeCrudTables: []
    };

    const actual = resolveConfig(fakeConfigPath, input);
    const expected: TypeSqlConfig = {
      databaseUri: absPath,
      sqlDir: path.resolve(configDir, './sql'),
      client: 'bun:sqlite',
      includeCrudTables: []
    };

    assert.deepStrictEqual(actual, expected);
  });

  it('does not resolve databaseUri if it looks like a connection string', () => {
    const input: TypeSqlConfig = {
      databaseUri: 'postgres://user:pass@host/db',
      sqlDir: './sql',
      client: 'pg',
      includeCrudTables: []
    };

    const actual = resolveConfig(fakeConfigPath, input);
    const expected: TypeSqlConfig = {
      databaseUri: 'postgres://user:pass@host/db',
      sqlDir: path.resolve(configDir, './sql'),
      client: 'pg',
      includeCrudTables: []
    };

    assert.deepStrictEqual(actual, expected);
  });

  it('handles empty or whitespace databaseUri as relative path', () => {
    const inputs = [
      { databaseUri: '', sqlDir: './sql' },
      { databaseUri: '   ', sqlDir: './sql' }
    ];

    for (const input of inputs) {
      const config: TypeSqlConfig = {
        databaseUri: input.databaseUri,
        sqlDir: input.sqlDir,
        client: 'bun:sqlite',
        includeCrudTables: []
      };
      const actual = resolveConfig(fakeConfigPath, config);
      const expected: TypeSqlConfig = {
        databaseUri: path.resolve(configDir, input.databaseUri),
        sqlDir: path.resolve(configDir, input.sqlDir),
        client: 'bun:sqlite',
        includeCrudTables: []
      };

      assert.deepStrictEqual(actual, expected);
    }
  });
});

describe('resolveEnvVars', () => {
  it('does not replace databaseUri if no env var pattern', () => {
    const input: TypeSqlConfig = {
      databaseUri: 'postgres://user:pass@host/db',
      sqlDir: './sql',
      client: 'pg',
      includeCrudTables: []
    };

    const actual = resolveEnvVars(input);
    const expected: TypeSqlConfig = {
      ...input
    };

    assert.deepStrictEqual(actual, expected);
  });

  it('replaces ${ENV_VAR} with process.env value', () => {
    process.env.TEST_DB = 'postgres://env-user:env-pass@env-host/env-db';
    process.env.AUTH_TOKEN = 'secret-token';

    const input: TypeSqlConfig = {
      databaseUri: '${TEST_DB}',
      authToken: '${AUTH_TOKEN}',
      sqlDir: './sql',
      client: 'pg',
      includeCrudTables: []
    };

    const actual = resolveEnvVars(input);
    const expected: TypeSqlConfig = {
      ...input,
      databaseUri: process.env.TEST_DB!,
      authToken: 'secret-token'
    };

    assert.deepStrictEqual(actual, expected);

    delete process.env.TEST_DB;
  });

  it('replaces ${ENV_VAR} with empty string and warns if env var missing', () => {
    const input: TypeSqlConfig = {
      databaseUri: '${MISSING_VAR}',
      sqlDir: './sql',
      client: 'pg',
      includeCrudTables: []
    };

    let warnCalled = false;
    const originalWarn = console.warn;
    console.warn = (msg: string) => {
      if (msg.includes('MISSING_VAR')) warnCalled = true;
    };

    const actual = resolveEnvVars(input);
    const expected: TypeSqlConfig = {
      ...input,
      databaseUri: ''
    };

    assert.deepStrictEqual(actual, expected);
    assert.strictEqual(warnCalled, true);

    console.warn = originalWarn;
  });
});
