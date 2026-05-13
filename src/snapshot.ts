import * as fs from 'fs';
import * as path from 'path';
import { parseEnv, serialiseEnv, readEnvFile } from './env';

export interface Snapshot {
  timestamp: string;
  label?: string;
  env: Record<string, string>;
}

export function resolveSnapshotsPath(dir: string): string {
  return path.join(dir, '.envcrypt', 'snapshots.json');
}

export function loadSnapshots(dir: string): Snapshot[] {
  const filePath = resolveSnapshotsPath(dir);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Snapshot[];
}

export function saveSnapshots(dir: string, snapshots: Snapshot[]): void {
  const filePath = resolveSnapshotsPath(dir);
  const snapshotDir = path.dirname(filePath);
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(snapshots, null, 2), 'utf-8');
}

export function createSnapshot(dir: string, envFile: string, label?: string): Snapshot {
  const raw = readEnvFile(envFile);
  const env = parseEnv(raw);
  const snapshot: Snapshot = {
    timestamp: new Date().toISOString(),
    env,
    ...(label ? { label } : {}),
  };
  const snapshots = loadSnapshots(dir);
  snapshots.push(snapshot);
  saveSnapshots(dir, snapshots);
  return snapshot;
}

export function restoreSnapshot(index: number, dir: string): Record<string, string> {
  const snapshots = loadSnapshots(dir);
  if (index < 0 || index >= snapshots.length) {
    throw new Error(`Snapshot index ${index} out of range (0-${snapshots.length - 1})`);
  }
  return snapshots[index].env;
}

export function deleteSnapshot(index: number, dir: string): void {
  const snapshots = loadSnapshots(dir);
  if (index < 0 || index >= snapshots.length) {
    throw new Error(`Snapshot index ${index} out of range (0-${snapshots.length - 1})`);
  }
  snapshots.splice(index, 1);
  saveSnapshots(dir, snapshots);
}
