import { Command } from 'commander';
import * as path from 'path';
import { exportEnvFile, ExportFormat } from './export';
import { loadConfig } from './config';

export function registerExportCommands(program: Command): void {
  program
    .command('export')
    .description('Export a .env file to a different format (json, yaml, shell)')
    .argument('[envFile]', 'path to the .env file', '.env')
    .option('-f, --format <format>', 'output format: json, yaml, shell', 'json')
    .option('-o, --output <file>', 'write output to a file instead of stdout')
    .action(async (envFile: string, options: { format: string; output?: string }) => {
      try {
        const config = await loadConfig().catch(() => ({}));
        const resolvedEnv = path.resolve(envFile);
        const format = options.format as ExportFormat;

        const validFormats: ExportFormat[] = ['json', 'yaml', 'shell'];
        if (!validFormats.includes(format)) {
          console.error(`Error: unsupported format "${format}". Choose from: json, yaml, shell.`);
          process.exit(1);
        }

        const output = await exportEnvFile(
          resolvedEnv,
          format,
          options.output ? path.resolve(options.output) : undefined
        );

        if (options.output) {
          console.log(`Exported to ${options.output}`);
        } else {
          console.log(output);
        }
      } catch (err: any) {
        console.error(`Export failed: ${err.message}`);
        process.exit(1);
      }
    });
}
