import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  readGitignore,
  addGitignoreEntries,
  isGitignored,
  GITIGNORE_FILE,
  ENVCRYPT_GITIGNORE_ENTRIES,
} from './gitignore';
import { DEFAULT_PRIVATE_KEY_FILE } from './keys';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-gitignore-test-'));
}

describe('gitignore', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('readGitignore returns empty string when no file exists', () => {
    expect(readGitignore(tmpDir)).toBe('');
  });

  test('readGitignore returns file content when file exists', () => {
    fs.writeFileSync(path.join(tmpDir, GITIGNORE_FILE), 'node_modules\n', 'utf8');
    expect(readGitignore(tmpDir)).toBe('node_modules\n');
  });

  test('addGitignoreEntries creates .gitignore if missing', () => {
    addGitignoreEntries(tmpDir, ['envcrypt.key']);
    expect(fs.existsSync(path.join(tmpDir, GITIGNORE_FILE))).toBe(true);
  });

  test('addGitignoreEntries adds missing entries', () => {
    const { added, skipped } = addGitignoreEntries(tmpDir, ['envcrypt.key', '*.env']);
    expect(added).toContain('envcrypt.key');
    expect(added).toContain('*.env');
    expect(skipped).toHaveLength(0);
  });

  test('addGitignoreEntries skips already present entries', () => {
    fs.writeFileSync(path.join(tmpDir, GITIGNORE_FILE), 'envcrypt.key\n', 'utf8');
    const { added, skipped } = addGitignoreEntries(tmpDir, ['envcrypt.key', '*.env']);
    expect(skipped).toContain('envcrypt.key');
    expect(added).toContain('*.env');
  });

  test('isGitignored returns true for present entry', () => {
    fs.writeFileSync(path.join(tmpDir, GITIGNORE_FILE), 'envcrypt.key\n', 'utf8');
    expect(isGitignored('envcrypt.key', tmpDir)).toBe(true);
  });

  test('isGitignored returns false for absent entry', () => {
    expect(isGitignored('envcrypt.key', tmpDir)).toBe(false);
  });

  test('ENVCRYPT_GITIGNORE_ENTRIES includes private key file', () => {
    expect(ENVCRYPT_GITIGNORE_ENTRIES).toContain(DEFAULT_PRIVATE_KEY_FILE);
  });

  test('addGitignoreEntries appends envcrypt block with comment', () => {
    addGitignoreEntries(tmpDir, ['envcrypt.key']);
    const content = fs.readFileSync(path.join(tmpDir, GITIGNORE_FILE), 'utf8');
    expect(content).toContain('# envcrypt');
    expect(content).toContain('envcrypt.key');
  });
});
