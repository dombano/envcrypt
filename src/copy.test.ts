import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { copyEnvKeys } from './copy';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-copy-'));
}

describe('copyEnvKeys', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('copies all keys when no key filter is provided', async () => {
    const src = path.join(dir, '.env.src');
    const dest = path.join(dir, '.env.dest');
    await fs.writeFile(src, 'FOO=bar\nBAZ=qux\n');

    const copied = await copyEnvKeys(src, dest);
    expect(copied).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
    expect(copied).toHaveLength(2);

    const content = await fs.readFile(dest, 'utf-8');
    expect(content).toContain('FOO=bar');
    expect(content).toContain('BAZ=qux');
  });

  it('copies only specified keys', async () => {
    const src = path.join(dir, '.env.src');
    const dest = path.join(dir, '.env.dest');
    await fs.writeFile(src, 'FOO=bar\nBAZ=qux\nSECRET=hidden\n');

    const copied = await copyEnvKeys(src, dest, { keys: ['FOO', 'BAZ'] });
    expect(copied).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
    expect(copied).not.toContain('SECRET');
  });

  it('does not overwrite existing keys by default', async () => {
    const src = path.join(dir, '.env.src');
    const dest = path.join(dir, '.env.dest');
    await fs.writeFile(src, 'FOO=new\n');
    await fs.writeFile(dest, 'FOO=old\n');

    const copied = await copyEnvKeys(src, dest);
    expect(copied).toHaveLength(0);

    const content = await fs.readFile(dest, 'utf-8');
    expect(content).toContain('FOO=old');
  });

  it('overwrites existing keys when overwrite option is set', async () => {
    const src = path.join(dir, '.env.src');
    const dest = path.join(dir, '.env.dest');
    await fs.writeFile(src, 'FOO=new\n');
    await fs.writeFile(dest, 'FOO=old\n');

    const copied = await copyEnvKeys(src, dest, { overwrite: true });
    expect(copied).toContain('FOO');

    const content = await fs.readFile(dest, 'utf-8');
    expect(content).toContain('FOO=new');
  });

  it('throws when a specified key is missing from source', async () => {
    const src = path.join(dir, '.env.src');
    const dest = path.join(dir, '.env.dest');
    await fs.writeFile(src, 'FOO=bar\n');

    await expect(copyEnvKeys(src, dest, { keys: ['MISSING'] })).rejects.toThrow(
      'Keys not found in source: MISSING'
    );
  });
});
