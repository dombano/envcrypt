import { Command } from 'commander';
import { addProfile, getActiveProfile, loadProfiles, removeProfile, switchProfile } from './profile';

export function registerProfileCommands(program: Command): void {
  const profile = program
    .command('profile')
    .description('Manage environment profiles');

  profile
    .command('add <name>')
    .description('Add a new profile')
    .option('--env <file>', 'Path to .env file', '.env')
    .option('--enc <file>', 'Path to encrypted file', '.env.enc')
    .action((name: string, opts: { env: string; enc: string }) => {
      addProfile(name, { name, envFile: opts.env, encryptedFile: opts.enc });
      console.log(`Profile "${name}" added.`);
    });

  profile
    .command('remove <name>')
    .description('Remove a profile')
    .action((name: string) => {
      removeProfile(name);
      console.log(`Profile "${name}" removed.`);
    });

  profile
    .command('switch <name>')
    .description('Switch the active profile')
    .action((name: string) => {
      switchProfile(name);
      console.log(`Switched to profile "${name}".`);
    });

  profile
    .command('list')
    .description('List all profiles')
    .action(() => {
      const config = loadProfiles();
      const names = Object.keys(config.profiles);
      if (names.length === 0) {
        console.log('No profiles configured.');
        return;
      }
      names.forEach((name) => {
        const marker = name === config.active ? '*' : ' ';
        const p = config.profiles[name];
        console.log(`${marker} ${name}  (env: ${p.envFile}, enc: ${p.encryptedFile})`);
      });
    });

  profile
    .command('current')
    .description('Show the active profile')
    .action(() => {
      const p = getActiveProfile();
      if (!p) {
        console.log('No active profile.');
      } else {
        console.log(`Active profile: ${p.name}  (env: ${p.envFile}, enc: ${p.encryptedFile})`);
      }
    });
}
