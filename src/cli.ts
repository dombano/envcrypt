#!/usr/bin/env node
import { Command } from 'commander';
import { registerEncryptCommands } from './encrypt.cli';
import { registerDecryptCommands } from './decrypt.cli';
import { registerRecipientsCommands } from './recipients.cli';
import { registerRotateCommands } from './rotate.cli';
import { registerAuditCommands } from './audit.cli';
import { registerConfigCommands } from './config.cli';
import { registerMergeCommands } from './merge.cli';
import { registerProfileCommands } from './profile.cli';

const program = new Command();

program
  .name('envcrypt')
  .description('Encrypt and share .env files securely using public-key cryptography')
  .version('1.0.0');

registerEncryptCommands(program);
registerDecryptCommands(program);
registerRecipientsCommands(program);
registerRotateCommands(program);
registerAuditCommands(program);
registerConfigCommands(program);
registerMergeCommands(program);
registerProfileCommands(program);

program.parse(process.argv);
