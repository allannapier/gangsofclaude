---
name: next-turn
description: Advance the turn. All 22 AI characters act in rank order, processing their queued actions and responding to messages.
argument-hint: 
user-invocable: true
allowed-tools: Read, Write, Edit, Task
disable-model-invocation: false
---

# Next Turn

Advance the game turn. All 22 AI characters act in rank order, creating a dynamic, evolving game world.

## Usage

`/next-turn`

## Turn Processing Order

Characters act from lowest rank to highest:

1. **Associates** (4 characters) act first
2. **Soldiers** (6 characters) act second
3. **Capos** (6 characters) act third
4. **Consiglieres** (4 characters) act fourth
5. **Underbosses** (4 characters) act fifth
6. **Dons** (4 characters) act last

## For Each Character

1. **Spawn their sub-agent** with context:
   - Their current state (wealth, loyalty, respect)
   - Messages they've received
   - Family status and relationships
   - Recent events affecting them

2. **Agent chooses ONE action:**
   - Attack a rival
   - Recruit/Mentor
   - Expand territory
   - Gather intel
   - Send message
   - Do nothing (if cautious)

3. **Resolve action immediately**
   - Update game state
   - Apply effects
   - Record events

4. **Move to next character**

## Random Events

Each turn, there's a 20% chance of a random event:
- Police crackdown
- Business opportunity
- Rival makes offer
- Betrayal within family
- Black market opens

## Win/Lose Conditions Checked

**Win:**
- Player is Don
- All other families eliminated (0 soldiers, 0 territory)

**Lose:**
- Player family eliminated
- Player assassinated
- Player loyalty reaches 0

## Process

1. Increment turn counter
2. For each of 22 characters (in rank order):
   - Spawn their sub-agent
   - Provide context
   - Get their action decision
   - Resolve action
   - Update game state
3. Check for random events
4. Check win/lose conditions
5. Save game state
6. Display turn summary to player

**Important:** This is the heart of the game. With 22 AI characters acting each turn, emergent storytelling is created. Be patient during processing.
