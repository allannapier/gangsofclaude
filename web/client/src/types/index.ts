export type SkillCommand =
  | 'start-game' | 'status' | 'next-turn' | 'promote'
  | 'seek-patronage' | 'recruit' | 'attack' | 'intel' | 'expand'
  | 'claim'
  | 'message';

export interface Skill {
  id: SkillCommand;
  name: string;
  description: string;
  category: 'core' | 'action' | 'social';
  arguments?: SkillArgument[];
}

export interface SkillArgument {
  name: string;
  hint: string;
  options?: string[];
}

export interface Family {
  id: string;
  name: string;
  fullName: string;
  color: string;
  description?: string;
  territory: string[];
  stats: {
    wealth: number;
    territory: number;
    respect: number;
  };
  members: Character[];
}

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  family: string;
  alive: boolean;
  loyalty: number;
  personality: string;
  traits: string[];
}

export interface GameState {
  phase: 'setup' | 'playing' | 'ended';
  turn: number;
  winner: string | null;
  player?: {
    name: string;
    rank: string;
    family: string;
    wealth: number;
    respect: number;
    loyalty: number;
  };
  families?: Family[];
  events?: GameEvent[];
  territoryOwnership?: Record<string, string>; // Maps territory name to family id
}

export interface GameEvent {
  id: string;
  turn: number;
  type: string;
  actor: string;
  action: string;
  target?: string;
  description: string;
  timestamp?: number;
  result?: string;
}
