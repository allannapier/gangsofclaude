---
name: status
description: Display your current character stats, family standings, recent messages, and current events.
argument-hint:
user-invocable: true
allowed-tools: Read, Bash
disable-model-invocation: false
---

# Status

Display a comprehensive overview of your current position in the criminal underworld.

## Usage

`/status`

## Process

### Call Status Display Script

Execute the status.sh script to display formatted status:

```bash
bash .claude/scripts/mechanics/status.sh
```

The script will:
- Display player status (name, rank, family, loyalty, respect, wealth)
- Show family standings for all 4 families
- List recent messages (last 5)
- Show current events
- Display progress to next rank with requirements

## Token Savings

**Before:** ~200 tokens per status call (LLM formatting)
**After:** ~5 tokens per status call (script output)
**Savings:** 97%

## Output Format

The script displays formatted ASCII output with sections:
- Player Status
- Family Standings
- Recent Messages
- Current Events
- Progress to Next Rank

**Note:** This is a read-only operation. No game state changes.
