import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt } from './crypto';
import { readEnvFile, writeEnvFile, parseEnv, serialiseEnv } from './env';

export interface ShareOptions {
  inputPath: string;
  outputPath: string;
  publicKeyPath: string;
}

export interface ReceiveOptions {
  inputPath: string;
  outputPath: string;
  privateKeyPath: string;
}

/**
 * Encrypts a .env file using a recipient's public key and writes
 * the encrypted payload to the output path as a JSON file.
 */
export async function shareEnvFile(options: ShareOptions): Promise<void> {
  const { inputPath, outputPath, publicKeyPath } = options;

  const publicKey = fs.readFileSync(path.resolve(publicKeyPath), 'utf-8').trim();
  const envContent = readEnvFile(path.resolve(inputPath));
  const encrypted = encrypt(envContent, publicKey);

  const payload = JSON.stringify({ encrypted }, null, 2);
  fs.writeFileSync(path.resolve(outputPath), payload, 'utf-8');
}

/**
 * Decrypts an encrypted .env JSON file using the recipient's private key
 * and writes the resulting .env file to the output path.
 */
export async function receiveEnvFile(options: ReceiveOptions): Promise<void> {
  const { inputPath, outputPath, privateKeyPath } = options;

  const privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf-8').trim();
  const raw = fs.readFileSync(path.resolve(inputPath), 'utf-8');
  const payload = JSON.parse(raw) as { encrypted: string };

  if (!payload.encrypted) {
    throw new Error('Invalid encrypted env file: missing "encrypted" field.');
  }

  const decrypted = decrypt(payload.encrypted, privateKey);
  writeEnvFile(path.resolve(outputPath), decrypted);
}

/**
 * Returns the list of variable keys present in an encrypted env file
 * without fully decrypting values — useful for previewing shared files.
 * Requires the private key to decrypt.
 */
export async function listEnvKeys(encryptedPath: string, privateKeyPath: string): Promise<string[]> {
  const privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf-8').trim();
  const raw = fs.readFileSync(path.resolve(encryptedPath), 'utf-8');
  const payload = JSON.parse(raw) as { encrypted: string };

  const decrypted = decrypt(payload.encrypted, privateKey);
  const parsed = parseEnv(decrypted);
  return Object.keys(parsed);
}
