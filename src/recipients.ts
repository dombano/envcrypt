import * as fs from 'fs';
import * as path from 'path';

export interface Recipient {
  name: string;
  publicKey: string;
}

const RECIPIENTS_FILE = '.envcrypt/recipients.json';

export function resolveRecipientsPath(baseDir: string = process.cwd()): string {
  return path.join(baseDir, RECIPIENTS_FILE);
}

export function loadRecipients(baseDir: string = process.cwd()): Recipient[] {
  const filePath = resolveRecipientsPath(baseDir);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Recipients file must contain a JSON array');
    }
    return parsed as Recipient[];
  } catch (err) {
    throw new Error(`Failed to parse recipients file: ${(err as Error).message}`);
  }
}

export function saveRecipients(recipients: Recipient[], baseDir: string = process.cwd()): void {
  const filePath = resolveRecipientsPath(baseDir);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(recipients, null, 2), 'utf-8');
}

export function addRecipient(name: string, publicKey: string, baseDir: string = process.cwd()): void {
  const recipients = loadRecipients(baseDir);
  const existing = recipients.find((r) => r.name === name);
  if (existing) {
    throw new Error(`Recipient "${name}" already exists`);
  }
  recipients.push({ name, publicKey });
  saveRecipients(recipients, baseDir);
}

export function removeRecipient(name: string, baseDir: string = process.cwd()): void {
  const recipients = loadRecipients(baseDir);
  const index = recipients.findIndex((r) => r.name === name);
  if (index === -1) {
    throw new Error(`Recipient "${name}" not found`);
  }
  recipients.splice(index, 1);
  saveRecipients(recipients, baseDir);
}

export function getRecipient(name: string, baseDir: string = process.cwd()): Recipient {
  const recipients = loadRecipients(baseDir);
  const recipient = recipients.find((r) => r.name === name);
  if (!recipient) {
    throw new Error(`Recipient "${name}" not found`);
  }
  return recipient;
}
