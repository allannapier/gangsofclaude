---
name: attack
description: Launch a violent action against a target. Attack types include: assassinate, beatdown, business, territory
argument-hint: [target] [type]
user-invocable: true
allowed-tools: Bash, Read
disable-model-invocation: false
---

# Attack (Optimized)

Launch a violent action against a target character or family using the combat resolution script.

## Usage

`/attack [target_id] [attack_type]`

Example: `/attack marco_rossetti assassinate`

## Attack Types

1. **assassinate** - Attempt to kill target (high risk, high reward)
2. **beatdown** - Send message by injuring target (moderate risk)
3. **business** - Destroy their income sources
4. **territory** - Challenge for control of territory

## Rank Restrictions

- **Outsider/Associate**: Can only attack other Associates/outsiders
- **Soldier**: Can attack Associates and Soldiers
- **Capo+**: Can attack anyone

**Attacking above your rank** = Severe consequences if caught

## Process

This skill now uses the optimized `combat.sh` script which:

1. **Reads game state** to get attacker and defender stats
2. **Calculates combat power** using deterministic formulas
3. **Determines outcome** (decisive victory, marginal victory, or defeat)
4. **Calculates losses** for both sides
5. **Updates game state** with casualties and territory changes
6. **Returns JSON result** with narrative template

## Token Savings

- **Before**: ~2,000 tokens per attack (LLM calculates combat)
- **After**: ~100 tokens per attack (mechanical calculation)
- **Savings**: 95%

## Execution

Parse arguments and call the combat script:

\`\`\`bash
# Parse arguments
TARGET="$ARGUMENTS[0]"
TYPE="${ARGUMENTS[1]:-beatdown}"
ATTACKER_FAMILY=$(jq -r '.player.family' .claude/game-state/save.json)

# Call combat script
RESULT=$(bash .claude/scripts/mechanics/combat.sh "$ATTACKER_FAMILY" "$TARGET" "$TYPE")

# Display result
echo "$RESULT" | jq -r '.narrative'

# Update game state (already handled by script)
\`\`\`

The combat.sh script handles all the mechanical resolution. This skill provides the user interface and displays narrative results.

## What Changed

Previously, this skill would use the LLM to calculate combat power, determine outcomes, and decide casualties. Now, the combat.sh script handles all of that deterministically using mathematical formulas.

The LLM is still used for narrative enhancement - displaying the results in an engaging way for the player.
