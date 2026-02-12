---
name: next-turn
description: Advance the turn. All 22 AI characters act in rank order, processing their queued actions and responding to messages.
argument-hint: 
user-invocable: true
allowed-tools: Read, Write, Edit, Task
disable-model-invocation: false
---

# Next Turn

Advance the game turn. All 22 AI characters act in rank order, creating a dynamic, evolving game world.

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

## For Each Character

**PROCESS: Parent skill MUST log each action after agent completes**

1. **Spawn sub-agent** with context (state, messages, family status)

2. **Agent decides action** - they return: `{ action, target, description }`

3. **YOU (parent skill) MUST log the action immediately:**
   ```
   Read .claude/game-state/save.json
   Parse to get saveData
   saveData.events.push({
     turn: saveData.turn,
     type: 'action',
     actor: 'Character Name',  // Use the actual character's full name
     action: action_name,       // The action they chose
     target: target_name,       // Who/what they targeted
     description: description,  // What they did
     timestamp: Date.now()
   })
   Write JSON.stringify(saveData, null, 2) back to .claude/game-state/save.json
   ```
   **CRITICAL: Do this IMMEDIATELY after each agent responds, before moving to next character**

4. **Resolve action effects** - update families, territory, etc.

5. **Move to next character**

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

For EACH character:

1. **Spawn sub-agent** with full context

2. **Get their action decision** (they tell you what they want to do)

3. **🔴 MANDATORY: Log the action:**
   ```
   Read .claude/game-state/save.json
   Parse to get saveData
   saveData.events.push({
     turn: saveData.turn,            // The pre-incremented turn number
     type: 'action',
     actor: 'Character Full Name',   // e.g., "Vito Marinelli"
     action: action_name,             // e.g., "attack", "expand", "intel"
     target: target_name,             // e.g., "Rossetti Family"
     description: description,        // Full description of what they did
     timestamp: Date.now()
   })
   Write JSON.stringify(saveData, null, 2) back to .claude/game-state/save.json
   ```
   **⚠️ REQUIRED - The web UI polls this file every 500ms**

4. **Resolve action effects** (update families, territory, wealth, etc.)

5. **Move to next character**

### STEP 2: Finalize Turn
1. Check for random events
2. Check win/lose conditions
3. Save final game state
4. Display turn summary to player

**🔴 CRITICAL RULE:** After EVERY character acts, you MUST write their action to save.json. The web interface polls this file every 500ms to show progress. If you skip this step, the UI will freeze.

**Important:** This is the heart of the game. With 22 AI characters acting each turn, emergent storytelling is created. Be patient during processing.
