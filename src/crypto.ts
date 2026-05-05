import * as crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedPayload {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
}

/**
 * Generates an RSA key pair for use with envcrypt.
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

/**
 * Encrypts plaintext using a hybrid approach:
 * - AES-256-CBC for the data
 * - RSA-OAEP to encrypt the AES key
 */
export function encrypt(plaintext: string, publicKeyPem: string): EncryptedPayload {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    aesKey
  );

  return {
    encryptedData: encrypted.toString('base64'),
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
  };
}

/**
 * Decrypts an EncryptedPayload using the private key.
 */
export function decrypt(payload: EncryptedPayload, privateKeyPem: string): string {
  const aesKey = crypto.privateDecrypt(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(payload.encryptedKey, 'base64')
  );

  const iv = Buffer.from(payload.iv, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedData, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
