/**
 * PIN-based access control for Gangs of Claude.
 * Stores a bcrypt-hashed 6-digit PIN at ~/.gangs-of-claude/access.json
 * Session tokens are held in memory and expire when the server restarts.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.gangs-of-claude');
const ACCESS_FILE = join(CONFIG_DIR, 'access.json');

interface AccessConfig {
  pinHash: string;
}

// Active session tokens (in-memory, cleared on server restart)
const activeSessions = new Set<string>();

function readConfig(): AccessConfig | null {
  try {
    if (!existsSync(ACCESS_FILE)) return null;
    return JSON.parse(readFileSync(ACCESS_FILE, 'utf-8')) as AccessConfig;
  } catch {
    return null;
  }
}

function writeConfig(config: AccessConfig) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(ACCESS_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function isPinSet(): boolean {
  return readConfig() !== null;
}

export async function setupPin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (!/^\d{6}$/.test(pin)) return { success: false, error: 'PIN must be exactly 6 digits.' };
  if (isPinSet()) return { success: false, error: 'PIN is already configured.' };
  const pinHash = await Bun.password.hash(pin);
  writeConfig({ pinHash });
  return { success: true };
}

export async function verifyPin(pin: string): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;
  return Bun.password.verify(pin, config.pinHash);
}

export function createSession(): string {
  const token = crypto.randomUUID();
  activeSessions.add(token);
  return token;
}

export function validateSession(token: string | null | undefined): boolean {
  if (!token) return false;
  return activeSessions.has(token);
}
