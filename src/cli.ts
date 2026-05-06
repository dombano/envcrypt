#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import { generateKeyPair } from './crypto';
import { readEnvFile } from './env';
import { encryptEnvFile, decryptEnvFile } from './share';
import * as fs from 'fs';

const program = new Command();

program
  .name('envcrypt')
  .description('Encrypt and share .env files securely using public-key cryptography')
  .version('1.0.0');

program
  .command('keygen')
  .description('Generate a new public/private key pair')
  .option('-o, --output <dir>', 'Output directory for key files', '.')
  .action((opts) => {
    const { publicKey, privateKey } = generateKeyPair();
    const pubPath = path.join(opts.output, 'envcrypt.pub');
    const privPath = path.join(opts.output, 'envcrypt.key');
    fs.writeFileSync(pubPath, publicKey, 'utf8');
    fs.writeFileSync(privPath, privateKey, 'utf8');
    console.log(`Public key written to:  ${pubPath}`);
    console.log(`Private key written to: ${privPath}`);
    console.log('Keep your private key safe and never commit it!');
  });

program
  .command('encrypt')
  .description('Encrypt a .env file using a public key')
  .argument('<envFile>', 'Path to the .env file')
  .option('-k, --key <file>', 'Path to the public key file', 'envcrypt.pub')
  .option('-o, --output <file>', 'Output file path', '<envFile>.enc')
  .action(async (envFile, opts) => {
    const publicKey = fs.readFileSync(opts.key, 'utf8');
    const outputFile = opts.output === '<envFile>.enc' ? `${envFile}.enc` : opts.output;
    await encryptEnvFile(envFile, outputFile, publicKey);
    console.log(`Encrypted env written to: ${outputFile}`);
  });

program
  .command('decrypt')
  .description('Decrypt an encrypted .env file using a private key')
  .argument('<encFile>', 'Path to the encrypted .env file')
  .option('-k, --key <file>', 'Path to the private key file', 'envcrypt.key')
  .option('-o, --output <file>', 'Output file path', '.env')
  .action(async (encFile, opts) => {
    const privateKey = fs.readFileSync(opts.key, 'utf8');
    await decryptEnvFile(encFile, opts.output, privateKey);
    console.log(`Decrypted env written to: ${opts.output}`);
  });

program.parse(process.argv);
