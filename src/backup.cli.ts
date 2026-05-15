import { Command } from 'commander';
import * as path from 'path';
import { createBackup, listBackups, restoreBackup, deleteBackup } from './backup';

export function registerBackupCommands(program: Command): void {
  const backup = program
    .command('backup')
    .description('Manage .env file backups');

  backup
    .command('create [envfile]')
    .description('Create a backup of an .env file')
    .action(async (envfile = '.env') => {
      const dir = process.cwd();
      const envFilePath = path.resolve(dir, envfile);
      try {
        const dest = await createBackup(envFilePath, dir);
        console.log(`Backup created: ${dest}`);
      } catch (err: any) {
        console.error(`Error creating backup: ${err.message}`);
        process.exit(1);
      }
    });

  backup
    .command('list')
    .description('List all available backups')
    .action(async () => {
      const dir = process.cwd();
      const entries = await listBackups(dir);
      if (entries.length === 0) {
        console.log('No backups found.');
        return;
      }
      console.log('Available backups:');
      entries.forEach(e => console.log(`  ${e.filename}  (source: ${e.source})  ${e.timestamp}`));
    });

  backup
    .command('restore <backupfile> [envfile]')
    .description('Restore a backup to an .env file')
    .action(async (backupfile: string, envfile = '.env') => {
      const dir = process.cwd();
      const destPath = path.resolve(dir, envfile);
      try {
        await restoreBackup(backupfile, destPath, dir);
        console.log(`Restored ${backupfile} to ${destPath}`);
      } catch (err: any) {
        console.error(`Error restoring backup: ${err.message}`);
        process.exit(1);
      }
    });

  backup
    .command('delete <backupfile>')
    .description('Delete a backup')
    .action(async (backupfile: string) => {
      const dir = process.cwd();
      try {
        await deleteBackup(backupfile, dir);
        console.log(`Deleted backup: ${backupfile}`);
      } catch (err: any) {
        console.error(`Error deleting backup: ${err.message}`);
        process.exit(1);
      }
    });
}
