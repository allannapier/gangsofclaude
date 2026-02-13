---
name: expand
description: Grow your family's territory and business operations. Costs wealth, may provoke rivals.
argument-hint: [amount]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Expand

Grow your family's territory and increase income.

## Usage

`/expand [amount] [territory]`

Amount options: small, medium, large
Territory (optional): Specific territory name to target

If territory is specified and is unowned, it will be claimed.
If territory is specified and is owned by another family, expansion will target that area.
If territory is not specified, random expansion occurs.

## Costs and Benefits

| Size | Wealth Cost | Territory Gain | Risk Level |
|------|-------------|----------------|------------|
| small | 50 | +1-3 territory | Low |
| medium | 150 | +4-7 territory | Medium |
| large | 400 | +8-15 territory | High |

## Risks

**Provocation Chance:**
- Small: 10% chance rival notices
- Medium: 30% chance rival notices
- Large: 60% chance rival notices

**If noticed by rival:**
- They may attack your new territory
- They may send threats
- They may demand you stop

## Success Formula

territory_gained = random(min, max) + (player.respect / 10)

High respect = Better expansion results

## Process

1. Read game state
2. Check player has enough wealth
3. Calculate territory gain
4. Roll for provocation
5. If provoked: Generate rival response event
6. **IMPORTANT**: If a specific territory name was provided and expansion succeeds:
   - Update the `territoryOwnership` map in save.json with the player's family ID as the owner
   - For random/generic expansion, increment the family's territory count but specific territories in `territoryOwnership` should only be added when explicitly named
7. Update family territory count and player wealth
8. Save game state
9. Display results with narrative

**Restriction:** Only Capo and above can authorize expansion. Soldiers and Associates must get permission.
