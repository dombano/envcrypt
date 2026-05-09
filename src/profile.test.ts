import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addProfile,
  getActiveProfile,
  loadProfiles,
  removeProfile,
  switchProfile,
} from './profile';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-profile-test-'));
}

describe('profile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loadProfiles returns empty config when no file exists', () => {
    const config = loadProfiles(tmpDir);
    expect(config.active).toBeNull();
    expect(config.profiles).toEqual({});
  });

  test('addProfile adds a profile and sets it as active', () => {
    addProfile('dev', { name: 'dev', envFile: '.env', encryptedFile: '.env.enc' }, tmpDir);
    const config = loadProfiles(tmpDir);
    expect(config.active).toBe('dev');
    expect(config.profiles['dev']).toBeDefined();
  });

  test('addProfile does not override active when one already exists', () => {
    addProfile('dev', { name: 'dev', envFile: '.env', encryptedFile: '.env.enc' }, tmpDir);
    addProfile('prod', { name: 'prod', envFile: '.env.prod', encryptedFile: '.env.prod.enc' }, tmpDir);
    const config = loadProfiles(tmpDir);
    expect(config.active).toBe('dev');
  });

  test('switchProfile changes active profile', () => {
    addProfile('dev', { name: 'dev', envFile: '.env', encryptedFile: '.env.enc' }, tmpDir);
    addProfile('prod', { name: 'prod', envFile: '.env.prod', encryptedFile: '.env.prod.enc' }, tmpDir);
    switchProfile('prod', tmpDir);
    const config = loadProfiles(tmpDir);
    expect(config.active).toBe('prod');
  });

  test('switchProfile throws for unknown profile', () => {
    expect(() => switchProfile('nope', tmpDir)).toThrow('Profile "nope" does not exist.');
  });

  test('removeProfile removes profile and updates active', () => {
    addProfile('dev', { name: 'dev', envFile: '.env', encryptedFile: '.env.enc' }, tmpDir);
    addProfile('prod', { name: 'prod', envFile: '.env.prod', encryptedFile: '.env.prod.enc' }, tmpDir);
    removeProfile('dev', tmpDir);
    const config = loadProfiles(tmpDir);
    expect(config.profiles['dev']).toBeUndefined();
    expect(config.active).toBe('prod');
  });

  test('getActiveProfile returns null when no profiles', () => {
    expect(getActiveProfile(tmpDir)).toBeNull();
  });

  test('getActiveProfile returns active profile', () => {
    addProfile('dev', { name: 'dev', envFile: '.env', encryptedFile: '.env.enc' }, tmpDir);
    const profile = getActiveProfile(tmpDir);
    expect(profile?.name).toBe('dev');
  });
});
