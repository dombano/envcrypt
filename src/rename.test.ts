import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { renameEnvKey, renameEnvKeyInFile } from './rename';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-rename-'));
}

describe('renameEnvKey', () => {
  it('renames an existing key preserving value', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const { env: updated, result } = renameEnvKey(env, 'FOO', 'NEW_FOO');
    expect(updated).not.toHaveProperty('FOO');
    expect(updated['NEW_FOO']).toBe('bar');
    expect(updated['BAZ']).toBe('qux');
    expect(result.found).toBe(true);
  });

  it('preserves insertion order around the renamed key', () => {
    const env = { A: '1', B: '2', C: '3' };
    const { env: updated } = renameEnvKey(env, 'B', 'B_NEW');
    expect(Object.keys(updated)).toEqual(['A', 'B_NEW', 'C']);
  });

  it('returns found=false when key does not exist', () => {
    const env = { FOO: 'bar' };
    const { env: updated, result } = renameEnvKey(env, 'MISSING', 'X');
    expect(result.found).toBe(false);
    expect(updated).toEqual(env);
  });

  it('is a no-op when old and new keys are the same', () => {
    const env = { FOO: 'bar' };
    const { env: updated, result } = renameEnvKey(env, 'FOO', 'FOO');
    expect(result.found).toBe(true);
    expect(updated).toEqual(env);
  });

  it('overwrites existing key with the new name', () => {
    const env = { FOO: 'original', BAR: 'other' };
    const { env: updated } = renameEnvKey(env, 'FOO', 'BAR');
    expect(updated['BAR']).toBe('original');
    expect(Object.keys(updated)).toHaveLength(1);
  });
});

describe('renameEnvKeyInFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('renames a key in a file and persists the change', async () => {
    const filePath = path.join(tmpDir, '.env');
    await fs.writeFile(filePath, 'OLD_KEY=hello\nOTHER=world\n', 'utf-8');

    const result = await renameEnvKeyInFile(filePath, 'OLD_KEY', 'NEW_KEY');
    expect(result.found).toBe(true);

    const contents = await fs.readFile(filePath, 'utf-8');
    expect(contents).toContain('NEW_KEY=hello');
    expect(contents).not.toContain('OLD_KEY');
  });

  it('returns found=false and does not modify file when key is absent', async () => {
    const filePath = path.join(tmpDir, '.env');
    const original = 'FOO=bar\n';
    await fs.writeFile(filePath, original, 'utf-8');

    const result = await renameEnvKeyInFile(filePath, 'MISSING', 'X');
    expect(result.found).toBe(false);

    const contents = await fs.readFile(filePath, 'utf-8');
    expect(contents).toBe(original);
  });
});
