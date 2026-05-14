import { importFromJson, importFromYaml, importFromShell, importEnv } from './import';

describe('importFromJson', () => {
  it('parses a flat JSON object into an EnvMap', () => {
    const json = JSON.stringify({ API_KEY: 'abc123', PORT: '3000' });
    expect(importFromJson(json)).toEqual({ API_KEY: 'abc123', PORT: '3000' });
  });

  it('throws if root is not a plain object', () => {
    expect(() => importFromJson('["a","b"]')).toThrow('plain object');
  });

  it('throws if a value is not a string', () => {
    const json = JSON.stringify({ PORT: 3000 });
    expect(() => importFromJson(json)).toThrow('must be a string');
  });
});

describe('importFromYaml', () => {
  it('parses a YAML mapping into an EnvMap', () => {
    const yaml = 'API_KEY: abc123\nPORT: "3000"\n';
    expect(importFromYaml(yaml)).toEqual({ API_KEY: 'abc123', PORT: '3000' });
  });

  it('throws if YAML root is a list', () => {
    expect(() => importFromYaml('- a\n- b\n')).toThrow('plain mapping');
  });

  it('throws if a value is not a string', () => {
    const yaml = 'PORT: 3000\n';
    expect(() => importFromYaml(yaml)).toThrow('must be a string');
  });
});

describe('importFromShell', () => {
  it('parses export statements', () => {
    const shell = 'export API_KEY=abc123\nexport PORT=3000\n';
    expect(importFromShell(shell)).toEqual({ API_KEY: 'abc123', PORT: '3000' });
  });

  it('parses bare KEY=VALUE lines', () => {
    const shell = 'API_KEY=abc123\nPORT=3000\n';
    expect(importFromShell(shell)).toEqual({ API_KEY: 'abc123', PORT: '3000' });
  });

  it('strips surrounding quotes from values', () => {
    const shell = 'API_KEY="abc123"\nNAME=\'hello world\'\n';
    expect(importFromShell(shell)).toEqual({ API_KEY: 'abc123', NAME: 'hello world' });
  });

  it('ignores comments and blank lines', () => {
    const shell = '# comment\n\nAPI_KEY=abc123\n';
    expect(importFromShell(shell)).toEqual({ API_KEY: 'abc123' });
  });
});

describe('importEnv', () => {
  it('dispatches to the correct parser based on format', () => {
    const json = JSON.stringify({ FOO: 'bar' });
    expect(importEnv(json, 'json')).toEqual({ FOO: 'bar' });

    const yaml = 'FOO: bar\n';
    expect(importEnv(yaml, 'yaml')).toEqual({ FOO: 'bar' });

    const shell = 'FOO=bar\n';
    expect(importEnv(shell, 'shell')).toEqual({ FOO: 'bar' });
  });
});
