---
name: promote
description: Check if you qualify for rank promotion and attempt to advance within your family.
argument-hint:
user-invocable: true
allowed-tools: Bash, Read
disable-model-invocation: false
---

# Promote (Optimized)

Check if you qualify for rank promotion and attempt to advance within your family using the promotion check script.

## Usage

`/promote`

## Promotion Requirements

The promotion script automatically checks all requirements:

### Outsider → Associate
- Successfully complete `/seek-patronage` with any family member
- Automatic upon successful recruitment

### Associate → Soldier
- Respect: 10+
- Complete 1 successful mission for the family
- Family loyalty: 60+
- Cost: 100 wealth (buying your way in)

### Soldier → Capo
- Respect: 30+
- Complete 5 successful actions
- Control at least 1 territory
- Family loyalty: 70+
- Current Capo must die or retire (OR you start your own crew)

### Capo → Underboss
- Respect: 60+
- Control 3+ territories
- Have 5+ soldiers in your crew
- Family loyalty: 80+
- Current Underboss position must be vacant

### Underboss → Don
- Respect: 90+
- Control 5+ territories
- Have 10+ soldiers
- Current Don must die
- Family loyalty: 95+
- Survive any challenges from other Underbosses

## Process

This skill now uses the optimized `promotion.sh` script which:

1. **Reads player stats** from game state
2. **Checks current rank** and next rank requirements
3. **Calculates success chance** using formula:
   ```
   base_chance = 70%
   + player.respect/4
   + family_loyalty/10
   - (current_rank_holders * 5)
   ```
4. **Rolls for success** using deterministic random
5. **Updates player rank** if successful
6. **Returns JSON result** with narrative template

## Token Savings

- **Before**: ~2,000 tokens per promotion check (LLM analyzes requirements)
- **After**: ~100 tokens per promotion check (mechanical calculation)
- **Savings**: 95%

## Execution

Call the promotion script:

\`\`\`bash
# Call promotion script
RESULT=$(bash .claude/scripts/mechanics/promotion.sh)

# Display result
echo "$RESULT" | jq -r '.narrative'

# Update game state (already handled by script)
\`\`\`

The promotion.sh script handles all the requirement checking and success calculation. This skill provides the user interface and displays results.

## What Changed

Previously, this skill would use the LLM to analyze requirements, calculate success chances, and determine outcomes. Now, the promotion.sh script handles all of that deterministically using clear rules and formulas.

The LLM is still used for narrative enhancement - displaying the promotion results in an engaging way.
