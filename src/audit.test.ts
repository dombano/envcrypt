import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  appendAuditEntry,
  readAuditLog,
  createAuditEntry,
  resolveAuditLogPath,
} from './audit';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-audit-test-'));
}

describe('audit', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('resolveAuditLogPath returns correct path', () => {
    const result = resolveAuditLogPath('/some/dir');
    expect(result).toBe('/some/dir/.envcrypt-audit.log');
  });

  test('createAuditEntry creates entry with timestamp and action', () => {
    const entry = createAuditEntry('encrypt', 'Encrypted .env for 2 recipients');
    expect(entry.action).toBe('encrypt');
    expect(entry.details).toBe('Encrypted .env for 2 recipients');
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('readAuditLog returns empty array when file does not exist', async () => {
    const entries = await readAuditLog(tmpDir);
    expect(entries).toEqual([]);
  });

  test('appendAuditEntry writes entry to log', async () => {
    const entry = createAuditEntry('init', 'Initialised keys');
    await appendAuditEntry(entry, tmpDir);
    const logPath = resolveAuditLogPath(tmpDir);
    const content = await fs.readFile(logPath, 'utf-8');
    expect(content).toContain('"action":"init"');
  });

  test('readAuditLog returns all appended entries', async () => {
    await appendAuditEntry(createAuditEntry('init', 'Keys initialised'), tmpDir);
    await appendAuditEntry(createAuditEntry('encrypt', 'Encrypted .env'), tmpDir);
    await appendAuditEntry(createAuditEntry('decrypt', 'Decrypted .env'), tmpDir);

    const entries = await readAuditLog(tmpDir);
    expect(entries).toHaveLength(3);
    expect(entries[0].action).toBe('init');
    expect(entries[1].action).toBe('encrypt');
    expect(entries[2].action).toBe('decrypt');
  });

  test('readAuditLog preserves entry details', async () => {
    const entry = createAuditEntry('add-recipient', 'alice@example.com');
    await appendAuditEntry(entry, tmpDir);
    const entries = await readAuditLog(tmpDir);
    expect(entries[0].details).toBe('alice@example.com');
  });
});
