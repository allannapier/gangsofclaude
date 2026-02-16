# Token Optimization Plan for La Cosa Nostra

## Executive Summary

This document outlines a comprehensive plan to reduce token consumption in the La Cosa Nostra game by converting LLM-based functions to deterministic scripts.

## Current Token Consumption Analysis

### Major Token Consumers

| Function | Est. Tokens/Call | Frequency | Impact |
|----------|-----------------|-----------|--------|
| `/next-turn` | 5,000-10,000 | Every turn | **CRITICAL** |
| `/attack` | 500-1,000 | Per attack | High |
| `/promote` | 300-500 | Per attempt | Medium |
| `/status` | 200-400 | Frequent | Medium |
| `/expand` | 400-600 | Per expansion | Medium |
| `/recruit` | 300-500 | Per recruit | Medium |
| `/intel` | 300-500 | per operation | Medium |

### Total Token Usage (Per 10 Turns)
- Current: ~50,000-100,000 tokens (primarily from /next-turn)
- After optimization: ~5,000-10,000 tokens
- **Savings: 80-90% reduction**

## Implemented Scripts

### 1. Combat Resolution (`combat.sh`)
**Location:** `.claude/scripts/mechanics/combat.sh`

**Replaces:** LLM-based combat calculations in `/attack` skill

**Formula:**
```bash
attack_power = (soldiers * 10) + (territory * 5) + (wealth / 100) + random(1-20)
defense_power = (soldiers * 10) + (territory * 5) + (wealth / 100) + random(1-20)

if attack_power > defense_power * 1.2:
    decisive_victory
elif attack_power > defense_power:
    marginal_victory
else:
    defeat
```

**Token Savings:** ~500 tokens per attack

### 2. Promotion Check (`promotion.sh`)
**Location:** `.claude/scripts/mechanics/promotion.sh`

**Replaces:** LLM-based eligibility checking in `/promote` skill

**Features:**
- Checks all rank requirements
- Returns missing requirements
- Calculates success chance

**Token Savings:** ~300 tokens per check

### 3. Territory Expansion (`expand.sh`)
**Location:** `.claude/scripts/mechanics/expand.sh`

**Replaces:** LLM-based expansion calculations in `/expand` skill

**Formula:**
```bash
territory_gained = random(min, max) + (player.respect / 10)
provocation_chance = {small: 10%, medium: 30%, large: 60%}
```

**Token Savings:** ~400 tokens per expansion

### 4. Recruitment Calculator (`recruit.sh`)
**Location:** `.claude/scripts/mechanics/recruit.sh`

**Replaces:** LLM-based recruitment calculations in `/recruit` skill

**Formula:**
```bash
success_chance = base_chance + (player.respect / 2)
# Associate: 50%, Soldier: 70%, Capo+: 70%
```

**Token Savings:** ~300 tokens per recruitment

### 5. Status Display (`status.sh`)
**Location:** `.claude/scripts/mechanics/status.sh`

**Replaces:** LLM-based status formatting in `/status` skill

**Features:**
- Pure bash output formatting
- No LLM calls needed
- Instant execution

**Token Savings:** ~200 tokens per status

### 6. TypeScript Game Engine (`mechanics.ts`)
**Location:** `web/server/mechanics.ts`

**Purpose:** Server-side game mechanics for web UI

**Functions:**
- `resolveCombat()` - Combat resolution
- `checkPromotionEligibility()` - Promotion checking
- `calculateExpansion()` - Territory expansion
- `calculateRecruitment()` - Recruitment success
- `calculateIntelOperation()` - Intel operations

## Usage in Skills

### Before (LLM-based):
```
1. Skill reads instructions from SKILL.md
2. Claude interprets formulas and makes decisions
3. Claude generates narrative text
4. Claude updates game state
```

### After (Script-based):
```
1. Skill reads instructions from SKILL.md
2. Skill calls bash script: ./combat.sh marinelli rossetti assassinate
3. Script returns JSON with deterministic outcome
4. Claude uses outcome for narrative ONLY
5. Claude updates game state
```

### Example Skill Integration:

```bash
# In /attack skill
RESULT=$(./.claude/scripts/mechanics/combat.sh "$ATTACKER_FAMILY" "$DEFENDER_FAMILY" "$ATTACK_TYPE")

OUTCOME=$(echo "$RESULT" | jq -r '.outcome')
ATTACKER_LOSSES=$(echo "$RESULT" | jq -r '.losses.attacker.soldiers')
DEFENDER_LOSSES=$(echo "$RESULT" | jq -r '.losses.defender.soldiers')
TERRITORY_GAIN=$(echo "$RESULT" | jq -r '.gains.territory')

# Claude now ONLY generates narrative based on these deterministic values
```

## Migration Plan

### Phase 1: Core Mechanics (COMPLETED)
- [x] Combat resolution script
- [x] Promotion check script
- [x] Expansion calculator
- [x] Recruitment calculator
- [x] Status display script
- [x] TypeScript game engine

### Phase 2: Skill Integration (NEXT)
1. Update `/attack` skill to use combat.sh
2. Update `/promote` skill to use promotion.sh
3. Update `/expand` skill to use expand.sh
4. Update `/recruit` skill to use recruit.sh
5. Update `/status` skill to use status.sh
6. Update `/intel` skill to use mechanics.ts

### Phase 3: Agent Optimization
1. Reduce agent prompts to focus ONLY on:
   - Narrative generation
   - Character dialogue
   - Strategic decision-making (non-deterministic)
2. Remove all formula-based calculations from agent instructions
3. Agents call scripts for outcomes

### Phase 4: Next-Turn Optimization
1. Implement batch turn processing
2. Use mechanical action selection (already partially implemented)
3. Reduce narrative generation for NPCs
4. Log events without LLM calls

## What Still Needs LLM

These elements should remain LLM-based for creativity:

1. **Narrative Generation**
   - Combat descriptions
   - Success/failure messages
   - Event storytelling

2. **Character Dialogue**
   - Message responses
   - Order content
   - Character interactions

3. **Complex Decisions**
   - Strategic choices (when multiple valid options)
   - Diplomatic responses
   - Role-playing scenarios

4. **Random Events**
   - Event selection (though outcomes can be scripted)
   - Event descriptions

## Testing Plan

1. **Unit Tests for Each Script:**
   ```bash
   ./combat.sh marinelli rossetti assassinate
   ./promotion.sh
   ./expand.sh marinelli small "The Docks"
   ```

2. **Integration Testing:**
   - Run each skill with script backing
   - Verify game state updates correctly
   - Check territory ownership changes

3. **Token Usage Tracking:**
   - Measure tokens before/after each skill
   - Track per-turn consumption
   - Verify 80%+ reduction target

## Expected Results

### Token Savings
- Per turn: 80-90% reduction
- Per attack: 100% reduction for calculations (narrative only)
- Per status check: 100% reduction

### Performance Improvements
- Faster turn processing (no waiting for agent LLM calls)
- More reliable outcomes (deterministic formulas)
- Better testability (pure functions)

### Maintained Quality
- Rich narratives still generated by LLM
- Character dialogue remains creative
- Strategic depth preserved

## Risks and Mitigation

| Risk | Mitigation |
|------|-----------|
| Scripts may have bugs | Comprehensive testing before deployment |
| Loss of emergent behavior | Keep strategic decisions LLM-based |
| Balance issues | Tune formulas based on playtesting |
| Integration complexity | Phase 2 allows gradual migration |

## Next Steps

1. Review and test all scripts
2. Update one skill as proof-of-concept (recommend `/status` first)
3. Measure actual token savings
4. Roll out to remaining skills
5. Optimize `/next-turn` processing
6. Update agent prompts to use scripts

---

**Created:** 2025-02-14
**Status:** Phase 1 Complete, Phase 2 Ready to Begin
**Team:** token-optimization-squad
