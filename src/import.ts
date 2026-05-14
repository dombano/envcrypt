import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { EnvMap } from './env';

export type ImportFormat = 'json' | 'yaml' | 'shell';

function detectFormat(filePath: string): ImportFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  if (ext === '.sh') return 'shell';
  throw new Error(`Cannot detect format for extension "${ext}". Use --format to specify.`);
}

export function importFromJson(content: string): EnvMap {
  const parsed = JSON.parse(content);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON input must be a plain object of key-value pairs.');
  }
  const result: EnvMap = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`Value for key "${key}" must be a string, got ${typeof value}.`);
    }
    result[key] = value;
  }
  return result;
}

export function importFromYaml(content: string): EnvMap {
  const parsed = yaml.load(content);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('YAML input must be a plain mapping of key-value pairs.');
  }
  const result: EnvMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      throw new Error(`Value for key "${key}" must be a string, got ${typeof value}.`);
    }
    result[key] = value;
  }
  return result;
}

export function importFromShell(content: string): EnvMap {
  const result: EnvMap = {};
  const lines = content.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const exportLine = line.startsWith('export ') ? line.slice(7) : line;
    const eqIdx = exportLine.indexOf('=');
    if (eqIdx === -1) continue;
    const key = exportLine.slice(0, eqIdx).trim();
    let value = exportLine.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function importEnv(content: string, format: ImportFormat): EnvMap {
  switch (format) {
    case 'json': return importFromJson(content);
    case 'yaml': return importFromYaml(content);
    case 'shell': return importFromShell(content);
  }
}

export function importEnvFile(filePath: string, format?: ImportFormat): EnvMap {
  const resolved = format ?? detectFormat(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  return importEnv(content, resolved);
}
