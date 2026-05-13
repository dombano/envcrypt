import { Command } from 'commander';
import * as path from 'path';
import { readEnvFile } from './env';
import {
  readTemplateFile,
  writeTemplateFile,
  templateFromEnv,
  validateAgainstTemplate,
  serialiseTemplate,
} from './template';

const DEFAULT_TEMPLATE = '.env.template';

export function registerTemplateCommands(program: Command): void {
  const tmpl = program.command('template').description('Manage .env template files');

  tmpl
    .command('generate')
    .description('Generate a .env.template from an existing .env file')
    .option('-i, --input <file>', 'Source .env file', '.env')
    .option('-o, --output <file>', 'Output template file', DEFAULT_TEMPLATE)
    .action(async (opts) => {
      try {
        const env = await readEnvFile(path.resolve(opts.input));
        const template = templateFromEnv(env);
        await writeTemplateFile(path.resolve(opts.output), template);
        console.log(`Template written to ${opts.output} (${template.variables.length} variables)`);
      } catch (err: any) {
        console.error('Error generating template:', err.message);
        process.exit(1);
      }
    });

  tmpl
    .command('validate')
    .description('Validate a .env file against a .env.template')
    .option('-e, --env <file>', '.env file to validate', '.env')
    .option('-t, --template <file>', 'Template file', DEFAULT_TEMPLATE)
    .action(async (opts) => {
      try {
        const env = await readEnvFile(path.resolve(opts.env));
        const template = await readTemplateFile(path.resolve(opts.template));
        const missing = validateAgainstTemplate(env, template);
        if (missing.length === 0) {
          console.log('✔ All required variables are present.');
        } else {
          console.error(`✘ Missing required variables:\n  ${missing.join('\n  ')}`);
          process.exit(1);
        }
      } catch (err: any) {
        console.error('Error validating env:', err.message);
        process.exit(1);
      }
    });

  tmpl
    .command('show')
    .description('Print the parsed template as formatted text')
    .option('-t, --template <file>', 'Template file', DEFAULT_TEMPLATE)
    .action(async (opts) => {
      try {
        const template = await readTemplateFile(path.resolve(opts.template));
        console.log(serialiseTemplate(template));
      } catch (err: any) {
        console.error('Error reading template:', err.message);
        process.exit(1);
      }
    });
}
