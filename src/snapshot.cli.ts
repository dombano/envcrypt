import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { createSnapshot, loadSnapshots, restoreSnapshot, deleteSnapshot } from './snapshot';
import { serialiseEnv } from './env';
import { writeEnvFile } from './env';

export function registerSnapshotCommands(program: Command): void {
  const snap = program.command('snapshot').description('manage .env snapshots');

  snap
    .command('create')
    .description('create a snapshot of the current .env file')
    .option('-e, --env <file>', '.env file to snapshot', '.env')
    .option('-l, --label <label>', 'optional label for the snapshot')
    .option('-d, --dir <dir>', 'project directory', process.cwd())
    .action((opts) => {
      const envFile = path.resolve(opts.dir, opts.env);
      const snap = createSnapshot(opts.dir, envFile, opts.label);
      console.log(`Snapshot created at ${snap.timestamp}${snap.label ? ` (${snap.label})` : ''}`);
    });

  snap
    .command('list')
    .description('list all saved snapshots')
    .option('-d, --dir <dir>', 'project directory', process.cwd())
    .action((opts) => {
      const snapshots = loadSnapshots(opts.dir);
      if (snapshots.length === 0) {
        console.log('No snapshots found.');
        return;
      }
      snapshots.forEach((s, i) => {
        const label = s.label ? ` — ${s.label}` : '';
        const keys = Object.keys(s.env).length;
        console.log(`[${i}] ${s.timestamp}${label} (${keys} key${keys !== 1 ? 's' : ''})`);
      });
    });

  snap
    .command('restore <index>')
    .description('restore a snapshot into the .env file')
    .option('-e, --env <file>', '.env file to write', '.env')
    .option('-d, --dir <dir>', 'project directory', process.cwd())
    .action((indexStr, opts) => {
      const index = parseInt(indexStr, 10);
      const env = restoreSnapshot(index, opts.dir);
      const envFile = path.resolve(opts.dir, opts.env);
      writeEnvFile(envFile, serialiseEnv(env));
      console.log(`Snapshot [${index}] restored to ${envFile}`);
    });

  snap
    .command('delete <index>')
    .description('delete a snapshot by index')
    .option('-d, --dir <dir>', 'project directory', process.cwd())
    .action((indexStr, opts) => {
      const index = parseInt(indexStr, 10);
      deleteSnapshot(index, opts.dir);
      console.log(`Snapshot [${index}] deleted.`);
    });
}
