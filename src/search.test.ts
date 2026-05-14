import { searchEnv, formatSearchResults } from './search';
import { EnvMap } from './env';

const sampleEnv: EnvMap = {
  DATABASE_URL: 'postgres://localhost:5432/mydb',
  REDIS_URL: 'redis://localhost:6379',
  API_KEY: 'secret-api-key-123',
  DEBUG: 'true',
  APP_NAME: 'myapp',
};

describe('searchEnv', () => {
  it('finds matches in keys by default', () => {
    const results = searchEnv(sampleEnv, 'URL');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('REDIS_URL');
  });

  it('finds matches in values by default', () => {
    const results = searchEnv(sampleEnv, 'localhost');
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.matchedOn === 'value')).toBe(true);
  });

  it('marks matchedOn as both when key and value match', () => {
    const env: EnvMap = { myapp: 'myapp-value' };
    const results = searchEnv(env, 'myapp');
    expect(results[0].matchedOn).toBe('both');
  });

  it('respects keysOnly option', () => {
    const results = searchEnv(sampleEnv, 'localhost', { keysOnly: true });
    expect(results).toHaveLength(0);
  });

  it('respects valuesOnly option', () => {
    const results = searchEnv(sampleEnv, 'URL', { valuesOnly: true });
    expect(results).toHaveLength(0);
  });

  it('is case-insensitive by default', () => {
    const results = searchEnv(sampleEnv, 'api_key');
    expect(results).toHaveLength(1);
  });

  it('respects caseSensitive option', () => {
    const results = searchEnv(sampleEnv, 'api_key', { caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('supports regex queries', () => {
    const results = searchEnv(sampleEnv, '^(DATABASE|REDIS)_URL$', { regex: true });
    expect(results).toHaveLength(2);
  });

  it('returns empty array when no matches', () => {
    const results = searchEnv(sampleEnv, 'NONEXISTENT');
    expect(results).toHaveLength(0);
  });
});

describe('formatSearchResults', () => {
  it('returns no matches message for empty results', () => {
    expect(formatSearchResults([])).toBe('No matches found.');
  });

  it('formats results with key match tag', () => {
    const results = searchEnv(sampleEnv, 'DEBUG', { valuesOnly: false, keysOnly: true });
    const output = formatSearchResults(results);
    expect(output).toContain('DEBUG=true [key]');
  });

  it('formats results without tag when both matched', () => {
    const env: EnvMap = { myapp: 'myapp' };
    const results = searchEnv(env, 'myapp');
    const output = formatSearchResults(results);
    expect(output).toBe('myapp=myapp');
  });
});
