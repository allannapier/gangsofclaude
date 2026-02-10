---
name: promote
description: Check if you qualify for rank promotion and attempt to advance within your family.
argument-hint: 
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Promote

Check if you qualify for rank promotion and attempt to advance within your family.

## Usage

`/promote`

## Promotion Requirements

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

## Promotion Process

1. Read game state
2. Check player's current rank
3. Verify all requirements for next rank are met
4. Calculate success chance:

```
base_chance = 70%
+player.respect/4
+family_loyalty/10
-(current_rank_holders * 5)
```

5. Roll for success
6. If successful:
   - Update player rank
   - Display `templates/promotion.txt` ASCII art
   - Grant new abilities
   - Family celebrates (relationship bonuses)
7. If failed:
   - Lose -5 respect
   - Must wait 5 turns before trying again
8. Save game state

## Special Circumstances

**Don Death:**
- When a Don dies, all Underbosses compete for position
- Player can declare if they're Underboss+
- Civil war may erupt

**Family Split:**
- Capos with enough power can form their own family
- Requires 60+ respect, 3+ territories, 5+ soldiers
