import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  exportEnv,
  exportEnvFile,
  formatAsJson,
  formatAsYaml,
  formatAsShell,
} from './export';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-export-test-'));
}

const sampleEnv: Record<string, string> = {
  APP_NAME: 'myapp',
  DB_HOST: 'localhost',
  SECRET_KEY: 'abc123',
};

describe('formatAsJson', () => {
  it('should produce valid JSON', () => {
    const result = formatAsJson(sampleEnv);
    expect(JSON.parse(result)).toEqual(sampleEnv);
  });
});

describe('formatAsYaml', () => {
  it('should include all keys', () => {
    const result = formatAsYaml(sampleEnv);
    expect(result).toContain('APP_NAME:');
    expect(result).toContain('DB_HOST:');
    expect(result).toContain('SECRET_KEY:');
  });

  it('should quote values', () => {
    const result = formatAsYaml({ KEY: 'value with spaces' });
    expect(result).toContain('"value with spaces"');
  });
});

describe('formatAsShell', () => {
  it('should prefix each line with export', () => {
    const result = formatAsShell(sampleEnv);
    const lines = result.split('\n');
    expect(lines.every((l) => l.startsWith('export '))).toBe(true);
  });

  it('should include key=value pairs', () => {
    const result = formatAsShell({ MY_VAR: 'hello' });
    expect(result).toContain('export MY_VAR="hello"');
  });
});

describe('exportEnv', () => {
  it('should throw on unsupported format', () => {
    expect(() => exportEnv(sampleEnv, 'csv' as any)).toThrow();
  });
});

describe('exportEnvFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should write output to file when outputPath is given', async () => {
    const envFile = path.join(tmpDir, '.env');
    const outFile = path.join(tmpDir, 'env.json');
    await fs.writeFile(envFile, 'APP=test\nDEBUG=false\n', 'utf8');

    await exportEnvFile(envFile, 'json', outFile);

    const content = await fs.readFile(outFile, 'utf8');
    expect(JSON.parse(content)).toEqual({ APP: 'test', DEBUG: 'false' });
  });

  it('should return output string without writing when no outputPath', async () => {
    const envFile = path.join(tmpDir, '.env');
    await fs.writeFile(envFile, 'FOO=bar\n', 'utf8');

    const result = await exportEnvFile(envFile, 'shell');
    expect(result).toContain('export FOO="bar"');
  });
});
