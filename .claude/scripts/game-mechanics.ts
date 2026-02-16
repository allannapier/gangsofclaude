/**
 * Game Mechanics Library for Gangs of Claude
 * TypeScript implementations of core game logic
 *
 * This module provides deterministic, testable functions for:
 * - Combat resolution
 * - Promotion eligibility
 * - Territory expansion
 */

export interface CombatResult {
  outcome: 'decisive_victory' | 'marginal_victory' | 'defeat';
  attack_type: string;
  combat_power: {
    attacker: number;
    defender: number;
  };
  rolls: {
    attacker: number;
    defender: number;
  };
  losses: {
    attacker: {
      percentage: number;
      soldiers_lost: number;
    };
    defender: {
      percentage: number;
      soldiers_lost: number;
    };
  };
  narrative: string;
}

export interface PromotionCheck {
  current_rank: string;
  next_rank: string;
  eligible: boolean;
  success_chance: number;
  requirements: {
    met: Array<{ requirement: string; current: string }>;
    missing: Array<{ requirement: string; current: string }>;
  };
}

export interface ExpansionOutcome {
  family_id: string;
  expansion_size: 'small' | 'medium' | 'large';
  territory: {
    name: string | null;
    status: string;
    gain: number;
    current: number;
    new: number;
    breakdown: {
      base: number;
      respect_bonus: number;
    };
  };
  cost: {
    wealth: number;
    can_afford: boolean;
    current_wealth: number;
    new_wealth: number;
  };
  provocation: {
    provoked: boolean;
    rival_family: string | null;
    event: string | null;
  };
}

/**
 * Combat Resolution
 * Calculates attack vs defense power and determines combat outcome
 *
 * @param attacker - Attacker family stats
 * @param defender - Defender family stats
 * @param attackType - Type of attack (assassinate, beatdown, business, territory)
 * @param seed - Random seed for deterministic testing
 */
export function resolveCombat(
  attacker: { soldiers: number; territory: number; wealth: number },
  defender: { soldiers: number; territory: number; wealth: number },
  attackType: string = 'territory',
  seed?: number
): CombatResult {
  // Seeded random for testing
  const random = seed ? seededRandom(seed) : Math.random;

  // Generate random modifiers (1-20)
  const attackerRoll = Math.floor(random() * 20) + 1;
  const defenderRoll = Math.floor(random() * 20) + 1;

  // Calculate combat power
  // Formula: (soldiers * 10) + (territory * 5) + (wealth / 100) + random(1-20)
  const attackPower =
    attacker.soldiers * 10 +
    attacker.territory * 5 +
    Math.floor(attacker.wealth / 100) +
    attackerRoll;

  const defensePower =
    defender.soldiers * 10 +
    defender.territory * 5 +
    Math.floor(defender.wealth / 100) +
    defenderRoll;

  // Determine outcome
  const defensePowerThreshold = Math.floor(defensePower * 1.2);

  let outcome: CombatResult['outcome'] = 'defeat';
  let attackerLossMin = 30;
  let attackerLossMax = 50;
  let defenderLossMin = 5;
  let defenderLossMax = 15;
  let narrative = 'Your forces were overwhelmed and forced to retreat.';

  if (attackPower > defensePowerThreshold) {
    outcome = 'decisive_victory';
    attackerLossMin = 5;
    attackerLossMax = 15;
    defenderLossMin = 30;
    defenderLossMax = 50;
    narrative = 'A crushing victory! Your forces dominated the battlefield.';
  } else if (attackPower > defensePower) {
    outcome = 'marginal_victory';
    attackerLossMin = 15;
    attackerLossMax = 30;
    defenderLossMin = 15;
    defenderLossMax = 30;
    narrative = 'A hard-fought victory. Both sides took significant losses.';
  }

  // Calculate losses
  const attackerLoss =
    attackerLossMin + Math.floor(random() * (attackerLossMax - attackerLossMin + 1));
  const defenderLoss =
    defenderLossMin + Math.floor(random() * (defenderLossMax - defenderLossMin + 1));

  // Calculate soldier casualties
  let attackerSoldiersLost = Math.floor(attacker.soldiers * attackerLoss / 100);
  let defenderSoldiersLost = Math.floor(defender.soldiers * defenderLoss / 100);

  // Ensure at least 1 soldier lost if there are any
  if (attacker.soldiers > 0 && attackerSoldiersLost === 0 && outcome !== 'decisive_victory') {
    attackerSoldiersLost = 1;
  }
  if (defender.soldiers > 0 && defenderSoldiersLost === 0) {
    defenderSoldiersLost = 1;
  }

  return {
    outcome,
    attack_type: attackType,
    combat_power: {
      attacker: attackPower,
      defender: defensePower,
    },
    rolls: {
      attacker: attackerRoll,
      defender: defenderRoll,
    },
    losses: {
      attacker: {
        percentage: attackerLoss,
        soldiers_lost: attackerSoldiersLost,
      },
      defender: {
        percentage: defenderLoss,
        soldiers_lost: defenderSoldiersLost,
      },
    },
    narrative,
  };
}

/**
 * Promotion Eligibility Check
 * Checks if player meets requirements for next rank promotion
 *
 * @param player - Player stats
 * @param family - Player family stats
 * @param successfulActions - Number of successful actions completed
 * @param controlledTerritories - Number of territories player controls
 * @param rankHolders - Number of NPCs at current rank (blocks promotion)
 */
export function checkPromotionEligibility(
  player: {
    rank: string;
    respect: number;
    loyalty: number;
    wealth: number;
  },
  family: {
    soldiers: number;
  },
  successfulActions: number,
  controlledTerritories: number,
  rankHolders: number = 0
): PromotionCheck {
  const RANKS = ['Outsider', 'Associate', 'Soldier', 'Capo', 'Underboss', 'Don'];
  const currentRankIndex = RANKS.indexOf(player.rank);

  // Already at max rank
  if (currentRankIndex === RANKS.length - 1) {
    return {
      current_rank: player.rank,
      next_rank: player.rank,
      eligible: false,
      success_chance: 0,
      requirements: { met: [], missing: [] },
    };
  }

  const nextRank = RANKS[currentRankIndex + 1];
  const requirementsMet: Array<{ requirement: string; current: string }> = [];
  const requirementsMissing: Array<{ requirement: string; current: string }> = [];
  let baseChance = 70;

  switch (nextRank) {
    case 'Associate':
      requirementsMissing.push({ requirement: 'Seek patronage', current: 'Required' });
      baseChance = 100;
      break;

    case 'Soldier':
      checkRequirement(requirementsMet, requirementsMissing, 'Respect', player.respect, 10);
      checkRequirement(requirementsMet, requirementsMissing, 'Successful actions', successfulActions, 1);
      checkRequirement(requirementsMet, requirementsMissing, 'Loyalty', player.loyalty, 60);
      checkRequirement(requirementsMet, requirementsMissing, 'Wealth', player.wealth, 100, true);
      break;

    case 'Capo':
      checkRequirement(requirementsMet, requirementsMissing, 'Respect', player.respect, 30);
      checkRequirement(requirementsMet, requirementsMissing, 'Successful actions', successfulActions, 5);
      checkRequirement(requirementsMet, requirementsMissing, 'Controlled territories', controlledTerritories, 1);
      checkRequirement(requirementsMet, requirementsMissing, 'Loyalty', player.loyalty, 70);
      requirementsMet.push({ requirement: 'Position', current: 'Vacant or own crew' });
      break;

    case 'Underboss':
      checkRequirement(requirementsMet, requirementsMissing, 'Respect', player.respect, 60);
      checkRequirement(requirementsMet, requirementsMissing, 'Controlled territories', controlledTerritories, 3);
      checkRequirement(requirementsMet, requirementsMissing, 'Family soldiers', family.soldiers, 5);
      checkRequirement(requirementsMet, requirementsMissing, 'Loyalty', player.loyalty, 80);
      requirementsMet.push({ requirement: 'Position', current: 'Must be vacant' });
      break;

    case 'Don':
      checkRequirement(requirementsMet, requirementsMissing, 'Respect', player.respect, 90);
      checkRequirement(requirementsMet, requirementsMissing, 'Controlled territories', controlledTerritories, 5);
      checkRequirement(requirementsMet, requirementsMissing, 'Family soldiers', family.soldiers, 10);
      checkRequirement(requirementsMet, requirementsMissing, 'Loyalty', player.loyalty, 95);
      requirementsMet.push({ requirement: 'Position', current: 'Don must die' });
      break;
  }

  // Calculate success chance
  // Formula: base_chance + (player.respect/4) + (family.loyalty/10) - (rank_holders * 5)
  let successChance = baseChance + Math.floor(player.respect / 4) + Math.floor(player.loyalty / 10) - rankHolders * 5;
  successChance = Math.max(5, Math.min(95, successChance));

  return {
    current_rank: player.rank,
    next_rank: nextRank,
    eligible: requirementsMissing.length === 0,
    success_chance: successChance,
    requirements: {
      met: requirementsMet,
      missing: requirementsMissing,
    },
  };
}

/**
 * Territory Expansion Outcome
 * Calculates territory gain and provocation chance for expansion
 *
 * @param familyId - Family expanding
 * @param size - Size of expansion (small, medium, large)
 * @param familyStats - Current family stats
 * @param playerRespect - Player's respect (affects outcome)
 * @param territoryName - Optional specific territory to claim
 * @param currentTerritoryOwner - Current owner of territory (if claiming specific)
 * @param seed - Random seed for testing
 */
export function calculateExpansionOutcome(
  familyId: string,
  size: 'small' | 'medium' | 'large',
  familyStats: { wealth: number; territory: number },
  playerRespect: number,
  territoryName?: string,
  currentTerritoryOwner?: string,
  seed?: number
): ExpansionOutcome {
  const random = seed ? seededRandom(seed) : Math.random;

  // Set cost and territory gain ranges
  const config = {
    small: { cost: 50, min: 1, max: 3, provocation: 10 },
    medium: { cost: 150, min: 4, max: 7, provocation: 30 },
    large: { cost: 400, min: 8, max: 15, provocation: 60 },
  };

  const { cost: wealthCost, min, max, provocation: provocationChance } = config[size];
  const canAfford = familyStats.wealth >= wealthCost;

  // Calculate territory gain
  const baseGain = min + Math.floor(random() * (max - min + 1));
  const respectBonus = Math.floor(playerRespect / 10);
  let territoryGain = baseGain + respectBonus;
  let territoryStatus = 'generic';
  let provocationEvent = '';
  let rivalFamily: string | null = null;
  let provoked = false;

  // Handle specific territory claim
  if (territoryName) {
    if (currentTerritoryOwner === '') {
      // Unowned territory
      territoryStatus = 'unowned';
      territoryGain = 1;
    } else if (currentTerritoryOwner === familyId) {
      // Already owned
      territoryStatus = 'already_owned';
      territoryGain = 0;
    } else {
      // Owned by rival - this is an attack
      territoryStatus = 'contested';
      territoryGain = 0;
      provoked = true;
      rivalFamily = currentTerritoryOwner;
      provocationEvent = `The ${rivalFamily} family controls ${territoryName} and will defend it!`;
    }
  }

  // Check for provocation on generic expansion
  if (!provoked && territoryStatus === 'generic') {
    if (Math.floor(random() * 100) < provocationChance) {
      provoked = true;
      // Would need to determine rival family from game state
      provocationEvent = `A rival family has noticed your ${size} expansion.`;
    }
  }

  return {
    family_id: familyId,
    expansion_size: size,
    territory: {
      name: territoryName || null,
      status: territoryStatus,
      gain: territoryGain,
      current: familyStats.territory,
      new: familyStats.territory + territoryGain,
      breakdown: {
        base: baseGain,
        respect_bonus: respectBonus,
      },
    },
    cost: {
      wealth: wealthCost,
      can_afford: canAfford,
      current_wealth: familyStats.wealth,
      new_wealth: familyStats.wealth - wealthCost,
    },
    provocation: {
      provoked,
      rival_family: rivalFamily,
      event: provocationEvent || null,
    },
  };
}

/**
 * Helper: Check if a requirement is met
 */
function checkRequirement(
  met: Array<{ requirement: string; current: string }>,
  missing: Array<{ requirement: string; current: string }>,
  name: string,
  current: number,
  required: number,
  isCost = false
): void {
  const currentStr = isCost ? `${current}/${required} (cost)` : `${current}/${required}`;
  if (current >= required) {
    met.push({ requirement: name, current: currentStr });
  } else {
    missing.push({ requirement: name, current: currentStr });
  }
}

/**
 * Helper: Seeded random number generator for testing
 */
function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Export types for use in other modules
export type { CombatResult, PromotionCheck, ExpansionOutcome };
