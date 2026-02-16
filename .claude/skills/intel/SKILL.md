---
name: intel
description: Espionage and information gathering operations. Types: spy, steal, blackmail, survey
argument-hint: [target] [type]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Intel

Conduct espionage and information gathering operations.

## Usage

`/intel [target_id] [operation_type]`

## Operation Types

1. **spy** - Plant a mole in enemy family
   - Cost: 100 wealth
   - Effect: Receive information about target's actions
   - Risk: Mole may be discovered (10% per turn)

2. **steal** - Steal resources from target
   - Cost: 50 wealth
   - Effect: Gain 10-30% of target's wealth
   - Risk: Detection causes relationship damage

3. **blackmail** - Get compromising information on target
   - Cost: 75 wealth
   - Effect: Leverage over target, can force actions
   - Risk: Target may retaliate if discovered

4. **survey** - Assess enemy strength and disposition
   - Cost: 25 wealth
   - Effect: Reveal target's wealth, territory, soldier count
   - Risk: Minimal
   - Target: Can be a character, family name, or territory owner

## Rank Restrictions

- **Associate**: Can only use survey
- **Soldier**: Can use survey, steal
- **Capo+**: Can use all operations

## Outcomes

**Success:**
- Operation effect applied
- Gain intelligence about target
- Information added to game state

**Failure:**
- Lose wealth cost
- May be discovered (varies by operation)
- Relationship damage if discovered

## Process

1. Read game state
2. Validate target and operation type
3. Check rank restrictions
4. Check player has enough wealth
5. Calculate success (base 70% + player respect/5)
6. Apply effects or generate discovery event
7. Save game state
8. Display results
