import { Command } from 'commander';
import { readEnvFile } from './env';
import { searchEnv, formatSearchResults } from './search';

export function registerSearchCommands(program: Command): void {
  program
    .command('search <query>')
    .description('Search for keys or values in an env file')
    .option('-f, --file <path>', 'Path to the .env file', '.env')
    .option('-k, --keys-only', 'Search keys only')
    .option('-v, --values-only', 'Search values only')
    .option('-c, --case-sensitive', 'Enable case-sensitive matching')
    .option('-r, --regex', 'Treat query as a regular expression')
    .option('--json', 'Output results as JSON')
    .action(async (query: string, opts) => {
      try {
        const env = await readEnvFile(opts.file);
        const results = searchEnv(env, query, {
          keysOnly: opts.keysOnly ?? false,
          valuesOnly: opts.valuesOnly ?? false,
          caseSensitive: opts.caseSensitive ?? false,
          regex: opts.regex ?? false,
        });

        if (opts.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          console.log(formatSearchResults(results));
        }

        if (results.length === 0) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
