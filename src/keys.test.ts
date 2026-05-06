import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveKeyPair,
  loadPublicKey,
  loadPrivateKey,
  initKeys,
  keysExist,
  DEFAULT_PUBLIC_KEY_FILE,
  DEFAULT_PRIVATE_KEY_FILE,
} from './keys';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-keys-test-'));
}

describe('keys', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('initKeys generates and saves key pair files', () => {
    const keyPair = initKeys(tmpDir);
    expect(keyPair.publicKey).toBeTruthy();
    expect(keyPair.privateKey).toBeTruthy();
    expect(fs.existsSync(path.join(tmpDir, DEFAULT_PUBLIC_KEY_FILE))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, DEFAULT_PRIVATE_KEY_FILE))).toBe(true);
  });

  test('loadPublicKey reads saved public key', () => {
    const keyPair = initKeys(tmpDir);
    const loaded = loadPublicKey(tmpDir);
    expect(loaded).toBe(keyPair.publicKey.trim());
  });

  test('loadPrivateKey reads saved private key', () => {
    const keyPair = initKeys(tmpDir);
    const loaded = loadPrivateKey(tmpDir);
    expect(loaded).toBe(keyPair.privateKey.trim());
  });

  test('keysExist returns false when no keys present', () => {
    expect(keysExist(tmpDir)).toBe(false);
  });

  test('keysExist returns true after initKeys', () => {
    initKeys(tmpDir);
    expect(keysExist(tmpDir)).toBe(true);
  });

  test('loadPublicKey throws if file missing', () => {
    expect(() => loadPublicKey(tmpDir)).toThrow('Public key file not found');
  });

  test('loadPrivateKey throws if file missing', () => {
    expect(() => loadPrivateKey(tmpDir)).toThrow('Private key file not found');
  });

  test('saveKeyPair writes keys with correct content', () => {
    const keyPair = { publicKey: 'pub-key-data', privateKey: 'priv-key-data' };
    saveKeyPair(keyPair, tmpDir);
    const pubContent = fs.readFileSync(path.join(tmpDir, DEFAULT_PUBLIC_KEY_FILE), 'utf8');
    const privContent = fs.readFileSync(path.join(tmpDir, DEFAULT_PRIVATE_KEY_FILE), 'utf8');
    expect(pubContent).toBe('pub-key-data');
    expect(privContent).toBe('priv-key-data');
  });
});
