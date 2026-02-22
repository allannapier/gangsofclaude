/**
 * Simplified game protocol types
 */

export type BusinessType = 
  | 'none'
  | 'protection'
  | 'numbers'
  | 'speakeasy'
  | 'brothel'
  | 'casino'
  | 'smuggling';

export interface Territory {
  id: string;
  name: string;
  owner: string | null;
  muscle: number;
  business: BusinessType;
}

export interface FamilyState {
  id: string;
  name: string;
  wealth: number;
  totalMuscle: number;
  personality: 'aggressive' | 'business' | 'cunning' | 'defensive';
  lastAttackedBy: string | null;
}

export interface DiplomacyMessage {
  from: string;
  to: string;
  type: 'partnership' | 'coordinate_attack' | 'war' | 'intel';
  targetFamily?: string;
  turn: number;
  status?: 'pending' | 'accepted' | 'rejected';
  respondedTurn?: number;
}

export interface GameEvent {
  turn: number;
  actor: string;
  action: string;
  details: string;
  result?: string;
}

// ── City Events ──

export type CityEventType = 
  | 'police_crackdown'
  | 'black_market'
  | 'turf_war'
  | 'rat_in_ranks'
  | 'press_scandal'
  | 'windfall';

export interface ActiveEffect {
  id: string;
  type: CityEventType;
  targetFamily?: string;
  targetTerritory?: string;
  turnsRemaining: number;
  description: string;
}

export interface IntelReport {
  targetFamily: string;
  wealth: number;
  territories: { id: string; name: string; muscle: number; business: BusinessType }[];
  gatheredTurn: number;
  expiresTurn: number;
}

export interface Fortification {
  territoryId: string;
  bonusDefense: number;
  expiresTurn: number;
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
  activeEffects: ActiveEffect[];
  intel: IntelReport[];
  fortifications: Fortification[];
}

// WebSocket messages server → browser
export type ServerMessage =
  | { type: 'state_update'; state: SaveState }
  | { type: 'turn_start'; turn: number }
  | { type: 'turn_event'; event: GameEvent }
  | { type: 'turn_complete'; turn: number; winner: string | null };

