import * as fs from 'fs';
import * as path from 'path';
import { generateKeyPair } from './crypto';

export const DEFAULT_PUBLIC_KEY_FILE = 'envcrypt.pub';
export const DEFAULT_PRIVATE_KEY_FILE = 'envcrypt.key';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function saveKeyPair(
  keyPair: KeyPair,
  dir: string = process.cwd(),
  publicKeyFile: string = DEFAULT_PUBLIC_KEY_FILE,
  privateKeyFile: string = DEFAULT_PRIVATE_KEY_FILE
): void {
  const pubPath = path.join(dir, publicKeyFile);
  const privPath = path.join(dir, privateKeyFile);
  fs.writeFileSync(pubPath, keyPair.publicKey, 'utf8');
  fs.writeFileSync(privPath, keyPair.privateKey, { encoding: 'utf8', mode: 0o600 });
}

export function loadPublicKey(
  dir: string = process.cwd(),
  publicKeyFile: string = DEFAULT_PUBLIC_KEY_FILE
): string {
  const pubPath = path.join(dir, publicKeyFile);
  if (!fs.existsSync(pubPath)) {
    throw new Error(`Public key file not found: ${pubPath}`);
  }
  return fs.readFileSync(pubPath, 'utf8').trim();
}

export function loadPrivateKey(
  dir: string = process.cwd(),
  privateKeyFile: string = DEFAULT_PRIVATE_KEY_FILE
): string {
  const privPath = path.join(dir, privateKeyFile);
  if (!fs.existsSync(privPath)) {
    throw new Error(`Private key file not found: ${privPath}`);
  }
  return fs.readFileSync(privPath, 'utf8').trim();
}

export function initKeys(dir: string = process.cwd()): KeyPair {
  const keyPair = generateKeyPair();
  saveKeyPair(keyPair, dir);
  return keyPair;
}

export function keysExist(
  dir: string = process.cwd(),
  publicKeyFile: string = DEFAULT_PUBLIC_KEY_FILE,
  privateKeyFile: string = DEFAULT_PRIVATE_KEY_FILE
): boolean {
  return (
    fs.existsSync(path.join(dir, publicKeyFile)) &&
    fs.existsSync(path.join(dir, privateKeyFile))
  );
}
