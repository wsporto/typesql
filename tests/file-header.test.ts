import assert from 'node:assert';
import { applyFileHeader } from '../src/codegen/code-generator';

describe('applyFileHeader', () => {
  const tsContent = 'export type Result = { id: number };\n';

  it('leaves content untouched when no header is configured', () => {
    assert.strictEqual(applyFileHeader(tsContent, undefined), tsContent);
  });

  it('prepends a single-line header', () => {
    const actual = applyFileHeader(tsContent, '// AUTO-GENERATED - DO NOT EDIT');

    assert.strictEqual(actual, `// AUTO-GENERATED - DO NOT EDIT\n${tsContent}`);
  });

  it('joins an array header with newlines, one entry per line', () => {
    const actual = applyFileHeader(tsContent, ['// AUTO-GENERATED - DO NOT EDIT', '// @ts-nocheck']);

    assert.strictEqual(actual, `// AUTO-GENERATED - DO NOT EDIT\n// @ts-nocheck\n${tsContent}`);
  });

  it('writes the header verbatim, without adding comment markers', () => {
    const actual = applyFileHeader(tsContent, '/* eslint-disable */');

    assert.strictEqual(actual, `/* eslint-disable */\n${tsContent}`);
  });

  it('keeps a blank line the header itself asks for', () => {
    const actual = applyFileHeader(tsContent, ['// AUTO-GENERATED', '']);

    assert.strictEqual(actual, `// AUTO-GENERATED\n\n${tsContent}`);
  });

  it('leaves content untouched for an empty or blank header', () => {
    assert.strictEqual(applyFileHeader(tsContent, ''), tsContent);
    assert.strictEqual(applyFileHeader(tsContent, []), tsContent);
    assert.strictEqual(applyFileHeader(tsContent, ['', '  ']), tsContent);
  });

  it('does not alter the generated content itself', () => {
    const multiline = 'import x from "y";\n\nexport const q = 1;\n';

    assert.strictEqual(applyFileHeader(multiline, '// header'), `// header\n${multiline}`);
  });
});
