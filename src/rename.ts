import { readEnvFile, writeEnvFile } from './env';

export interface RenameResult {
  oldKey: string;
  newKey: string;
  found: boolean;
}

/**
 * Rename a key in an env record, preserving value and order.
 */
export function renameEnvKey(
  env: Record<string, string>,
  oldKey: string,
  newKey: string
): { env: Record<string, string>; result: RenameResult } {
  const result: RenameResult = { oldKey, newKey, found: false };

  if (!(oldKey in env)) {
    return { env, result };
  }

  if (oldKey === newKey) {
    return { env, result: { ...result, found: true } };
  }

  const updated: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (k === oldKey) {
      updated[newKey] = v;
    } else {
      updated[k] = v;
    }
  }

  result.found = true;
  return { env: updated, result };
}

/**
 * Rename a key inside an .env file on disk.
 */
export async function renameEnvKeyInFile(
  filePath: string,
  oldKey: string,
  newKey: string
): Promise<RenameResult> {
  const env = await readEnvFile(filePath);
  const { env: updated, result } = renameEnvKey(env, oldKey, newKey);

  if (result.found && oldKey !== newKey) {
    await writeEnvFile(filePath, updated);
  }

  return result;
}
