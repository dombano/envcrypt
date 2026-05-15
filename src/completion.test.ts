import { Command } from 'commander';
import { generateBashCompletion, generateZshCompletion, extractCommandNames } from './completion';

const COMMANDS = ['encrypt', 'decrypt', 'share', 'rotate', 'audit', 'diff', 'merge'];

describe('generateBashCompletion', () => {
  it('includes the program name in the script', () => {
    const script = generateBashCompletion('envcrypt', COMMANDS);
    expect(script).toContain('_envcrypt_completions');
    expect(script).toContain('complete -F _envcrypt_completions envcrypt');
  });

  it('includes all commands in the completion word list', () => {
    const script = generateBashCompletion('envcrypt', COMMANDS);
    for (const cmd of COMMANDS) {
      expect(script).toContain(cmd);
    }
  });

  it('includes file completion for encrypt and decrypt', () => {
    const script = generateBashCompletion('envcrypt', COMMANDS);
    expect(script).toContain('compgen -f');
  });

  it('includes format options', () => {
    const script = generateBashCompletion('envcrypt', COMMANDS);
    expect(script).toContain('json yaml shell');
  });
});

describe('generateZshCompletion', () => {
  it('includes compdef directive for the program', () => {
    const script = generateZshCompletion('envcrypt', COMMANDS);
    expect(script).toContain('#compdef envcrypt');
  });

  it('lists all commands in zsh format', () => {
    const script = generateZshCompletion('envcrypt', COMMANDS);
    for (const cmd of COMMANDS) {
      expect(script).toContain(`'${cmd}:`);
    }
  });

  it('returns a non-empty string', () => {
    const script = generateZshCompletion('envcrypt', []);
    expect(script.length).toBeGreaterThan(0);
  });
});

describe('extractCommandNames', () => {
  it('returns names of all registered subcommands', () => {
    const program = new Command();
    program.command('encrypt').description('Encrypt a file');
    program.command('decrypt').description('Decrypt a file');
    program.command('share').description('Share a file');

    const names = extractCommandNames(program);
    expect(names).toEqual(['encrypt', 'decrypt', 'share']);
  });

  it('returns empty array for program with no commands', () => {
    const program = new Command();
    expect(extractCommandNames(program)).toEqual([]);
  });
});
