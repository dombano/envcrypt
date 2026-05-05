import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseEnv, serialiseEnv, readEnvFile, writeEnvFile, EnvMap } from './env';

describe('parseEnv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnv('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comment lines', () => {
    const result = parseEnv('# comment\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('ignores empty lines', () => {
    const result = parseEnv('\nFOO=bar\n\n');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('strips double quotes from values', () => {
    const result = parseEnv('FOO="hello world"');
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('strips single quotes from values', () => {
    const result = parseEnv("FOO='hello world'");
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('handles values containing equals signs', () => {
    const result = parseEnv('DATABASE_URL=postgres://user:pass@host/db?sslmode=require');
    expect(result.DATABASE_URL).toBe('postgres://user:pass@host/db?sslmode=require');
  });

  it('returns empty object for empty input', () => {
    expect(parseEnv('')).toEqual({});
  });
});

describe('serialiseEnv', () => {
  it('serialises a simple map', () => {
    const result = serialiseEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const result = serialiseEnv({ MSG: 'hello world' });
    expect(result).toBe('MSG="hello world"');
  });

  it('round-trips through parse and serialise', () => {
    const original: EnvMap = { API_KEY: 'abc123', DB_URL: 'localhost:5432' };
    const serialised = serialiseEnv(original);
    const parsed = parseEnv(serialised);
    expect(parsed).toEqual(original);
  });
});

describe('readEnvFile / writeEnvFile', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `envcrypt-test-${Date.now()}.env`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('writes and reads back an env map', () => {
    const env: EnvMap = { SECRET: 'mysecret', PORT: '3000' };
    writeEnvFile(tmpFile, env);
    const result = readEnvFile(tmpFile);
    expect(result).toEqual(env);
  });

  it('throws when file does not exist', () => {
    expect(() => readEnvFile('/nonexistent/.env')).toThrow('File not found');
  });
});
