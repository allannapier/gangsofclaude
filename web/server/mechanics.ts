/**
 * Game Mechanics Engine — Simplified Territory Control
 * Pure TypeScript functions for deterministic game logic
 */

// ── Constants ──

export const MUSCLE_HIRE_COST = 50;
export const MUSCLE_UPKEEP_COST = 10;
export const BASE_TERRITORY_INCOME = 100;
export const TERRITORY_UPGRADE_COST = 200;
export const MAX_TERRITORY_LEVEL = 5;

// Income per level: L1=$100, L2=$150, L3=$225, L4=$340, L5=$500
export function territoryIncome(level: number): number {
  return Math.floor(BASE_TERRITORY_INCOME * Math.pow(1.5, level - 1));
}

// ── Types ──

export interface Territory {
  id: string;
  name: string;
  owner: string | null; // family id or null if unclaimed
  muscle: number;
  level: number; // 1-5, affects income
}

export interface FamilyState {
  id: string;
  name: string;
  wealth: number;
  totalMuscle: number; // derived from territory muscle sums
  personality: 'aggressive' | 'business' | 'cunning' | 'defensive';
}

export interface DiplomacyMessage {
  from: string;
  to: string;
  type: 'partnership' | 'coordinate_attack' | 'war' | 'intel';
  targetFamily?: string; // for coordinate_attack and intel types
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
  playerMessaged: boolean;
  winner: string | null;
  families: Record<string, FamilyState>;
  territories: Territory[];
  diplomacy: DiplomacyMessage[];
  events: GameEvent[];
}

// ── Combat Resolution (Weighted Random) ──

export interface CombatResult {
  success: boolean;
  attackerLosses: number;
  defenderLosses: number;
  description: string;
}

export function resolveCombat(
  attackerMuscle: number,
  defenderMuscle: number,
): CombatResult {
  if (attackerMuscle <= 0) {
    return { success: false, attackerLosses: 0, defenderLosses: 0, description: 'No muscle sent to attack.' };
  }

  const total = attackerMuscle + defenderMuscle;
  const attackerChance = defenderMuscle === 0 ? 0.95 : attackerMuscle / total;

  // Weighted random roll
  const roll = Math.random();
  const success = roll < attackerChance;

  // Both sides take losses regardless
  const baseLossRate = 0.2 + Math.random() * 0.3; // 20-50% losses
  if (success) {
    const attackerLosses = Math.max(1, Math.floor(attackerMuscle * baseLossRate * 0.5));
    const defenderLosses = Math.max(defenderMuscle > 0 ? 1 : 0, Math.floor(defenderMuscle * baseLossRate));
    return {
      success: true,
      attackerLosses,
      defenderLosses,
      description: `Attack succeeded! Lost ${attackerLosses} muscle, defender lost ${defenderLosses}.`,
    };
  } else {
    const attackerLosses = Math.max(1, Math.floor(attackerMuscle * baseLossRate));
    const defenderLosses = Math.max(defenderMuscle > 0 ? 1 : 0, Math.floor(defenderMuscle * baseLossRate * 0.5));
    return {
      success: false,
      attackerLosses,
      defenderLosses,
      description: `Attack failed! Lost ${attackerLosses} muscle, defender lost ${defenderLosses}.`,
    };
  }
}

// ── Economy ──

export function calculateFamilyIncome(territories: Territory[], familyId: string): number {
  return territories
    .filter(t => t.owner === familyId)
    .reduce((sum, t) => sum + territoryIncome(t.level), 0);
}

export function calculateUpkeepCost(territories: Territory[], familyId: string): number {
  const totalMuscle = territories
    .filter(t => t.owner === familyId)
    .reduce((sum, t) => sum + t.muscle, 0);
  return totalMuscle * MUSCLE_UPKEEP_COST;
}

export function processFamilyEconomy(
  state: SaveState,
  familyId: string,
): { income: number; upkeep: number; deserted: number; netWealth: number } {
  const family = state.families[familyId];
  const income = calculateFamilyIncome(state.territories, familyId);
  const upkeep = calculateUpkeepCost(state.territories, familyId);
  const netIncome = income - upkeep;
  let newWealth = family.wealth + netIncome;
  let deserted = 0;

  // If broke, muscle deserts until affordable
  if (newWealth < 0) {
    const familyTerritories = state.territories.filter(t => t.owner === familyId && t.muscle > 0);
    while (newWealth < 0 && familyTerritories.some(t => t.muscle > 0)) {
      // Remove muscle from territory with most muscle
      familyTerritories.sort((a, b) => b.muscle - a.muscle);
      const t = familyTerritories[0];
      t.muscle--;
      deserted++;
      newWealth += MUSCLE_UPKEEP_COST;
    }
    newWealth = Math.max(0, newWealth);
  }

  return { income, upkeep, deserted, netWealth: newWealth };
}

// ── Initial Game State ──

export const TERRITORY_DEFINITIONS: { id: string; name: string }[] = [
  { id: 'little_italy', name: 'Little Italy' },
  { id: 'warehouse_district', name: 'Warehouse District' },
  { id: 'north_end', name: 'North End' },
  { id: 'fishmarket', name: 'Fishmarket' },
  { id: 'downtown', name: 'Downtown' },
  { id: 'financial_district', name: 'Financial District' },
  { id: 'east_side', name: 'East Side' },
  { id: 'harbor', name: 'Harbor' },
  // 8 unclaimed
  { id: 'chinatown', name: 'Chinatown' },
  { id: 'midtown', name: 'Midtown' },
  { id: 'west_end', name: 'West End' },
  { id: 'industrial_zone', name: 'Industrial Zone' },
  { id: 'suburbs', name: 'Suburbs' },
  { id: 'old_town', name: 'Old Town' },
  { id: 'riverside', name: 'Riverside' },
  { id: 'uptown', name: 'Uptown' },
];

export function createInitialState(): SaveState {
  return {
    turn: 0,
    phase: 'setup',
    playerFamily: null,
    playerActed: false,
    playerMessaged: false,
    winner: null,
    families: {
      marinelli: { id: 'marinelli', name: 'Marinelli', wealth: 500, totalMuscle: 4, personality: 'aggressive' },
      rossetti: { id: 'rossetti', name: 'Rossetti', wealth: 500, totalMuscle: 4, personality: 'business' },
      falcone: { id: 'falcone', name: 'Falcone', wealth: 500, totalMuscle: 4, personality: 'cunning' },
      moretti: { id: 'moretti', name: 'Moretti', wealth: 500, totalMuscle: 4, personality: 'defensive' },
    },
    territories: [
      { id: 'little_italy', name: 'Little Italy', owner: 'marinelli', muscle: 2, level: 1 },
      { id: 'warehouse_district', name: 'Warehouse District', owner: 'marinelli', muscle: 2, level: 1 },
      { id: 'north_end', name: 'North End', owner: 'rossetti', muscle: 2, level: 1 },
      { id: 'fishmarket', name: 'Fishmarket', owner: 'rossetti', muscle: 2, level: 1 },
      { id: 'downtown', name: 'Downtown', owner: 'falcone', muscle: 2, level: 1 },
      { id: 'financial_district', name: 'Financial District', owner: 'falcone', muscle: 2, level: 1 },
      { id: 'east_side', name: 'East Side', owner: 'moretti', muscle: 2, level: 1 },
      { id: 'harbor', name: 'Harbor', owner: 'moretti', muscle: 2, level: 1 },
      // Unclaimed
      { id: 'chinatown', name: 'Chinatown', owner: null, muscle: 0, level: 1 },
      { id: 'midtown', name: 'Midtown', owner: null, muscle: 0, level: 1 },
      { id: 'west_end', name: 'West End', owner: null, muscle: 0, level: 1 },
      { id: 'industrial_zone', name: 'Industrial Zone', owner: null, muscle: 0, level: 1 },
      { id: 'suburbs', name: 'Suburbs', owner: null, muscle: 0, level: 1 },
      { id: 'old_town', name: 'Old Town', owner: null, muscle: 0, level: 1 },
      { id: 'riverside', name: 'Riverside', owner: null, muscle: 0, level: 1 },
      { id: 'uptown', name: 'Uptown', owner: null, muscle: 0, level: 1 },
    ],
    diplomacy: [],
    events: [],
  };
}

// ── Win Condition ──

export function checkWinCondition(state: SaveState): string | null {
  const owners = new Set(state.territories.map(t => t.owner).filter(Boolean));
  if (owners.size === 1) return [...owners][0]!;
  return null;
}

// ── Family elimination check ──

export function getEliminatedFamilies(state: SaveState): string[] {
  const activeFamilies = Object.keys(state.families);
  return activeFamilies.filter(fid => {
    const ownsTerritories = state.territories.some(t => t.owner === fid);
    return !ownsTerritories;
  });
}
