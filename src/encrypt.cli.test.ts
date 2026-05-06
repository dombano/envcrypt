import { Command } from 'commander';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { registerEncryptCommands } from './encrypt.cli';
import { generateKeyPair } from './crypto';
import { saveKeyPair } from './keys';
import { saveRecipients } from './recipients';

function makeTempDir() {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-enc-cli-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });
  return () => dir;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerEncryptCommands(program);
  return program;
}

describe('encrypt CLI', () => {
  const getDir = makeTempDir();

  it('encrypts a .env file for all recipients', async () => {
    const dir = getDir();
    const keysDir = path.join(dir, '.envcrypt');
    await fs.mkdir(keysDir, { recursive: true });

    const { publicKey, privateKey } = await generateKeyPair();
    await saveKeyPair(publicKey, privateKey, keysDir);

    const recipientsPath = path.join(keysDir, 'recipients.json');
    await saveRecipients(
      [{ name: 'alice', publicKeyPath: path.join(keysDir, 'public.pem') }],
      recipientsPath
    );

    const envPath = path.join(dir, '.env');
    await fs.writeFile(envPath, 'SECRET=hello\nDB_URL=postgres://localhost/db\n');

    const outputPath = path.join(dir, '.env.enc');
    const program = makeProgram();

    await program.parseAsync([
      'node', 'envcrypt', 'encrypt',
      '--env', envPath,
      '--output', outputPath,
      '--recipients', recipientsPath,
    ]);

    const stat = await fs.stat(outputPath);
    expect(stat.isFile()).toBe(true);

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('exits with error when no recipients exist', async () => {
    const dir = getDir();
    const keysDir = path.join(dir, '.envcrypt');
    await fs.mkdir(keysDir, { recursive: true });

    const recipientsPath = path.join(keysDir, 'recipients.json');
    await saveRecipients([], recipientsPath);

    const envPath = path.join(dir, '.env');
    await fs.writeFile(envPath, 'KEY=value\n');

    const outputPath = path.join(dir, '.env.enc');
    const program = makeProgram();

    const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    await program.parseAsync([
      'node', 'envcrypt', 'encrypt',
      '--env', envPath,
      '--output', outputPath,
      '--recipients', recipientsPath,
    ]);

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
