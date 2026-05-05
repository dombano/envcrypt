/**
 * envcrypt — public entry point
 *
 * Re-exports the public API so consumers can import from 'envcrypt' directly.
 */

export { generateKeyPair, encrypt, decrypt } from './crypto';
export { parseEnv, serialiseEnv, readEnvFile, writeEnvFile } from './env';
export type { EnvMap } from './env';

import { readEnvFile, serialiseEnv, writeEnvFile, EnvMap } from './env';
import { encrypt, decrypt } from './crypto';

/**
 * Encrypts an entire .env file and writes the ciphertext to an output path.
 *
 * @param inputPath   Path to the plaintext .env file
 * @param outputPath  Path where the encrypted file will be written
 * @param publicKey   Recipient's public key (PEM or base64)
 */
export async function encryptEnvFile(
  inputPath: string,
  outputPath: string,
  publicKey: string
): Promise<void> {
  const env = readEnvFile(inputPath);
  const plaintext = serialiseEnv(env);
  const ciphertext = await encrypt(plaintext, publicKey);
  writeEnvFile(outputPath, { __envcrypt__: ciphertext });
}

/**
 * Decrypts an encrypted .env file and writes the plaintext to an output path.
 *
 * @param inputPath   Path to the encrypted .env file
 * @param outputPath  Path where the decrypted file will be written
 * @param privateKey  Recipient's private key (PEM or base64)
 */
export async function decryptEnvFile(
  inputPath: string,
  outputPath: string,
  privateKey: string
): Promise<void> {
  const encrypted = readEnvFile(inputPath);
  const ciphertext = encrypted['__envcrypt__'];
  if (!ciphertext) {
    throw new Error('Input file does not appear to be an envcrypt-encrypted file.');
  }
  const plaintext = await decrypt(ciphertext, privateKey);
  const env: EnvMap = {};
  for (const [key, value] of Object.entries(require('./env').parseEnv(plaintext))) {
    env[key] = value as string;
  }
  writeEnvFile(outputPath, env);
}
