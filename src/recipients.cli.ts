import { Command } from 'commander';
import { addRecipient, removeRecipient, loadRecipients } from './recipients';
import { loadPublicKey } from './keys';

export function registerRecipientsCommands(program: Command): void {
  const recipients = program
    .command('recipients')
    .description('Manage recipients who can decrypt shared .env files');

  recipients
    .command('add <name>')
    .description('Add a recipient by name and public key file or inline key')
    .option('-k, --key <publicKey>', 'Inline public key string')
    .option('-f, --file <keyFile>', 'Path to public key file')
    .action((name: string, options: { key?: string; file?: string }) => {
      try {
        let publicKey: string;
        if (options.key) {
          publicKey = options.key.trim();
        } else if (options.file) {
          publicKey = loadPublicKey(options.file);
        } else {
          console.error('Error: provide a public key via --key or --file');
          process.exit(1);
        }
        addRecipient(name, publicKey);
        console.log(`Recipient "${name}" added successfully.`);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  recipients
    .command('remove <name>')
    .description('Remove a recipient by name')
    .action((name: string) => {
      try {
        removeRecipient(name);
        console.log(`Recipient "${name}" removed.`);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  recipients
    .command('list')
    .description('List all recipients')
    .action(() => {
      try {
        const list = loadRecipients();
        if (list.length === 0) {
          console.log('No recipients configured.');
          return;
        }
        console.log('Recipients:');
        list.forEach((r) => console.log(`  - ${r.name}`));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
