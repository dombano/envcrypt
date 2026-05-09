import { parseEnv, serialiseEnv, readEnvFile, writeEnvFile } from './env';

export type MergeStrategy = 'ours' | 'theirs' | 'interactive';

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: string[];
  added: string[];
  overwritten: string[];
}

/**
 * Merges two env records. `base` is the existing file, `incoming` is the new data.
 * Strategy:
 *   - 'ours'    : keep base value on conflict
 *   - 'theirs'  : use incoming value on conflict
 */
export function mergeEnv(
  base: Record<string, string>,
  incoming: Record<string, string>,
  strategy: Exclude<MergeStrategy, 'interactive'> = 'theirs'
): MergeResult {
  const merged: Record<string, string> = { ...base };
  const conflicts: string[] = [];
  const added: string[] = [];
  const overwritten: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in base)) {
      merged[key] = value;
      added.push(key);
    } else if (base[key] !== value) {
      conflicts.push(key);
      if (strategy === 'theirs') {
        merged[key] = value;
        overwritten.push(key);
      }
      // 'ours': keep existing — no change needed
    }
  }

  return { merged, conflicts, added, overwritten };
}

/**
 * Merges two .env files on disk and writes the result to `outputPath`.
 */
export async function mergeEnvFiles(
  basePath: string,
  incomingPath: string,
  outputPath: string,
  strategy: Exclude<MergeStrategy, 'interactive'> = 'theirs'
): Promise<MergeResult> {
  const base = parseEnv(await readEnvFile(basePath));
  const incoming = parseEnv(await readEnvFile(incomingPath));
  const result = mergeEnv(base, incoming, strategy);
  await writeEnvFile(outputPath, serialiseEnv(result.merged));
  return result;
}
