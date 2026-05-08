import { Command } from 'commander';
import { loadConfig, saveConfig, configExists } from './config';

export function registerConfigCommands(program: Command): void {
  const config = program
    .command('config')
    .description('Manage envcrypt configuration');

  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const cfg = loadConfig();
      console.log(JSON.stringify(cfg, null, 2));
    });

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const allowed = ['keysDir', 'recipientsFile', 'auditLog', 'defaultEnvFile', 'encryptedEnvFile'];
      if (!allowed.includes(key)) {
        console.error(`Unknown config key: ${key}. Allowed keys: ${allowed.join(', ')}`);
        process.exit(1);
      }
      saveConfig({ [key]: value });
      console.log(`Set ${key} = ${value}`);
    });

  config
    .command('init')
    .description('Create a default configuration file')
    .option('--force', 'Overwrite existing config', false)
    .action((opts: { force: boolean }) => {
      if (configExists() && !opts.force) {
        console.error('Config file already exists. Use --force to overwrite.');
        process.exit(1);
      }
      saveConfig({});
      console.log('Created .envcryptrc.json with default configuration.');
    });
}
