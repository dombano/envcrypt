import * as fs from 'fs/promises';
import * as path from 'path';

export interface AuditEntry {
  timestamp: string;
  action: 'encrypt' | 'decrypt' | 'rotate' | 'add-recipient' | 'remove-recipient' | 'init';
  details: string;
  user?: string;
}

export function resolveAuditLogPath(dir: string = process.cwd()): string {
  return path.join(dir, '.envcrypt-audit.log');
}

export async function appendAuditEntry(
  entry: AuditEntry,
  dir: string = process.cwd()
): Promise<void> {
  const logPath = resolveAuditLogPath(dir);
  const line = JSON.stringify(entry) + '\n';
  await fs.appendFile(logPath, line, 'utf-8');
}

export async function readAuditLog(
  dir: string = process.cwd()
): Promise<AuditEntry[]> {
  const logPath = resolveAuditLogPath(dir);
  try {
    const content = await fs.readFile(logPath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as AuditEntry);
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export function createAuditEntry(
  action: AuditEntry['action'],
  details: string
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    details,
    user: process.env.USER ?? process.env.USERNAME,
  };
}
