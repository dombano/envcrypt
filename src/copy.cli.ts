import { Command } from 'commander';
import { copyEnvKeys } from './copy';

export function registerCopyCommands(program: Command): void {
  program
    .command('copy <source> <destination>')
    .description('Copy env keys from one file to another')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to copy (default: all)')
    .option('--overwrite', 'Overwrite existing keys in the destination', false)
    .action(async (source: string, destination: string, opts) => {
      try {
        const keys = opts.keys
          ? (opts.keys as string).split(',').map((k: string) => k.trim()).filter(Boolean)
          : undefined;

        const copied = await copyEnvKeys(source, destination, {
          keys,
          overwrite: opts.overwrite as boolean,
        });

        if (copied.length === 0) {
          console.log('No keys were copied (all already exist in destination; use --overwrite to replace).');
        } else {
          console.log(`Copied ${copied.length} key(s) to ${destination}: ${copied.join(', ')}`);
        }
      } catch (err) {
        console.error('Error:', (err as Error).message);
        process.exit(1);
      }
    });
}
