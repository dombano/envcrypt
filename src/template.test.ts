import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  parseTemplate,
  serialiseTemplate,
  validateAgainstTemplate,
  templateFromEnv,
  readTemplateFile,
  writeTemplateFile,
} from './template';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envcrypt-template-'));
}

describe('parseTemplate', () => {
  it('parses required keys with no default', () => {
    const result = parseTemplate('API_KEY=\nDB_URL=');
    expect(result.variables).toHaveLength(2);
    expect(result.variables[0]).toMatchObject({ key: 'API_KEY', required: true });
  });

  it('parses optional keys with defaults', () => {
    const result = parseTemplate('PORT=3000');
    expect(result.variables[0]).toMatchObject({ key: 'PORT', required: false, defaultValue: '3000' });
  });

  it('parses example placeholder values', () => {
    const result = parseTemplate('SECRET=<your-secret-here>');
    expect(result.variables[0]).toMatchObject({ key: 'SECRET', required: true, example: 'your-secret-here' });
  });

  it('captures inline descriptions from preceding comments', () => {
    const result = parseTemplate('# The API key\nAPI_KEY=');
    expect(result.variables[0].description).toBe('The API key');
  });

  it('resets description after blank line', () => {
    const result = parseTemplate('# Desc\n\nKEY=');
    expect(result.variables[0].description).toBeUndefined();
  });
});

describe('serialiseTemplate', () => {
  it('round-trips a template', () => {
    const original = '# Database URL\nDB_URL=\n\nPORT=3000';
    const parsed = parseTemplate(original);
    const out = serialiseTemplate(parsed);
    expect(out).toContain('DB_URL=');
    expect(out).toContain('PORT=3000');
    expect(out).toContain('# Database URL');
  });
});

describe('validateAgainstTemplate', () => {
  it('returns missing required keys', () => {
    const template = parseTemplate('API_KEY=\nPORT=3000');
    const missing = validateAgainstTemplate({ PORT: '8080' }, template);
    expect(missing).toEqual(['API_KEY']);
  });

  it('returns empty array when all required keys present', () => {
    const template = parseTemplate('API_KEY=');
    const missing = validateAgainstTemplate({ API_KEY: 'abc' }, template);
    expect(missing).toHaveLength(0);
  });
});

describe('templateFromEnv', () => {
  it('creates required variables from all env keys', () => {
    const t = templateFromEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(t.variables.map(v => v.key)).toEqual(['FOO', 'BAZ']);
    expect(t.variables.every(v => v.required)).toBe(true);
  });
});

describe('readTemplateFile / writeTemplateFile', () => {
  it('writes and reads back a template file', async () => {
    const dir = await makeTempDir();
    const filePath = path.join(dir, '.env.template');
    const template = parseTemplate('# My key\nMY_KEY=');
    await writeTemplateFile(filePath, template);
    const loaded = await readTemplateFile(filePath);
    expect(loaded.variables[0].key).toBe('MY_KEY');
    expect(loaded.variables[0].description).toBe('My key');
  });
});
