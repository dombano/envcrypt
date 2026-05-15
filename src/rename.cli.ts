import { Command } from 'commander';
import { renameEnvKeyInFile } from './rename';
import { loadConfig } from './config';

export function registerRenameCommands(program: Command): void {
  program
    .command('rename <oldKey> <newKey>')
    .description('Rename a key in the .env file')
    .option('-f, --file <path>', 'Path to the .env file')
    .option('--cwd <dir>', 'Working directory', process.cwd())
    .action(async (oldKey: string, newKey: string, opts: { file?: string; cwd: string }) => {
      try {
        let filePath = opts.file;

        if (!filePath) {
          const config = await loadConfig(opts.cwd).catch(() => null);
          filePath = config?.envFile
            ? require('path').resolve(opts.cwd, config.envFile)
            : require('path').join(opts.cwd, '.env');
        }

        if (!oldKey || !newKey) {
          console.error('Error: both <oldKey> and <newKey> are required.');
          process.exit(1);
        }

        const result = await renameEnvKeyInFile(filePath, oldKey, newKey);

        if (!result.found) {
          console.error(`Error: key "${oldKey}" not found in ${filePath}`);
          process.exit(1);
        }

        if (oldKey === newKey) {
          console.log(`Key "${oldKey}" unchanged (old and new names are identical).`);
        } else {
          console.log(`Renamed "${oldKey}" → "${newKey}" in ${filePath}`);
        }
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
