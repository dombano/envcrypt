import { parseEnv } from './env';
import * as fs from 'fs';

export interface EnvDiff {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
  unchanged: Record<string, string>;
}

/**
 * Compare two env records and return a structured diff.
 */
export function diffEnv(
  before: Record<string, string>,
  after: Record<string, string>
): EnvDiff {
  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { from: string; to: string }> = {};
  const unchanged: Record<string, string> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const inBefore = Object.prototype.hasOwnProperty.call(before, key);
    const inAfter = Object.prototype.hasOwnProperty.call(after, key);

    if (inBefore && inAfter) {
      if (before[key] !== after[key]) {
        changed[key] = { from: before[key], to: after[key] };
      } else {
        unchanged[key] = before[key];
      }
    } else if (inAfter) {
      added[key] = after[key];
    } else {
      removed[key] = before[key];
    }
  }

  return { added, removed, changed, unchanged };
}

/**
 * Diff two .env files by path and return a structured diff.
 */
export function diffEnvFiles(beforePath: string, afterPath: string): EnvDiff {
  const beforeContent = fs.existsSync(beforePath)
    ? fs.readFileSync(beforePath, 'utf8')
    : '';
  const afterContent = fs.existsSync(afterPath)
    ? fs.readFileSync(afterPath, 'utf8')
    : '';

  const before = parseEnv(beforeContent);
  const after = parseEnv(afterContent);

  return diffEnv(before, after);
}

/**
 * Format a diff for human-readable CLI output.
 */
export function formatDiff(diff: EnvDiff, maskValues = true): string {
  const lines: string[] = [];
  const mask = (v: string) => (maskValues ? '***' : v);

  for (const key of Object.keys(diff.added).sort()) {
    lines.push(`+ ${key}=${mask(diff.added[key])}`);
  }
  for (const key of Object.keys(diff.removed).sort()) {
    lines.push(`- ${key}=${mask(diff.removed[key])}`);
  }
  for (const key of Object.keys(diff.changed).sort()) {
    lines.push(`~ ${key}: ${mask(diff.changed[key].from)} → ${mask(diff.changed[key].to)}`);
  }

  if (lines.length === 0) {
    return 'No differences found.';
  }

  return lines.join('\n');
}
