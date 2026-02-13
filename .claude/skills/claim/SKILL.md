---
name: claim
description: Claim unowned territory for your family. Costs wealth, may provoke rivals.
argument-hint: [territory]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Claim Territory

Claim a specific unowned territory for your family.

## Usage

`/claim [territory]`

Territory examples: Brooklyn, Queens, Bronx, Manhattan, Staten Island, East Side, West Side, Harlem, etc.

## Costs

| Claim Cost | Wealth Cost | Risk Level |
|------------|-------------|-------------|
| Any unclaimed territory | 25 wealth | Low-Medium |

**Success Formula:**
- Claiming succeeds if territory is unowned
- High respect = Higher chance of claim being recognized
- Wealth cost: 25 per territory

## Risks

**Provocation Chance:**
- 15% chance a rival family notices your expansion
- If you claim territory adjacent to a rival: 35% chance they respond
- If multiple families border the territory: 50% chance of conflict

**If challenged by rival:**
- They may attack the new territory
- They may send threats
- They may demand you withdraw

## Process

1. Read game state
2. Check player has enough wealth (25)
3. Verify territory is currently unowned
4. Calculate if rivals are provoked
5. If provoked: Generate rival response event
6. **IMPORTANT**: Update the `territoryOwnership` map in save.json. Add the claimed territory with the player's family ID as the owner. For example, if Marinelli claims "East Harbor", add `"East Harbor": "marinelli"` to the territoryOwnership map
7. Increment the family's territory count
8. Deduct wealth from player
9. Save game state
10. Display results with narrative

**Restriction:** Only Associates and above can claim territory. Outsiders must first join a family via `/seek-patronage`.
