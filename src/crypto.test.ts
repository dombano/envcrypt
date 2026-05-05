import { generateKeyPair, encrypt, decrypt, EncryptedPayload } from './crypto';

describe('crypto module', () => {
  let publicKey: string;
  let privateKey: string;

  beforeAll(() => {
    const keyPair = generateKeyPair();
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  test('generateKeyPair returns PEM-encoded keys', () => {
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
  });

  test('encrypt returns a valid EncryptedPayload', () => {
    const payload = encrypt('SECRET=hello', publicKey);
    expect(payload).toHaveProperty('encryptedData');
    expect(payload).toHaveProperty('encryptedKey');
    expect(payload).toHaveProperty('iv');
    expect(typeof payload.encryptedData).toBe('string');
    expect(typeof payload.encryptedKey).toBe('string');
    expect(typeof payload.iv).toBe('string');
  });

  test('decrypt recovers original plaintext', () => {
    const original = 'DB_HOST=localhost\nDB_PASS=supersecret';
    const payload = encrypt(original, publicKey);
    const decrypted = decrypt(payload, privateKey);
    expect(decrypted).toBe(original);
  });

  test('decrypt fails with wrong private key', () => {
    const payload = encrypt('SECRET=value', publicKey);
    const { privateKey: wrongKey } = generateKeyPair();
    expect(() => decrypt(payload, wrongKey)).toThrow();
  });

  test('each encryption produces a unique ciphertext', () => {
    const plaintext = 'SAME=value';
    const payload1 = encrypt(plaintext, publicKey);
    const payload2 = encrypt(plaintext, publicKey);
    expect(payload1.encryptedData).not.toBe(payload2.encryptedData);
    expect(payload1.iv).not.toBe(payload2.iv);
  });
});
