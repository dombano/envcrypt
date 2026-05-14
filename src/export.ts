import { readEnvFile } from './env';
import { loadRecipients } from './recipients';
import { loadConfig } from './config';
import * as fs from 'fs/promises';
import * as path from 'path';

export type ExportFormat = 'json' | 'yaml' | 'shell';

export function formatAsJson(env: Record<string, string>): string {
  return JSON.stringify(env, null, 2);
}

export function formatAsYaml(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

export function formatAsShell(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `export ${key}=${JSON.stringify(value)}`)
    .join('\n');
}

export function exportEnv(
  env: Record<string, string>,
  format: ExportFormat
): string {
  switch (format) {
    case 'json':
      return formatAsJson(env);
    case 'yaml':
      return formatAsYaml(env);
    case 'shell':
      return formatAsShell(env);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export async function exportEnvFile(
  envPath: string,
  format: ExportFormat,
  outputPath?: string
): Promise<string> {
  const env = await readEnvFile(envPath);
  const output = exportEnv(env, format);

  if (outputPath) {
    await fs.writeFile(outputPath, output, 'utf8');
  }

  return output;
}
