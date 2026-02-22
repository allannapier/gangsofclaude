/**
 * Game Mechanics Engine — Simplified Territory Control
 * Pure TypeScript functions for deterministic game logic
 */

// ── Constants ──

export const MUSCLE_HIRE_COST = 50;
export const MAX_HIRE_PER_TURN = 10;
export const MUSCLE_UPKEEP_COST = 10;

// ── Business Types ──

export type BusinessType = 
  | 'none'           // Unclaimed territory
  | 'protection'     // $100/turn, $150 cost
  | 'numbers'        // $150/turn, $250 cost  
  | 'speakeasy'      // $225/turn, $400 cost
  | 'brothel'        // $340/turn, $600 cost
  | 'casino'         // $500/turn, $1000 cost
  | 'smuggling';     // $750/turn, $1500 cost

export interface BusinessDefinition {
  name: string;
  cost: number;
  income: number;
  description: string;
  upgradesFrom: BusinessType[];
}

export const BUSINESS_DEFINITIONS: Record<BusinessType, BusinessDefinition> = {
  none: { 
    name: 'Unclaimed', 
    cost: 0, 
    income: 0, 
    description: 'No operations',
    upgradesFrom: []
  },
  protection: { 
    name: 'Protection Racket', 
    cost: 150, 
    income: 100, 
    description: 'Basic street-level shakedowns',
    upgradesFrom: ['none']
  },
  numbers: { 
    name: 'Numbers Racket', 
    cost: 250, 
    income: 150, 
    description: 'Illegal lottery operations',
    upgradesFrom: ['protection']
  },
  speakeasy: { 
    name: 'Speakeasy', 
    cost: 400, 
    income: 225, 
    description: 'Underground drinking establishment',
    upgradesFrom: ['protection', 'numbers']
  },
  brothel: { 
    name: 'Brothel', 
    cost: 600, 
    income: 340, 
    description: 'House of ill repute',
    upgradesFrom: ['numbers', 'speakeasy']
  },
  casino: { 
    name: 'Casino', 
    cost: 1000, 
    income: 500, 
    description: 'High-stakes gambling den',
    upgradesFrom: ['speakeasy', 'brothel']
  },
  smuggling: {
    name: 'Smuggling Operation',
    cost: 1500,
    income: 750,
    description: 'International contraband trade',
    upgradesFrom: ['casino', 'brothel']
  }
};

export function territoryIncome(business: BusinessType): number {
  return BUSINESS_DEFINITIONS[business]?.income ?? 0;
}

export function canUpgradeBusiness(current: BusinessType, target: BusinessType): boolean {
  return BUSINESS_DEFINITIONS[target]?.upgradesFrom?.includes(current) ?? false;
}

// ── Types ──

export interface Territory {
  id: string;
  name: string;
  owner: string | null; // family id or null if unclaimed
  muscle: number;
  business: BusinessType; // Type of business operation
}

export interface FamilyState {
  id: string;
  name: string;
  wealth: number;
  totalMuscle: number; // derived from territory muscle sums
  personality: 'aggressive' | 'business' | 'cunning' | 'defensive';
  lastAttackedBy: string | null; // Tracks who last captured a territory from this family
}

export interface DiplomacyMessage {
  from: string;
  to: string;
  type: 'partnership' | 'coordinate_attack' | 'war' | 'intel';
  targetFamily?: string; // for coordinate_attack and intel types
  turn: number;
  status?: 'pending' | 'accepted' | 'rejected'; // Status of the proposal
  respondedTurn?: number; // When it was responded to
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
  weight: number; // probability weight for random selection
  description: string;
}

export const CITY_EVENT_DEFINITIONS: CityEventDefinition[] = [
  { type: 'police_crackdown', name: 'Police Crackdown', icon: '🚔', weight: 20, description: 'The cops raid a territory — income frozen for 2 turns' },
  { type: 'black_market', name: 'Black Market Opportunity', icon: '💰', weight: 15, description: 'A lucrative black market deal appears — $500 bonus to the wealthiest unclaimed territory\'s next claimer' },
  { type: 'turf_war', name: 'Turf War Erupts', icon: '🔥', weight: 15, description: 'Street gangs clash — a random territory gains +2 bonus muscle for defense' },
  { type: 'rat_in_ranks', name: 'Rat in the Ranks', icon: '🐀', weight: 20, description: 'A traitor is discovered — the family with the most muscle loses 1 unit' },
  { type: 'press_scandal', name: 'Press Scandal', icon: '📰', weight: 15, description: 'A newspaper exposé hits — a family\'s income is halved for 1 turn' },
  { type: 'windfall', name: 'Windfall', icon: '🎰', weight: 15, description: 'A lucky break — a random family receives $300' },
];

export const CITY_EVENT_CHANCE = 0.30; // 30% chance per turn

// ── Covert Operations ──

export type CovertOpType = 'spy' | 'sabotage' | 'bribe' | 'fortify';

export interface CovertOpDefinition {
  type: CovertOpType;
  name: string;
  icon: string;
  cost: number;
  description: string;
  successRate?: number; // 1.0 = always succeeds
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

// ── Combat Resolution (Weighted Random) ──

export interface CombatResult {
  success: boolean;
  attackerLosses: number;
  defenderLosses: number;
  description: string;
}

export function getBusinessDefenseBonus(business: BusinessType): number {
  // Better businesses provide defensive advantage
  const bonuses: Record<BusinessType, number> = {
    none: 0,
    protection: 0,
    numbers: 1,      // +1 effective muscle
    speakeasy: 2,    // +2 effective muscle
    brothel: 3,      // +3 effective muscle
    casino: 5,       // +5 effective muscle
    smuggling: 7,    // +7 effective muscle
  };
  return bonuses[business] || 0;
}

export function resolveCombat(
  attackerMuscle: number,
  defenderMuscle: number,
  defenderBusiness: BusinessType = 'protection',
  extraDefenseBonus: number = 0,
): CombatResult {
  if (attackerMuscle <= 0) {
    return { success: false, attackerLosses: 0, defenderLosses: 0, description: 'No muscle sent to attack.' };
  }

  // Apply business defense bonus + fortification/turf war/alliance bonuses
  const defenseBonus = getBusinessDefenseBonus(defenderBusiness) + extraDefenseBonus;
  const effectiveDefenderMuscle = defenderMuscle + defenseBonus;
  
  const total = attackerMuscle + effectiveDefenderMuscle;
  const attackerChance = effectiveDefenderMuscle === 0 ? 0.95 : attackerMuscle / total;

  // Weighted random roll
  const roll = Math.random();
  const success = roll < attackerChance;

  // Both sides take losses regardless
  const baseLossRate = 0.2 + Math.random() * 0.3; // 20-50% losses
  const bonusDesc = defenseBonus > 0 ? ` (${BUSINESS_DEFINITIONS[defenderBusiness].name} +${defenseBonus} defense)` : '';
  
  if (success) {
    const attackerLosses = Math.max(1, Math.floor(attackerMuscle * baseLossRate * 0.5));
    const defenderLosses = Math.max(defenderMuscle > 0 ? 1 : 0, Math.floor(defenderMuscle * baseLossRate));
    return {
      success: true,
      attackerLosses,
      defenderLosses,
      description: `Attack succeeded${bonusDesc}! Lost ${attackerLosses} muscle, defender lost ${defenderLosses}.`,
    };
  } else {
    const attackerLosses = Math.max(1, Math.floor(attackerMuscle * baseLossRate));
    const defenderLosses = Math.max(defenderMuscle > 0 ? 1 : 0, Math.floor(defenderMuscle * baseLossRate * 0.5));
    return {
      success: false,
      attackerLosses,
      defenderLosses,
      description: `Attack failed${bonusDesc}! Lost ${attackerLosses} muscle, defender lost ${defenderLosses}.`,
    };
  }
}

// ── City Events ──

export function rollCityEvent(state: SaveState): GameEvent | null {
  if (Math.random() > CITY_EVENT_CHANCE) return null;

  // Weighted random selection
  const totalWeight = CITY_EVENT_DEFINITIONS.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = CITY_EVENT_DEFINITIONS[0];
  for (const def of CITY_EVENT_DEFINITIONS) {
    roll -= def.weight;
    if (roll <= 0) { selected = def; break; }
  }

  return applyCityEvent(state, selected);
}

function applyCityEvent(state: SaveState, def: CityEventDefinition): GameEvent {
  const activeFamilyIds = Object.keys(state.families).filter(
    fid => state.territories.some(t => t.owner === fid)
  );

  switch (def.type) {
    case 'police_crackdown': {
      // Pick a random owned territory
      const owned = state.territories.filter(t => t.owner && t.business !== 'none');
      if (owned.length === 0) break;
      const target = owned[Math.floor(Math.random() * owned.length)];
      state.activeEffects.push({
        id: `crackdown_${state.turn}_${target.id}`,
        type: 'police_crackdown',
        targetTerritory: target.id,
        targetFamily: target.owner!,
        turnsRemaining: 2,
        description: `Police crackdown on ${target.name} — income frozen`,
      });
      return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: Police raid ${target.name} (${state.families[target.owner!]?.name})! Income frozen for 2 turns.` };
    }
    case 'black_market': {
      // Give $500 to the family with the least wealth (rubber-banding)
      const poorest = activeFamilyIds.reduce((a, b) => 
        state.families[a].wealth < state.families[b].wealth ? a : b
      );
      state.families[poorest].wealth += 500;
      return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: A lucrative deal falls into the ${state.families[poorest].name} family's lap! +$500.` };
    }
    case 'turf_war': {
      // Random territory gains +2 temporary defense
      const allOwned = state.territories.filter(t => t.owner);
      if (allOwned.length === 0) break;
      const target = allOwned[Math.floor(Math.random() * allOwned.length)];
      state.activeEffects.push({
        id: `turfwar_${state.turn}_${target.id}`,
        type: 'turf_war',
        targetTerritory: target.id,
        targetFamily: target.owner!,
        turnsRemaining: 2,
        description: `Turf war defense bonus on ${target.name}`,
      });
      return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: Street gangs fortify ${target.name} (${state.families[target.owner!]?.name})! +2 defense for 2 turns.` };
    }
    case 'rat_in_ranks': {
      // Family with most muscle loses 1 unit
      const strongest = activeFamilyIds.reduce((a, b) => 
        state.families[a].totalMuscle > state.families[b].totalMuscle ? a : b
      );
      const terrs = state.territories.filter(t => t.owner === strongest && t.muscle > 0);
      if (terrs.length === 0) break;
      terrs.sort((a, b) => b.muscle - a.muscle);
      terrs[0].muscle--;
      state.families[strongest].totalMuscle--;
      return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: A rat is found in the ${state.families[strongest].name} ranks! 1 muscle deserts from ${terrs[0].name}.` };
    }
    case 'press_scandal': {
      // Random family's income halved for 1 turn
      const target = activeFamilyIds[Math.floor(Math.random() * activeFamilyIds.length)];
      state.activeEffects.push({
        id: `scandal_${state.turn}_${target}`,
        type: 'press_scandal',
        targetFamily: target,
        turnsRemaining: 1,
        description: `Press scandal halving ${state.families[target].name} income`,
      });
      return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: The newspapers expose ${state.families[target].name} operations! Income halved this turn.` };
    }
    case 'windfall': {
      // Random family gets $300
      const lucky = activeFamilyIds[Math.floor(Math.random() * activeFamilyIds.length)];
      state.families[lucky].wealth += 300;
      return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: The ${state.families[lucky].name} family hits a lucky streak! +$300.` };
    }
  }

  // Fallback if no valid targets
  return { turn: state.turn, actor: 'City', action: 'city_event', details: `${def.icon} ${def.name}: The city stirs, but nothing comes of it.` };
}

export function processActiveEffects(state: SaveState): void {
  // Decrement turns remaining, remove expired
  state.activeEffects = state.activeEffects
    .map(e => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }))
    .filter(e => e.turnsRemaining > 0);
}

export function isTerritoryCrackdown(state: SaveState, territoryId: string): boolean {
  return state.activeEffects.some(e => e.type === 'police_crackdown' && e.targetTerritory === territoryId);
}

export function isFamilyScandal(state: SaveState, familyId: string): boolean {
  return state.activeEffects.some(e => e.type === 'press_scandal' && e.targetFamily === familyId);
}

export function getTerritoryDefenseBonus(state: SaveState, territoryId: string): number {
  return state.activeEffects
    .filter(e => e.type === 'turf_war' && e.targetTerritory === territoryId)
    .reduce((sum, _) => sum + 2, 0);
}

// ── Covert Operations ──

export function executeSpy(state: SaveState, actorFamily: string, targetFamily: string): { success: boolean; event: GameEvent; intel?: IntelReport } {
  const family = state.families[actorFamily];
  const cost = COVERT_OP_DEFINITIONS.spy.cost;
  if (family.wealth < cost) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🕵️ Spy operation failed — insufficient funds ($${cost} needed).` } };
  }
  family.wealth -= cost;
  const targetTerritories = state.territories.filter(t => t.owner === targetFamily).map(t => ({
    id: t.id, name: t.name, muscle: t.muscle, business: t.business,
  }));
  const intel: IntelReport = {
    targetFamily,
    wealth: state.families[targetFamily].wealth,
    territories: targetTerritories,
    gatheredTurn: state.turn,
    expiresTurn: state.turn + 3,
  };
  state.intel.push(intel);
  return {
    success: true,
    intel,
    event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🕵️ Spy planted in the ${state.families[targetFamily].name} organization! Intel gathered for 3 turns.` },
  };
}

export function executeSabotage(state: SaveState, actorFamily: string, targetTerritoryId: string): { success: boolean; event: GameEvent } {
  const family = state.families[actorFamily];
  const cost = COVERT_OP_DEFINITIONS.sabotage.cost;
  if (family.wealth < cost) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🗡️ Sabotage failed — insufficient funds ($${cost} needed).` } };
  }
  family.wealth -= cost;
  const territory = state.territories.find(t => t.id === targetTerritoryId);
  if (!territory || territory.owner === actorFamily || territory.business === 'none') {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🗡️ Sabotage failed — invalid target.` } };
  }
  if (Math.random() > COVERT_OP_DEFINITIONS.sabotage.successRate!) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🗡️ Sabotage attempt on ${territory.name} was discovered and foiled!` } };
  }
  // Downgrade business by 1 level
  const downgradeMap: Record<string, BusinessType> = {
    smuggling: 'casino', casino: 'brothel', brothel: 'speakeasy',
    speakeasy: 'numbers', numbers: 'protection', protection: 'none',
  };
  const oldBusiness = territory.business;
  territory.business = downgradeMap[oldBusiness] || 'none';
  return {
    success: true,
    event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🗡️ Sabotage successful! ${territory.name}'s ${BUSINESS_DEFINITIONS[oldBusiness].name} downgraded to ${BUSINESS_DEFINITIONS[territory.business].name}.` },
  };
}

export function executeBribe(state: SaveState, actorFamily: string, targetTerritoryId: string): { success: boolean; event: GameEvent } {
  const family = state.families[actorFamily];
  const cost = COVERT_OP_DEFINITIONS.bribe.cost;
  if (family.wealth < cost) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🐀 Bribe failed — insufficient funds ($${cost} needed).` } };
  }
  family.wealth -= cost;
  const territory = state.territories.find(t => t.id === targetTerritoryId);
  if (!territory || territory.owner === actorFamily || territory.muscle <= 0) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🐀 Bribe failed — invalid target or no muscle to bribe.` } };
  }
  if (Math.random() > COVERT_OP_DEFINITIONS.bribe.successRate!) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🐀 Bribe attempt on ${territory.name} failed — the muscle stayed loyal!` } };
  }
  const stolen = Math.min(territory.muscle, 1 + (Math.random() > 0.5 ? 1 : 0)); // 1-2 muscle
  territory.muscle -= stolen;
  // Add stolen muscle to actor's territory with the most muscle
  const actorTerrs = state.territories.filter(t => t.owner === actorFamily);
  if (actorTerrs.length > 0) {
    actorTerrs.sort((a, b) => b.muscle - a.muscle);
    actorTerrs[0].muscle += stolen;
  }
  // Update totals
  if (territory.owner) state.families[territory.owner].totalMuscle -= stolen;
  state.families[actorFamily].totalMuscle += stolen;
  return {
    success: true,
    event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🐀 Bribe successful! ${stolen} muscle defected from ${territory.name} (${state.families[territory.owner!]?.name}).` },
  };
}

export function executeFortify(state: SaveState, actorFamily: string, targetTerritoryId: string): { success: boolean; event: GameEvent } {
  const family = state.families[actorFamily];
  const cost = COVERT_OP_DEFINITIONS.fortify.cost;
  if (family.wealth < cost) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🔒 Fortify failed — insufficient funds ($${cost} needed).` } };
  }
  const territory = state.territories.find(t => t.id === targetTerritoryId);
  if (!territory || territory.owner !== actorFamily) {
    return { success: false, event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🔒 Fortify failed — you don't own this territory.` } };
  }
  family.wealth -= cost;
  state.fortifications.push({
    territoryId: targetTerritoryId,
    bonusDefense: 3,
    expiresTurn: state.turn + 2,
  });
  return {
    success: true,
    event: { turn: state.turn, actor: state.families[actorFamily].name, action: 'covert_op', details: `🔒 ${territory.name} fortified! +3 defense bonus for 2 turns.` },
  };
}

export function processExpiredIntelAndFortifications(state: SaveState): void {
  state.intel = state.intel.filter(i => i.expiresTurn > state.turn);
  state.fortifications = state.fortifications.filter(f => f.expiresTurn > state.turn);
}

export function getFortificationBonus(state: SaveState, territoryId: string): number {
  return state.fortifications
    .filter(f => f.territoryId === territoryId && f.expiresTurn > state.turn)
    .reduce((sum, f) => sum + f.bonusDefense, 0);
}

// ── Alliance Mechanics ──

export function getActiveAlliances(state: SaveState): { family1: string; family2: string }[] {
  const alliances: { family1: string; family2: string }[] = [];
  for (const msg of state.diplomacy) {
    if (msg.type === 'partnership' && msg.status === 'accepted') {
      // Check not broken by a subsequent war declaration
      const broken = state.diplomacy.some(
        w => w.type === 'war' && w.turn > msg.turn &&
        ((w.from === msg.from && w.to === msg.to) || (w.from === msg.to && w.to === msg.from))
      );
      if (!broken) {
        alliances.push({ family1: msg.from, family2: msg.to });
      }
    }
  }
  return alliances;
}

export function areAllied(state: SaveState, family1: string, family2: string): boolean {
  return getActiveAlliances(state).some(
    a => (a.family1 === family1 && a.family2 === family2) ||
         (a.family1 === family2 && a.family2 === family1)
  );
}

export function getAllianceDefenseBonus(state: SaveState, defenderFamily: string): number {
  return areAllied(state, defenderFamily, defenderFamily) ? 0 :
    getActiveAlliances(state).some(a => a.family1 === defenderFamily || a.family2 === defenderFamily) ? 2 : 0;
}

export function applyBetrayalPenalty(state: SaveState, betrayerFamily: string): GameEvent | null {
  const family = state.families[betrayerFamily];
  // Lose $200
  family.wealth = Math.max(0, family.wealth - 200);
  // Lose 2 muscle (from territories with most muscle)
  let deserted = 0;
  const terrs = state.territories.filter(t => t.owner === betrayerFamily && t.muscle > 0);
  terrs.sort((a, b) => b.muscle - a.muscle);
  for (const t of terrs) {
    if (deserted >= 2) break;
    const loss = Math.min(t.muscle, 2 - deserted);
    t.muscle -= loss;
    deserted += loss;
  }
  family.totalMuscle -= deserted;
  if (deserted > 0 || family.wealth > 0) {
    return {
      turn: state.turn,
      actor: family.name,
      action: 'betrayal',
      details: `⚠️ Alliance betrayed! ${family.name} loses $200 and ${deserted} muscle desert in disgust.`,
    };
  }
  return null;
}

// ── Economy ──

export function calculateFamilyIncome(territories: Territory[], familyId: string, state?: SaveState): number {
  return territories
    .filter(t => t.owner === familyId)
    .reduce((sum, t) => {
      let income = territoryIncome(t.business);
      if (state) {
        // Police crackdown freezes income
        if (isTerritoryCrackdown(state, t.id)) income = 0;
      }
      return sum + income;
    }, 0);
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
  let income = calculateFamilyIncome(state.territories, familyId, state);
  // Press scandal halves income
  if (isFamilyScandal(state, familyId)) income = Math.floor(income / 2);
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
    playerCovertUsed: false,
    winner: null,
    families: {
      marinelli: { id: 'marinelli', name: 'Marinelli', wealth: 500, totalMuscle: 4, personality: 'aggressive', lastAttackedBy: null },
      rossetti: { id: 'rossetti', name: 'Rossetti', wealth: 500, totalMuscle: 4, personality: 'business', lastAttackedBy: null },
      falcone: { id: 'falcone', name: 'Falcone', wealth: 500, totalMuscle: 4, personality: 'cunning', lastAttackedBy: null },
      moretti: { id: 'moretti', name: 'Moretti', wealth: 500, totalMuscle: 4, personality: 'defensive', lastAttackedBy: null },
    },
    territories: [
      { id: 'little_italy', name: 'Little Italy', owner: 'marinelli', muscle: 2, business: 'protection' },
      { id: 'warehouse_district', name: 'Warehouse District', owner: 'marinelli', muscle: 2, business: 'protection' },
      { id: 'north_end', name: 'North End', owner: 'rossetti', muscle: 2, business: 'protection' },
      { id: 'fishmarket', name: 'Fishmarket', owner: 'rossetti', muscle: 2, business: 'protection' },
      { id: 'downtown', name: 'Downtown', owner: 'falcone', muscle: 2, business: 'protection' },
      { id: 'financial_district', name: 'Financial District', owner: 'falcone', muscle: 2, business: 'protection' },
      { id: 'east_side', name: 'East Side', owner: 'moretti', muscle: 2, business: 'protection' },
      { id: 'harbor', name: 'Harbor', owner: 'moretti', muscle: 2, business: 'protection' },
      // Unclaimed
      { id: 'chinatown', name: 'Chinatown', owner: null, muscle: 0, business: 'none' },
      { id: 'midtown', name: 'Midtown', owner: null, muscle: 0, business: 'none' },
      { id: 'west_end', name: 'West End', owner: null, muscle: 0, business: 'none' },
      { id: 'industrial_zone', name: 'Industrial Zone', owner: null, muscle: 0, business: 'none' },
      { id: 'suburbs', name: 'Suburbs', owner: null, muscle: 0, business: 'none' },
      { id: 'old_town', name: 'Old Town', owner: null, muscle: 0, business: 'none' },
      { id: 'riverside', name: 'Riverside', owner: null, muscle: 0, business: 'none' },
      { id: 'uptown', name: 'Uptown', owner: null, muscle: 0, business: 'none' },
    ],
    diplomacy: [],
    events: [],
    activeEffects: [],
    intel: [],
    fortifications: [],
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
