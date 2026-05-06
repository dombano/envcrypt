import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadRecipients,
  saveRecipients,
  addRecipient,
  removeRecipient,
  getRecipient,
} from './recipients';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-recipients-test-'));
}

describe('recipients', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loadRecipients returns empty array when file does not exist', () => {
    const result = loadRecipients(tmpDir);
    expect(result).toEqual([]);
  });

  it('saveRecipients and loadRecipients round-trips data', () => {
    const recipients = [
      { name: 'alice', publicKey: 'alice-pub-key' },
      { name: 'bob', publicKey: 'bob-pub-key' },
    ];
    saveRecipients(recipients, tmpDir);
    const loaded = loadRecipients(tmpDir);
    expect(loaded).toEqual(recipients);
  });

  it('addRecipient adds a new recipient', () => {
    addRecipient('alice', 'alice-pub-key', tmpDir);
    const recipients = loadRecipients(tmpDir);
    expect(recipients).toHaveLength(1);
    expect(recipients[0]).toEqual({ name: 'alice', publicKey: 'alice-pub-key' });
  });

  it('addRecipient throws if recipient already exists', () => {
    addRecipient('alice', 'alice-pub-key', tmpDir);
    expect(() => addRecipient('alice', 'another-key', tmpDir)).toThrow(
      'Recipient "alice" already exists'
    );
  });

  it('removeRecipient removes an existing recipient', () => {
    addRecipient('alice', 'alice-pub-key', tmpDir);
    addRecipient('bob', 'bob-pub-key', tmpDir);
    removeRecipient('alice', tmpDir);
    const recipients = loadRecipients(tmpDir);
    expect(recipients).toHaveLength(1);
    expect(recipients[0].name).toBe('bob');
  });

  it('removeRecipient throws if recipient not found', () => {
    expect(() => removeRecipient('ghost', tmpDir)).toThrow('Recipient "ghost" not found');
  });

  it('getRecipient returns the correct recipient', () => {
    addRecipient('alice', 'alice-pub-key', tmpDir);
    const recipient = getRecipient('alice', tmpDir);
    expect(recipient).toEqual({ name: 'alice', publicKey: 'alice-pub-key' });
  });

  it('getRecipient throws if recipient not found', () => {
    expect(() => getRecipient('nobody', tmpDir)).toThrow('Recipient "nobody" not found');
  });

  it('loadRecipients throws on malformed JSON', () => {
    const dir = path.join(tmpDir, '.envcrypt');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'recipients.json'), 'not-json', 'utf-8');
    expect(() => loadRecipients(tmpDir)).toThrow('Failed to parse recipients file');
  });
});
