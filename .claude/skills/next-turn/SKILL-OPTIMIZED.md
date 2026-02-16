---
name: next-turn
description: Advance the turn. All 22 AI characters act in rank order, processing their queued actions and responding to messages.
argument-hint:
user-invocable: true
allowed-tools: Bash, Read
disable-model-invocation: false
---

# Next Turn (Optimized)

Advance the game turn using the efficient turn processing script.

> **🔴 IMPORTANT:** The turn counter in `save.json` is **automatically incremented** before this skill runs (via PreToolUse hook). When you start, `saveData.turn` already contains the NEW turn number. Use it directly when logging actions - do NOT increment it again.

## Usage

`/next-turn`

## Process

This skill now uses the optimized `turn.sh` script which:

1. **Reads current game state** (save.json)
2. **Processes all 22 AI characters** deterministically:
   - Associates act first
   - Then Soldiers, Capos, Consiglieres, Underbosses, and Dons
   - Each character selects action based on: seed = turn + index + loyalty + respect
   - Actions are mapped: attack, recruit, expand, intel, message, hold
3. **Updates game state immediately** after each character acts
4. **Generates orders for player** when appropriate
5. **Handles random events** (20% chance per turn)

## Token Savings

- **Before**: ~44,000 tokens per turn (22 AI agents × 2,000 tokens each)
- **After**: ~1,500 tokens per turn (mechanical processing + optional narrative)
- **Savings**: 96.6%

## Execution

Call the turn processing script:

\`\`\`bash
# Get current turn number
TURN_NUMBER=$(jq -r '.turn' .claude/game-state/save.json)

# Process the turn
RESULT=$(bash .claude/scripts/mechanics/turn.sh $TURN_NUMBER)

# Display result
echo "$RESULT" | jq -r '.message'
\`\`\`

The turn.sh script handles all the mechanical processing. This skill provides the user interface and displays results.

## What Changed

Previously, this skill would invoke 22 separate AI agents, each using the LLM to decide actions. Now, the turn.sh script handles all of that deterministically, with the LLM only used for narrative enhancement if needed.

The UI will show real-time progress as each character acts, because turn.sh writes events to save.json immediately after processing each character.
