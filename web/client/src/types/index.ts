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

export interface CityEventDefinition {
  type: CityEventType;
  name: string;
  icon: string;
  weight: number;
  description: string;
}

export const CITY_EVENT_DEFINITIONS: CityEventDefinition[] = [
  { type: 'police_crackdown', name: 'Police Crackdown', icon: '🚔', weight: 20, description: 'The cops raid a territory — income frozen for 2 turns' },
  { type: 'black_market', name: 'Black Market Opportunity', icon: '💰', weight: 15, description: 'A lucrative black market deal appears — $500 bonus to next claimer' },
  { type: 'turf_war', name: 'Turf War Erupts', icon: '🔥', weight: 15, description: 'Street gangs clash — a random territory gains +2 bonus muscle for defense' },
  { type: 'rat_in_ranks', name: 'Rat in the Ranks', icon: '🐀', weight: 20, description: 'A traitor is discovered — the family with the most muscle loses 1 unit' },
  { type: 'press_scandal', name: 'Press Scandal', icon: '📰', weight: 15, description: 'A newspaper exposé hits — a family\'s income is halved for 1 turn' },
  { type: 'windfall', name: 'Windfall', icon: '🎰', weight: 15, description: 'A lucky break — a random family receives $300' },
];

export const CITY_EVENT_CHANCE = 0.30;

// ── Covert Operations ──

export type CovertOpType = 'spy' | 'sabotage' | 'bribe' | 'fortify';

export interface CovertOpDefinition {
  type: CovertOpType;
  name: string;
  icon: string;
  cost: number;
  description: string;
  successRate?: number;
}

export const COVERT_OP_DEFINITIONS: Record<CovertOpType, CovertOpDefinition> = {
  spy: { type: 'spy', name: 'Spy', icon: '🕵️', cost: 200, description: 'Reveal a rival family\'s full muscle distribution and wealth for 3 turns', successRate: 1.0 },
  sabotage: { type: 'sabotage', name: 'Sabotage', icon: '🗡️', cost: 300, description: 'Attempt to downgrade a rival territory\'s business by 1 level (60% success)', successRate: 0.6 },
  bribe: { type: 'bribe', name: 'Bribe', icon: '🐀', cost: 150, description: 'Attempt to steal 1-2 muscle from a rival territory (70% success)', successRate: 0.7 },
  fortify: { type: 'fortify', name: 'Fortify', icon: '🔒', cost: 200, description: 'Add +3 defense bonus to one of your territories for 2 turns', successRate: 1.0 },
};

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
  playerActed: boolean;
  playerMessaged: boolean;
  playerCovertUsed: boolean;
  winner: string | null;
  families: Record<string, FamilyState>;
  territories: Territory[];
  diplomacy: DiplomacyMessage[];
  events: GameEvent[];
  activeEffects: ActiveEffect[];
  intel: IntelReport[];
  fortifications: Fortification[];
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
