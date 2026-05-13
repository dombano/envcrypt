import * as fs from 'fs';
import * as path from 'path';
import { readEnvFile, writeEnvFile } from './env';
import { loadRecipients } from './recipients';
import { encrypt } from './crypto';
import { loadPublicKey } from './keys';

export interface WatchOptions {
  envPath: string;
  outPath: string;
  recipientsPath?: string;
  keysDir?: string;
  debounceMs?: number;
}

export type WatchCallback = (event: 'encrypted' | 'error', detail: string) => void;

export function watchEnvFile(
  options: WatchOptions,
  callback: WatchCallback
): () => void {
  const { envPath, outPath, recipientsPath, keysDir, debounceMs = 300 } = options;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const handleChange = async () => {
    try {
      const env = await readEnvFile(envPath);
      const recipients = await loadRecipients(recipientsPath);

      if (recipients.length === 0) {
        callback('error', 'No recipients configured');
        return;
      }

      const encryptedEntries: Record<string, string> = {};

      for (const recipient of recipients) {
        const publicKeyPath = keysDir
          ? path.join(keysDir, `${recipient}.pub`)
          : path.join(process.cwd(), '.envcrypt', 'keys', `${recipient}.pub`);

        const publicKey = await loadPublicKey(publicKeyPath);

        for (const [key, value] of Object.entries(env)) {
          const tag = `${recipient}:${key}`;
          encryptedEntries[tag] = await encrypt(value, publicKey);
        }
      }

      await writeEnvFile(outPath, encryptedEntries);
      callback('encrypted', `Encrypted ${Object.keys(env).length} variable(s) for ${recipients.length} recipient(s)`);
    } catch (err) {
      callback('error', err instanceof Error ? err.message : String(err));
    }
  };

  const watcher = fs.watch(envPath, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleChange, debounceMs);
  });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    watcher.close();
  };
}
