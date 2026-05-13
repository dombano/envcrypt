import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadSnapshots,
  saveSnapshots,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  resolveSnapshotsPath,
} from './snapshot';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcrypt-snapshot-'));
}

describe('snapshot', () => {
  let dir: string;
  let envFile: string;

  beforeEach(() => {
    dir = makeTempDir();
    envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\nBAZ=qux\n', 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty array when no snapshots file exists', () => {
    expect(loadSnapshots(dir)).toEqual([]);
  });

  it('saves and loads snapshots', () => {
    const snapshots = [{ timestamp: '2024-01-01T00:00:00.000Z', env: { FOO: 'bar' } }];
    saveSnapshots(dir, snapshots);
    expect(loadSnapshots(dir)).toEqual(snapshots);
  });

  it('creates a snapshot from an env file', () => {
    const snap = createSnapshot(dir, envFile, 'initial');
    expect(snap.label).toBe('initial');
    expect(snap.env).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(snap.timestamp).toBeTruthy();
    const loaded = loadSnapshots(dir);
    expect(loaded).toHaveLength(1);
  });

  it('creates a snapshot without a label', () => {
    const snap = createSnapshot(dir, envFile);
    expect(snap.label).toBeUndefined();
  });

  it('restores a snapshot by index', () => {
    createSnapshot(dir, envFile, 'v1');
    fs.writeFileSync(envFile, 'FOO=changed\n', 'utf-8');
    createSnapshot(dir, envFile, 'v2');
    const env = restoreSnapshot(0, dir);
    expect(env).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('throws when restoring out-of-range index', () => {
    expect(() => restoreSnapshot(5, dir)).toThrow('out of range');
  });

  it('deletes a snapshot by index', () => {
    createSnapshot(dir, envFile, 'v1');
    createSnapshot(dir, envFile, 'v2');
    deleteSnapshot(0, dir);
    const remaining = loadSnapshots(dir);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].label).toBe('v2');
  });

  it('throws when deleting out-of-range index', () => {
    expect(() => deleteSnapshot(0, dir)).toThrow('out of range');
  });

  it('resolves correct snapshots path', () => {
    const p = resolveSnapshotsPath('/project');
    expect(p).toBe('/project/.envcrypt/snapshots.json');
  });
});
