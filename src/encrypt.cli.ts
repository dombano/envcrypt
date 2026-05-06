import { Command } from 'commander';
import path from 'path';
import { loadRecipients } from './recipients';
import { readEnvFile, writeEnvFile } from './env';
import { loadPublicKey } from './keys';
import { encryptEnvForRecipients } from './share';

export function registerEncryptCommands(program: Command): void {
  program
    .command('encrypt')
    .description('Encrypt a .env file for all recipients')
    .option('-e, --env <path>', 'Path to the .env file', '.env')
    .option('-o, --output <path>', 'Output path for the encrypted file', '.env.enc')
    .option('-r, --recipients <path>', 'Path to recipients file', '.envcrypt/recipients.json')
    .action(async (options) => {
      try {
        const envPath = path.resolve(options.env);
        const outputPath = path.resolve(options.output);
        const recipientsPath = path.resolve(options.recipients);

        const envVars = await readEnvFile(envPath);
        const recipients = await loadRecipients(recipientsPath);

        if (recipients.length === 0) {
          console.error('No recipients found. Add recipients with: envcrypt recipients add <name> <public-key-path>');
          process.exit(1);
        }

        const publicKeys = await Promise.all(
          recipients.map(async (r) => ({
            name: r.name,
            publicKey: await loadPublicKey(r.publicKeyPath),
          }))
        );

        await encryptEnvForRecipients(envVars, publicKeys, outputPath);

        console.log(`Encrypted .env for ${recipients.length} recipient(s) -> ${outputPath}`);
        recipients.forEach((r) => console.log(`  - ${r.name}`));
      } catch (err: any) {
        console.error('Encryption failed:', err.message);
        process.exit(1);
      }
    });
}
