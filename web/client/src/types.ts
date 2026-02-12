/**
 * Game data types for Gangs of Claude
 */

export type FamilyId = 'marinelli' | 'rossetti' | 'falcone' | 'moretti';

export interface Family {
  id: FamilyId;
  name: string;
  fullName: string;
  color: string;
  description: string;
  territory: string[];
  members: Character[];
  stats: {
    wealth: number;
    territory: number;
    respect: number;
  };
}

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'Don' | 'Underboss' | 'Consigliere' | 'Capo' | 'Soldier' | 'Associate';
  family: FamilyId;
  alive: boolean;
  loyalty: number;
  personality: string;
  traits: string[];
}

export interface Player {
  name: string;
  rank: string;
  family: FamilyId | null;
  wealth: number;
  respect: number;
  loyalty: number;
}

export interface GameEvent {
  id: string;
  turn: number;
  type: 'message' | 'attack' | 'recruit' | 'death' | 'expand' | 'intel' | 'promote' | string;
  actor: string;
  action: string;
  target?: string;
  description: string;
  result?: 'success' | 'failure' | 'pending' | string;
  timestamp?: Date | number;
}

export interface GameState {
  player: Player;
  families: Family[];
  turn: number;
  events: GameEvent[];
  phase: 'setup' | 'playing' | 'ended';
  winner?: FamilyId;
}

export type SkillCommand =
  | 'start-game'
  | 'status'
  | 'next-turn'
  | 'promote'
  | 'seek-patronage'
  | 'attack'
  | 'recruit'
  | 'message'
  | 'expand'
  | 'intel';

export interface Skill {
  id: SkillCommand;
  name: string;
  description: string;
  arguments?: { name: string; hint: string; options?: string[] }[];
  category: 'core' | 'action' | 'social';
}
