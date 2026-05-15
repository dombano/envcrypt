import * as fs from 'fs/promises';
import * as path from 'path';
import { readEnvFile, writeEnvFile } from './env';

export interface BackupEntry {
  timestamp: string;
  filename: string;
  source: string;
}

export function resolveBackupsPath(dir: string): string {
  return path.join(dir, '.envcrypt', 'backups');
}

export async function listBackups(dir: string): Promise<BackupEntry[]> {
  const backupsDir = resolveBackupsPath(dir);
  try {
    const files = await fs.readdir(backupsDir);
    return files
      .filter(f => f.endsWith('.env.bak'))
      .map(filename => {
        const parts = filename.replace('.env.bak', '').split('_');
        const source = parts.slice(0, -2).join('_');
        const timestamp = parts.slice(-2).join('T').replace(/-/g, ':').replace('T', 'T');
        return { timestamp, filename, source };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

export async function createBackup(envFilePath: string, dir: string): Promise<string> {
  const backupsDir = resolveBackupsPath(dir);
  await fs.mkdir(backupsDir, { recursive: true });

  const source = path.basename(envFilePath, path.extname(envFilePath));
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const filename = `${source}_${timestamp}.env.bak`;
  const destPath = path.join(backupsDir, filename);

  const vars = await readEnvFile(envFilePath);
  await writeEnvFile(destPath, vars);

  return destPath;
}

export async function restoreBackup(backupFilename: string, destPath: string, dir: string): Promise<void> {
  const backupsDir = resolveBackupsPath(dir);
  const backupPath = path.join(backupsDir, backupFilename);
  const vars = await readEnvFile(backupPath);
  await writeEnvFile(destPath, vars);
}

export async function deleteBackup(backupFilename: string, dir: string): Promise<void> {
  const backupsDir = resolveBackupsPath(dir);
  const backupPath = path.join(backupsDir, backupFilename);
  await fs.unlink(backupPath);
}
