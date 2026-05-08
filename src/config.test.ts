import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, saveConfig, configExists, resolveConfigPath } from './config';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-config-test-'));
}

describe('config', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loadConfig returns defaults when no config file exists', () => {
    const config = loadConfig(tmpDir);
    expect(config.keysDir).toBe('.envcrypt/keys');
    expect(config.recipientsFile).toBe('.envcrypt/recipients.json');
    expect(config.auditLog).toBe('.envcrypt/audit.log');
    expect(config.defaultEnvFile).toBe('.env');
    expect(config.encryptedEnvFile).toBe('.env.enc');
  });

  test('saveConfig writes config file', () => {
    saveConfig({ defaultEnvFile: '.env.local' }, tmpDir);
    expect(configExists(tmpDir)).toBe(true);
  });

  test('loadConfig merges partial config with defaults', () => {
    saveConfig({ defaultEnvFile: '.env.local', encryptedEnvFile: '.env.local.enc' }, tmpDir);
    const config = loadConfig(tmpDir);
    expect(config.defaultEnvFile).toBe('.env.local');
    expect(config.encryptedEnvFile).toBe('.env.local.enc');
    expect(config.keysDir).toBe('.envcrypt/keys');
  });

  test('configExists returns false when no config', () => {
    expect(configExists(tmpDir)).toBe(false);
  });

  test('configExists returns true after save', () => {
    saveConfig({}, tmpDir);
    expect(configExists(tmpDir)).toBe(true);
  });

  test('resolveConfigPath returns correct path', () => {
    const result = resolveConfigPath(tmpDir);
    expect(result).toBe(path.join(tmpDir, '.envcryptrc.json'));
  });

  test('loadConfig throws on invalid JSON', () => {
    const configPath = resolveConfigPath(tmpDir);
    fs.writeFileSync(configPath, 'not valid json', 'utf-8');
    expect(() => loadConfig(tmpDir)).toThrow('Failed to parse config file');
  });
});
