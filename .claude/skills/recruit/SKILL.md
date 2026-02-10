---
name: recruit
description: Build your network within your family. As Associate: recruit outsiders. As Soldier+: mentor lower-ranking members.
argument-hint: [target]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Recruit / Mentor

Build your network and strengthen your position within your family.

## Usage

`/recruit [target_id]`

## Rank Restrictions

- **Associate**: Can recruit outsiders to become Associates
- **Soldier**: Can't recruit, but can mentor Associates
- **Capo+**: Can recruit Associates to become Soldiers

## Requirements

**Recruiting (Associate rank):**
- Target must be unaffiliated (outsider)
- Cost: 25 wealth
- Success chance: 50% + (player.respect / 2)

**Mentoring (Soldier+ rank):**
- Target must be lower rank than you
- Target must be in your family
- Cost: 10 wealth per training session
- Success: Target gains +5 loyalty to you

## Outcomes

**Successful Recruitment:**
- Target becomes Associate of your family
- Display `templates/recruit-success.txt` ASCII art
- Gain +5 respect from family
- Target added to your contacts

**Failed Recruitment:**
- Lose wealth cost
- Target may warn others
- Lose -2 respect

**Mentoring Success:**
- Target gains +5 loyalty
- Target gains +3 respect
- You gain +2 respect from family

## Process

1. Read game state
2. Validate player rank and target
3. Check if player has enough wealth
4. Calculate success chance
5. Roll for success
6. Update game state
7. Display outcome with narrative
8. Save game state
