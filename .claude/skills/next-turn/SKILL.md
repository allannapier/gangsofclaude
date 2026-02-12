---
name: next-turn
description: Advance the turn. All 22 AI characters act in rank order, processing their queued actions and responding to messages.
argument-hint: 
user-invocable: true
allowed-tools: Read, Write, Edit, Task
disable-model-invocation: false
---

# Next Turn

Advance the game turn using a mechanical simulation loop. Do not block turn progress on long sub-agent conversations.

> **🔴 IMPORTANT:** The turn counter in `save.json` is **automatically incremented** before this skill runs (via PreToolUse hook). When you start, `saveData.turn` already contains the NEW turn number. Use it directly when logging actions - do NOT increment it again.

## Usage

`/next-turn`

## Turn Processing Order

Characters act from lowest rank to highest:

1. **Associates** (4 characters) act first
2. **Soldiers** (6 characters) act second
3. **Capos** (6 characters) act third
4. **Consiglieres** (4 characters) act fourth
5. **Underbosses** (4 characters) act fifth
6. **Dons** (4 characters) act last

## For Each Character (Mechanical, Non-Blocking)

Use only current game-state data to choose actions; do not wait on character sub-agent output.

Action selection:
1. Build deterministic seed: `seed = saveData.turn + character_index + character.loyalty + character.respect`.
2. Map `seed % 6` to:
   - `0 -> attack`
   - `1 -> recruit`
   - `2 -> expand`
   - `3 -> intel`
   - `4 -> message`
   - `5 -> hold`
3. If `character.loyalty < 30`, override action to `hold`.
4. Build a short deterministic target and description from family/rank/action.

MANDATORY logging step after each character:
1. Read `.claude/game-state/save.json`.
2. Append one event:
   - `turn: saveData.turn`
   - `type: 'action'`
   - `actor: '<Character Full Name>'`
   - `action: '<action>'`
   - `target: '<target>'`
   - `description: '<description>'`
   - `timestamp: Date.now()`
3. Write file back immediately.
4. Continue to next character.

Never batch all 22 action logs into one final write.

## Random Events

Each turn, there's a 20% chance of a random event:
- Police crackdown
- Business opportunity
- Rival makes offer
- Betrayal within family
- Black market opens

## Win/Lose Conditions Checked

**Win:**
- Player is Don
- All other families eliminated (0 soldiers, 0 territory)

**Lose:**
- Player family eliminated
- Player assassinated
- Player loyalty reaches 0

## Process

### ✅ AUTOMATIC: Turn Counter Pre-Incremented

**The turn counter is automatically incremented BEFORE this skill runs** (via PreToolUse hook).

When this skill starts, `saveData.turn` already contains the NEW turn number. You do NOT need to increment it - just use `saveData.turn` as-is when logging actions.

### STEP 1: Process All 22 Characters (in rank order)

For each character in rank order:
1. Determine action mechanically from state (no sub-agent dependency).
2. Apply simple numeric effects to family/player/character stats.
3. Log action immediately to `.claude/game-state/save.json` (one write per character).
4. Proceed to next character.

### STEP 2: Finalize Turn
1. Check for random events
2. Check win/lose conditions
3. Save final game state
4. Display turn summary to player

**🔴 CRITICAL RULE:** After EVERY character acts, write their action to save.json immediately. The web interface polls this file every 500ms to show progress. If actions are delayed or batched, the UI appears frozen.

**Important:** This is the heart of the game. With 22 AI characters acting each turn, emergent storytelling is created. Be patient during processing.
