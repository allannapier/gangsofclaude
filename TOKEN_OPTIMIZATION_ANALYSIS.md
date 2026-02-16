# Token Optimization Analysis for La Cosa Nostra

## Executive Summary

Current token consumption is **excessive** due to using Opus LLM for deterministic calculations. Analysis reveals **~85% of token usage** could be eliminated by implementing scripts for mechanical operations.

**Estimated Token Savings: 70-85% per turn**

---

## Current Architecture Analysis

### Skills Inventory (11 total)

| Skill | Current Implementation | Token Usage | Scriptable Priority |
|-------|----------------------|-------------|-------------------|
| `/next-turn` | LLM processes 22 agents | **CRITICAL** | **HIGH** |
| `/attack` | LLM calculates combat | High | **HIGH** ✅ Already scripted |
| `/promote` | LLM checks requirements | Medium | **HIGH** ✅ Already scripted |
| `/expand` | LLM calculates expansion | Medium | **HIGH** ✅ Already scripted |
| `/recruit` | LLM determines success | Medium | **MEDIUM** |
| `/intel` | LLM calculates outcomes | Medium | **MEDIUM** |
| `/seek-patronage` | LLM character interaction | Low-Medium | **MEDIUM** |
| `/message` | LLM generates dialogue | Low | LOW (keep creative) |
| `/status` | LLM formats display | Low | **HIGH** (simple) |
| `/claim` | LLM validates claim | Low | **HIGH** (simple) |
| `/start-game` | One-time initialization | N/A | LOW |

### Agents Inventory (22 total - ALL using Opus model)

Every `/next-turn` triggers **ALL 22 agents**, each using Opus model for:
- Action selection (can be deterministic)
- Target selection (can be deterministic)
- Logging (can be scripted)

**Token Cost Per Turn:**
- 22 agents × ~2,000 tokens each = **~44,000 tokens per turn**
- Plus `/next-turn` skill processing: ~5,000 tokens
- **Total: ~50,000 tokens per turn**

---

## Categorization: What Can Be Scripted

### ✅ HIGH PRIORITY - Deterministic Calculations (Script Immediately)

**Already Implemented:**
1. ✅ **Combat Resolution** (`combat-resolution.sh`)
   - Formula: (soldiers × 10) + (territory × 5) + (wealth/100) + random
   - Current: LLM evaluates this
   - Savings: ~1,500 tokens per attack

2. ✅ **Promotion Check** (`promotion-check.sh`)
   - Formula: requirements check + success chance calculation
   - Current: LLM evaluates this
   - Savings: ~1,000 tokens per promotion

3. ✅ **Expansion Outcome** (`expansion-outcome.sh`)
   - Formula: territory gain + provocation chance
   - Current: LLM evaluates this
   - Savings: ~1,200 tokens per expansion

**Should Be Scripted (High Impact):**

4. **`/next-turn` Agent Processing** ⚠️ **HIGHEST IMPACT**
   - **Current:** 22 agents × Opus model = ~44,000 tokens
   - **Solution:** Script for action selection + logging
   - **Savings: ~40,000 tokens per turn (80% reduction!)**

   **Proposed Script:** `process-turn.sh`
   ```bash
   # Process all 22 characters deterministically
   # - Read character states
   # - Calculate action: (turn + index + loyalty + respect) % 6
   # - Log each action immediately
   # - Generate orders for player (mechanical)
   # - Check win/lose conditions
   ```

5. **`/recruit` Outcome Calculation**
   - Formula: 50% + (respect/2) success chance
   - Wealth cost: 25 (recruit) or 10 (mentor)
   - Savings: ~800 tokens per recruit

6. **`/intel` Outcome Calculation**
   - Formula: base 70% + respect/5 success
   - Risk calculation per operation type
   - Savings: ~900 tokens per intel operation

7. **`/seek-patronage` Success Calculation**
   - Formula: base 40% with modifiers
   - Character trait lookup
   - Savings: ~700 tokens per attempt

8. **`/status` Display Formatting**
   - Just data formatting, no calculations
   - Savings: ~500 tokens per use

### ⚠️ MEDIUM PRIORITY - Hybrid Approach

9. **Character Dialogue (Messages)**
   - **Solution:** Script for mechanics, LLM for content
   - Script handles: delivery, relationship updates, logging
   - LLM generates: actual dialogue text only
   - Savings: ~50% (script mechanics, LLM creative)

### ❌ LOW PRIORITY - Keep Creative (LLM)

10. **Random Event Narrative**
    - Keep LLM for creative storytelling
    - Minimal token usage (20% chance per turn)

11. **Character Development**
    - Agent personality should remain LLM-driven
    - But action selection should be scripted

---

## Implementation Priority Roadmap

### Phase 1: Quick Wins (Already Done ✅)
- ✅ Combat resolution script
- ✅ Promotion check script
- ✅ Expansion outcome script
- ✅ Test suite (14 tests passing)

**Estimated Savings: ~3,700 tokens per use case**

### Phase 2: Critical Optimization (Do Next)

**`/next-turn` Script Implementation** ⚠️ **MAXIMUM IMPACT**

Create `process-turn.sh`:
```bash
#!/bin/bash
# Process all 22 characters mechanically

# 1. Read game state
# 2. For each character (in rank order):
#    - Calculate action: (turn + index + loyalty + respect) % 6
#    - If loyalty < 30: override to "hold"
#    - Determine target (mechanical selection)
#    - Log action to save.json immediately
#    - Generate player order (if applicable)
# 3. Check random events (20% chance)
# 4. Check win/lose conditions
# 5. Return turn summary
```

**Estimated Savings: ~40,000 tokens per turn (80% reduction!)**

### Phase 3: Additional Mechanics (Medium Impact)

Scripts to create:
1. `recruit-outcome.sh` - Calculate recruitment success
2. `intel-outcome.sh` - Calculate intel operation results
3. `patronage-outcome.sh` - Calculate patronage success
4. `status-display.sh` - Format status display

**Estimated Savings: ~3,000 tokens per turn**

### Phase 4: Hybrid Optimization (Lower Impact)

1. Keep LLM for dialogue generation only
2. Script handles all mechanical aspects
3. Cache common responses

**Estimated Savings: ~20% on message operations**

---

## Token Savings Projection

### Current Usage Per Turn
```
/next-turn processing:  50,000 tokens (22 agents + skill)
Player actions:          5,000 tokens (average)
Random events:           2,000 tokens (20% chance)
--------------------------------------------
Total per turn:         57,000 tokens
```

### After Phase 2 Implementation
```
/next-turn processing:  10,000 tokens (script + summary)
Player actions:          1,000 tokens (scripted mechanics)
Random events:           2,000 tokens (unchanged)
--------------------------------------------
Total per turn:         13,000 tokens
```

### Savings
- **Per turn: 44,000 tokens (77% reduction)**
- **Per 10 turns: 440,000 tokens**
- **Per 100 turns: 4,400,000 tokens**

**Cost Reduction:** Assuming Opus at $15/1M tokens:
- Current: ~$0.86 per turn
- Optimized: ~$0.20 per turn
- **Savings: ~$0.66 per turn (76% cost reduction)**

---

## Specific Implementation Recommendations

### 1. `/next-turn` Script (HIGHEST PRIORITY)

**File:** `.claude/scripts/process-turn.sh`

**Logic:**
```bash
# For each of 22 characters:
SEED=$((TURN + CHARACTER_INDEX + LOYALTY + RESPECT))
ACTION=$((SEED % 6))

case $ACTION in
    0) action="attack" ;;
    1) action="recruit" ;;
    2) action="expand" ;;
    3) action="intel" ;;
    4) action="message" ;;
    5) action="hold" ;;
esac

# Override if disloyal
if [ $LOYALTY -lt 30 ]; then
    action="hold"
fi

# Log immediately to save.json
# Generate order for player (if in family + higher rank + 20% chance)
```

**Integration:** Update `/next-turn` skill to call this script instead of spawning 22 agents.

### 2. Additional Scripts to Create

| Script | Purpose | Formula | Priority |
|--------|---------|---------|----------|
| `recruit-outcome.sh` | Calculate recruitment success | 50% + (respect/2) | HIGH |
| `intel-outcome.sh` | Calculate intel results | 70% + (respect/5) | HIGH |
| `patronage-outcome.sh` | Calculate patronage success | 40% + modifiers | MEDIUM |
| `status-display.sh` | Format status display | Data formatting | LOW |

### 3. Skills to Update

Update these skills to call scripts instead of calculating mechanically:
1. `/attack` → Call `combat-resolution.sh` ✅ Already done
2. `/promote` → Call `promotion-check.sh` ✅ Already done
3. `/expand` → Call `expansion-outcome.sh` ✅ Already done
4. `/next-turn` → Call `process-turn.sh` ⚠️ **NEXT**
5. `/recruit` → Call `recruit-outcome.sh`
6. `/intel` → Call `intel-outcome.sh`
7. `/seek-patronage` → Call `patronage-outcome.sh`
8. `/status` → Call `status-display.sh`

---

## Risk Assessment

### Low Risk
- ✅ Combat, promotion, expansion scripts (already tested)
- ✅ Status display formatting
- ✅ Simple success/failure calculations

### Medium Risk
- ⚠️ `/next-turn` script (thoroughly test before deployment)
  - Risk: Breaking emergent gameplay
  - Mitigation: Preserve randomness through seed formula
  - Rollout: A/B test with parallel LLM processing first

### Keep Creative (Don't Script)
- ❌ Character dialogue generation
- ❌ Random event narratives
- ❌ Complex diplomatic scenarios

---

## Testing Strategy

1. **Unit Tests:** Each script has test suite
2. **Integration Tests:** Scripts + skills together
3. **Comparison Tests:** Script output vs LLM output (validate consistency)
4. **A/B Testing:** Run both in parallel during transition

---

## Next Steps

1. **Immediate:** Create `process-turn.sh` script
2. **This Week:** Update `/next-turn` skill to use script
3. **Next Week:** Create remaining mechanic scripts
4. **Ongoing:** Update skills to call scripts
5. **Monitor:** Track token usage reduction

---

## Conclusion

**Token optimization potential: 70-85% reduction**

The `/next-turn` processing alone accounts for **~80% of token usage** and is **fully scriptable** using the deterministic formula already defined in the skill.

**Recommendation: Implement `/next-turn` script immediately for maximum impact.**

The remaining scripts provide incremental savings and should be implemented systematically.

Creative LLM usage should be preserved for:
- Narrative generation
- Character dialogue
- Complex scenarios requiring human-like judgment
