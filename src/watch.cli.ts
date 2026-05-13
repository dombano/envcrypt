import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { watchEnvFile } from './watch';
import { loadConfig } from './config';

export function registerWatchCommands(program: Command): void {
  program
    .command('watch')
    .description('Watch a .env file and automatically re-encrypt on changes')
    .argument('[envFile]', 'Path to the .env file to watch', '.env')
    .option('-o, --out <file>', 'Output encrypted file path', '.env.encrypted')
    .option('-r, --recipients <file>', 'Path to recipients file')
    .option('-k, --keys-dir <dir>', 'Directory containing recipient public keys')
    .option('-d, --debounce <ms>', 'Debounce delay in milliseconds', '300')
    .action(async (envFile: string, opts) => {
      const envPath = path.resolve(envFile);

      if (!fs.existsSync(envPath)) {
        console.error(`Error: File not found: ${envPath}`);
        process.exit(1);
      }

      let config: Record<string, unknown> = {};
      try {
        config = await loadConfig() as Record<string, unknown>;
      } catch {
        // config is optional
      }

      const outPath = path.resolve(opts.out as string);
      const recipientsPath = opts.recipients
        ? path.resolve(opts.recipients as string)
        : undefined;
      const keysDir = opts.keysDir
        ? path.resolve(opts.keysDir as string)
        : (config.keysDir as string | undefined);
      const debounceMs = parseInt(opts.debounce as string, 10);

      console.log(`Watching ${envPath} for changes...`);
      console.log(`Output: ${outPath}`);

      const stop = watchEnvFile(
        { envPath, outPath, recipientsPath, keysDir, debounceMs },
        (event, detail) => {
          const timestamp = new Date().toISOString();
          if (event === 'encrypted') {
            console.log(`[${timestamp}] ✔ ${detail}`);
          } else {
            console.error(`[${timestamp}] ✖ ${detail}`);
          }
        }
      );

      process.on('SIGINT', () => {
        stop();
        console.log('\nStopped watching.');
        process.exit(0);
      });
    });
}
