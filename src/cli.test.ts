import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-cli-'));
}

const CLI = path.resolve(__dirname, '../src/cli.ts');
const runCli = (args: string, cwd: string) =>
  execSync(`npx ts-node ${CLI} ${args}`, { cwd, encoding: 'utf8' });

describe('CLI', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('keygen creates public and private key files', () => {
    const output = runCli(`keygen --output ${tmpDir}`, tmpDir);
    expect(output).toContain('Public key written to');
    expect(output).toContain('Private key written to');
    expect(fs.existsSync(path.join(tmpDir, 'envcrypt.pub'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'envcrypt.key'))).toBe(true);
  });

  it('generated keys are non-empty strings', () => {
    runCli(`keygen --output ${tmpDir}`, tmpDir);
    const pub = fs.readFileSync(path.join(tmpDir, 'envcrypt.pub'), 'utf8');
    const priv = fs.readFileSync(path.join(tmpDir, 'envcrypt.key'), 'utf8');
    expect(pub.length).toBeGreaterThan(0);
    expect(priv.length).toBeGreaterThan(0);
  });

  it('encrypt and decrypt round-trips .env file', () => {
    const envContent = 'API_KEY=secret123\nDB_URL=postgres://localhost/test\n';
    const envFile = path.join(tmpDir, '.env');
    const encFile = path.join(tmpDir, '.env.enc');
    const outFile = path.join(tmpDir, '.env.decrypted');

    fs.writeFileSync(envFile, envContent, 'utf8');
    runCli(`keygen --output ${tmpDir}`, tmpDir);

    runCli(
      `encrypt ${envFile} --key ${path.join(tmpDir, 'envcrypt.pub')} --output ${encFile}`,
      tmpDir
    );
    expect(fs.existsSync(encFile)).toBe(true);

    runCli(
      `decrypt ${encFile} --key ${path.join(tmpDir, 'envcrypt.key')} --output ${outFile}`,
      tmpDir
    );
    const decrypted = fs.readFileSync(outFile, 'utf8');
    expect(decrypted).toContain('API_KEY=secret123');
    expect(decrypted).toContain('DB_URL=postgres://localhost/test');
  });
});
