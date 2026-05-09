import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { mergeEnv, mergeEnvFiles } from './merge';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-merge-'));
}

describe('mergeEnv', () => {
  const base = { FOO: 'foo', SHARED: 'base-value' };
  const incoming = { BAR: 'bar', SHARED: 'new-value' };

  it('adds new keys from incoming', () => {
    const { merged, added } = mergeEnv(base, incoming, 'theirs');
    expect(merged.BAR).toBe('bar');
    expect(added).toContain('BAR');
  });

  it('strategy theirs: overwrites conflicting keys', () => {
    const { merged, overwritten, conflicts } = mergeEnv(base, incoming, 'theirs');
    expect(merged.SHARED).toBe('new-value');
    expect(conflicts).toContain('SHARED');
    expect(overwritten).toContain('SHARED');
  });

  it('strategy ours: keeps base value on conflict', () => {
    const { merged, conflicts, overwritten } = mergeEnv(base, incoming, 'ours');
    expect(merged.SHARED).toBe('base-value');
    expect(conflicts).toContain('SHARED');
    expect(overwritten).toHaveLength(0);
  });

  it('reports no conflicts when keys are identical', () => {
    const { conflicts, added } = mergeEnv(base, { FOO: 'foo' }, 'theirs');
    expect(conflicts).toHaveLength(0);
    expect(added).toHaveLength(0);
  });

  it('preserves base keys not present in incoming', () => {
    const { merged } = mergeEnv(base, incoming, 'theirs');
    expect(merged.FOO).toBe('foo');
  });
});

describe('mergeEnvFiles', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('merges two env files and writes output', async () => {
    const basePath = path.join(tmpDir, 'base.env');
    const incomingPath = path.join(tmpDir, 'incoming.env');
    const outputPath = path.join(tmpDir, 'merged.env');

    await fs.writeFile(basePath, 'FOO=foo\nSHARED=base\n');
    await fs.writeFile(incomingPath, 'BAR=bar\nSHARED=new\n');

    const result = await mergeEnvFiles(basePath, incomingPath, outputPath, 'theirs');

    expect(result.added).toContain('BAR');
    expect(result.conflicts).toContain('SHARED');

    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toContain('FOO=foo');
    expect(content).toContain('BAR=bar');
    expect(content).toContain('SHARED=new');
  });

  it('writes to base path when output equals base', async () => {
    const basePath = path.join(tmpDir, 'base.env');
    const incomingPath = path.join(tmpDir, 'incoming.env');

    await fs.writeFile(basePath, 'A=1\n');
    await fs.writeFile(incomingPath, 'B=2\n');

    await mergeEnvFiles(basePath, incomingPath, basePath, 'theirs');
    const content = await fs.readFile(basePath, 'utf8');
    expect(content).toContain('A=1');
    expect(content).toContain('B=2');
  });
});
