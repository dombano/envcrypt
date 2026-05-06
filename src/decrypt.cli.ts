import { Command } from 'commander';
import path from 'path';
import { loadPrivateKey } from './keys';
import { readEnvFile, writeEnvFile } from './env';
import { decrypt } from './crypto';

export function registerDecryptCommands(program: Command): void {
  program
    .command('decrypt')
    .description('Decrypt an encrypted .env file using your private key')
    .option('-i, --input <file>', 'Encrypted input file', '.env.enc')
    .option('-o, --output <file>', 'Decrypted output file', '.env')
    .option('-k, --keys-dir <dir>', 'Directory containing keys', '.envcrypt')
    .action(async (options) => {
      try {
        const keysDir = path.resolve(process.cwd(), options.keysDir);
        const inputPath = path.resolve(process.cwd(), options.input);
        const outputPath = path.resolve(process.cwd(), options.output);

        const privateKey = await loadPrivateKey(keysDir);
        if (!privateKey) {
          console.error('Error: No private key found. Run `envcrypt init` first.');
          process.exit(1);
        }

        let encryptedData: Record<string, string>;
        try {
          encryptedData = await readEnvFile(inputPath);
        } catch {
          console.error(`Error: Could not read encrypted file at ${inputPath}`);
          process.exit(1);
        }

        const decrypted: Record<string, string> = {};
        for (const [key, value] of Object.entries(encryptedData)) {
          try {
            decrypted[key] = decrypt(value, privateKey);
          } catch {
            console.error(`Error: Failed to decrypt key "${key}". Wrong private key?`);
            process.exit(1);
          }
        }

        await writeEnvFile(outputPath, decrypted);
        console.log(`Decrypted ${Object.keys(decrypted).length} variable(s) to ${outputPath}`);
      } catch (err) {
        console.error('Unexpected error:', err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
