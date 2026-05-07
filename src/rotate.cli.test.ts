import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { registerRotateCommands } from './rotate.cli';
import { generateKeyPair, encrypt } from './crypto';
import { saveKeyPair } from './keys';
import { saveRecipients } from './recipients';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-rotate-test-'));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRotateCommands(program);
  return program;
}

describe('rotate CLI', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should rotate encryption successfully', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    await saveKeyPair(publicKey, privateKey, tmpDir);

    const plaintext = 'API_KEY=secret123\nDB_URL=postgres://localhost/db';
    const encrypted = await encrypt(plaintext, publicKey);
    const encFile = path.join(tmpDir, '.env.enc');

    const fingerprint = Buffer.from(publicKey).toString('base64').slice(0, 16);
    await fs.writeFile(
      encFile,
      JSON.stringify({ version: 1, recipients: { [fingerprint]: encrypted } }),
      'utf-8'
    );

    await saveRecipients([], path.join(tmpDir, 'recipients.json'));

    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync([
      'node', 'envcrypt', 'rotate',
      '--encrypted', encFile,
      '--keys-dir', tmpDir,
      '--recipients', path.join(tmpDir, 'recipients.json'),
      '--env-file', path.join(tmpDir, '.env'),
    ]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('rotated successfully'));
    consoleSpy.mockRestore();

    const result = await fs.readFile(encFile, 'utf-8');
    const parsed = JSON.parse(result);
    expect(parsed.version).toBe(1);
    expect(parsed.recipients).toBeDefined();
  });

  it('should exit with error if encrypted file does not exist', async () => {
    const program = makeProgram();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'envcrypt', 'rotate', '--encrypted', '/nonexistent/.env.enc'])
    ).rejects.toThrow();

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
