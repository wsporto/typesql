import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeFile, writeTsFile } from '../src/codegen/code-generator';

// mtime is pinned to a fixed point before each re-write, so "was it written?" is decided by
// whether that timestamp survived - not by clock granularity between two writes.
const PINNED = new Date('2020-01-01T00:00:00.000Z');

describe('writeFile', () => {
  let tmpDir: string;
  let filePath: string;

  const content = 'export const query = 1;\n';

  const pin = () => fs.utimesSync(filePath, PINNED, PINNED);
  const wasRewritten = () => fs.statSync(filePath).mtimeMs !== PINNED.getTime();

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typesql-write-'));
    filePath = path.join(tmpDir, 'out', 'query.ts');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates the file and its parent directories', () => {
    writeFile(filePath, content);

    assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), content);
  });

  it('does not touch the file when the content is identical', () => {
    writeFile(filePath, content);
    pin();

    writeFile(filePath, content);

    assert.strictEqual(wasRewritten(), false);
    assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), content);
  });

  it('writes when the content changed', () => {
    writeFile(filePath, content);
    pin();

    writeFile(filePath, 'export const query = 2;\n');

    assert.strictEqual(wasRewritten(), true);
    assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), 'export const query = 2;\n');
  });

  it('writes when the content differs only by trailing whitespace', () => {
    writeFile(filePath, content);
    pin();

    writeFile(filePath, `${content}\n`);

    assert.strictEqual(wasRewritten(), true);
  });

  it('stays quiet across repeated identical writes', () => {
    writeFile(filePath, content);
    pin();

    for (let i = 0; i < 5; i++) {
      writeFile(filePath, content);
    }

    assert.strictEqual(wasRewritten(), false);
  });
});

describe('writeTsFile', () => {
  let tmpDir: string;
  let filePath: string;

  const content = 'export const query = 1;\n';
  const header = '// AUTO-GENERATED - DO NOT EDIT';

  const pin = () => fs.utimesSync(filePath, PINNED, PINNED);
  const wasRewritten = () => fs.statSync(filePath).mtimeMs !== PINNED.getTime();

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typesql-write-ts-'));
    filePath = path.join(tmpDir, 'query.ts');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('does not touch the file when header and content are identical', () => {
    writeTsFile(filePath, content, header);
    pin();

    writeTsFile(filePath, content, header);

    assert.strictEqual(wasRewritten(), false);
  });

  it('writes when only the header changed', () => {
    writeTsFile(filePath, content, header);
    pin();

    writeTsFile(filePath, content, '// @ts-nocheck');

    assert.strictEqual(wasRewritten(), true);
    assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), `// @ts-nocheck\n${content}`);
  });

  it('writes when the header is removed', () => {
    writeTsFile(filePath, content, header);
    pin();

    writeTsFile(filePath, content, undefined);

    assert.strictEqual(wasRewritten(), true);
    assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), content);
  });
});
