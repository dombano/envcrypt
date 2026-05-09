import { diffEnv, diffEnvFiles, formatDiff } from './diff';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-diff-'));
}

describe('diffEnv', () => {
  it('detects added keys', () => {
    const result = diffEnv({}, { NEW_KEY: 'value' });
    expect(result.added).toEqual({ NEW_KEY: 'value' });
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
  });

  it('detects removed keys', () => {
    const result = diffEnv({ OLD_KEY: 'value' }, {});
    expect(result.removed).toEqual({ OLD_KEY: 'value' });
    expect(result.added).toEqual({});
    expect(result.changed).toEqual({});
  });

  it('detects changed keys', () => {
    const result = diffEnv({ KEY: 'old' }, { KEY: 'new' });
    expect(result.changed).toEqual({ KEY: { from: 'old', to: 'new' } });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
  });

  it('detects unchanged keys', () => {
    const result = diffEnv({ KEY: 'same' }, { KEY: 'same' });
    expect(result.unchanged).toEqual({ KEY: 'same' });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
  });

  it('handles mixed changes', () => {
    const before = { A: '1', B: '2', C: '3' };
    const after = { A: '1', B: '99', D: '4' };
    const result = diffEnv(before, after);
    expect(result.unchanged).toEqual({ A: '1' });
    expect(result.changed).toEqual({ B: { from: '2', to: '99' } });
    expect(result.removed).toEqual({ C: '3' });
    expect(result.added).toEqual({ D: '4' });
  });
});

describe('diffEnvFiles', () => {
  it('diffs two env files', () => {
    const dir = makeTempDir();
    const beforePath = path.join(dir, 'before.env');
    const afterPath = path.join(dir, 'after.env');
    fs.writeFileSync(beforePath, 'FOO=bar\nBAZ=qux\n');
    fs.writeFileSync(afterPath, 'FOO=bar\nNEW=val\n');
    const result = diffEnvFiles(beforePath, afterPath);
    expect(result.unchanged).toEqual({ FOO: 'bar' });
    expect(result.removed).toEqual({ BAZ: 'qux' });
    expect(result.added).toEqual({ NEW: 'val' });
  });

  it('treats missing file as empty', () => {
    const dir = makeTempDir();
    const afterPath = path.join(dir, 'after.env');
    fs.writeFileSync(afterPath, 'ONLY=here\n');
    const result = diffEnvFiles(path.join(dir, 'nonexistent.env'), afterPath);
    expect(result.added).toEqual({ ONLY: 'here' });
  });
});

describe('formatDiff', () => {
  it('masks values by default', () => {
    const diff = diffEnv({}, { SECRET: 'password' });
    const output = formatDiff(diff);
    expect(output).toContain('+ SECRET=***');
    expect(output).not.toContain('password');
  });

  it('shows values when maskValues is false', () => {
    const diff = diffEnv({}, { KEY: 'visible' });
    const output = formatDiff(diff, false);
    expect(output).toContain('+ KEY=visible');
  });

  it('returns no-diff message when identical', () => {
    const diff = diffEnv({ A: '1' }, { A: '1' });
    expect(formatDiff(diff)).toBe('No differences found.');
  });
});
