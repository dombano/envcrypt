import { loadRecipients } from './recipients';
import { readEnvFile, writeEnvFile } from './env';
import { loadPrivateKey, loadPublicKey } from './keys';
import { decrypt, encrypt } from './crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface RotateOptions {
  keysDir?: string;
  envFile?: string;
  recipientsFile?: string;
}

/**
 * Re-encrypts an existing encrypted .env file with fresh encryption.
 * Useful after revoking a recipient or rotating keys.
 */
export async function rotateEncryption(
  encryptedFile: string,
  options: RotateOptions = {}
): Promise<void> {
  const keysDir = options.keysDir ?? '.';
  const envFile = options.envFile ?? '.env';
  const recipientsFile = options.recipientsFile;

  // Decrypt the current encrypted file using our private key
  const privateKey = await loadPrivateKey(keysDir);
  const publicKey = await loadPublicKey(keysDir);

  const encryptedContent = await fs.readFile(encryptedFile, 'utf-8');
  const decrypted = await decrypt(encryptedContent, privateKey);

  // Write decrypted content to env file temporarily
  await writeEnvFile(envFile, decrypted);

  // Load recipients
  const recipients = await loadRecipients(recipientsFile ?? path.join(keysDir, 'recipients.json'));

  // Re-encrypt for all recipients including ourselves
  const allPublicKeys = [publicKey, ...recipients.map((r) => r.publicKey)];

  const reEncrypted: Record<string, string> = {};
  for (const pubKey of allPublicKeys) {
    const fingerprint = Buffer.from(pubKey).toString('base64').slice(0, 16);
    reEncrypted[fingerprint] = await encrypt(decrypted, pubKey);
  }

  const output = JSON.stringify({ version: 1, recipients: reEncrypted }, null, 2);
  await fs.writeFile(encryptedFile, output, 'utf-8');
}

export async function decryptEnvFile(
  encryptedFile: string,
  keysDir: string = '.'
): Promise<string> {
  const privateKey = await loadPrivateKey(keysDir);
  const encryptedContent = await fs.readFile(encryptedFile, 'utf-8');
  return decrypt(encryptedContent, privateKey);
}
