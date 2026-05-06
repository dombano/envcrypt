import { Command } from 'commander';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { registerDecryptCommands } from './decrypt.cli';
import { generateKeyPair, encrypt } from './crypto';
import { saveKeyPair } from './keys';
import { serialiseEnv } from './env';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-decrypt-test-'));
}

describe('registerDecryptCommands', () => {
  let tmpDir: string;
  let keysDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
    keysDir = path.join(tmpDir, '.envcrypt');
    await fs.mkdir(keysDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function makeProgram(): Command {
    const program = new Command();
    program.exitOverride();
    registerDecryptCommands(program);
    return program;
  }

  it('registers the decrypt command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'decrypt');
    expect(cmd).toBeDefined();
  });

  it('decrypts an encrypted .env file', async () => {
    const { publicKey, privateKey } = generateKeyPair();
    await saveKeyPair(keysDir, publicKey, privateKey);

    const original = { API_KEY: 'supersecret', DB_URL: 'postgres://localhost/db' };
    const encrypted: Record<string, string> = {};
    for (const [k, v] of Object.entries(original)) {
      encrypted[k] = encrypt(v, publicKey);
    }

    const inputFile = path.join(tmpDir, '.env.enc');
    const outputFile = path.join(tmpDir, '.env.decrypted');
    await fs.writeFile(inputFile, serialiseEnv(encrypted), 'utf-8');

    const program = makeProgram();
    await program.parseAsync([
      'node', 'envcrypt', 'decrypt',
      '--input', inputFile,
      '--output', outputFile,
      '--keys-dir', keysDir,
    ]);

    const result = await fs.readFile(outputFile, 'utf-8');
    expect(result).toContain('API_KEY=supersecret');
    expect(result).toContain('DB_URL=postgres://localhost/db');
  });

  it('exits with error if private key is missing', async () => {
    const inputFile = path.join(tmpDir, '.env.enc');
    await fs.writeFile(inputFile, 'FOO=bar', 'utf-8');

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();

    await expect(
      program.parseAsync(['node', 'envcrypt', 'decrypt', '--input', inputFile, '--keys-dir', keysDir])
    ).rejects.toThrow('exit');

    mockExit.mockRestore();
  });
});
