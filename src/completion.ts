import { Command } from 'commander';

/**
 * Generates bash completion script for envcrypt CLI.
 */
export function generateBashCompletion(programName: string, commands: string[]): string {
  const cmdList = commands.join(' ');
  return `# Bash completion for ${programName}
_${programName}_completions() {
  local cur prev words cword
  _init_completion || return

  local commands="${cmdList}"

  if [[ $cword -eq 1 ]]; then
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    return 0
  fi

  case "$prev" in
    encrypt|decrypt|share)
      COMPREPLY=($(compgen -f -- "$cur"))
      return 0
      ;;
    --profile)
      COMPREPLY=($(compgen -W "default development staging production" -- "$cur"))
      return 0
      ;;
    --format)
      COMPREPLY=($(compgen -W "json yaml shell" -- "$cur"))
      return 0
      ;;
  esac

  COMPREPLY=($(compgen -W "$commands" -- "$cur"))
}
complete -F _${programName}_completions ${programName}
`;
}

/**
 * Generates zsh completion script for envcrypt CLI.
 */
export function generateZshCompletion(programName: string, commands: string[]): string {
  const compdefLines = commands
    .map(cmd => `  '${cmd}:${cmd} command'`)
    .join('\n');
  return `#compdef ${programName}
_${programName}() {
  local -a commands
  commands=(
${compdefLines}
  )
  _describe '${programName} commands' commands
}
_${programName}
`;
}

/**
 * Extracts command names from a Commander program.
 */
export function extractCommandNames(program: Command): string[] {
  return program.commands.map(cmd => cmd.name());
}
