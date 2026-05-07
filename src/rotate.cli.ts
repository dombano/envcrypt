import { Command } from 'commander';
import { rotateEncryption } from './rotate';
import * as path from 'path';

export function registerRotateCommands(program: Command): void {
  program
    .command('rotate')
    .description('Re-encrypt the .env.enc file with current recipients and keys')
    .option('-e, --encrypted <file>', 'encrypted env file', '.env.enc')
    .option('-k, --keys-dir <dir>', 'directory containing key files', '.')
    .option('-r, --recipients <file>', 'recipients file path')
    .option('--env-file <file>', 'plaintext env file path', '.env')
    .action(async (opts) => {
      try {
        const encryptedFile = path.resolve(opts.encrypted);
        const keysDir = path.resolve(opts.keysDir);
        const recipientsFile = opts.recipients
          ? path.resolve(opts.recipients)
          : undefined;
        const envFile = path.resolve(opts.envFile);

        console.log(`Rotating encryption for ${encryptedFile}...`);

        await rotateEncryption(encryptedFile, {
          keysDir,
          envFile,
          recipientsFile,
        });

        console.log('✓ Encryption rotated successfully.');
      } catch (err: any) {
        console.error('Error rotating encryption:', err.message);
        process.exit(1);
      }
    });
}
