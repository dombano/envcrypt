import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createBackup, listBackups, restoreBackup, deleteBackup, resolveBackupsPath } from './backup';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-backup-test-'));
}

describe('backup', () => {
  let dir: string;
  let envFilePath: string;

  beforeEach(async () => {
    dir = await makeTempDir();
    envFilePath = path.join(dir, '.env');
    await fs.writeFile(envFilePath, 'KEY1=value1\nKEY2=value2\n', 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('resolveBackupsPath returns correct path', () => {
    const p = resolveBackupsPath(dir);
    expect(p).toBe(path.join(dir, '.envcrypt', 'backups'));
  });

  test('createBackup creates a backup file', async () => {
    const dest = await createBackup(envFilePath, dir);
    const stat = await fs.stat(dest);
    expect(stat.isFile()).toBe(true);
    expect(dest).toContain('.env.bak');
  });

  test('listBackups returns created backup', async () => {
    await createBackup(envFilePath, dir);
    const entries = await listBackups(dir);
    expect(entries.length).toBe(1);
    expect(entries[0].filename).toMatch(/\.env\.bak$/);
    expect(entries[0].source).toBe('.env');
  });

  test('listBackups returns empty array when no backups exist', async () => {
    const entries = await listBackups(dir);
    expect(entries).toEqual([]);
  });

  test('restoreBackup restores content to destination', async () => {
    const dest = await createBackup(envFilePath, dir);
    const backupFilename = path.basename(dest);
    const restorePath = path.join(dir, '.env.restored');
    await restoreBackup(backupFilename, restorePath, dir);
    const content = await fs.readFile(restorePath, 'utf-8');
    expect(content).toContain('KEY1=value1');
    expect(content).toContain('KEY2=value2');
  });

  test('deleteBackup removes the backup file', async () => {
    const dest = await createBackup(envFilePath, dir);
    const backupFilename = path.basename(dest);
    await deleteBackup(backupFilename, dir);
    const entries = await listBackups(dir);
    expect(entries.length).toBe(0);
  });

  test('multiple backups are listed sorted by newest first', async () => {
    await createBackup(envFilePath, dir);
    await new Promise(r => setTimeout(r, 1100));
    await createBackup(envFilePath, dir);
    const entries = await listBackups(dir);
    expect(entries.length).toBe(2);
    expect(entries[0].timestamp >= entries[1].timestamp).toBe(true);
  });
});
