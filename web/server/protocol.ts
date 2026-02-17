/**
 * Simplified game protocol types
 */

export interface Territory {
  id: string;
  name: string;
  owner: string | null;
  muscle: number;
  level: number;
}

export interface FamilyState {
  id: string;
  name: string;
  wealth: number;
  totalMuscle: number;
  personality: 'aggressive' | 'business' | 'cunning' | 'defensive';
}

export interface DiplomacyMessage {
  from: string;
  to: string;
  type: 'partnership' | 'coordinate_attack' | 'war' | 'intel';
  targetFamily?: string;
  turn: number;
}

export interface GameEvent {
  turn: number;
  actor: string;
  action: string;
  details: string;
  result?: string;
}

export interface SaveState {
  turn: number;
  phase: 'setup' | 'playing' | 'ended';
  playerFamily: string | null;
  winner: string | null;
  families: Record<string, FamilyState>;
  territories: Territory[];
  diplomacy: DiplomacyMessage[];
  events: GameEvent[];
}

// WebSocket messages server → browser
export type ServerMessage =
  | { type: 'state_update'; state: SaveState }
  | { type: 'turn_start'; turn: number }
  | { type: 'turn_event'; event: GameEvent }
  | { type: 'turn_complete'; turn: number; winner: string | null };

