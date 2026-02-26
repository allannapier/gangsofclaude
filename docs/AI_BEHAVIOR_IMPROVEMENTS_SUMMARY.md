# AI Behavior Improvements - Implementation Summary

## Overview

Implemented a comprehensive AI behavior improvement system with:
- Short-term memory for all 4 families
- 16 family-specific scenario skills
- Memory-integrated decision making
- Grudge tracking system

## Components

### 1. Memory Infrastructure

**Files:**
- `.claude/agent-memory/marinelli/MEMORY.md`
- `.claude/agent-memory/rossetti/MEMORY.md`
- `.claude/agent-memory/falcone/MEMORY.md`
- `.claude/agent-memory/moretti/MEMORY.md`

**Features:**
- 3-move strategic planning
- Grudge and debt tracking
- Enemy observations
- Relationship status

### 2. Agent Files

Updated all 4 agent files with:
- Memory workflow (read → assess → decide → update)
- Scenario priority evaluation
- Skill invocation guidance

### 3. Scenario Skills (16 total)

| Scenario | Marinelli | Rossetti | Falcone | Moretti |
|----------|-----------|----------|---------|---------|
| Desperation | All-in attack | Hostile takeover | Chaos coalition | Honorable stand |
| Defensive Crisis | 1.5x retaliation | Economic warfare | Delayed revenge | Measured response |
| Expansion Window | Aggressive claiming | Strategic acquisition | Quiet expansion | Defensive perimeter |
| Dominant Threat | Rally troops | Economic warfare | Chaos strategy | Coalition leader |
| Economic Build | Hire muscle | Upgrade businesses | Gather intel | Balanced growth |

### 4. Integration

**File:** `web/server/ai-prompts.ts`

Added:
- Memory system instructions
- Scenario priority documentation
- Grudge tracking guidance
- Family-specific behavior rules

## How It Works

### Turn Flow
1. Agent reads MEMORY.md
2. Assesses current game state
3. Evaluates scenario priority:
   - DESPERATION (≤2 territories)
   - DEFENSIVE_CRISIS (attacked recently)
   - DOMINANT_THREAT (enemy >40%)
   - EXPANSION_WINDOW (unclaimed)
   - ECONOMIC_BUILD (default)
4. Invokes appropriate skill
5. Decides main action + covert + diplomacy
6. Updates MEMORY.md with results

### Key Behaviors

**Marinelli:**
- Aggressive expansion
- Immediate retaliation
- Muscle-first economy
- Grudge-driven attacks

**Rossetti:**
- Economic optimization
- Strategic partnerships
- ROI-based decisions
- Business-focused warfare

**Falcone:**
- Information gathering
- Manipulation tactics
- Delayed retaliation
- Betrayal at optimal moment

**Moretti:**
- Honorable conduct
- Measured 1.5x retaliation
- Defensive expansion
- Never betray allies

## Testing Recommendations

### Early Game (Turns 1-10)
- Verify all families claim unclaimed territories
- Check distinct expansion patterns per family

### Mid Game (Turns 11-25)
- Verify retaliation when attacked
- Check dominant threat coordination
- Verify grudge tracking

### Late Game (Turns 25+)
- Verify no family is too passive
- Check leader suppression
- Verify desperate behaviors when low on territories

## Files Changed

Total: 25+ files
- 4 memory files
- 4 agent files
- 16 scenario skill files
- 3 original game skills (start-game, status, next-turn)
- 1 prompts file

## Complete File Manifest

See `docs/AI_FILES_MANIFEST.txt` for the complete list of all files.
