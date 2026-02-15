---
name: attack
description: Launch a violent action against a target. Attack types include: assassinate, beatdown, business, territory
argument-hint: [target] [type]
user-invocable: true
allowed-tools: Read, Write, Edit, Bash
disable-model-invocation: false
---

# Attack

Launch a violent action against a target character or family.

## Usage

`/attack [target_family] [attack_type]`

Example: `/attack rossetti assassinate`

## Process

### STEP 1: Parse Arguments

Get the target family and attack type from $ARGUMENTS:
```bash
TARGET_FAMILY="$ARGUMENTS[0]"
ATTACK_TYPE="${ARGUMENTS[1]:-beatdown}"
```

### STEP 2: Call Combat Resolution Script

Execute the combat.sh script to resolve combat:

```bash
RESULT=$(bash .claude/scripts/mechanics/combat.sh "$PLAYER_FAMILY" "$TARGET_FAMILY" "$ATTACK_TYPE")
```

The script returns JSON with:
- Outcome (decisive_victory, marginal_victory, defeat)
- Attack and defense power
- Casualties for both sides
- Territory gained (if applicable)
- Wealth stolen (if applicable)
- Respect changes

### STEP 3: Parse and Display Results

Parse the JSON output and display:
- Combat outcome description
- Casualties sustained
- Territory/wealth gains (if any)
- ASCII art for victory/defeat

### STEP 4: Update Game State

Apply the results from the script to save.json:
- Update family soldier counts
- Update family wealth
- Update territoryOwnership map if territory was gained
- Update player respect
- Log the combat event

## Token Savings

**Before:** ~500 tokens per attack (LLM calculation + narrative)
**After:** ~20 tokens per attack (script calculation + narrative)
**Savings:** 96%

## Attack Types

1. **assassinate** - Attempt to kill target (high risk, high reward)
2. **beatdown** - Send message by injuring target (moderate risk)
3. **business** - Destroy their income sources
4. **territory** - Challenge for control of territory

## Combat Formula

```
attack_power = (soldiers * 10) + (territory * 5) + (wealth / 100) + random(1-20)
defense_power = (soldiers * 10) + (territory * 5) + (wealth / 100) + random(1-20)

if attack_power > defense_power * 1.2:
    decisive_victory
elif attack_power > defense_power:
    marginal_victory
else:
    defeat
```

## Outcomes

**Decisive Victory:** 5-15% attacker losses, 30-50% defender losses, territory gained
**Marginal Victory:** 15-30% losses on both sides, minor gains
**Defeat:** 30-50% attacker losses, 5-15% defender losses, respect lost
