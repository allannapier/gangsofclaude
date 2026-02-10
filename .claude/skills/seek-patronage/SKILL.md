---
name: seek-patronage
description: As an outsider, attempt to get recruited by a family. Target Associates, Soldiers, or Capos - Dons and Underbosses won't meet with you.
argument-hint: [character_name]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Seek Patronage

You are trying to get noticed by a Mafia family to become an Associate.

## Usage

`/seek-patronage [character_id]`

Example: `/seek-patronage enzo_marinelli`

## Valid Targets

**Can approach:**
- Associates (easiest - they're recruiters)
- Soldiers (moderate difficulty)
- Capos (hard - they're busy)

**Cannot approach:**
- Dons (will refuse to meet with outsiders)
- Underbosses (will refuse to meet with outsiders)
- Consiglieres (will refuse to meet with outsiders)

## Success Determination

Base success chance: 40%

**Modifiers:**
- +20% if targeting an Associate
- +10% if player has respect > 5
- +5% per existing contact
- -10% if targeting a Capo
- -15% if player has enemies in that family

**Character traits affect success:**
- Charming/Recruiter traits: +15%
- Cautious traits: -10%
- Aggressive traits: -5%

## Outcomes

**Success:**
- Player becomes Associate of that family
- Player.family set to family name
- Player.rank set to "Associate"
- Gain +5 respect
- Character becomes a contact

**Failure:**
- Lose -5 respect
- May gain an enemy (20% chance)
- Character may warn others about you (message added)

## Process

1. Read game state from `.claude/game-state/save.json`
2. Validate target exists and is approachable
3. If target is Don/Underboss/Consigliere: Refuse with message "They don't meet with street hustlers"
4. Calculate success chance
5. Roll for success (random 1-100)
6. Update game state accordingly
7. Save game state
8. Display outcome to player with narrative text
