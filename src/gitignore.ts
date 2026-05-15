import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_PRIVATE_KEY_FILE } from './keys';

export const GITIGNORE_FILE = '.gitignore';

export const ENVCRYPT_GITIGNORE_ENTRIES = [
  DEFAULT_PRIVATE_KEY_FILE,
  '*.env',
  '.env*',
  '!.env.encrypted',
];

export function readGitignore(dir: string = process.cwd()): string {
  const gitignorePath = path.join(dir, GITIGNORE_FILE);
  if (!fs.existsSync(gitignorePath)) {
    return '';
  }
  return fs.readFileSync(gitignorePath, 'utf8');
}

export function addGitignoreEntries(
  dir: string = process.cwd(),
  entries: string[] = ENVCRYPT_GITIGNORE_ENTRIES
): { added: string[]; skipped: string[] } {
  const gitignorePath = path.join(dir, GITIGNORE_FILE);
  const existing = readGitignore(dir);
  const existingLines = existing.split('\n').map((l) => l.trim());

  const added: string[] = [];
  const skipped: string[] = [];
  const toAppend: string[] = [];

  for (const entry of entries) {
    if (existingLines.includes(entry)) {
      skipped.push(entry);
    } else {
      added.push(entry);
      toAppend.push(entry);
    }
  }

  if (toAppend.length > 0) {
    const separator = existing.endsWith('\n') || existing === '' ? '' : '\n';
    const block = `\n# envcrypt\n${toAppend.join('\n')}\n`;
    fs.writeFileSync(gitignorePath, existing + separator + block, 'utf8');
  }

  return { added, skipped };
}

export function isGitignored(entry: string, dir: string = process.cwd()): boolean {
  const content = readGitignore(dir);
  const lines = content.split('\n').map((l) => l.trim());
  return lines.includes(entry);
}

/**
 * Returns true if all envcrypt-managed entries are present in the .gitignore
 * file in the given directory.
 *
 * @param dir - The directory containing the .gitignore file.
 * @param entries - The entries to check for (defaults to ENVCRYPT_GITIGNORE_ENTRIES).
 * @returns True if every entry is already present in .gitignore.
 */
export function hasAllGitignoreEntries(
  dir: string = process.cwd(),
  entries: string[] = ENVCRYPT_GITIGNORE_ENTRIES
): boolean {
  const content = readGitignore(dir);
  const lines = content.split('\n').map((l) => l.trim());
  return entries.every((entry) => lines.includes(entry));
}

/**
 * Removes all envcrypt-managed entries (and the '# envcrypt' header block)
 * from the .gitignore file in the given directory.
 *
 * @param dir - The directory containing the .gitignore file.
 * @returns The list of entries that were removed.
 */
export function removeGitignoreEntries(
  dir: string = process.cwd(),
  entries: string[] = ENVCRYPT_GITIGNORE_ENTRIES
): string[] {
  const gitignorePath = path.join(dir, GITIGNORE_FILE);
  const existing = readGitignore(dir);
  if (!existing) {
    return [];
  }

  const removed: string[] = [];
  const filteredLines = existing.split('\n').filter((line) => {
    const trimmed = line.trim();
    if (trimmed === '# envcrypt') {
      return false;
    }
    if (entries.includes(trimmed)) {
      removed.push(trimmed);
      return false;
    }
    return true;
  });

  if (removed.length > 0) {
    fs.writeFileSync(gitignorePath, filteredLines.join('\n'), 'utf8');
  }

  return removed;
}
