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
