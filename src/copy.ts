import { readEnvFile, writeEnvFile } from './env';

export interface CopyOptions {
  keys?: string[];
  overwrite?: boolean;
}

/**
 * Copy specific keys (or all keys) from one env file to another.
 * Returns the list of keys that were actually copied.
 */
export async function copyEnvKeys(
  sourcePath: string,
  destPath: string,
  options: CopyOptions = {}
): Promise<string[]> {
  const source = await readEnvFile(sourcePath);

  let destEntries: Record<string, string> = {};
  try {
    destEntries = await readEnvFile(destPath);
  } catch {
    // destination may not exist yet — that's fine
  }

  const keysToCopy = options.keys && options.keys.length > 0
    ? options.keys
    : Object.keys(source);

  const missing = keysToCopy.filter((k) => !(k in source));
  if (missing.length > 0) {
    throw new Error(`Keys not found in source: ${missing.join(', ')}`);
  }

  const copied: string[] = [];

  for (const key of keysToCopy) {
    if (!options.overwrite && key in destEntries) {
      continue;
    }
    destEntries[key] = source[key];
    copied.push(key);
  }

  await writeEnvFile(destPath, destEntries);
  return copied;
}
