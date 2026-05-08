import * as fs from 'fs';
import * as path from 'path';

export interface EnvcryptConfig {
  keysDir: string;
  recipientsFile: string;
  auditLog: string;
  defaultEnvFile: string;
  encryptedEnvFile: string;
}

const DEFAULT_CONFIG: EnvcryptConfig = {
  keysDir: '.envcrypt/keys',
  recipientsFile: '.envcrypt/recipients.json',
  auditLog: '.envcrypt/audit.log',
  defaultEnvFile: '.env',
  encryptedEnvFile: '.env.enc',
};

const CONFIG_FILE = '.envcryptrc.json';

export function resolveConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILE);
}

export function loadConfig(cwd: string = process.cwd()): EnvcryptConfig {
  const configPath = resolveConfigPath(cwd);
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const partial = JSON.parse(raw) as Partial<EnvcryptConfig>;
    return { ...DEFAULT_CONFIG, ...partial };
  } catch {
    throw new Error(`Failed to parse config file at ${configPath}`);
  }
}

export function saveConfig(config: Partial<EnvcryptConfig>, cwd: string = process.cwd()): void {
  const configPath = resolveConfigPath(cwd);
  const existing = loadConfig(cwd);
  const merged = { ...existing, ...config };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
}

export function configExists(cwd: string = process.cwd()): boolean {
  return fs.existsSync(resolveConfigPath(cwd));
}
