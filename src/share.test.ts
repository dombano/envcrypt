import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { shareEnvFile, receiveEnvFile, listEnvKeys } from './share';
import { generateKeyPair } from './crypto';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-share-test-'));
}

describe('shareEnvFile / receiveEnvFile', () => {
  let tmpDir: string;
  let publicKeyPath: string;
  let privateKeyPath: string;
  let inputEnvPath: string;
  let encryptedPath: string;
  let outputEnvPath: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    publicKeyPath = path.join(tmpDir, 'pub.pem');
    privateKeyPath = path.join(tmpDir, 'priv.pem');
    inputEnvPath = path.join(tmpDir, '.env');
    encryptedPath = path.join(tmpDir, '.env.enc.json');
    outputEnvPath = path.join(tmpDir, '.env.out');

    const { publicKey, privateKey } = generateKeyPair();
    fs.writeFileSync(publicKeyPath, publicKey, 'utf-8');
    fs.writeFileSync(privateKeyPath, privateKey, 'utf-8');
    fs.writeFileSync(inputEnvPath, 'API_KEY=secret123\nDB_URL=postgres://localhost/mydb\n', 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create an encrypted JSON file', async () => {
    await shareEnvFile({ inputPath: inputEnvPath, outputPath: encryptedPath, publicKeyPath });
    expect(fs.existsSync(encryptedPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(encryptedPath, 'utf-8'));
    expect(content).toHaveProperty('encrypted');
    expect(typeof content.encrypted).toBe('string');
  });

  it('should decrypt the env file back to original content', async () => {
    await shareEnvFile({ inputPath: inputEnvPath, outputPath: encryptedPath, publicKeyPath });
    await receiveEnvFile({ inputPath: encryptedPath, outputPath: outputEnvPath, privateKeyPath });
    const result = fs.readFileSync(outputEnvPath, 'utf-8');
    expect(result).toContain('API_KEY=secret123');
    expect(result).toContain('DB_URL=postgres://localhost/mydb');
  });

  it('should list env keys from encrypted file', async () => {
    await shareEnvFile({ inputPath: inputEnvPath, outputPath: encryptedPath, publicKeyPath });
    const keys = await listEnvKeys(encryptedPath, privateKeyPath);
    expect(keys).toContain('API_KEY');
    expect(keys).toContain('DB_URL');
    expect(keys).toHaveLength(2);
  });

  it('should throw on invalid encrypted file', async () => {
    fs.writeFileSync(encryptedPath, JSON.stringify({ wrong: 'field' }), 'utf-8');
    await expect(
      receiveEnvFile({ inputPath: encryptedPath, outputPath: outputEnvPath, privateKeyPath })
    ).rejects.toThrow('missing "encrypted" field');
  });
});
