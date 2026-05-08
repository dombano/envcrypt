import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerConfigCommands } from './config.cli';
import { resolveConfigPath } from './config';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-config-cli-test-'));
}

function makeProgram(cwd: string): Command {
  const program = new Command();
  program.exitOverride();
  jest.spyOn(process, 'cwd').mockReturnValue(cwd);
  registerConfigCommands(program);
  return program;
}

describe('config CLI', () => {
  let tmpDir: string;
  let cwdSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTempDir();
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('config show prints defaults when no config file', () => {
    const program = makeProgram(tmpDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['config', 'show'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('.envcrypt/keys'));
    spy.mockRestore();
  });

  test('config init creates config file', () => {
    const program = makeProgram(tmpDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['config', 'init'], { from: 'user' });
    expect(fs.existsSync(resolveConfigPath(tmpDir))).toBe(true);
    spy.mockRestore();
  });

  test('config init fails if file exists without --force', () => {
    const program = makeProgram(tmpDir);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    program.parse(['config', 'init'], { from: 'user' });
    expect(() => program.parse(['config', 'init'], { from: 'user' })).toThrow('exit');
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('config set updates a key', () => {
    const program = makeProgram(tmpDir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['config', 'set', 'defaultEnvFile', '.env.local'], { from: 'user' });
    const raw = fs.readFileSync(resolveConfigPath(tmpDir), 'utf-8');
    expect(raw).toContain('.env.local');
    spy.mockRestore();
  });
});
