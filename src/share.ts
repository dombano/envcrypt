import fs from 'fs/promises';
import path from 'path';
import { encrypt, decrypt } from './crypto';
import { parseEnv, serialiseEnv } from './env';

export interface RecipientKey {
  name: string;
  publicKey: string;
}

export interface EncryptedBundle {
  version: number;
  recipients: Array<{
    name: string;
    payload: string;
  }>;
}

export async function encryptEnvForRecipients(
  envVars: Record<string, string>,
  recipients: RecipientKey[],
  outputPath: string
): Promise<void> {
  const plaintext = serialiseEnv(envVars);

  const bundle: EncryptedBundle = {
    version: 1,
    recipients: await Promise.all(
      recipients.map(async (r) => ({
        name: r.name,
        payload: await encrypt(plaintext, r.publicKey),
      }))
    ),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(bundle, null, 2), 'utf-8');
}

export async function decryptEnvBundle(
  bundlePath: string,
  recipientName: string,
  privateKey: string
): Promise<Record<string, string>> {
  const raw = await fs.readFile(bundlePath, 'utf-8');
  const bundle: EncryptedBundle = JSON.parse(raw);

  const entry = bundle.recipients.find((r) => r.name === recipientName);
  if (!entry) {
    throw new Error(`Recipient "${recipientName}" not found in encrypted bundle.`);
  }

  const plaintext = await decrypt(entry.payload, privateKey);
  return parseEnv(plaintext);
}

export async function listBundleRecipients(bundlePath: string): Promise<string[]> {
  const raw = await fs.readFile(bundlePath, 'utf-8');
  const bundle: EncryptedBundle = JSON.parse(raw);
  return bundle.recipients.map((r) => r.name);
}
