/**
 * Game Mechanics Engine
 * Pure TypeScript functions for deterministic game logic
 * No LLM calls - all calculations are formula-based
 */

export interface GameState {
  turn: number;
  phase: string;
  player: PlayerState;
  families: Record<string, FamilyState>;
  territoryOwnership: Record<string, string>;
  events: GameEvent[];
  messages: Message[];
}

export interface PlayerState {
  name: string;
  rank: string;
  family: string;
  loyalty: number;
  respect: number;
  wealth: number;
  contacts: string[];
  enemies: string[];
}

export interface FamilyState {
  id: string;
  name: string;
  territory: number;
  soldiers: number;
  wealth: number;
  standing: string;
}

export interface CombatResult {
  outcome: 'decisive_victory' | 'marginal_victory' | 'defeat';
  attackType: string;
  attacker: string;
  defender: string;
  attackPower: number;
  defensePower: number;
  losses: {
    attacker: { soldiers: number; percent: number };
    defender: { soldiers: number; percent: number };
  };
  gains: {
    territory: number;
    wealth: number;
    respect: number;
  };
}

/**
 * Combat Resolution
 * Calculates attack vs defense outcomes using deterministic formulas
 */
export function resolveCombat(
  attackerFamily: FamilyState,
  defenderFamily: FamilyState,
  attackType: string,
  randomSeed: number = Math.random() * 100
): CombatResult {
  // Random components (1-20 each)
  const attackRoll = 1 + Math.floor(randomSeed % 20);
  const defenseRoll = 1 + Math.floor((randomSeed * 7) % 20);

  // Calculate combat power
  const attackPower = attackerFamily.soldiers * 10 + attackerFamily.territory * 5 + Math.floor(attackerFamily.wealth / 100) + attackRoll;
  const defensePower = defenderFamily.soldiers * 10 + defenderFamily.territory * 5 + Math.floor(defenderFamily.wealth / 100) + defenseRoll;

  // Threshold for decisive victory (1.2x defense)
  const decisiveThreshold = Math.floor(defensePower * 1.2);

  let outcome: CombatResult['outcome'];
  let attackerLossPercent: number;
  let defenderLossPercent: number;
  let territoryGain = 0;
  let wealthStolen = 0;
  let respectGain = 0;

  if (attackPower > decisiveThreshold) {
    outcome = 'decisive_victory';
    attackerLossPercent = 5 + Math.floor((randomSeed * 3) % 11); // 5-15%
    defenderLossPercent = 30 + Math.floor((randomSeed * 5) % 21); // 30-50%
    territoryGain = 1 + Math.floor(randomSeed % 3);
    wealthStolen = Math.floor(defenderFamily.wealth * (10 + Math.floor(randomSeed % 10)) / 100);
    respectGain = 5;
  } else if (attackPower > defensePower) {
    outcome = 'marginal_victory';
    attackerLossPercent = 15 + Math.floor((randomSeed * 4) % 16); // 15-30%
    defenderLossPercent = 15 + Math.floor((randomSeed * 6) % 16); // 15-30%
    territoryGain = 1;
    wealthStolen = Math.floor(defenderFamily.wealth * (5 + Math.floor(randomSeed % 5)) / 100);
    respectGain = 2;
  } else {
    outcome = 'defeat';
    attackerLossPercent = 30 + Math.floor((randomSeed * 7) % 21); // 30-50%
    defenderLossPercent = 5 + Math.floor((randomSeed * 2) % 11); // 5-15%
    territoryGain = 0;
    wealthStolen = 0;
    respectGain = -5;
  }

  const attackerSoldiersLost = Math.floor(attackerFamily.soldiers * attackerLossPercent / 100);
  const defenderSoldiersLost = Math.floor(defenderFamily.soldiers * defenderLossPercent / 100);

  return {
    outcome,
    attackType,
    attacker: attackerFamily.id,
    defender: defenderFamily.id,
    attackPower,
    defensePower,
    losses: {
      attacker: { soldiers: attackerSoldiersLost, percent: attackerLossPercent },
      defender: { soldiers: defenderSoldiersLost, percent: defenderLossPercent }
    },
    gains: {
      territory: territoryGain,
      wealth: wealthStolen,
      respect: respectGain
    }
  };
}

/**
 * Promotion Eligibility Check
 * Checks if player qualifies for rank promotion
 */
export interface PromotionCheckResult {
  currentRank: string;
  nextRank: string;
  eligible: boolean;
  missingRequirements: string[];
  successChance: number;
  currentStats: {
    respect: number;
    loyalty: number;
    wealth: number;
    actionsCompleted: number;
  };
}

export function checkPromotionEligibility(
  player: PlayerState,
  family: FamilyState,
  actionsCompleted: number
): PromotionCheckResult {
  const { rank: currentRank, respect, loyalty, wealth } = player;

  let nextRank = '';
  let eligible = false;
  let missingRequirements: string[] = [];
  let successChance = 0;

  const rankRequirements: Record<string, {
    next: string;
    respect: number;
    loyalty: number;
    wealth?: number;
    actions?: number;
    territory?: number;
    soldiers?: number;
  }> = {
    'Outsider': {
      next: 'Associate',
      respect: 0,
      loyalty: 0
    },
    'Associate': {
      next: 'Soldier',
      respect: 10,
      loyalty: 60,
      wealth: 100,
      actions: 1
    },
    'Soldier': {
      next: 'Capo',
      respect: 30,
      loyalty: 70,
      actions: 5,
      territory: 1
    },
    'Capo': {
      next: 'Underboss',
      respect: 60,
      loyalty: 80,
      territory: 3,
      soldiers: 5
    },
    'Underboss': {
      next: 'Don',
      respect: 90,
      loyalty: 95,
      territory: 5,
      soldiers: 10
    },
    'Don': {
      next: 'Maximum Rank',
      respect: 999,
      loyalty: 999
    }
  };

  const req = rankRequirements[currentRank];
  if (!req) {
    return {
      currentRank,
      nextRank: 'Unknown',
      eligible: false,
      missingRequirements: ['Invalid rank'],
      successChance: 0,
      currentStats: { respect, loyalty, wealth, actionsCompleted }
    };
  }

  nextRank = req.next;

  // Special case: Outsider to Associate requires recruitment
  if (currentRank === 'Outsider') {
    eligible = player.family !== 'none';
    if (!eligible) {
      missingRequirements = ['Complete /seek-patronage with any family'];
    }
    successChance = eligible ? 100 : 0;
  } else if (currentRank === 'Don') {
    eligible = false;
    missingRequirements = ['You have reached the highest rank'];
    successChance = 0;
  } else {
    // Check all requirements
    if (respect < req.respect) missingRequirements.push(`Respect: ${respect}/${req.respect}`);
    if (loyalty < req.loyalty) missingRequirements.push(`Loyalty: ${loyalty}/${req.loyalty}`);
    if (req.wealth && wealth < req.wealth) missingRequirements.push(`Wealth: ${wealth}/${req.wealth}`);
    if (req.actions && actionsCompleted < req.actions) missingRequirements.push(`Actions: ${actionsCompleted}/${req.actions}`);
    if (req.territory && family.territory < req.territory) missingRequirements.push(`Territory: ${family.territory}/${req.territory}`);
    if (req.soldiers && family.soldiers < req.soldiers) missingRequirements.push(`Soldiers: ${family.soldiers}/${req.soldiers}`);

    eligible = missingRequirements.length === 0;
    successChance = eligible ? 50 + Math.floor(respect / 4) + Math.floor(loyalty / 10) : 0;
  }

  return {
    currentRank,
    nextRank,
    eligible,
    missingRequirements,
    successChance,
    currentStats: {
      respect,
      loyalty,
      wealth,
      actionsCompleted
    }
  };
}

/**
 * Territory Expansion Calculator
 * Calculates territory gain and provocation chance
 */
export interface ExpansionResult {
  success: boolean;
  error?: string;
  family: string;
  size: string;
  cost: { wealth: number };
  gains: {
    territory: number;
    specificTerritory?: {
      name: string;
      alreadyOwned: boolean;
      currentOwner: string;
    };
  };
  provocation: {
    provoked: boolean;
    family: string | null;
  };
}

export function calculateExpansion(
  family: FamilyState,
  size: 'small' | 'medium' | 'large',
  territoryName: string | null,
  playerRespect: number,
  allFamilies: Record<string, FamilyState>,
  territoryOwnership: Record<string, string>,
  randomSeed: number = Math.random() * 100
): ExpansionResult {
  const sizeConfig = {
    small: { cost: 50, minGain: 1, maxGain: 3, provocationChance: 10 },
    medium: { cost: 150, minGain: 4, maxGain: 7, provocationChance: 30 },
    large: { cost: 400, minGain: 8, maxGain: 15, provocationChance: 60 }
  };

  const config = sizeConfig[size];

  // Check wealth
  if (family.wealth < config.cost) {
    return {
      success: false,
      error: `Insufficient wealth. Need ${config.cost}, have ${family.wealth}`,
      family: family.id,
      size,
      cost: { wealth: config.cost },
      gains: { territory: 0 },
      provocation: { provoked: false, family: null }
    };
  }

  // Calculate territory gain with respect bonus
  const baseGain = config.minGain + Math.floor(randomSeed % (config.maxGain - config.minGain + 1));
  const respectBonus = Math.floor(playerRespect / 10);
  const territoryGain = baseGain + respectBonus;

  // Roll for provocation
  const provocationRoll = 1 + Math.floor(randomSeed % 100);
  const provoked = provocationRoll <= config.provocationChance;

  // Find provoking family
  let provokingFamily: string | null = null;
  if (provoked) {
    const rivalFamilies = Object.keys(allFamilies).filter(f => f !== family.id);
    if (rivalFamilies.length > 0) {
      provokingFamily = rivalFamilies[Math.floor(randomSeed % rivalFamilies.length)];
    }
  }

  // Check specific territory
  let specificTerritory;
  if (territoryName) {
    const currentOwner = territoryOwnership[territoryName] || '';
    specificTerritory = {
      name: territoryName,
      alreadyOwned: currentOwner === family.id,
      currentOwner
    };
  }

  return {
    success: true,
    family: family.id,
    size,
    cost: { wealth: config.cost },
    gains: {
      territory: territoryGain,
      specificTerritory
    },
    provocation: {
      provoked,
      family: provokingFamily
    }
  };
}

/**
 * Recruitment Success Calculator
 * Calculates recruitment/mentoring success and outcomes
 */
export interface RecruitmentResult {
  success: boolean;
  error?: string;
  actor: { rank: string };
  target: { id: string; rank: string };
  cost: { wealth: number };
  roll: { value: number; chance: number };
  outcomes: {
    respect: number;
    loyalty: number;
    message: string;
  };
}

export function calculateRecruitment(
  actorRank: string,
  targetId: string,
  targetRank: string,
  targetFamily: string,
  actorFamily: string,
  playerRespect: number,
  playerWealth: number,
  randomSeed: number = Math.random() * 100
): RecruitmentResult {
  let wealthCost = 0;
  let baseChance = 0;
  let error: string | undefined;
  const targetIsUnaffiliated = !targetFamily || targetFamily === 'none';

  // Define requirements by actor rank
  switch (actorRank) {
    case 'Associate':
      wealthCost = 25;
      baseChance = 50;
      if (!targetIsUnaffiliated) {
        error = 'Associates can only recruit unaffiliated outsiders';
      }
      break;
    case 'Soldier':
      wealthCost = 10;
      baseChance = 70;
      if (targetFamily !== actorFamily) {
        error = 'Soldiers can only mentor their own family members';
      }
      break;
    case 'Capo':
    case 'Consigliere':
    case 'Underboss':
    case 'Don':
      wealthCost = 50;
      baseChance = 70;
      if (targetRank !== 'Associate') {
        error = 'Can only recruit Associates to become Soldiers';
      }
      break;
    default:
      error = 'Invalid actor rank';
  }

  if (error) {
    return {
      success: false,
      error,
      actor: { rank: actorRank },
      target: { id: targetId, rank: targetRank },
      cost: { wealth: 0 },
      roll: { value: 0, chance: 0 },
      outcomes: { respect: 0, loyalty: 0, message: 'recruit-invalid' }
    };
  }

  // Check wealth
  if (playerWealth < wealthCost) {
    return {
      success: false,
      error: `Insufficient wealth. Need ${wealthCost}, have ${playerWealth}`,
      actor: { rank: actorRank },
      target: { id: targetId, rank: targetRank },
      cost: { wealth: wealthCost },
      roll: { value: 0, chance: 0 },
      outcomes: { respect: 0, loyalty: 0, message: 'recruit-no-wealth' }
    };
  }

  // Calculate success chance
  let successChance = baseChance + Math.floor(playerRespect / 2);
  if (successChance > 95) successChance = 95;

  // Roll for success
  const roll = 1 + Math.floor(randomSeed % 100);
  const success = roll <= successChance;

  return {
    success,
    actor: { rank: actorRank },
    target: { id: targetId, rank: targetRank },
    cost: { wealth: wealthCost },
    roll: { value: roll, chance: successChance },
    outcomes: {
      respect: success ? 5 : -2,
      loyalty: success ? 5 : 0,
      message: success ? 'recruit-success' : 'recruit-failed'
    }
  };
}

/**
 * Intel Operation Calculator
 * Calculates intel operation success and outcomes
 */
export interface IntelOperationResult {
  success: boolean;
  operation: string;
  target: string;
  cost: { wealth: number };
  roll: { value: number; chance: number };
  outcomes: {
    discovered?: boolean;
    information?: string;
    relationshipDamage: number;
  };
}

export function calculateIntelOperation(
  operation: 'spy' | 'steal' | 'blackmail' | 'survey',
  targetFamily: FamilyState,
  playerRespect: number,
  playerWealth: number,
  randomSeed: number = Math.random() * 100
): IntelOperationResult {
  const operationConfig = {
    spy: { cost: 100, baseChance: 60, risk: 10 },
    steal: { cost: 50, baseChance: 70, risk: 20 },
    blackmail: { cost: 75, baseChance: 65, risk: 15 },
    survey: { cost: 25, baseChance: 80, risk: 5 }
  };

  const config = operationConfig[operation];

  // Check wealth
  if (playerWealth < config.cost) {
    return {
      success: false,
      operation,
      target: targetFamily.id,
      cost: { wealth: config.cost },
      roll: { value: 0, chance: 0 },
      outcomes: { relationshipDamage: 0 }
    };
  }

  // Calculate success chance
  let successChance = config.baseChance + Math.floor(playerRespect / 5);
  if (successChance > 90) successChance = 90;

  // Roll for success
  const roll = 1 + Math.floor(randomSeed % 100);
  const success = roll <= successChance;

  // Check for discovery
  const discoveryRoll = 1 + Math.floor((randomSeed * 3) % 100);
  const discovered = discoveryRoll <= config.risk;

  // Generate information based on operation
  let information: string | undefined;
  if (success) {
    switch (operation) {
      case 'survey':
        information = `Wealth: ${targetFamily.wealth}, Territory: ${targetFamily.territory}, Soldiers: ${targetFamily.soldiers}`;
        break;
      case 'steal':
        const stolen = Math.floor(targetFamily.wealth * (10 + Math.floor(randomSeed % 20)) / 100);
        information = `Stole ${stolen} wealth from ${targetFamily.name}`;
        break;
      default:
        information = `Operation completed successfully`;
    }
  }

  return {
    success,
    operation,
    target: targetFamily.id,
    cost: { wealth: config.cost },
    roll: { value: roll, chance: successChance },
    outcomes: {
      discovered: success ? discovered : undefined,
      information,
      relationshipDamage: discovered ? -10 : 0
    },
  };
}

/**
 * Turn Income Calculator
 * Calculates per-turn income for the player based on rank, territory, and family wealth
 */
export interface TurnIncomeResult {
  total: number;
  breakdown: {
    rankStipend: number;
    territoryIncome: number;
    familyDividend: number;
    protectionRacket: number;
  };
  description: string;
}

const RANK_STIPENDS: Record<string, number> = {
  'Outsider': 0,
  'Associate': 25,
  'Soldier': 75,
  'Capo': 150,
  'Underboss': 300,
  'Don': 500,
};

const TERRITORY_INCOME_PER = 20;   // $20 per territory your family controls
const FAMILY_DIVIDEND_RATE = 0.005; // 0.5% of family wealth per turn
const PROTECTION_RACKET_PER = 10;  // $10 per territory (passive racket income)

export function calculateTurnIncome(
  player: PlayerState,
  family: FamilyState | null,
  territoryCount: number
): TurnIncomeResult {
  if (!player.family || player.family === 'none' || !family) {
    return {
      total: 0,
      breakdown: { rankStipend: 0, territoryIncome: 0, familyDividend: 0, protectionRacket: 0 },
      description: 'No income — join a family first',
    };
  }

  const rankStipend = RANK_STIPENDS[player.rank] || 0;
  const territoryIncome = territoryCount * TERRITORY_INCOME_PER;
  const familyDividend = Math.floor((family.wealth || 0) * FAMILY_DIVIDEND_RATE);
  const protectionRacket = territoryCount * PROTECTION_RACKET_PER;
  const total = rankStipend + territoryIncome + familyDividend + protectionRacket;

  const parts: string[] = [];
  if (rankStipend > 0) parts.push(`$${rankStipend} stipend`);
  if (territoryIncome > 0) parts.push(`$${territoryIncome} territory`);
  if (familyDividend > 0) parts.push(`$${familyDividend} family cut`);
  if (protectionRacket > 0) parts.push(`$${protectionRacket} rackets`);

  return {
    total,
    breakdown: { rankStipend, territoryIncome, familyDividend, protectionRacket },
    description: parts.length > 0 ? parts.join(' + ') : 'No income',
  };
}

/**
 * Action Reward Calculator
 * Calculates wealth gained from successful operations
 */
export interface ActionRewardResult {
  wealth: number;
  respect: number;
  description: string;
}

export function calculateActionReward(
  action: string,
  success: boolean,
  targetFamily: FamilyState | null,
  randomSeed: number = Math.random() * 100
): ActionRewardResult {
  if (!success) {
    return { wealth: 0, respect: 0, description: 'Failed — no reward' };
  }

  switch (action) {
    case 'steal': {
      const stolen = targetFamily
        ? Math.floor(targetFamily.wealth * (5 + Math.floor(randomSeed % 15)) / 100)
        : 50 + Math.floor(randomSeed % 150);
      return { wealth: stolen, respect: 2, description: `Stole $${stolen}` };
    }
    case 'blackmail': {
      const payout = 100 + Math.floor(randomSeed % 400);
      return { wealth: payout, respect: 3, description: `Blackmail payout: $${payout}` };
    }
    case 'territory':
    case 'claim': {
      const loot = 50 + Math.floor(randomSeed % 100);
      return { wealth: loot, respect: 5, description: `Seized assets: $${loot}` };
    }
    case 'assassinate': {
      const bounty = 75 + Math.floor(randomSeed % 200);
      return { wealth: bounty, respect: 5, description: `Contract pay: $${bounty}` };
    }
    case 'beatdown': {
      const shakedown = 25 + Math.floor(randomSeed % 75);
      return { wealth: shakedown, respect: 1, description: `Shakedown: $${shakedown}` };
    }
    case 'business': {
      const profit = 100 + Math.floor(randomSeed % 300);
      return { wealth: profit, respect: 3, description: `Business seized: $${profit}` };
    }
    case 'recruit': {
      return { wealth: 0, respect: 5, description: 'New recruit — respect gained' };
    }
    case 'expand': {
      const revenue = 30 + Math.floor(randomSeed % 70);
      return { wealth: revenue, respect: 2, description: `New rackets: $${revenue}/turn potential` };
    }
    default:
      return { wealth: 0, respect: 0, description: '' };
  }
}
