import { EnvMap } from './env';

export interface SearchOptions {
  caseSensitive?: boolean;
  keysOnly?: boolean;
  valuesOnly?: boolean;
  regex?: boolean;
}

export interface SearchResult {
  key: string;
  value: string;
  matchedOn: 'key' | 'value' | 'both';
}

export function searchEnv(
  env: EnvMap,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { caseSensitive = false, keysOnly = false, valuesOnly = false, regex = false } = options;

  const results: SearchResult[] = [];

  let matcher: (text: string) => boolean;

  if (regex) {
    const flags = caseSensitive ? '' : 'i';
    const re = new RegExp(query, flags);
    matcher = (text) => re.test(text);
  } else {
    const needle = caseSensitive ? query : query.toLowerCase();
    matcher = (text) => (caseSensitive ? text : text.toLowerCase()).includes(needle);
  }

  for (const [key, value] of Object.entries(env)) {
    const keyMatch = !valuesOnly && matcher(key);
    const valueMatch = !keysOnly && matcher(value);

    if (keyMatch || valueMatch) {
      results.push({
        key,
        value,
        matchedOn: keyMatch && valueMatch ? 'both' : keyMatch ? 'key' : 'value',
      });
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No matches found.';
  }

  return results
    .map((r) => {
      const tag = r.matchedOn !== 'both' ? ` [${r.matchedOn}]` : '';
      return `${r.key}=${r.value}${tag}`;
    })
    .join('\n');
}
