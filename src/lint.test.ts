import { lintEnv, formatLintResults, LintRule } from './lint';

describe('lintEnv', () => {
  it('returns no results for a clean env', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', PORT: '3000' };
    expect(lintEnv(env)).toEqual([]);
  });

  it('flags empty values', () => {
    const results = lintEnv({ API_KEY: '' });
    expect(results.some((r) => r.rule === 'no-empty-value')).toBe(true);
  });

  it('flags lowercase keys', () => {
    const results = lintEnv({ api_key: 'secret' });
    expect(results.some((r) => r.rule === 'uppercase-key')).toBe(true);
  });

  it('flags keys with whitespace', () => {
    const results = lintEnv({ 'MY KEY': 'value' });
    expect(results.some((r) => r.rule === 'no-whitespace-key')).toBe(true);
  });

  it('flags values wrapped in double quotes', () => {
    const results = lintEnv({ TOKEN: '"abc123"' });
    expect(results.some((r) => r.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('flags values wrapped in single quotes', () => {
    const results = lintEnv({ TOKEN: "'abc123'" });
    expect(results.some((r) => r.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('flags possible inline comments', () => {
    const results = lintEnv({ HOST: 'localhost #default' });
    expect(results.some((r) => r.rule === 'no-inline-comment')).toBe(true);
  });

  it('respects custom rules', () => {
    const custom: LintRule[] = [
      {
        name: 'no-localhost',
        check: (key, value) =>
          value.includes('localhost') ? `'${key}' uses localhost` : null,
      },
    ];
    const results = lintEnv({ DB: 'localhost:5432' }, custom);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-localhost');
  });

  it('returns multiple issues for multiple keys', () => {
    const env = { bad_key: '', GOOD_KEY: 'ok' };
    const results = lintEnv(env);
    const rules = results.map((r) => r.rule);
    expect(rules).toContain('no-empty-value');
    expect(rules).toContain('uppercase-key');
  });
});

describe('formatLintResults', () => {
  it('returns a friendly message when no issues', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('formats results with rule name and message', () => {
    const results = [{ key: 'FOO', rule: 'no-empty-value', message: "Value for 'FOO' is empty" }];
    const output = formatLintResults(results);
    expect(output).toContain('[no-empty-value]');
    expect(output).toContain("Value for 'FOO' is empty");
  });
});
