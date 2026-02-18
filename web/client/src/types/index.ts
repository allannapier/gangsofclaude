// ── Game Types ──

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

export interface SaveState {
  turn: number;
  phase: 'setup' | 'playing' | 'ended';
  playerFamily: string | null;
  playerActed: boolean;
  playerMessaged: boolean;
  winner: string | null;
  families: Record<string, FamilyState>;
  territories: Territory[];
  diplomacy: DiplomacyMessage[];
  events: GameEvent[];
}

export type ActionType = 'hire' | 'attack' | 'business' | 'move' | 'message';

export type DiplomacyType = 'partnership' | 'coordinate_attack' | 'war' | 'intel';

export const FAMILY_COLORS: Record<string, string> = {
  marinelli: '#dc2626',
  rossetti: '#ca8a04',
  falcone: '#7c3aed',
  moretti: '#16a34a',
};

export const FAMILY_DESCRIPTIONS: Record<string, { tagline: string; personality: string }> = {
  marinelli: { tagline: 'Blood & Iron', personality: 'Aggressive — prioritizes attacks and territorial expansion' },
  rossetti: { tagline: 'Money Talks', personality: 'Business — prioritizes business upgrades and wealth accumulation' },
  falcone: { tagline: 'Silent Knives', personality: 'Cunning — exploits weakness, balanced strategy' },
  moretti: { tagline: 'Honor Bound', personality: 'Defensive — builds strength, retaliates when attacked' },
};

export const BUSINESS_DEFINITIONS: Record<BusinessType, { name: string; cost: number; income: number; description: string; upgradesFrom: BusinessType[] }> = {
  none: { name: 'Unclaimed', cost: 0, income: 0, description: 'No operations', upgradesFrom: [] },
  protection: { name: 'Protection Racket', cost: 150, income: 100, description: 'Basic street-level shakedowns', upgradesFrom: ['none'] },
  numbers: { name: 'Numbers Racket', cost: 250, income: 150, description: 'Illegal lottery operations', upgradesFrom: ['protection'] },
  speakeasy: { name: 'Speakeasy', cost: 400, income: 225, description: 'Underground drinking establishment', upgradesFrom: ['protection', 'numbers'] },
  brothel: { name: 'Brothel', cost: 600, income: 340, description: 'House of ill repute', upgradesFrom: ['numbers', 'speakeasy'] },
  casino: { name: 'Casino', cost: 1000, income: 500, description: 'High-stakes gambling den', upgradesFrom: ['speakeasy', 'brothel'] },
  smuggling: { name: 'Smuggling Operation', cost: 1500, income: 750, description: 'International contraband trade', upgradesFrom: ['casino', 'brothel'] },
};

export const DIPLOMACY_LABELS: Record<DiplomacyType, string> = {
  partnership: "Let's make a partnership and have peace",
  coordinate_attack: "Let's coordinate an attack on a family next round",
  war: 'Our partnership is dead, time for war',
  intel: 'We have intel a family is planning to hit you',
};
