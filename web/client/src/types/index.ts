// ── Game Types ──

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
  playerActed: boolean;
  winner: string | null;
  families: Record<string, FamilyState>;
  territories: Territory[];
  diplomacy: DiplomacyMessage[];
  events: GameEvent[];
}

export type ActionType = 'hire' | 'attack' | 'upgrade' | 'move' | 'message';

export type DiplomacyType = 'partnership' | 'coordinate_attack' | 'war' | 'intel';

export const FAMILY_COLORS: Record<string, string> = {
  marinelli: '#dc2626',
  rossetti: '#ca8a04',
  falcone: '#7c3aed',
  moretti: '#16a34a',
};

export const FAMILY_DESCRIPTIONS: Record<string, { tagline: string; personality: string }> = {
  marinelli: { tagline: 'Blood & Iron', personality: 'Aggressive — prioritizes attacks and territorial expansion' },
  rossetti: { tagline: 'Money Talks', personality: 'Business — prioritizes upgrades and wealth accumulation' },
  falcone: { tagline: 'Silent Knives', personality: 'Cunning — exploits weakness, balanced strategy' },
  moretti: { tagline: 'Honor Bound', personality: 'Defensive — builds strength, retaliates when attacked' },
};

export const DIPLOMACY_LABELS: Record<DiplomacyType, string> = {
  partnership: "Let's make a partnership and have peace",
  coordinate_attack: "Let's coordinate an attack on a family next round",
  war: 'Our partnership is dead, time for war',
  intel: 'We have intel a family is planning to hit you',
};
