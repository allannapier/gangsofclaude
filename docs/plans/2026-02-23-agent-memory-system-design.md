# Agent Short-Term Memory System Design

## Overview

Each family agent maintains a memory file that persists their strategic thinking across turns. This creates continuity, long-term planning, and more human-like decision making.

## Memory Architecture

### Memory File Location

```
.claude/agent-memory/
├── marinelli/
│   └── MEMORY.md
├── rossetti/
│   └── MEMORY.md
├── falcone/
│   └── MEMORY.md
└── moretti/
    └── MEMORY.md
```

### Memory File Structure

```markdown
# <Family Name> Strategic Memory

Last Updated: Turn <number>

## Previous Turn Summary

**Turn <N-1> Actions:**
- Main Action: <action taken>
- Covert Op: <covert op or "None">
- Diplomacy: <diplomacy or "None">
- Target: <who/what was targeted>
- Result: <success/failure and outcome>

**Reasoning:** <why those actions were taken>

## Strategic Assessment

### Current Situation
- Territories: <count> (was <count> last turn)
- Wealth: $<amount> (trend: up/down/stable)
- Muscle: <count> total
- Threat Level: <low/medium/high/critical>

### Enemy Observations
- **<Enemy Family>**: <observations about their behavior, strength, weaknesses>
- **<Enemy Family>**: <observations>

### Relationship Status
- **Allies**: <list allies and trust level>
- **Enemies**: <list enemies and grudge level>
- **Neutral**: <families to watch>

## 3-Move Strategic Plan

### This Turn (Turn <N>)
**Goal:** <immediate objective>
**Planned Actions:**
- Main: <planned main action>
- Covert: <planned covert op>
- Diplomacy: <planned diplomacy>

### Next Turn (Turn <N+1>)
**Goal:** <next objective>
**Conditions:** <what needs to happen to execute this plan>

### Following Turn (Turn <N+2>)
**Goal:** <future objective>
**Contingency:** <backup plan if things change>

## Active Grudges & Debts

### Grudges (Owe Vengeance)
- **<Family>**: <what they did> (Turn <number>) - Priority: <high/medium/low>

### Debts (Owe Loyalty)
- **<Family>**: <what they did for us> (Turn <number>)

## Key Insights

- <strategic observation about game state>
- <prediction about enemy behavior>
- <opportunity spotted>

## Adjustments Needed

Based on current game state vs. previous plan:
- <what changed>
- <how plan adapts>
