import { EnvData } from './env';

export interface LintRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  key: string;
  rule: string;
  message: string;
}

const builtinRules: LintRule[] = [
  {
    name: 'no-empty-value',
    check: (key, value) =>
      value.trim() === '' ? `Value for '${key}' is empty` : null,
  },
  {
    name: 'no-whitespace-key',
    check: (key) =>
      /\s/.test(key) ? `Key '${key}' contains whitespace` : null,
  },
  {
    name: 'uppercase-key',
    check: (key) =>
      key !== key.toUpperCase()
        ? `Key '${key}' should be uppercase (got '${key}')`
        : null,
  },
  {
    name: 'no-quotes-in-value',
    check: (key, value) =>
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? `Value for '${key}' is wrapped in quotes — remove surrounding quotes`
        : null,
  },
  {
    name: 'no-inline-comment',
    check: (key, value) =>
      value.includes(' #')
        ? `Value for '${key}' may contain an inline comment`
        : null,
  },
];

export function lintEnv(
  env: EnvData,
  rules: LintRule[] = builtinRules
): LintResult[] {
  const results: LintResult[] = [];
  for (const [key, value] of Object.entries(env)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        results.push({ key, rule: rule.name, message });
      }
    }
  }
  return results;
}

export function formatLintResults(results: LintResult[]): string {
  if (results.length === 0) return 'No lint issues found.';
  return results
    .map((r) => `[${r.rule}] ${r.message}`)
    .join('\n');
}
