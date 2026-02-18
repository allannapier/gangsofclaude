/**
 * Gangs of Claude - Territory Control Game Server
 * Self-contained game server with WebSocket push to browsers.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import {
  createInitialState,
  resolveCombat,
  calculateFamilyIncome,
  calculateUpkeepCost,
  processFamilyEconomy,
  checkWinCondition,
  getEliminatedFamilies,
  territoryIncome,
  canUpgradeBusiness,
  getBusinessDefenseBonus,
  MUSCLE_HIRE_COST,
  BUSINESS_DEFINITIONS,
  type SaveState,
  type GameEvent,
  type DiplomacyMessage,
  type Territory,
  type BusinessType,
} from './mechanics';
import { ClaudeAgentBridge } from './claude-bridge';
import { buildFamilyPrompt, parseAIResponse, type AIAction } from './ai-prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const saveDir = join(rootDir, '..', '.claude', 'game-state');
const saveJsonPath = join(saveDir, 'save.json');

// ── State ──

let gameState: SaveState = loadState();
const browserClients = new Map<string, any>(); // sessionId → ws
const agentBridges = new Map<string, ClaudeAgentBridge>(); // sessionId → bridge
let isProcessingTurn = false;

function loadState(): SaveState {
  try {
    if (existsSync(saveJsonPath)) {
      const raw = readFileSync(saveJsonPath, 'utf-8');
      return JSON.parse(raw) as SaveState;
    }
  } catch (e) {
    console.error('Failed to load save.json, creating fresh state');
  }
  return createInitialState();
}

function saveState() {
  if (!existsSync(saveDir)) mkdirSync(saveDir, { recursive: true });
  writeFileSync(saveJsonPath, JSON.stringify(gameState, null, 2));
}

function broadcast(msg: any) {
  const data = JSON.stringify(msg);
  for (const [, ws] of browserClients) {
    try { ws.send(data); } catch {}
  }
}

// ── AI Decision Making ──

function aiDecideAction(familyId: string, state: SaveState): GameEvent | null {
  const family = state.families[familyId];
  if (!family) return null;

  const myTerritories = state.territories.filter(t => t.owner === familyId);
  if (myTerritories.length === 0) return null; // eliminated

  const totalMuscle = myTerritories.reduce((s, t) => s + t.muscle, 0);
  const income = calculateFamilyIncome(state.territories, familyId);
  const upkeep = calculateUpkeepCost(state.territories, familyId);

  // Check recent diplomacy
  const recentDiplomacy = state.diplomacy.filter(
    d => d.to === familyId && d.turn >= state.turn - 2
  );
  const hasWarDeclaration = recentDiplomacy.some(d => d.type === 'war');
  const hasPartnership = recentDiplomacy.some(d => d.type === 'partnership');
  const coordinateAttack = recentDiplomacy.find(d => d.type === 'coordinate_attack');

  // Find unclaimed territories
  const unclaimed = state.territories.filter(t => t.owner === null);
  // Find weak enemy territories
  const enemyTerritories = state.territories.filter(
    t => t.owner !== null && t.owner !== familyId
  );
  const weakEnemyTerritories = enemyTerritories.filter(t => t.muscle < 3);

  const roll = Math.random();

  // Personality-driven decisions
  switch (family.personality) {
    case 'aggressive': {
      // Marinelli: prioritize attacks, especially if war declared
      if (totalMuscle >= 4 && (hasWarDeclaration || roll < 0.5) && enemyTerritories.length > 0) {
        const target = weakEnemyTerritories.length > 0
          ? weakEnemyTerritories[Math.floor(Math.random() * weakEnemyTerritories.length)]
          : enemyTerritories[Math.floor(Math.random() * enemyTerritories.length)];
        return executeAIAttack(state, familyId, target);
      }
      if (unclaimed.length > 0 && totalMuscle >= 2) {
        return executeAIClaim(state, familyId, unclaimed);
      }
      if (family.wealth >= MUSCLE_HIRE_COST) {
        return executeAIHire(state, familyId);
      }
      break;
    }
    case 'business': {
      // Rossetti: prioritize business upgrades and hiring
      const upgradeable = myTerritories.filter(t => {
        // Check if can upgrade to any business
        const current = t.business;
        return ['numbers', 'speakeasy', 'brothel', 'casino', 'smuggling'].some(b => 
          canUpgradeBusiness(current, b as BusinessType) && family.wealth >= BUSINESS_DEFINITIONS[b as BusinessType].cost
        );
      });
      if (upgradeable.length > 0 && roll < 0.4) {
        const target = upgradeable[0];
        // Pick best affordable business
        const affordable: BusinessType[] = [];
        for (const biz of ['numbers', 'speakeasy', 'brothel', 'casino', 'smuggling'] as BusinessType[]) {
          if (canUpgradeBusiness(target.business, biz) && family.wealth >= BUSINESS_DEFINITIONS[biz].cost) {
            affordable.push(biz);
          }
        }
        if (affordable.length > 0) {
          return executeAIBusiness(state, familyId, target, affordable[affordable.length - 1]);
        }
      }
      if (family.wealth >= MUSCLE_HIRE_COST && roll < 0.7) {
        return executeAIHire(state, familyId);
      }
      if (unclaimed.length > 0 && totalMuscle >= 2) {
        return executeAIClaim(state, familyId, unclaimed);
      }
      break;
    }
    case 'cunning': {
      // Falcone: exploit weakness, claim unclaimed, balanced
      if (coordinateAttack && totalMuscle >= 4) {
        const coordTargets = enemyTerritories.filter(t => t.owner === coordinateAttack.targetFamily);
        if (coordTargets.length > 0) {
          const target = coordTargets.sort((a, b) => a.muscle - b.muscle)[0];
          return executeAIAttack(state, familyId, target);
        }
      }
      if (weakEnemyTerritories.length > 0 && totalMuscle >= 4 && roll < 0.4) {
        const target = weakEnemyTerritories[Math.floor(Math.random() * weakEnemyTerritories.length)];
        return executeAIAttack(state, familyId, target);
      }
      if (unclaimed.length > 0 && totalMuscle >= 2) {
        return executeAIClaim(state, familyId, unclaimed);
      }
      if (family.wealth >= MUSCLE_HIRE_COST) {
        return executeAIHire(state, familyId);
      }
      break;
    }
    case 'defensive': {
      // Moretti: build strength, retaliate only
      if (family.wealth >= MUSCLE_HIRE_COST && roll < 0.5) {
        return executeAIHire(state, familyId);
      }
      const upgradeable = myTerritories.filter(t => {
        const current = t.business;
        return ['numbers', 'speakeasy', 'brothel', 'casino', 'smuggling'].some(b => 
          canUpgradeBusiness(current, b as BusinessType) && family.wealth >= BUSINESS_DEFINITIONS[b as BusinessType].cost
        );
      });
      if (upgradeable.length > 0 && roll < 0.7) {
        const target = upgradeable[0];
        // Pick best affordable business
        const affordable: BusinessType[] = [];
        for (const biz of ['numbers', 'speakeasy', 'brothel', 'casino', 'smuggling'] as BusinessType[]) {
          if (canUpgradeBusiness(target.business, biz) && family.wealth >= BUSINESS_DEFINITIONS[biz].cost) {
            affordable.push(biz);
          }
        }
        if (affordable.length > 0) {
          return executeAIBusiness(state, familyId, target, affordable[affordable.length - 1]);
        }
      }
      if (hasWarDeclaration && totalMuscle >= 5 && enemyTerritories.length > 0) {
        const target = weakEnemyTerritories.length > 0
          ? weakEnemyTerritories[0]
          : enemyTerritories[Math.floor(Math.random() * enemyTerritories.length)];
        return executeAIAttack(state, familyId, target);
      }
      if (unclaimed.length > 0 && totalMuscle >= 2) {
        return executeAIClaim(state, familyId, unclaimed);
      }
      break;
    }
  }

  // Fallback: hire muscle if affordable, else do nothing
  if (family.wealth >= MUSCLE_HIRE_COST) {
    return executeAIHire(state, familyId);
  }
  return { turn: state.turn, actor: family.name, action: 'wait', details: `${family.name} bides their time.` };
}

function executeAIAttack(state: SaveState, familyId: string, target: Territory): GameEvent {
  const family = state.families[familyId];
  const myTerritories = state.territories.filter(t => t.owner === familyId && t.muscle > 0);

  // Send muscle from territories with the most muscle (leave at least 1 per territory)
  let muscleToSend = 0;
  const muscleSource: { territory: Territory; amount: number }[] = [];
  for (const t of myTerritories.sort((a, b) => b.muscle - a.muscle)) {
    const available = t.muscle - 1;
    if (available > 0 && muscleToSend < 5) {
      const send = Math.min(available, 5 - muscleToSend);
      muscleSource.push({ territory: t, amount: send });
      muscleToSend += send;
    }
  }

  if (muscleToSend <= 0) {
    return { turn: state.turn, actor: family.name, action: 'wait', details: `${family.name} wanted to attack but has no spare muscle.` };
  }

  const combat = resolveCombat(muscleToSend, target.muscle, target.business);

  // Apply losses
  let remainingAttackerLoss = combat.attackerLosses;
  for (const src of muscleSource) {
    const loss = Math.min(remainingAttackerLoss, src.amount);
    src.territory.muscle -= src.amount; // remove sent muscle
    const surviving = src.amount - loss;
    remainingAttackerLoss -= loss;
    // Survivors go to the target territory if won, or return home
    if (combat.success) {
      // survivors will be placed on conquered territory
    } else {
      src.territory.muscle += surviving;
    }
  }

  target.muscle = Math.max(0, target.muscle - combat.defenderLosses);

  if (combat.success) {
    const prevOwner = target.owner;
    target.owner = familyId;
    const survivingAttackers = muscleToSend - combat.attackerLosses;
    target.muscle += survivingAttackers;
    
    // Track last attacker for elimination bounty
    if (prevOwner) {
      state.families[prevOwner].lastAttackedBy = familyId;
    }
    
    // Business resets to protection on conquest (territory is damaged)
    target.business = 'protection';
    
    return {
      turn: state.turn,
      actor: family.name,
      action: 'attack',
      details: `${family.name} attacked ${target.name} (owned by ${prevOwner || 'nobody'}) with ${muscleToSend} muscle.`,
      result: `Victory! Captured ${target.name}. Lost ${combat.attackerLosses}, defender lost ${combat.defenderLosses}.`,
    };
  } else {
    return {
      turn: state.turn,
      actor: family.name,
      action: 'attack',
      details: `${family.name} attacked ${target.name} with ${muscleToSend} muscle.`,
      result: `Defeated! Lost ${combat.attackerLosses}, defender lost ${combat.defenderLosses}.`,
    };
  }
}

function executeAIClaim(state: SaveState, familyId: string, unclaimed: Territory[]): GameEvent {
  const family = state.families[familyId];
  const target = unclaimed[Math.floor(Math.random() * unclaimed.length)];
  target.owner = familyId;
  target.business = 'protection'; // Initialize with basic business
  // Move 1 muscle from strongest territory
  const myTerritories = state.territories.filter(t => t.owner === familyId && t.muscle > 1 && t.id !== target.id);
  if (myTerritories.length > 0) {
    myTerritories.sort((a, b) => b.muscle - a.muscle);
    myTerritories[0].muscle--;
    target.muscle = 1;
  }
  return {
    turn: state.turn,
    actor: family.name,
    action: 'claim',
    details: `${family.name} claimed ${target.name}.`,
  };
}

function executeAIHire(state: SaveState, familyId: string): GameEvent {
  const family = state.families[familyId];
  const count = Math.min(3, Math.floor(family.wealth / MUSCLE_HIRE_COST));
  if (count <= 0) return { turn: state.turn, actor: family.name, action: 'wait', details: `${family.name} can't afford muscle.` };

  family.wealth -= count * MUSCLE_HIRE_COST;
  // Place hired muscle on weakest territory
  const myTerritories = state.territories.filter(t => t.owner === familyId);
  myTerritories.sort((a, b) => a.muscle - b.muscle);
  myTerritories[0].muscle += count;

  return {
    turn: state.turn,
    actor: family.name,
    action: 'hire',
    details: `${family.name} hired ${count} muscle ($${count * MUSCLE_HIRE_COST}), stationed at ${myTerritories[0].name}.`,
  };
}

function executeAIBusiness(state: SaveState, familyId: string, target: Territory, businessType: BusinessType): GameEvent {
  const family = state.families[familyId];
  const businessDef = BUSINESS_DEFINITIONS[businessType];
  family.wealth -= businessDef.cost;
  target.business = businessType;
  return {
    turn: state.turn,
    actor: family.name,
    action: 'business',
    details: `${family.name} established ${businessDef.name} at ${target.name} ($${businessDef.cost}). Income: $${businessDef.income}/turn.`,
  };
}

// ── Turn Processing ──

function processEconomy(): GameEvent[] {
  const events: GameEvent[] = [];
  for (const familyId of Object.keys(gameState.families)) {
    const result = processFamilyEconomy(gameState, familyId);
    gameState.families[familyId].wealth = result.netWealth;
    const family = gameState.families[familyId];
    const income = result.income;
    const upkeep = result.upkeep;
    events.push({
      turn: gameState.turn,
      actor: family.name,
      action: 'income',
      details: `${family.name}: earned $${income}, upkeep $${upkeep}, net $${income - upkeep}. Wealth: $${family.wealth}${result.deserted > 0 ? `. ${result.deserted} muscle deserted!` : ''}`,
    });
  }
  return events;
}

function processAITurns(): GameEvent[] {
  // Fallback mechanical AI — used when LLM bridge is unavailable
  const events: GameEvent[] = [];
  const aiFamilies = Object.keys(gameState.families).filter(f => f !== gameState.playerFamily);
  for (const familyId of aiFamilies) {
    const eliminated = getEliminatedFamilies(gameState);
    if (eliminated.includes(familyId)) continue;
    const event = aiDecideAction(familyId, gameState);
    if (event) {
      events.push(event);
    }
  }
  return events;
}

/**
 * Execute an AI action returned by the LLM agent.
 * The agent decides WHAT to do; this function executes the mechanics.
 */
function executeAIAction(familyId: string, action: AIAction): GameEvent {
  const family = gameState.families[familyId];
  if (!family) {
    return { turn: gameState.turn, actor: familyId, action: 'wait', details: 'Family not found.' };
  }

  const tauntSuffix = action.taunt ? ` "${action.taunt}"` : '';

  switch (action.action) {
    case 'attack': {
      if (!action.target) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} considered an attack but had no target.${tauntSuffix}` };
      }
      const target = gameState.territories.find(t => t.id === action.target);
      if (!target || target.owner === familyId || target.owner === null) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} targeted invalid territory.${tauntSuffix}` };
      }
      return { ...executeAIAttack(gameState, familyId, target), details: `${family.name} attacked ${target.name} (${gameState.families[target.owner!]?.name || 'unknown'}). ${action.reasoning}${tauntSuffix}` };
    }

    case 'claim': {
      const unclaimed = action.target
        ? gameState.territories.filter(t => t.id === action.target && t.owner === null)
        : gameState.territories.filter(t => t.owner === null);
      if (unclaimed.length === 0) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} tried to claim territory but none available.${tauntSuffix}` };
      }
      const result = executeAIClaim(gameState, familyId, unclaimed);
      return { ...result, details: `${result.details} ${action.reasoning}${tauntSuffix}` };
    }

    case 'hire': {
      if (family.wealth < MUSCLE_HIRE_COST) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} wanted to hire but can't afford it.${tauntSuffix}` };
      }
      const result = executeAIHire(gameState, familyId);
      return { ...result, details: `${result.details} ${action.reasoning}${tauntSuffix}` };
    }

    case 'business': {
      if (!action.business) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} wanted to upgrade business but didn't specify which.${tauntSuffix}` };
      }
      const myTerritories = gameState.territories.filter(t => t.owner === familyId);
      const target = action.target
        ? myTerritories.find(t => t.id === action.target)
        : myTerritories[0]; // default to first territory
      
      if (!target) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} wanted to upgrade business but had no valid territory.${tauntSuffix}` };
      }
      
      const businessDef = BUSINESS_DEFINITIONS[action.business];
      if (!canUpgradeBusiness(target.business, action.business)) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} wanted to upgrade ${target.name} to ${businessDef.name} but can't upgrade from ${BUSINESS_DEFINITIONS[target.business].name}.${tauntSuffix}` };
      }
      
      if (family.wealth < businessDef.cost) {
        return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} wanted to upgrade business but couldn't afford it.${tauntSuffix}` };
      }
      
      const result = executeAIBusiness(gameState, familyId, target, action.business);
      return { ...result, details: `${result.details} ${action.reasoning}${tauntSuffix}` };
    }

    case 'wait':
    default:
      return { turn: gameState.turn, actor: family.name, action: 'wait', details: `${family.name} bides their time. ${action.reasoning}${tauntSuffix}` };
  }
}

/**
 * Process AI diplomacy message from LLM response.
 */
function processAIDiplomacy(familyId: string, action: AIAction): GameEvent | null {
  if (!action.diplomacy) return null;

  const family = gameState.families[familyId];
  const { type, target, targetFamily } = action.diplomacy;

  // Validate
  if (!gameState.families[target]) return null;
  if (target === familyId) return null;
  if (type === 'coordinate_attack' && (!targetFamily || !gameState.families[targetFamily])) return null;

  // Block duplicate proposals — don't re-propose if there's already an accepted or pending one
  if (type === 'partnership' || type === 'coordinate_attack') {
    const existingActive = gameState.diplomacy.find(d =>
      d.from === familyId && d.to === target && d.type === type &&
      (d.status === 'pending' || d.status === 'accepted')
    );
    if (existingActive) {
      console.log(`[diplomacy] Blocked duplicate ${type} from ${familyId} to ${target} (already ${existingActive.status})`);
      return null;
    }
  }

  const msg: DiplomacyMessage = {
    from: familyId,
    to: target,
    type,
    targetFamily: targetFamily || undefined,
    turn: gameState.turn,
    status: (type === 'partnership' || type === 'coordinate_attack') ? 'pending' : undefined,
  };
  gameState.diplomacy.push(msg);

  const typeLabels: Record<string, string> = {
    partnership: 'proposed a partnership with',
    coordinate_attack: `proposed coordinating an attack on ${gameState.families[targetFamily || '']?.name || targetFamily} with`,
    war: 'declared war on',
    intel: 'shared intel with',
  };

  return {
    turn: gameState.turn,
    actor: family.name,
    action: 'diplomacy',
    details: `${family.name} ${typeLabels[type] || type} ${gameState.families[target].name}.`,
  };
}

/**
 * LLM-driven turn processing — spawns Claude CLI, gets decisions from each family agent.
 */
async function processAITurnsLLM(broadcastEvent: (event: GameEvent) => void): Promise<GameEvent[]> {
  const events: GameEvent[] = [];
  const aiFamilies = Object.keys(gameState.families).filter(f => f !== gameState.playerFamily);

  let bridge: ClaudeAgentBridge | null = null;

  try {
    // Create and spawn the bridge
    console.log('[next-turn] Creating Claude bridge...');
    bridge = new ClaudeAgentBridge({ port: 3456 });
    agentBridges.set(bridge.id, bridge);

    console.log('[next-turn] Spawning Claude CLI...');
    await bridge.spawn();
    console.log(`[next-turn] ✅ Claude bridge connected, processing ${aiFamilies.length} families`);

    // Process each family sequentially
    for (const familyId of aiFamilies) {
      const eliminated = getEliminatedFamilies(gameState);
      if (eliminated.includes(familyId)) continue;

      const familyName = gameState.families[familyId]?.name || familyId;

      try {
        // Broadcast that this family is thinking
        broadcastEvent({
          turn: gameState.turn,
          actor: familyName,
          action: 'thinking',
          details: `${familyName} is deliberating...`,
        });

        // Build prompt with full game context
        const prompt = buildFamilyPrompt(familyId, gameState);

        // Send to Claude and wait for response
        const response = await bridge.sendPrompt(prompt);
        console.log(`[next-turn] ${familyName} response: ${response.substring(0, 200)}`);

        // Parse the LLM response
        const aiAction = parseAIResponse(response);

        if (aiAction) {
          // Process diplomacy first
          const diplomacyEvent = processAIDiplomacy(familyId, aiAction);
          if (diplomacyEvent) {
            events.push(diplomacyEvent);
            broadcastEvent(diplomacyEvent);
          }

          // Execute the action
          const actionEvent = executeAIAction(familyId, aiAction);
          events.push(actionEvent);
          broadcastEvent(actionEvent);
        } else {
          // Failed to parse — fallback to mechanical AI for this family
          console.warn(`[next-turn] Failed to parse LLM response for ${familyName}, using fallback`);
          const fallbackEvent = aiDecideAction(familyId, gameState);
          if (fallbackEvent) {
            events.push(fallbackEvent);
            broadcastEvent(fallbackEvent);
          }
        }
      } catch (e) {
        console.error(`[next-turn] Error processing ${familyName}:`, e);
        // Fallback to mechanical AI for this family
        const fallbackEvent = aiDecideAction(familyId, gameState);
        if (fallbackEvent) {
          events.push(fallbackEvent);
          broadcastEvent(fallbackEvent);
        }
      }
    }
  } catch (e) {
    console.error('[next-turn] ❌ Bridge failed, falling back to mechanical AI:', e);
    console.error('[next-turn] Error details:', e instanceof Error ? e.message : String(e));
    console.error('[next-turn] Stack:', e instanceof Error ? e.stack : 'N/A');
    // Full fallback — use mechanical AI for all families
    for (const familyId of aiFamilies) {
      const eliminated = getEliminatedFamilies(gameState);
      if (eliminated.includes(familyId)) continue;
      const event = aiDecideAction(familyId, gameState);
      if (event) {
        events.push(event);
        broadcastEvent(event);
      }
    }
  } finally {
    // Clean up bridge
    if (bridge) {
      agentBridges.delete(bridge.id);
      bridge.kill();
    }
  }

  return events;
}

function updateMuscleTotals() {
  for (const familyId of Object.keys(gameState.families)) {
    gameState.families[familyId].totalMuscle = gameState.territories
      .filter(t => t.owner === familyId)
      .reduce((s, t) => s + t.muscle, 0);
  }
}

async function processNextTurn(): Promise<{ events: GameEvent[]; winner: string | null }> {
  gameState.turn++;
  gameState.playerActed = false;
  gameState.playerMessaged = false;
  const turnEvents: GameEvent[] = [];

  // Helper to broadcast and collect events
  const broadcastEvent = (event: GameEvent) => {
    broadcast({ type: 'turn_event', event });
  };

  // 1. Economy phase
  const econEvents = processEconomy();
  turnEvents.push(...econEvents);
  for (const e of econEvents) {
    broadcastEvent(e);
  }

  // 2. AI actions (LLM-driven with fallback)
  const aiEvents = await processAITurnsLLM(broadcastEvent);
  turnEvents.push(...aiEvents);

  // 3. Update totals
  updateMuscleTotals();

  // 4. Check win condition
  const winner = checkWinCondition(gameState);
  if (winner) {
    gameState.phase = 'ended';
    gameState.winner = winner;
    const winEvent: GameEvent = {
      turn: gameState.turn,
      actor: gameState.families[winner]?.name || winner,
      action: 'victory',
      details: `${gameState.families[winner]?.name || winner} has conquered all territories!`,
    };
    turnEvents.push(winEvent);
    broadcastEvent(winEvent);
  }

  // 5. Check eliminations and transfer wealth
  const eliminated = getEliminatedFamilies(gameState);
  for (const fid of eliminated) {
    const eliminatedFamily = gameState.families[fid];
    const elimEvent: GameEvent = {
      turn: gameState.turn,
      actor: eliminatedFamily?.name || fid,
      action: 'eliminated',
      details: `${eliminatedFamily?.name || fid} has been eliminated!`,
    };
    
    // Transfer wealth to last attacker
    if (eliminatedFamily?.lastAttackedBy && eliminatedFamily.wealth > 0) {
      const victor = gameState.families[eliminatedFamily.lastAttackedBy];
      if (victor) {
        victor.wealth += eliminatedFamily.wealth;
        const bountyEvent: GameEvent = {
          turn: gameState.turn,
          actor: victor.name,
          action: 'bounty',
          details: `${victor.name} seized $${eliminatedFamily.wealth} from the eliminated ${eliminatedFamily.name} family!`,
        };
        turnEvents.push(bountyEvent);
        broadcastEvent(bountyEvent);
        eliminatedFamily.wealth = 0;
      }
    }
    
    turnEvents.push(elimEvent);
    broadcastEvent(elimEvent);
  }

  gameState.events.push(...turnEvents);
  saveState();
  return { events: turnEvents, winner };
}

// ── Player Actions ──

type ActionResult = { success: boolean; message: string; events: GameEvent[] };

function playerHireMuscle(count: number, territoryId: string): ActionResult {
  const family = gameState.families[gameState.playerFamily!];
  const territory = gameState.territories.find(t => t.id === territoryId && t.owner === gameState.playerFamily);
  if (!territory) return { success: false, message: 'You do not own that territory.', events: [] };

  const cost = count * MUSCLE_HIRE_COST;
  if (family.wealth < cost) return { success: false, message: `Not enough wealth. Need $${cost}, have $${family.wealth}.`, events: [] };

  family.wealth -= cost;
  territory.muscle += count;
  updateMuscleTotals();
  const event: GameEvent = {
    turn: gameState.turn,
    actor: family.name,
    action: 'hire',
    details: `Hired ${count} muscle for $${cost}, stationed at ${territory.name}.`,
  };
  gameState.events.push(event);
  // Don't save here - let the action handler save after setting playerActed
  return { success: true, message: event.details, events: [event] };
}

function playerAttack(fromTerritoryIds: string[], targetTerritoryId: string, musclePerTerritory: Record<string, number>): ActionResult {
  const family = gameState.families[gameState.playerFamily!];
  const target = gameState.territories.find(t => t.id === targetTerritoryId);
  if (!target) return { success: false, message: 'Invalid target territory.', events: [] };
  if (target.owner === gameState.playerFamily) return { success: false, message: 'Cannot attack your own territory.', events: [] };

  // Validate and collect muscle
  let totalMuscle = 0;
  const sources: { territory: Territory; amount: number }[] = [];
  for (const [tid, amount] of Object.entries(musclePerTerritory)) {
    const t = gameState.territories.find(tt => tt.id === tid && tt.owner === gameState.playerFamily);
    if (!t) return { success: false, message: `You don't own territory ${tid}.`, events: [] };
    if (amount > t.muscle) return { success: false, message: `Not enough muscle in ${t.name}. Has ${t.muscle}, trying to send ${amount}.`, events: [] };
    if (amount > 0) {
      sources.push({ territory: t, amount });
      totalMuscle += amount;
    }
  }

  if (totalMuscle <= 0) return { success: false, message: 'Must send at least 1 muscle.', events: [] };

  const combat = resolveCombat(totalMuscle, target.muscle, target.business);

  // Remove sent muscle from source territories
  for (const src of sources) {
    src.territory.muscle -= src.amount;
  }

  // Apply defender losses
  target.muscle = Math.max(0, target.muscle - combat.defenderLosses);

  const events: GameEvent[] = [];
  if (combat.success) {
    const prevOwner = target.owner;
    target.owner = gameState.playerFamily!;
    const surviving = totalMuscle - combat.attackerLosses;
    target.muscle += surviving;
    
    // Track last attacker for elimination bounty
    if (prevOwner) {
      gameState.families[prevOwner].lastAttackedBy = gameState.playerFamily!;
    }
    
    // Business resets to protection on conquest (territory is damaged)
    target.business = 'protection';
    
    const event: GameEvent = {
      turn: gameState.turn,
      actor: family.name,
      action: 'attack',
      details: `Attacked ${target.name}${prevOwner ? ` (${gameState.families[prevOwner]?.name})` : ''} with ${totalMuscle} muscle.`,
      result: `Victory! Captured ${target.name}. Lost ${combat.attackerLosses}, they lost ${combat.defenderLosses}.`,
    };
    events.push(event);
  } else {
    // Survivors return to first source territory
    const surviving = totalMuscle - combat.attackerLosses;
    if (surviving > 0 && sources.length > 0) {
      sources[0].territory.muscle += surviving;
    }
    const event: GameEvent = {
      turn: gameState.turn,
      actor: family.name,
      action: 'attack',
      details: `Attacked ${target.name} with ${totalMuscle} muscle.`,
      result: `Defeated! Lost ${combat.attackerLosses}, they lost ${combat.defenderLosses}.`,
    };
    events.push(event);
  }

  updateMuscleTotals();

  // Check win condition after attack
  const winner = checkWinCondition(gameState);
  if (winner) {
    gameState.phase = 'ended';
    gameState.winner = winner;
    events.push({
      turn: gameState.turn,
      actor: gameState.families[winner]?.name || winner,
      action: 'victory',
      details: `${gameState.families[winner]?.name || winner} has conquered all territories!`,
    });
  }

  gameState.events.push(...events);
  // Don't save here - let the action handler save after setting playerActed
  return { success: true, message: events[0].result || events[0].details, events };
}

function playerBusiness(territoryId: string, businessType: BusinessType): ActionResult {
  const family = gameState.families[gameState.playerFamily!];
  const territory = gameState.territories.find(t => t.id === territoryId && t.owner === gameState.playerFamily);
  if (!territory) return { success: false, message: 'You do not own that territory.', events: [] };
  
  const businessDef = BUSINESS_DEFINITIONS[businessType];
  
  // Validate upgrade path
  if (!canUpgradeBusiness(territory.business, businessType)) {
    return { success: false, message: `Cannot upgrade from ${BUSINESS_DEFINITIONS[territory.business].name} to ${businessDef.name}.`, events: [] };
  }
  
  if (family.wealth < businessDef.cost) {
    return { success: false, message: `Not enough wealth. Need $${businessDef.cost}, have $${family.wealth}.`, events: [] };
  }

  family.wealth -= businessDef.cost;
  territory.business = businessType;
  const event: GameEvent = {
    turn: gameState.turn,
    actor: family.name,
    action: 'business',
    details: `Established ${businessDef.name} at ${territory.name} ($${businessDef.cost}). Income: $${businessDef.income}/turn.`,
  };
  gameState.events.push(event);
  // Don't save here - let the action handler save after setting playerActed
  return { success: true, message: event.details, events: [event] };
}

function playerMoveMuscle(fromTerritoryId: string, toTerritoryId: string, amount: number): ActionResult {
  const from = gameState.territories.find(t => t.id === fromTerritoryId && t.owner === gameState.playerFamily);
  const to = gameState.territories.find(t => t.id === toTerritoryId && t.owner === gameState.playerFamily);
  if (!from) return { success: false, message: 'You do not own the source territory.', events: [] };
  if (!to) return { success: false, message: 'You do not own the destination territory.', events: [] };
  if (amount <= 0 || amount > from.muscle) return { success: false, message: `Invalid amount. ${from.name} has ${from.muscle} muscle.`, events: [] };

  from.muscle -= amount;
  to.muscle += amount;
  updateMuscleTotals();
  const event: GameEvent = {
    turn: gameState.turn,
    actor: gameState.families[gameState.playerFamily!].name,
    action: 'move',
    details: `Moved ${amount} muscle from ${from.name} to ${to.name}.`,
  };
  gameState.events.push(event);
  // Don't save here - let the action handler save after setting playerActed
  return { success: true, message: event.details, events: [event] };
}

function playerSendMessage(toFamily: string, type: DiplomacyMessage['type'], targetFamily?: string): ActionResult {
  const from = gameState.playerFamily!;
  if (!gameState.families[toFamily]) return { success: false, message: 'Invalid target family.', events: [] };

  const msg: DiplomacyMessage = { 
    from, 
    to: toFamily, 
    type, 
    targetFamily, 
    turn: gameState.turn,
    status: (type === 'partnership' || type === 'coordinate_attack') ? 'pending' : undefined
  };
  gameState.diplomacy.push(msg);

  const typeLabels: Record<string, string> = {
    partnership: 'proposed a partnership',
    coordinate_attack: `proposed coordinating an attack on ${gameState.families[targetFamily || '']?.name || targetFamily}`,
    war: 'declared war',
    intel: `shared intel about ${gameState.families[targetFamily || '']?.name || targetFamily}`,
  };

  const event: GameEvent = {
    turn: gameState.turn,
    actor: gameState.families[from].name,
    action: 'diplomacy',
    details: `${gameState.families[from].name} ${typeLabels[type]} with ${gameState.families[toFamily].name}.`,
  };
  gameState.events.push(event);
  // Don't save here - let the action handler save after setting playerMessaged
  return { success: true, message: event.details, events: [event] };
}

// ── HTTP + WebSocket Server ──

const app = new Hono();
app.use('*', cors());

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', turn: gameState.turn }));

// Get game state
app.get('/api/state', (c) => c.json(gameState));

// Start new game (choose family)
app.post('/api/start', async (c) => {
  const body = await c.req.json();
  const familyId = body.familyId;
  if (!['marinelli', 'rossetti', 'falcone', 'moretti'].includes(familyId)) {
    return c.json({ error: 'Invalid family' }, 400);
  }
  gameState = createInitialState();
  gameState.playerFamily = familyId;
  gameState.phase = 'playing';
  gameState.turn = 1;
  saveState();
  broadcast({ type: 'state_update', state: gameState });
  return c.json({ success: true, state: gameState });
});

// Next turn (LLM-driven, async with real-time streaming)
app.post('/api/next-turn', async (c) => {
  if (gameState.phase !== 'playing') return c.json({ error: 'Game is not in progress.' }, 400);
  if (isProcessingTurn) return c.json({ error: 'Turn is already being processed.' }, 400);

  isProcessingTurn = true;

  // Broadcast turn start
  broadcast({ type: 'turn_start', turn: gameState.turn + 1 });

  try {
    const result = await processNextTurn();

    // Events already broadcast in real-time during processing
    broadcast({ type: 'turn_complete', turn: gameState.turn, winner: result.winner });
    broadcast({ type: 'state_update', state: gameState });
    return c.json({ success: true, turn: gameState.turn, events: result.events, winner: result.winner });
  } catch (e) {
    console.error('[api/next-turn] Error:', e);
    return c.json({ error: 'Failed to process turn.' }, 500);
  } finally {
    isProcessingTurn = false;
  }
});

// Player action
app.post('/api/action', async (c) => {
  if (gameState.phase !== 'playing') return c.json({ error: 'Game is not in progress.' }, 400);
  if (!gameState.playerFamily) return c.json({ error: 'No family selected.' }, 400);

  const body = await c.req.json();
  const { action } = body;

  // Messages (diplomacy) are free — don't count as the player's action.
  // This matches AI families which get 1 action + 1 optional diplomacy per turn.
  const isMessage = action === 'message';

  if (!isMessage && gameState.playerActed) {
    return c.json({ error: 'You already used your action this turn. Click Next Turn to continue.' }, 400);
  }
  if (isMessage && gameState.playerMessaged) {
    return c.json({ error: 'You already sent a message this turn.' }, 400);
  }

  let result: ActionResult;

  switch (action) {
    case 'hire':
      result = playerHireMuscle(body.count || 1, body.territoryId);
      break;
    case 'attack':
      result = playerAttack(body.fromTerritoryIds || [], body.targetTerritoryId, body.musclePerTerritory || {});
      break;
    case 'business':
      result = playerBusiness(body.territoryId, body.businessType);
      break;
    case 'move':
      result = playerMoveMuscle(body.fromTerritoryId, body.toTerritoryId, body.amount || 1);
      break;
    case 'message':
      result = playerSendMessage(body.toFamily, body.messageType, body.targetFamily);
      break;
    default:
      return c.json({ error: 'Unknown action: ' + action }, 400);
  }

  if (result.success) {
    if (isMessage) {
      gameState.playerMessaged = true;
    } else {
      gameState.playerActed = true;
    }
    saveState();
    broadcast({ type: 'state_update', state: gameState });
  }
  return c.json(result);
});

// Reset game
app.post('/api/reset', async (c) => {
  gameState = createInitialState();
  saveState();
  broadcast({ type: 'state_update', state: gameState });
  return c.json({ success: true });
});

// Respond to diplomacy message (accept/reject)
app.post('/api/diplomacy-respond', async (c) => {
  if (gameState.phase !== 'playing') return c.json({ error: 'Game is not in progress.' }, 400);
  if (!gameState.playerFamily) return c.json({ error: 'No player family selected.' }, 400);
  
  const body = await c.req.json();
  const { messageIndex, response } = body; // response: 'accept' | 'reject'
  
  if (typeof messageIndex !== 'number') return c.json({ error: 'Invalid messageIndex.' }, 400);
  if (response !== 'accept' && response !== 'reject') return c.json({ error: 'Invalid response. Must be "accept" or "reject".' }, 400);
  
  const msg = gameState.diplomacy[messageIndex];
  if (!msg) return c.json({ error: 'Message not found.' }, 400);
  if (msg.to !== gameState.playerFamily) return c.json({ error: 'This message is not for you.' }, 400);
  if (msg.status && msg.status !== 'pending') return c.json({ error: 'Message already responded to.' }, 400);
  
  // Update message status
  msg.status = response === 'accept' ? 'accepted' : 'rejected';
  msg.respondedTurn = gameState.turn;
  console.log('[diplomacy-respond] Updated message:', JSON.stringify(msg));
  
  const family = gameState.families[gameState.playerFamily];
  const fromFamily = gameState.families[msg.from];
  const typeLabels: Record<string, string> = {
    partnership: 'partnership',
    coordinate_attack: 'coordinate attack proposal',
    war: 'war declaration',
    intel: 'intelligence sharing',
  };
  
  const event: GameEvent = {
    turn: gameState.turn,
    actor: family.name,
    action: 'diplomacy',
    details: `${family.name} ${response === 'accept' ? 'accepted' : 'rejected'} ${fromFamily.name}'s ${typeLabels[msg.type]}.`,
  };
  gameState.events.push(event);
  console.log('[diplomacy-respond] About to save, diplomacy array:', JSON.stringify(gameState.diplomacy));
  saveState();
  broadcast({ type: 'state_update', state: gameState });
  
  return c.json({ success: true, message: event.details, events: [event] });
});

// ── WebSocket for live updates ──

const server = Bun.serve({
  port: 3456,
  // LLM agent calls can take 60s+ per turn — disable idle timeout
  idleTimeout: 255, // max value in Bun (seconds)
  fetch(req, server) {
    const url = new URL(req.url);

    // Browser WebSocket upgrade
    if (url.pathname === '/ws') {
      const sessionId = url.searchParams.get('session') || crypto.randomUUID();
      if (server.upgrade(req, { data: { sessionId, type: 'browser' } })) return;
      return new Response('WebSocket upgrade failed', { status: 500 });
    }

    // Claude Agent WebSocket upgrade
    const agentMatch = url.pathname.match(/^\/ws\/agent\/(.+)$/);
    if (agentMatch) {
      const agentSessionId = agentMatch[1];
      if (server.upgrade(req, { data: { sessionId: agentSessionId, type: 'agent' } })) return;
      return new Response('Agent WebSocket upgrade failed', { status: 500 });
    }

    // Forward to Hono
    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: {
    open(ws: any) {
      const { sessionId, type } = ws.data || {};
      if (type === 'agent') {
        // Claude CLI agent connected
        const bridge = agentBridges.get(sessionId);
        if (bridge) {
          bridge.handleCliConnection(ws);
          console.log(`🤖 Agent connected: ${sessionId}`);
        } else {
          console.warn(`⚠️ Agent connected but no bridge found: ${sessionId}`);
        }
      } else {
        // Browser connected
        browserClients.set(sessionId, ws);
        console.log(`🌐 Browser connected: ${sessionId} (${browserClients.size} total)`);
        ws.send(JSON.stringify({ type: 'state_update', state: gameState }));
      }
    },
    message(ws: any, msg: string) {
      const { sessionId, type } = ws.data || {};
      if (type === 'agent') {
        // Message from Claude CLI
        const bridge = agentBridges.get(sessionId);
        if (bridge) {
          bridge.handleCliMessage(msg as string);
        }
      } else {
        // Message from browser
        try {
          const data = JSON.parse(msg as string);
          console.log(`📩 WS message:`, data.type);
        } catch {}
      }
    },
    close(ws: any) {
      const { sessionId, type } = ws.data || {};
      if (type === 'agent') {
        const bridge = agentBridges.get(sessionId);
        if (bridge) {
          bridge.handleCliClose();
        }
        console.log(`🤖 Agent disconnected: ${sessionId}`);
      } else {
        for (const [id, client] of browserClients) {
          if (client === ws) {
            browserClients.delete(id);
            console.log(`👋 Browser disconnected: ${id}`);
            break;
          }
        }
      }
    },
  },
});

console.log(`
🎮 Gangs of Claude - Territory Control
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server:    http://localhost:3456
🔌 WebSocket: ws://localhost:3456/ws
📁 Save file: ${saveJsonPath}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
