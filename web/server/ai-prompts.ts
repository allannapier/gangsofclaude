/**
 * AI Prompt Builder — Constructs rich prompts for LLM-driven family agents.
 * Each family gets full game context, personality, and available actions.
 */

import type { SaveState, Territory, GameEvent, DiplomacyMessage, BusinessType } from './mechanics';
import {
  calculateFamilyIncome,
  calculateUpkeepCost,
  MUSCLE_HIRE_COST,
  MAX_HIRE_PER_TURN,
  BUSINESS_DEFINITIONS,
  COVERT_OP_DEFINITIONS,
  canUpgradeBusiness,
  territoryIncome,
  areAllied,
  getActiveAlliances,
  getFortificationBonus,
  getTerritoryDefenseBonus,
  isTerritoryCrackdown,
} from './mechanics';

const RECENT_EVENT_TURN_WINDOW = 3;
const RECENT_EVENT_MAX_ENTRIES = 20;
const RECENT_DIPLOMACY_TURN_WINDOW = 5;
const RECENT_DIPLOMACY_MAX_ENTRIES = 20;

// Family personality descriptions embedded in prompts
const FAMILY_PERSONALITIES: Record<string, string> = {
  marinelli: `You are the **Marinelli Family** — Aggressive Traditionalists.
You rule through fear and overwhelming force. You are the oldest family in the city and believe you are the rightful rulers.
- Attack first, negotiate later. If a rival shows weakness, exploit it immediately.
- You hold grudges. If someone attacked you, retaliate even if it costs you.
- Prefer hiring muscle over upgrading businesses. You want raw power.
- Declare war readily. Diplomacy is a last resort.
- When wealthy and strong: launch attacks. When weak: rebuild muscle before striking.
- **Covert ops:** Prefer fortify to protect your turf. Rarely use spy or sabotage — that's sneaky, not your style.
- **Alliances:** Break them readily if it serves your interests. The betrayal penalty is worth it for the right conquest.
- Your tone is blunt, threatening, old-school mafia.`,

  rossetti: `You are the **Rossetti Family** — Business Diplomats.
You rule through wealth and influence. Violence is expensive and wasteful — money is the real power.
- Prioritize business upgrades for maximum income. Invest in high-tier operations.
- Prefer diplomacy over violence. Propose partnerships before resorting to force.
- Only attack when numbers overwhelmingly favor you.
- Form alliances against aggressors. Coordinate attacks only against the strongest rival.
- When wealthy: upgrade businesses and dominate economically. When threatened: seek allies.
- **Covert ops:** Love bribe (steal muscle cheaply) and spy (knowledge is power). Use sabotage against economic rivals.
- **Alliances:** Maintain partnerships. The defense bonus and coordination bonuses are valuable to you.
- Your tone is polished, business-like, condescending.`,

  falcone: `You are the **Falcone Family** — Cunning Manipulators.
You rule through intelligence and deception. Let enemies destroy each other while you pick up the pieces.
- Opportunistic: strike only when an enemy is weakened or distracted.
- Manipulate diplomacy: propose coordinate attacks to pit rivals against each other.
- Always target whoever is currently winning — bring them down.
- When rivals are fighting: claim territory while they're distracted.
- Prefer attacking weak territories (low muscle) for guaranteed wins.
- **Covert ops:** LOVE spy and sabotage. These are your bread and butter. Information is power, and sabotage weakens enemies without direct confrontation.
- **Alliances:** Form them strategically, then betray at the optimal moment for maximum gain.
- Your tone is cryptic, calculating, theatrical.`,

  moretti: `You are the **Moretti Family** — Honorable Traditionalists.
You rule through loyalty and measured strength. You don't start wars — you finish them.
- Defensive buildup: prioritize hiring muscle and fortifying territory.
- Only attack when attacked first, but hit hard when you do.
- Honor partnerships. If an ally asks for help, consider it.
- Patient expansion: claim unclaimed territory when safe, never overextend.
- Upgrade businesses for long-term income stability.
- **Covert ops:** Prefer fortify (protect your people) and spy (know your enemies). Never use bribe — that's dishonorable.
- **Alliances:** ALWAYS honor them. You NEVER betray a partner. Your word is your bond.
- Your tone is dignified, measured, old-world respect.`,
};

export interface AIAction {
  action: 'attack' | 'claim' | 'hire' | 'business' | 'wait';
  target?: string; // territory_id
  count?: number; // for hire action
  musclePerTerritory?: Record<string, number>; // for attack action
  business?: BusinessType; // for business action
  reasoning: string;
  diplomacy?: {
    type: 'war' | 'partnership' | 'coordinate_attack';
    target: string; // family_id
    targetFamily?: string; // for coordinate_attack
  } | null;
  covert?: {
    type: 'spy' | 'sabotage' | 'bribe' | 'fortify';
    target: string; // family_id or territory_id
  } | null;
  taunt?: string; // in-character flavor text for the game log
}

/**
 * Build a comprehensive prompt for a family's turn.
 */
export function buildFamilyPrompt(familyId: string, state: SaveState): string {
  const family = state.families[familyId];
  if (!family) return '';

  const personality = FAMILY_PERSONALITIES[familyId] || 'You are a crime family.';

  const myTerritories = state.territories.filter(t => t.owner === familyId);
  const totalMuscle = myTerritories.reduce((s, t) => s + t.muscle, 0);
  const income = calculateFamilyIncome(state.territories, familyId);
  const upkeep = calculateUpkeepCost(state.territories, familyId);
  const netIncome = income - upkeep;

  // Other families summary
  const otherFamilies = Object.entries(state.families)
    .filter(([fid]) => fid !== familyId)
    .map(([fid, f]) => {
      const fTerritories = state.territories.filter(t => t.owner === fid);
      const fMuscle = fTerritories.reduce((s, t) => s + t.muscle, 0);
      const fIncome = calculateFamilyIncome(state.territories, fid);
      return `  - **${f.name}**: ${fTerritories.length} territories, ${fMuscle} muscle, $${f.wealth} wealth, $${fIncome}/turn income`;
    })
    .join('\n');

  // Territory details
  const myTerritoryDetails = myTerritories
    .map(t => `  - ${t.name} (${t.id}): ${BUSINESS_DEFINITIONS[t.business]?.name || t.business}, ${t.muscle} muscle, $${territoryIncome(t.business)}/turn`)
    .join('\n');

  // Enemy territories
  const enemyTerritoriesList = state.territories
    .filter(t => t.owner !== null && t.owner !== familyId);
  const enemyTerritories = enemyTerritoriesList
    .map(t => {
      const ownerName = state.families[t.owner!]?.name || t.owner;
      return `  - ${t.name} (${t.id}): Owner=${ownerName}, ${BUSINESS_DEFINITIONS[t.business]?.name || t.business}, ${t.muscle} muscle`;
    })
    .join('\n') || '  (none)';

  // Unclaimed territories
  const unclaimed = state.territories.filter(t => t.owner === null);
  const unclaimedList = unclaimed.length > 0
    ? unclaimed.map(t => `  - ${t.name} (${t.id})`).join('\n')
    : '  (none)';

  // Recent events across all actors (all families + city + economy)
  const recentEvents = state.events
    .filter(e => e.turn >= state.turn - RECENT_EVENT_TURN_WINDOW && e.turn < state.turn)
    .slice(-RECENT_EVENT_MAX_ENTRIES)
    .map(e => `  - Turn ${e.turn}: ${e.actor} — ${e.action}: ${e.details}${e.result ? ' → ' + e.result : ''}`)
    .join('\n') || '  (none)';

  // Diplomacy messages to/from this family
  const recentDiplomacy = state.diplomacy
    .filter(d => (d.to === familyId || d.from === familyId) && d.turn >= state.turn - RECENT_DIPLOMACY_TURN_WINDOW)
    .slice(-RECENT_DIPLOMACY_MAX_ENTRIES)
    .map(d => {
      let statusStr = '';
      if (d.status === 'accepted') statusStr = ' ✅ ACCEPTED';
      else if (d.status === 'rejected') statusStr = ' ❌ REJECTED';
      else if (d.status === 'pending') statusStr = ' ⏳ PENDING (awaiting response)';
      return `  - Turn ${d.turn}: ${d.from} → ${d.to}: ${d.type}${d.targetFamily ? ` (target: ${d.targetFamily})` : ''}${statusStr}`;
    })
    .join('\n') || '  (none)';

  // Active alliances
  const alliances = getActiveAlliances(state);
  const myAlliances = alliances.filter(a => a.family1 === familyId || a.family2 === familyId);
  const allianceList = myAlliances.length > 0
    ? myAlliances.map(a => {
      const partner = a.family1 === familyId ? a.family2 : a.family1;
      return `  - 🤝 Allied with ${state.families[partner]?.name || partner} (+2 defense bonus, betrayal costs $200 + 2 muscle)`;
    }).join('\n')
    : '  (none)';

  // Active city effects
  const activeEffects = state.activeEffects.length > 0
    ? state.activeEffects.map(e => `  - ${e.description} (${e.turnsRemaining} turns remaining)`).join('\n')
    : '  (none)';

  // Fortifications
  const activeForts = state.fortifications.filter(f => f.expiresTurn > state.turn);
  const fortList = activeForts.length > 0
    ? activeForts.map(f => {
      const terr = state.territories.find(t => t.id === f.territoryId);
      return `  - ${terr?.name || f.territoryId}: +${f.bonusDefense} defense (expires turn ${f.expiresTurn})`;
    }).join('\n')
    : '  (none)';

  // Player family info
  const playerInfo = state.playerFamily
    ? `The player controls the **${state.families[state.playerFamily]?.name || state.playerFamily}** family.`
    : 'No player has joined yet.';

  // Available actions
  const canHire = family.wealth >= MUSCLE_HIRE_COST;
  const hireMax = Math.min(MAX_HIRE_PER_TURN, Math.floor(family.wealth / MUSCLE_HIRE_COST));
  
  // Check which businesses can be upgraded to
  const businessUpgrades: Array<{ territory: Territory; businesses: BusinessType[] }> = [];
  for (const t of myTerritories) {
    const affordable: BusinessType[] = [];
    for (const biz of ['protection', 'numbers', 'speakeasy', 'brothel', 'casino', 'smuggling'] as BusinessType[]) {
      if (canUpgradeBusiness(t.business, biz) && family.wealth >= BUSINESS_DEFINITIONS[biz].cost) {
        affordable.push(biz);
      }
    }
    if (affordable.length > 0) {
      businessUpgrades.push({ territory: t, businesses: affordable });
    }
  }
  const canUpgradeBusiness_check = businessUpgrades.length > 0;
  
  const canAttack = enemyTerritoriesList.length > 0 && totalMuscle >= 1;
  const canClaim = unclaimed.length > 0 && totalMuscle >= 2;

  // Other family IDs for diplomacy
  const otherFamilyIds = Object.keys(state.families).filter(fid => fid !== familyId);
  const eliminatedFamilies = otherFamilyIds.filter(fid => {
    return !state.territories.some(t => t.owner === fid);
  });
  const activeFamilyIds = otherFamilyIds.filter(fid => !eliminatedFamilies.includes(fid));

  return `${personality}

## CURRENT GAME STATE — Turn ${state.turn}

${playerInfo}

### Your Family: ${family.name}
- Wealth: $${family.wealth}
- Income: $${income}/turn | Upkeep: $${upkeep}/turn | Net: $${netIncome}/turn
- Total Muscle: ${totalMuscle}
- Territories (${myTerritories.length}):
${myTerritoryDetails}

### Rival Families
${otherFamilies}
${eliminatedFamilies.length > 0 ? `\n**Eliminated:** ${eliminatedFamilies.join(', ')}` : ''}

### Enemy Territories
${enemyTerritories}

### Unclaimed Territories
${unclaimedList}

### Recent Events (last ${RECENT_EVENT_TURN_WINDOW} full turns, all actors)
${recentEvents}

### Diplomacy History (last ${RECENT_DIPLOMACY_TURN_WINDOW} turns, messages involving your family)
${recentDiplomacy}

### Active Alliances
${allianceList}

### City Effects (active this turn)
${activeEffects}

### Fortifications
${fortList}

## AVAILABLE ACTIONS — Choose exactly ONE:

${canAttack ? `**ATTACK** — Send muscle to attack an enemy territory
  - You can attack with muscle from one or multiple territories (no hard cap)
  - Optional: include "musclePerTerritory" in your JSON to choose exact amounts by territory ID
  - If you omit "musclePerTerritory", the engine auto-allocates your attack force
  - Combat is weighted random: more muscle = higher chance of winning
  - ⚠️ **DEFENSE BONUS:** Better businesses provide defensive advantage! (Numbers +1, Speakeasy +2, Brothel +3, Casino +5, Smuggling +7)
  - Both sides take casualties (20-50% losses)
  - 🏴 **If you win:** Territory resets to Protection Racket (damaged in fighting)
  - Pick a target from enemy territories above` : '**ATTACK** — ❌ ' + (enemyTerritoriesList.length === 0 ? 'No enemy territories left' : 'Not enough muscle (need 1+)')}

${canClaim ? `**CLAIM** — Claim an unclaimed territory
  - Moves 1 muscle from your strongest territory to the new one
  - Establishes a Protection Racket (+$100/turn)
  - Free expansion, no combat required
  - Pick from unclaimed territories above` : '**CLAIM** — ❌ ' + (unclaimed.length === 0 ? 'No unclaimed territories left' : 'Not enough muscle (need 2+)')}

${canHire ? `**HIRE** — Recruit muscle ($${MUSCLE_HIRE_COST} each, up to ${MAX_HIRE_PER_TURN} per turn)
  - Optional: include "count" in your JSON (1-${hireMax}) to control how many to hire
  - Stationed at your weakest territory
  - You can afford up to ${hireMax} muscle ($${hireMax * MUSCLE_HIRE_COST})` : '**HIRE** — ❌ Cannot afford ($' + MUSCLE_HIRE_COST + ' per muscle)'}

${canUpgradeBusiness_check ? `**BUSINESS** — Upgrade a territory's business operation
  - ⚠️ **Higher businesses = harder to attack!** (Provides defense bonus)
  - But resets to Protection if conquered
${businessUpgrades.map(({ territory, businesses }) => {
  return `  - **${territory.name}** (${territory.id}) — Current: ${BUSINESS_DEFINITIONS[territory.business].name} ($${BUSINESS_DEFINITIONS[territory.business].income}/turn)
    Can upgrade to: ${businesses.map(b => `${BUSINESS_DEFINITIONS[b].name} ($${BUSINESS_DEFINITIONS[b].cost}, +$${BUSINESS_DEFINITIONS[b].income}/turn)`).join(' or ')}`;
}).join('\n')}` : '**BUSINESS** — ❌ No affordable upgrades'}

**WAIT** — Do nothing this turn (always available)

## OPTIONAL: Diplomacy Message (in addition to your action)

You may ALSO send ONE diplomacy message to another active family:
- **WAR** <family_id> — Declare war (makes them more likely to retaliate)
- **PARTNERSHIP** <family_id> — Propose alliance (may reduce hostility)
- **COORDINATE_ATTACK** <family_id> against <target_family_id> — Propose joint attack
${activeFamilyIds.length > 0 ? `Active families you can message: ${activeFamilyIds.join(', ')}` : 'No active families to message.'}

⚠️ **Do NOT re-propose partnerships or coordinate attacks that are already ACCEPTED or still PENDING.** Check the diplomacy log above.

## ALLIANCE MECHANICS
- **Active partnerships** grant +2 defense bonus when your allied territory is attacked
- **Betrayal penalty:** If you attack a partner, you lose $200 and 2 muscle desert
- **Coordinate attacks:** Diplomatic coordination signal (no direct combat stat bonus in current mechanics)
- Consider these mechanics when deciding whether to maintain or break alliances

## OPTIONAL: Covert Operation (in addition to your action and diplomacy)

You may ALSO perform ONE covert operation:
- **SPY** <family_id> ($200) — Reveals target's full muscle distribution and wealth for 3 turns. Always succeeds.
- **SABOTAGE** <territory_id> ($300) — 60% chance to downgrade target territory's business by 1 level. Must be enemy territory with a business.
- **BRIBE** <territory_id> ($150) — 70% chance to steal 1-2 muscle from enemy territory.
- **FORTIFY** <territory_id> ($200) — Add +3 defense bonus to one of YOUR territories for 2 turns. Always succeeds.

## RESPONSE FORMAT

You MUST respond with ONLY a valid JSON object, no other text:
\`\`\`json
{
  "action": "attack|claim|hire|business|wait",
  "target": "territory_id_or_null",
  "count": "number 1-${MAX_HIRE_PER_TURN} (optional, only for hire action)",
  "musclePerTerritory": {"your_territory_id": 3} (optional, only for attack action),
  "business": "protection|numbers|speakeasy|brothel|casino|smuggling (only for business action)",
  "reasoning": "1-2 sentence strategic explanation",
  "diplomacy": {"type": "war|partnership|coordinate_attack", "target": "family_id", "targetFamily": "family_id_only_for_coordinate_attack"} or null,
  "covert": {"type": "spy|sabotage|bribe|fortify", "target": "family_id_or_territory_id"} or null,
  "taunt": "short in-character quote for the game log (max 15 words)"
}
\`\`\`

Think strategically. Consider the full game state. What move best serves your family's interests this turn?`;
}

/**
 * Parse an AI response into a validated AIAction.
 * Handles common LLM quirks (markdown code blocks, extra text, etc.)
 */
export function parseAIResponse(raw: string): AIAction | null {
  // Try to extract JSON from response
  let jsonStr = raw.trim();

  // Remove markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const parsedCount = Math.floor(Number(parsed.count));
    const musclePerTerritory = (parsed.musclePerTerritory &&
      typeof parsed.musclePerTerritory === 'object' &&
      !Array.isArray(parsed.musclePerTerritory))
      ? Object.fromEntries(
        Object.entries(parsed.musclePerTerritory as Record<string, unknown>)
          .map(([territoryId, amount]) => [territoryId, Math.floor(Number(amount))] as const)
          .filter(([, amount]) => Number.isFinite(amount) && amount > 0)
      )
      : undefined;

    // Validate required fields
    const validActions = ['attack', 'claim', 'hire', 'business', 'wait'];
    if (!validActions.includes(parsed.action)) {
      console.error(`[ai-prompts] Invalid action: ${parsed.action}`);
      return null;
    }

    return {
      action: parsed.action,
      target: parsed.target || undefined,
      count: Number.isInteger(parsedCount) && parsedCount > 0 ? parsedCount : undefined,
      musclePerTerritory,
      business: parsed.business || undefined,
      reasoning: parsed.reasoning || 'No reasoning provided.',
      diplomacy: parsed.diplomacy || null,
      covert: parsed.covert || null,
      taunt: parsed.taunt || undefined,
    };
  } catch (e) {
    console.error(`[ai-prompts] Failed to parse AI response: ${e}`);
    console.error(`[ai-prompts] Raw response: ${raw.substring(0, 500)}`);
    return null;
  }
}
