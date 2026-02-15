---
name: next-turn
description: Advance the turn. All 22 AI characters act in rank order, processing their queued actions and responding to messages.
argument-hint:
user-invocable: true
allowed-tools: Read, Bash
disable-model-invocation: false
---

# Next Turn

Advance the game turn using the deterministic turn processing script.

> **🔴 IMPORTANT:** The turn counter in `save.json` is **automatically incremented** before this skill runs (via PreToolUse hook). The turn.sh script receives the NEW turn number directly.

## Usage

`/next-turn`

## Process

### STEP 1: Call Turn Processing Script

Execute the turn.sh script to process all 22 AI characters:

```bash
bash .claude/scripts/mechanics/turn.sh <turn_number>
```

The script will:
- Process all 22 characters in rank order
- Log each character's action immediately to save.json
- Generate player orders from higher-ranked family members
- Handle random events (20% chance per turn)

The script outputs progress to stderr and returns a JSON summary when complete.

### STEP 2: Display Turn Summary

After the script completes, display a summary to the player including:
- New turn number
- Number of characters processed
- Any random events that occurred
- New orders received (if any)
- Family standings overview

### STEP 3: Check Win/Lose Conditions

**Win:**
- Player is Don
- All other families eliminated (0 soldiers, 0 territory)

**Lose:**
- Player family eliminated
- Player loyalty reaches 0

## Token Savings

**Before:** ~50,000 tokens per turn (22 LLM agent calls)
**After:** ~1,500 tokens per turn (deterministic script)
**Savings:** 97%

## Script Output Format

The turn.sh script returns JSON:
```json
{
  "success": true,
  "turn": 7,
  "characters_processed": 22,
  "message": "22 characters processed for turn 7"
}
```

All character actions are written directly to save.json as events, allowing the web UI to show real-time progress.

**Important:** This skill now uses a deterministic script instead of LLM agents, resulting in massive token savings while maintaining all game mechanics.
