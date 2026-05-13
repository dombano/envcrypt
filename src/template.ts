import * as fs from 'fs/promises';
import * as path from 'path';
import { EnvMap } from './env';

export interface TemplateVariable {
  key: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  example?: string;
}

export interface EnvTemplate {
  variables: TemplateVariable[];
}

/**
 * Parse a .env.template file into a structured template object.
 * Lines starting with # before a KEY= are treated as metadata.
 */
export function parseTemplate(content: string): EnvTemplate {
  const lines = content.split('\n');
  const variables: TemplateVariable[] = [];
  let pendingDescription: string | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('#')) {
      pendingDescription = line.slice(1).trim() || undefined;
      continue;
    }
    if (line === '') {
      pendingDescription = undefined;
      continue;
    }
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const rest = line.slice(eqIndex + 1).trim();
    const required = rest === '' || rest.startsWith('<');
    const defaultValue = !required && !rest.startsWith('<') ? rest : undefined;
    const example = rest.startsWith('<') ? rest.slice(1, rest.length - 1) : undefined;
    variables.push({ key, description: pendingDescription, required, defaultValue, example });
    pendingDescription = undefined;
  }
  return { variables };
}

/** Generate a .env.template string from a list of template variables. */
export function serialiseTemplate(template: EnvTemplate): string {
  return template.variables
    .map(({ key, description, required, defaultValue, example }) => {
      const lines: string[] = [];
      if (description) lines.push(`# ${description}`);
      const value = required ? (example ? `<${example}>` : '') : (defaultValue ?? '');
      lines.push(`${key}=${value}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

/** Validate an EnvMap against a template, returning missing required keys. */
export function validateAgainstTemplate(env: EnvMap, template: EnvTemplate): string[] {
  return template.variables
    .filter(v => v.required && (env[v.key] === undefined || env[v.key] === ''))
    .map(v => v.key);
}

/** Generate a template from an existing EnvMap (all keys required, no defaults). */
export function templateFromEnv(env: EnvMap): EnvTemplate {
  return { variables: Object.keys(env).map(key => ({ key, required: true })) };
}

export async function readTemplateFile(filePath: string): Promise<EnvTemplate> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseTemplate(content);
}

export async function writeTemplateFile(filePath: string, template: EnvTemplate): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, serialiseTemplate(template), 'utf-8');
}
