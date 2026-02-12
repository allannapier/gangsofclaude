/**
 * Game State Action Logger
 *
 * This module provides a function to log character actions to save.json.
 * Both player actions and AI character actions are logged this way.
 *
 * Usage from any agent:
 *   logAction({
 *     turn: 5,
 *     actor: "Vito Marinelli",
 *     action: "attack",
 *     target: "Rossetti Family",
 *     description: "Vito ordered a hit on Rossetti's warehouse"
 *   })
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saveJsonPath = join(__dirname, 'save.json');

export interface ActionLog {
  turn: number;
  type: 'action' | 'message' | 'event';
  actor: string;
  action: string;
  target?: string;
  description?: string;
  timestamp?: number;
}

/**
 * Log an action to save.json events array
 */
export function logAction(action: ActionLog): void {
  try {
    let saveData: any = { events: [] };

    if (existsSync(saveJsonPath)) {
      const content = readFileSync(saveJsonPath, 'utf-8');
      if (content.trim()) {
        saveData = JSON.parse(content);
      }
    }

    if (!saveData.events) {
      saveData.events = [];
    }

    // Add the action
    saveData.events.push({
      turn: action.turn,
      type: action.type || 'action',
      actor: action.actor,
      action: action.action,
      target: action.target,
      description: action.description,
      timestamp: Date.now(),
    });

    writeFileSync(saveJsonPath, JSON.stringify(saveData, null, 2));
    console.log(`✅ Action logged: ${action.actor} - ${action.action}`);
  } catch (e) {
    console.error('❌ Failed to log action:', e);
  }
}

// CLI usage: bun run log-action.ts '{"turn":1,"actor":"Vito","action":"attack"}'
if (process.argv[2]) {
  try {
    const action = JSON.parse(process.argv[2]);
    logAction(action);
  } catch (e) {
    console.error('Invalid JSON argument:', e);
    process.exit(1);
  }
}
