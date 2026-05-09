import * as fs from 'fs';
import * as path from 'path';

export interface Profile {
  name: string;
  envFile: string;
  encryptedFile: string;
  recipients?: string[];
}

export interface ProfilesConfig {
  active: string | null;
  profiles: Record<string, Profile>;
}

export function resolveProfilesPath(dir: string = process.cwd()): string {
  return path.join(dir, '.envcrypt', 'profiles.json');
}

export function loadProfiles(dir?: string): ProfilesConfig {
  const filePath = resolveProfilesPath(dir);
  if (!fs.existsSync(filePath)) {
    return { active: null, profiles: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as ProfilesConfig;
}

export function saveProfiles(config: ProfilesConfig, dir?: string): void {
  const filePath = resolveProfilesPath(dir);
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addProfile(name: string, profile: Profile, dir?: string): void {
  const config = loadProfiles(dir);
  config.profiles[name] = profile;
  if (config.active === null) {
    config.active = name;
  }
  saveProfiles(config, dir);
}

export function removeProfile(name: string, dir?: string): void {
  const config = loadProfiles(dir);
  if (!config.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  delete config.profiles[name];
  if (config.active === name) {
    const remaining = Object.keys(config.profiles);
    config.active = remaining.length > 0 ? remaining[0] : null;
  }
  saveProfiles(config, dir);
}

export function switchProfile(name: string, dir?: string): void {
  const config = loadProfiles(dir);
  if (!config.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  config.active = name;
  saveProfiles(config, dir);
}

export function getActiveProfile(dir?: string): Profile | null {
  const config = loadProfiles(dir);
  if (!config.active) return null;
  return config.profiles[config.active] ?? null;
}
