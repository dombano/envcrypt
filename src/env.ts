import * as fs from 'fs';
import * as path from 'path';

export interface EnvMap {
  [key: string]: string;
}

/**
 * Parses the contents of a .env file into a key-value map.
 */
export function parseEnv(content: string): EnvMap {
  const result: EnvMap = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialises a key-value map back into .env file format.
 */
export function serialiseEnv(env: EnvMap): string {
  return Object.entries(env)
    .map(([key, value]) => {
      // Quote values that contain spaces or special characters
      const needsQuoting = /[\s#"'\\]/.test(value);
      const serialisedValue = needsQuoting ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}=${serialisedValue}`;
    })
    .join('\n');
}

/**
 * Reads and parses a .env file from disk.
 */
export function readEnvFile(filePath: string): EnvMap {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  return parseEnv(content);
}

/**
 * Writes an EnvMap to disk in .env format.
 */
export function writeEnvFile(filePath: string, env: EnvMap): void {
  const resolved = path.resolve(filePath);
  fs.writeFileSync(resolved, serialiseEnv(env), 'utf-8');
}
