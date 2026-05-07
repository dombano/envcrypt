import { Command } from 'commander';
import { readAuditLog, AuditEntry } from './audit';

function formatEntry(entry: AuditEntry): string {
  const ts = new Date(entry.timestamp).toLocaleString();
  const user = entry.user ? ` [${entry.user}]` : '';
  return `${ts}${user}  ${entry.action.padEnd(16)}  ${entry.details}`;
}

export function registerAuditCommands(program: Command): void {
  const audit = program
    .command('audit')
    .description('View the audit log of envcrypt actions');

  audit
    .command('log')
    .description('Display all recorded audit log entries')
    .option('-n, --last <number>', 'Show only the last N entries')
    .option('--json', 'Output entries as JSON')
    .action(async (options) => {
      try {
        let entries = await readAuditLog(process.cwd());

        if (entries.length === 0) {
          console.log('No audit log entries found.');
          return;
        }

        if (options.last) {
          const n = parseInt(options.last, 10);
          if (isNaN(n) || n <= 0) {
            console.error('--last must be a positive integer');
            process.exit(1);
          }
          entries = entries.slice(-n);
        }

        if (options.json) {
          console.log(JSON.stringify(entries, null, 2));
        } else {
          console.log(
            `${'Timestamp'.padEnd(22)}  ${'User'.padEnd(12)}  ${'Action'.padEnd(16)}  Details`
          );
          console.log('-'.repeat(80));
          for (const entry of entries) {
            console.log(formatEntry(entry));
          }
        }
      } catch (err: any) {
        console.error('Failed to read audit log:', err.message);
        process.exit(1);
      }
    });
}
