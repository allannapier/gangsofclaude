# Game Mechanics Scripts - Integration Guide

This guide shows how to integrate the script-based game mechanics into Claude Code skills.

## Overview

The game mechanics system provides three core functions:

1. **Combat Resolution** (`combat-resolution.sh`) - Calculate attack outcomes
2. **Promotion Check** (`promotion-check.sh`) - Check rank advancement eligibility
3. **Expansion Outcome** (`expansion-outcome.sh`) - Calculate territory expansion results

All scripts output JSON for easy parsing and integration.

## Script Interface

### 1. Combat Resolution Script

**Location:** `.claude/scripts/combat-resolution.sh`

**Usage:**
```bash
./combat-resolution.sh <attacker_family> <defender_family> [attack_type]
```

**Parameters:**
- `attacker_family`: Family ID of attacker (e.g., "marinelli")
- `defender_family`: Family ID of defender (e.g., "rossetti")
- `attack_type`: Optional attack type (default: "territory")
  - Options: assassinate, beatdown, business, territory

**Output:** JSON with outcome, losses, and narrative

**Example Output:**
```json
{
  "outcome": "decisive_victory",
  "attack_type": "assassinate",
  "combat_power": {
    "attacker": 96,
    "defender": 80
  },
  "rolls": {
    "attacker": 15,
    "defender": 5
  },
  "losses": {
    "attacker": {
      "percentage": 12,
      "soldiers_lost": 0
    },
    "defender": {
      "percentage": 45,
      "soldiers_lost": 1
    }
  },
  "narrative": "A crushing victory! Your forces dominated the battlefield."
}
```

### 2. Promotion Check Script

**Location:** `.claude/scripts/promotion-check.sh`

**Usage:**
```bash
./promotion-check.sh
```

**Parameters:** None (reads from save.json)

**Output:** JSON with eligibility status and requirements

**Example Output:**
```json
{
  "current_rank": "Associate",
  "next_rank": "Soldier",
  "eligible": false,
  "success_chance": 76,
  "requirements": {
    "met": [
      {"requirement": "Successful actions", "current": "13/1"}
    ],
    "missing": [
      {"requirement": "Respect", "current": "5/10"},
      {"requirement": "Loyalty", "current": "50/60"},
      {"requirement": "Wealth", "current": "0/100 (cost to buy in)"}
    ]
  }
}
```

### 3. Expansion Outcome Script

**Location:** `.claude/scripts/expansion-outcome.sh`

**Usage:**
```bash
./expansion-outcome.sh <family_id> <size> [territory_name]
```

**Parameters:**
- `family_id`: Family ID (e.g., "marinelli")
- `size`: Expansion size (small, medium, large)
- `territory_name`: Optional specific territory name

**Output:** JSON with territory gain, cost, and provocation status

**Example Output:**
```json
{
  "family_id": "marinelli",
  "expansion_size": "medium",
  "territory": {
    "name": "East Harbor",
    "status": "unowned",
    "gain": 1,
    "current": 3,
    "new": 4,
    "breakdown": {
      "base": 7,
      "respect_bonus": 0
    }
  },
  "cost": {
    "wealth": 150,
    "can_afford": true,
    "current_wealth": 5000,
    "new_wealth": 4850
  },
  "provocation": {
    "provoked": true,
    "rival_family": "falcone",
    "event": "The Falcone family is alarmed by your expansion and threatening retaliation."
  }
}
```

## Integration Examples

### Example 1: Attack Skill Integration

In `.claude/skills/attack/SKILL.md`, add a process step:

```markdown
## Process

1. Read game state
2. Validate target and attack type
3. Check rank restrictions
4. **Call combat resolution script:**
   ```bash
   RESULT=$(.claude/scripts/combat-resolution.sh "$ATTACKER_FAMILY" "$DEFENDER_FAMILY" "$ATTACK_TYPE")
   OUTCOME=$(echo "$RESULT" | jq -r '.outcome')
   NARRATIVE=$(echo "$RESULT" | jq -r '.narrative')
   ATTACKER_LOSSES=$(echo "$RESULT" | jq -r '.losses.attacker.soldiers_lost')
   DEFENDER_LOSSES=$(echo "$RESULT" | jq -r '.losses.defender.soldiers_lost')
   ```
5. Display appropriate ASCII art based on outcome
6. Update game state with losses
7. Save game state
```

### Example 2: Promote Skill Integration

In `.claude/skills/promote/SKILL.md`:

```markdown
## Process

1. Read game state
2. **Check promotion eligibility:**
   ```bash
   PROMOTION_CHECK=$(.claude/scripts/promotion-check.sh)
   ELIGIBLE=$(echo "$PROMOTION_CHECK" | jq -r '.eligible')
   SUCCESS_CHANCE=$(echo "$PROMOTION_CHECK" | jq -r '.success_chance')
   NEXT_RANK=$(echo "$PROMOTION_CHECK" | jq -r '.next_rank')
   ```
3. If not eligible, display missing requirements
4. If eligible, roll for success against SUCCESS_CHANCE
5. Update player rank if successful
6. Save game state
```

### Example 3: Expand Skill Integration

In `.claude/skills/expand/SKILL.md`:

```markdown
## Process

1. Read game state
2. **Calculate expansion outcome:**
   ```bash
   EXPANSION=$(.claude/scripts/expansion-outcome.sh "$FAMILY_ID" "$SIZE" "$TERRITORY_NAME")
   CAN_AFFORD=$(echo "$EXPANSION" | jq -r '.cost.can_afford')
   TERRITORY_GAIN=$(echo "$EXPANSION" | jq -r '.territory.gain')
   PROVOKED=$(echo "$EXPANSION" | jq -r '.provocation.provoked')
   PROVOCATION_EVENT=$(echo "$EXPANSION" | jq -r '.provocation.event')
   ```
3. Check if family can afford expansion
4. Apply territory gain and wealth cost
5. Handle provocation if triggered
6. Update territoryOwnership if specific territory claimed
7. Save game state
```

## Testing

To test the scripts independently:

```bash
# Test combat resolution
.claude/scripts/combat-resolution.sh marinelli rossetti assassinate | jq '.'

# Test promotion check
.claude/scripts/promotion-check.sh | jq '.'

# Test expansion outcome
.claude/scripts/expansion-outcome.sh marinelli medium "East Harbor" | jq '.'
```

## Error Handling

All scripts return structured error messages:

```json
{
  "error": "Attacker family 'invalid' not found"
}
```

Skills should check for errors:

```bash
RESULT=$(.claude/scripts/combat-resolution.sh "$ATTACKER" "$DEFENDER")
if echo "$RESULT" | jq -e '.error' >/dev/null; then
    ERROR_MSG=$(echo "$RESULT" | jq -r '.error')
    echo "Error: $ERROR_MSG"
    exit 1
fi
```

## TypeScript/Web Integration

The `game-mechanics.ts` file provides equivalent TypeScript functions for use in the web UI:

```typescript
import { resolveCombat, checkPromotionEligibility, calculateExpansionOutcome } from './game-mechanics';

// Combat resolution
const combatResult = resolveCombat(
  { soldiers: 3, territory: 3, wealth: 5000 },
  { soldiers: 3, territory: 2, wealth: 6000 },
  'assassinate'
);

// Promotion check
const promotionCheck = checkPromotionEligibility(
  { rank: 'Associate', respect: 5, loyalty: 50, wealth: 0 },
  { soldiers: 3 },
  13,
  1
);

// Expansion outcome
const expansionResult = calculateExpansionOutcome(
  'marinelli',
  'medium',
  { wealth: 5000, territory: 3 },
  5,
  'East Harbor',
  ''
);
```

## Design Principles

1. **Deterministic**: Same inputs produce same outputs (with seed support for testing)
2. **Idempotent**: Scripts can be run multiple times without side effects
3. **Stateless**: Scripts don't modify game state - they only calculate outcomes
4. **JSON Output**: Easy to parse and integrate
5. **Error Handling**: Structured error messages for graceful failure

## Next Steps

1. Add these scripts to the allowed-tools for skills that need them
2. Update skill SKILL.md files with integration examples
3. Create unit tests for edge cases
4. Add support for seeded random numbers for testing
5. Document any game balance formula changes
