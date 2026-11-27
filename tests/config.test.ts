import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'path';
import { globSync } from 'glob';
import { TypeSqlConfig } from '../src/types';
import {
  collectSqlFiles,
  crudRootDir,
  indexFileDirs,
  isCrudFile,
  isNestedOutDir,
  resolveConfig,
  resolveEnvVars,
  resolveSqlDir,
  resolveSqlFile,
  resolveTsFilePath
} from '../src/load-config';

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

describe('resolveSqlDir', () => {
  describe('plain directories', () => {
    it('appends the recursive glob and keeps the directory as base', () => {
      assert.deepStrictEqual(resolveSqlDir('src'), { glob: 'src/**/*.sql', baseDir: 'src' });
    });

    it('normalizes a leading ./ and a trailing slash', () => {
      assert.deepStrictEqual(resolveSqlDir('./src'), { glob: 'src/**/*.sql', baseDir: 'src' });
      assert.deepStrictEqual(resolveSqlDir('src/'), { glob: 'src/**/*.sql', baseDir: 'src' });
    });

    it('handles an absolute directory', () => {
      assert.deepStrictEqual(resolveSqlDir('/app/sql'), { glob: '/app/sql/**/*.sql', baseDir: '/app/sql' });
    });

    it('handles the current directory', () => {
      assert.deepStrictEqual(resolveSqlDir('.'), { glob: '**/*.sql', baseDir: '.' });
    });
  });

  describe('directory globs', () => {
    it('appends the recursive glob and bases on the magic-free prefix', () => {
      assert.deepStrictEqual(resolveSqlDir('src/**/queries'), { glob: 'src/**/queries/**/*.sql', baseDir: 'src' });
    });

    it('handles an absolute directory glob', () => {
      assert.deepStrictEqual(resolveSqlDir('/app/src/**/queries'), {
        glob: '/app/src/**/queries/**/*.sql',
        baseDir: '/app/src'
      });
    });

    it('falls back to the current directory when the glob starts with magic', () => {
      assert.deepStrictEqual(resolveSqlDir('**/queries'), { glob: '**/queries/**/*.sql', baseDir: '.' });
    });
  });

  describe('patterns already targeting .sql files', () => {
    it('uses the pattern verbatim and bases on the magic-free prefix', () => {
      assert.deepStrictEqual(resolveSqlDir('src/**/*.query.sql'), { glob: 'src/**/*.query.sql', baseDir: 'src' });
    });

    it('uses an absolute pattern verbatim', () => {
      assert.deepStrictEqual(resolveSqlDir('/app/sql/**/*.query.sql'), {
        glob: '/app/sql/**/*.query.sql',
        baseDir: '/app/sql'
      });
    });

    it('matches the .sql suffix case-insensitively', () => {
      assert.deepStrictEqual(resolveSqlDir('src/queries/GET-USER.SQL'), {
        glob: 'src/queries/GET-USER.SQL',
        baseDir: 'src/queries'
      });
    });

    it('bases a magic-free .sql path on its parent directory', () => {
      assert.deepStrictEqual(resolveSqlDir('src/queries/get-user.sql'), {
        glob: 'src/queries/get-user.sql',
        baseDir: 'src/queries'
      });
    });
  });

  describe('glob magic detection', () => {
    it('treats braces as magic', () => {
      assert.deepStrictEqual(resolveSqlDir('src/{users,posts}/*.sql'), {
        glob: 'src/{users,posts}/*.sql',
        baseDir: 'src'
      });
    });

    it('treats ? as magic', () => {
      assert.deepStrictEqual(resolveSqlDir('src/q?/*.sql'), { glob: 'src/q?/*.sql', baseDir: 'src' });
    });

    it('stops at the first magic segment, not the last static one', () => {
      assert.deepStrictEqual(resolveSqlDir('src/*/queries/nested'), {
        glob: 'src/*/queries/nested/**/*.sql',
        baseDir: 'src'
      });
    });
  });

  // A directory name may contain characters glob treats as magic (`app[dev]`, a Next.js
  // `[locale]` folder). Those must stay literal: the base directory anchors outDir, so
  // truncating it there would write generated code outside the project.
  describe('directories whose names contain glob magic', () => {
    let projectDir: string;
    let sqlDir: string;

    before(() => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typesql-'));
      projectDir = path.join(tmpDir, 'app[dev]');
      sqlDir = path.join(projectDir, 'src');
      fs.mkdirSync(path.join(sqlDir, 'users/queries'), { recursive: true });
      fs.writeFileSync(path.join(sqlDir, 'users/queries/get-user.sql'), 'select 1');
      fs.writeFileSync(path.join(sqlDir, 'users/legacy.sql'), 'select 2');
    });

    after(() => {
      fs.rmSync(path.dirname(projectDir), { recursive: true, force: true });
    });

    it('keeps the base directory inside the project', () => {
      assert.strictEqual(resolveSqlDir(sqlDir).baseDir, sqlDir);
      assert.strictEqual(resolveSqlDir(`${sqlDir}/**/queries`).baseDir, sqlDir);
      assert.strictEqual(resolveSqlDir(`${sqlDir}/**/*.sql`).baseDir, sqlDir);
    });

    it('escapes the base directory so the glob still matches', () => {
      const { glob } = resolveSqlDir(sqlDir);

      assert.deepStrictEqual(globSync(glob).sort(), [
        path.join(sqlDir, 'users/legacy.sql'),
        path.join(sqlDir, 'users/queries/get-user.sql')
      ]);
    });

    it('applies the user pattern beneath the escaped base directory', () => {
      const { glob } = resolveSqlDir(`${sqlDir}/**/queries`);

      assert.deepStrictEqual(globSync(glob), [path.join(sqlDir, 'users/queries/get-user.sql')]);
    });
  });

  // An exclusion segment is magic, but minimatch reads a leading '!' as negating the whole
  // pattern when the segment is tested alone - so it must not be absorbed into the base
  // directory, where escaping would turn it into a literal folder name that matches nothing.
  describe('exclusion patterns', () => {
    let projectDir: string;

    const files = [
      'src/users/queries/get-user.sql',
      'packages/api/queries/list.sql',
      'node_modules/somepkg/queries/vendor.sql',
      'packages/api/node_modules/dep/queries/nested-vendor.sql'
    ];

    before(() => {
      projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typesql-'));
      for (const file of files) {
        fs.mkdirSync(path.join(projectDir, path.dirname(file)), { recursive: true });
        fs.writeFileSync(path.join(projectDir, file), 'select 1');
      }
    });

    after(() => {
      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('treats a leading ! as magic rather than a literal directory', () => {
      assert.deepStrictEqual(resolveSqlDir('./!(node_modules)/**/queries/**/*.sql'), {
        glob: '!(node_modules)/**/queries/**/*.sql',
        baseDir: '.'
      });
    });

    it('anchors the base directory above the exclusion', () => {
      const { baseDir } = resolveSqlDir(path.join(projectDir, '!(node_modules)/**/queries/**/*.sql'));

      assert.strictEqual(baseDir, projectDir);
    });

    it('excludes a top-level node_modules', () => {
      const { glob } = resolveSqlDir(path.join(projectDir, '!(node_modules)/**/queries/**/*.sql'));

      const matched = globSync(glob).map((file) => path.relative(projectDir, file)).sort();

      assert.ok(!matched.includes(path.join('node_modules/somepkg/queries/vendor.sql')));
      assert.ok(matched.includes(path.join('src/users/queries/get-user.sql')));
      assert.ok(matched.includes(path.join('packages/api/queries/list.sql')));
    });

    // Documented limitation: the exclusion constrains one segment, and the `**` after it
    // re-admits every descendant - so a nested node_modules is still matched.
    it('does not exclude a nested node_modules', () => {
      const { glob } = resolveSqlDir(path.join(projectDir, '!(node_modules)/**/queries/**/*.sql'));

      const matched = globSync(glob).map((file) => path.relative(projectDir, file));

      assert.ok(matched.includes(path.join('packages/api/node_modules/dep/queries/nested-vendor.sql')));
    });
  });

  it('produces a base directory that preserves the sql tree in the output', () => {
    const { baseDir } = resolveSqlDir(`${path.resolve('/app/src')}/**/queries`);
    const sqlPath = path.resolve('/app/src/users/queries/get-user.sql');
    const outDir = path.resolve('/app/generated');

    const actual = resolveTsFilePath(sqlPath, baseDir, outDir);
    const expected = path.resolve('/app/generated/users/queries/get-user.ts');

    assert.strictEqual(actual, expected);
  });
});

// `outDir` is read by shape: a bare name sits beside each query, an explicitly rooted path
// keeps one global output tree mirroring the base directory.
describe('outDir modes', () => {
  const baseDir = path.resolve('/app/src');
  const sqlPath = path.resolve('/app/src/users/queries/get-user.sql');

  describe('isNestedOutDir', () => {
    it('treats a bare name as nested', () => {
      assert.strictEqual(isNestedOutDir('gen'), true);
      assert.strictEqual(isNestedOutDir('generated/ts'), true);
    });

    it('treats an explicitly rooted path as global', () => {
      assert.strictEqual(isNestedOutDir('./gen'), false);
      assert.strictEqual(isNestedOutDir('../gen'), false);
      assert.strictEqual(isNestedOutDir('.'), false);
      assert.strictEqual(isNestedOutDir('..'), false);
      assert.strictEqual(isNestedOutDir(path.resolve('/abs/out')), false);
    });

    it('treats a missing or blank outDir as global', () => {
      assert.strictEqual(isNestedOutDir(undefined), false);
      assert.strictEqual(isNestedOutDir(''), false);
      assert.strictEqual(isNestedOutDir('   '), false);
    });
  });

  describe('resolveTsFilePath', () => {
    it('puts output beside the query for a bare name', () => {
      assert.strictEqual(
        resolveTsFilePath(sqlPath, baseDir, 'gen'),
        path.resolve('/app/src/users/queries/gen/get-user.ts')
      );
    });

    it('keeps each query directory separate rather than merging them', () => {
      const other = path.resolve('/app/src/posts/queries/get-post.sql');

      assert.strictEqual(resolveTsFilePath(other, baseDir, 'gen'), path.resolve('/app/src/posts/queries/gen/get-post.ts'));
    });

    it('mirrors the tree into a global outDir for a rooted path', () => {
      assert.strictEqual(
        resolveTsFilePath(sqlPath, baseDir, path.resolve('/app/generated')),
        path.resolve('/app/generated/users/queries/get-user.ts')
      );
    });

    it('ignores the base directory entirely when nested', () => {
      const unrelatedBase = path.resolve('/somewhere/else');

      assert.strictEqual(
        resolveTsFilePath(sqlPath, unrelatedBase, 'gen'),
        path.resolve('/app/src/users/queries/gen/get-user.ts')
      );
    });

    it('supports a multi-segment nested name', () => {
      assert.strictEqual(
        resolveTsFilePath(sqlPath, baseDir, 'gen/sql'),
        path.resolve('/app/src/users/queries/gen/sql/get-user.ts')
      );
    });
  });

  describe('crudRootDir', () => {
    it('uses the base directory when outDir is nested', () => {
      assert.strictEqual(crudRootDir({ baseDir, outDir: 'gen' }), baseDir);
    });

    it('uses the base directory when no outDir is set', () => {
      assert.strictEqual(crudRootDir({ baseDir }), baseDir);
    });

    it('uses the global outDir when one is configured', () => {
      const outDir = path.resolve('/app/generated');

      assert.strictEqual(crudRootDir({ baseDir, outDir }), outDir);
    });
  });

  it('generates a nested query through collectSqlFiles', () => {
    const actual = collectSqlFiles([sqlPath], [], { baseDir, outDir: 'gen' });

    assert.deepStrictEqual(actual, [
      { sqlPath, tsPath: path.resolve('/app/src/users/queries/gen/get-user.ts'), isCrud: false }
    ]);
  });

  it('keeps generated crud sql at the crud root and its output nested', () => {
    const crudQuery = path.resolve('/app/src/crud/users/select-from-users.sql');

    const actual = collectSqlFiles([], [crudQuery], { baseDir, outDir: 'gen' });

    assert.deepStrictEqual(actual, [
      { sqlPath: crudQuery, tsPath: path.resolve('/app/src/crud/users/gen/select-from-users.ts'), isCrud: true }
    ]);
  });
});

describe('isCrudFile', () => {
  const sqlDir = path.resolve('/app/src');

  it('detects files under the crud folder', () => {
    assert.strictEqual(isCrudFile(sqlDir, path.resolve('/app/src/crud/users/select-from-users.sql')), true);
  });

  it('rejects files outside the crud folder', () => {
    assert.strictEqual(isCrudFile(sqlDir, path.resolve('/app/src/users/get-user.sql')), false);
  });

  it('rejects a folder that merely starts with crud', () => {
    assert.strictEqual(isCrudFile(sqlDir, path.resolve('/app/src/crudely/get-user.sql')), false);
  });

  it('rejects files outside the sql directory', () => {
    assert.strictEqual(isCrudFile(sqlDir, path.resolve('/app/other/crud/users/select-from-users.sql')), false);
  });
});

describe('resolveSqlFile', () => {
  const baseDir = path.resolve('/app/src');
  const noCrud: ReadonlySet<string> = new Set();

  it('resolves a query against the base directory', () => {
    const outDir = path.resolve('/app/generated');
    const sqlPath = path.resolve('/app/src/users/queries/get-user.sql');

    assert.deepStrictEqual(resolveSqlFile(sqlPath, { baseDir, outDir }, noCrud), {
      sqlPath,
      tsPath: path.resolve('/app/generated/users/queries/get-user.ts'),
      isCrud: false
    });
  });

  it('flags a hand-written query living under the crud folder', () => {
    const sqlPath = path.resolve('/app/src/crud/users/select-from-users.sql');

    assert.deepStrictEqual(resolveSqlFile(sqlPath, { baseDir, outDir: baseDir }, noCrud), {
      sqlPath,
      tsPath: path.resolve('/app/src/crud/users/select-from-users.ts'),
      isCrud: true
    });
  });

  // Generated crud queries land under outDir, which need not sit inside the base directory,
  // so resolving them against baseDir would push the output outside outDir entirely.
  it('resolves a generated crud query against the output directory', () => {
    const outDir = path.resolve('/app/generated');
    const sqlPath = path.resolve('/app/generated/crud/users/select-from-users.sql');
    const crudPaths = new Set([sqlPath]);

    assert.deepStrictEqual(resolveSqlFile(sqlPath, { baseDir, outDir }, crudPaths), {
      sqlPath,
      tsPath: path.resolve('/app/generated/crud/users/select-from-users.ts'),
      isCrud: true
    });
  });

  it('flags a generated crud query that the glob also matched', () => {
    const sqlPath = path.resolve('/app/src/crud/users/select-from-users.sql');
    const crudPaths = new Set([sqlPath]);

    assert.deepStrictEqual(resolveSqlFile(sqlPath, { baseDir, outDir: baseDir }, crudPaths), {
      sqlPath,
      tsPath: path.resolve('/app/src/crud/users/select-from-users.ts'),
      isCrud: true
    });
  });

  it('matches crud paths regardless of how the sql path is spelled', () => {
    const crudPaths = new Set([path.resolve('/app/src/crud/users/select-from-users.sql')]);
    const sqlPath = path.resolve('/app/src/users/../crud/users/select-from-users.sql');

    assert.strictEqual(resolveSqlFile(sqlPath, { baseDir, outDir: baseDir }, crudPaths).isCrud, true);
  });
});

describe('collectSqlFiles', () => {
  const baseDir = path.resolve('/app/src');
  const query = path.resolve('/app/src/users/queries/get-user.sql');

  it('compiles the files the glob matched', () => {
    const actual = collectSqlFiles([query], [], { baseDir, outDir: baseDir });

    assert.deepStrictEqual(actual, [
      { sqlPath: query, tsPath: path.resolve('/app/src/users/queries/get-user.ts'), isCrud: false }
    ]);
  });

  // Without this, `includeCrudTables` silently produces .sql files that never become .ts.
  it('compiles generated crud queries the glob did not match', () => {
    const crudQuery = path.resolve('/app/src/crud/users/select-from-users.sql');

    const actual = collectSqlFiles([query], [crudQuery], { baseDir, outDir: baseDir });

    assert.deepStrictEqual(actual, [
      { sqlPath: query, tsPath: path.resolve('/app/src/users/queries/get-user.ts'), isCrud: false },
      { sqlPath: crudQuery, tsPath: path.resolve('/app/src/crud/users/select-from-users.ts'), isCrud: true }
    ]);
  });

  it('compiles a generated crud query only once when the glob already matched it', () => {
    const crudQuery = path.resolve('/app/src/crud/users/select-from-users.sql');

    const actual = collectSqlFiles([query, crudQuery], [crudQuery], { baseDir, outDir: baseDir });

    assert.deepStrictEqual(actual.map((file) => file.sqlPath), [query, crudQuery]);
    assert.strictEqual(actual[1].isCrud, true);
  });

  it('keeps generated crud output inside outDir when it differs from the base directory', () => {
    const outDir = path.resolve('/app/generated');
    const crudQuery = path.resolve('/app/generated/crud/users/select-from-users.sql');

    const actual = collectSqlFiles([query], [crudQuery], { baseDir, outDir });

    assert.deepStrictEqual(actual, [
      { sqlPath: query, tsPath: path.resolve('/app/generated/users/queries/get-user.ts'), isCrud: false },
      { sqlPath: crudQuery, tsPath: path.resolve('/app/generated/crud/users/select-from-users.ts'), isCrud: true }
    ]);
  });

  it('returns nothing when no files matched and no crud was generated', () => {
    assert.deepStrictEqual(collectSqlFiles([], [], { baseDir, outDir: baseDir }), []);
  });
});

describe('indexFileDirs', () => {
  it('returns the directory of each generated file, deduplicated', () => {
    const actual = indexFileDirs([
      path.resolve('/app/generated/users/get-user.ts'),
      path.resolve('/app/generated/users/insert-user.ts'),
      path.resolve('/app/generated/posts/get-post.ts')
    ]);

    assert.deepStrictEqual(actual, [path.resolve('/app/generated/users'), path.resolve('/app/generated/posts')]);
  });

  // The whole point of the fix: directories that received no generated code are never
  // listed, so hand-written index.ts files elsewhere under the base directory survive.
  it('never returns a directory that received no generated file', () => {
    const actual = indexFileDirs([path.resolve('/app/src/users/queries/get-user.ts')]);

    assert.deepStrictEqual(actual, [path.resolve('/app/src/users/queries')]);
  });

  it('returns nothing when no files were generated', () => {
    assert.deepStrictEqual(indexFileDirs([]), []);
  });
});

describe('resolveTsFilePath', () => {
  it('resolves path when outDir is not provided (defaults to sqlDir)', () => {
    const sqlDir = path.resolve('/myapp/sql');
    const sqlPath = path.resolve('/myapp/sql/users/get-user.sql');

    const actual = resolveTsFilePath(sqlPath, sqlDir);
    const expected = path.resolve('/myapp/sql/users/get-user.ts');

    assert.strictEqual(actual, expected);
  });

  it('resolves path when outDir is provided and sqlPath is in subdirectory', () => {
    const sqlDir = path.resolve('/myapp/sql');
    const outDir = path.resolve('/myapp/generated');
    const sqlPath = path.resolve('/myapp/sql/users/other/select-user.sql');

    const actual = resolveTsFilePath(sqlPath, sqlDir, outDir);
    const expected = path.resolve('/myapp/generated/users/other/select-user.ts');

    assert.strictEqual(actual, expected);
  });

  it('resolves path when sqlPath is directly in sqlDir', () => {
    const sqlDir = path.resolve('/myapp/sql');
    const outDir = path.resolve('/myapp/out');
    const sqlPath = path.resolve('/myapp/sql/find-user.sql');

    const actual = resolveTsFilePath(sqlPath, sqlDir, outDir);
    const expected = path.resolve('/myapp/out/find-user.ts');

    assert.strictEqual(actual, expected);
  });

  it('resolves path correctly with relative sqlDir and outDir', () => {
    const baseDir = process.cwd(); // simulate like configDir in your example
    const sqlDir = './sql';
    const outDir = './generated';
    const sqlPath = path.join(baseDir, 'sql/users/get-user.sql');

    const actual = resolveTsFilePath(sqlPath, path.resolve(baseDir, sqlDir), path.resolve(baseDir, outDir));
    const expected = path.resolve(baseDir, 'generated/users/get-user.ts');

    assert.strictEqual(actual, expected);
  });
});
