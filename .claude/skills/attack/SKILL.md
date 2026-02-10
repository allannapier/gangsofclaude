---
name: attack
description: Launch a violent action against a target. Attack types include: assassinate, beatdown, business, territory
argument-hint: [target] [type]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Attack

Launch a violent action against a target character or family.

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

## Combat Resolution

The main Claude acts as arbitrator for all combat:

```
attack_power = (player.soldiers * 10) + (player.territory * 5) + (player.wealth / 100) + random(1-20)
defense_power = (target.soldiers * 10) + (target.territory * 5) + (target.wealth / 100) + random(1-20)

if attack_power > defense_power * 1.2:
    # Decisive victory
elif attack_power > defense_power:
    # Marginal victory
else:
    # Defeat
```

## Outcomes

**Decisive Victory:**
- Attacker losses: 5-15%
- Defender losses: 30-50%
- Display `templates/attack-success.txt` ASCII art
- Gain territory/wealth based on attack type

**Marginal Victory:**
- Attacker losses: 15-30%
- Defender losses: 15-30%
- Both sides hurt, minor gains

**Defeat:**
- Attacker losses: 30-50%
- Defender losses: 5-15%
- Display `templates/attack-failure.txt` ASCII art
- Lose respect, may gain enemies

## Special: Assassination

If attack type is "assassinate":
- Display `templates/assassination.txt` ASCII art
- Target has chance to die based on success margin
- If caught: Major respect loss, bounty on your head
- If successful: Major respect gain, fear generated

## Process

1. Read game state
2. Validate target and attack type
3. Check rank restrictions
4. Calculate combat power
5. Resolve combat
6. Display appropriate ASCII art
7. Update game state (wealth, territory, relationships)
8. Save game state
