import { Command } from 'commander';
import { mergeEnvFiles, MergeStrategy } from './merge';

export function registerMergeCommands(program: Command): void {
  program
    .command('merge <base> <incoming>')
    .description('Merge two .env files together')
    .option('-o, --output <path>', 'Output path (defaults to <base>)')
    .option(
      '-s, --strategy <strategy>',
      'Conflict resolution strategy: ours | theirs (default: theirs)',
      'theirs'
    )
    .action(async (base: string, incoming: string, opts: { output?: string; strategy: string }) => {
      const strategy = opts.strategy as MergeStrategy;
      if (strategy !== 'ours' && strategy !== 'theirs') {
        console.error(`Invalid strategy "${strategy}". Use "ours" or "theirs".`);
        process.exit(1);
      }

      const output = opts.output ?? base;

      try {
        const result = await mergeEnvFiles(base, incoming, output, strategy);

        if (result.added.length > 0) {
          console.log(`Added keys: ${result.added.join(', ')}`);
        }
        if (result.conflicts.length > 0) {
          const kept = strategy === 'ours' ? 'base' : 'incoming';
          console.log(
            `Conflicts resolved (kept ${kept}): ${result.conflicts.join(', ')}`
          );
        }
        if (result.added.length === 0 && result.conflicts.length === 0) {
          console.log('No changes — files were identical.');
        }

        console.log(`Merged env written to ${output}`);
      } catch (err) {
        console.error('Merge failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
