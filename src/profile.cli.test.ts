import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerProfileCommands } from './profile.cli';
import { loadProfiles } from './profile';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-profile-cli-test-'));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerProfileCommands(program);
  return program;
}

describe('profile cli', () => {
  let tmpDir: string;
  let originalCwd: () => string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('profile add creates a profile', () => {
    const program = makeProgram();
    program.parse(['profile', 'add', 'dev', '--env', '.env', '--enc', '.env.enc'], { from: 'user' });
    const config = loadProfiles(tmpDir);
    expect(config.profiles['dev']).toBeDefined();
    expect(config.active).toBe('dev');
  });

  test('profile switch changes active profile', () => {
    const program = makeProgram();
    program.parse(['profile', 'add', 'dev'], { from: 'user' });
    program.parse(['profile', 'add', 'prod', '--env', '.env.prod', '--enc', '.env.prod.enc'], { from: 'user' });
    program.parse(['profile', 'switch', 'prod'], { from: 'user' });
    const config = loadProfiles(tmpDir);
    expect(config.active).toBe('prod');
  });

  test('profile remove deletes profile', () => {
    const program = makeProgram();
    program.parse(['profile', 'add', 'dev'], { from: 'user' });
    program.parse(['profile', 'remove', 'dev'], { from: 'user' });
    const config = loadProfiles(tmpDir);
    expect(config.profiles['dev']).toBeUndefined();
  });

  test('profile list prints profiles', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    program.parse(['profile', 'add', 'dev'], { from: 'user' });
    program.parse(['profile', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dev'));
    consoleSpy.mockRestore();
  });

  test('profile current shows active profile', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    program.parse(['profile', 'add', 'dev'], { from: 'user' });
    program.parse(['profile', 'current'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dev'));
    consoleSpy.mockRestore();
  });
});
