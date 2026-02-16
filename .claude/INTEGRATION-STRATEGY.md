# Integration Strategy: Unified Game Engine

## Current Situation

We have two parallel implementations:

1. **Systems Architect Design** (`.claude/game-engine/`):
   - Comprehensive architecture with engine.sh dispatcher
   - Library modules (json.sh, logging.sh, random.sh)
   - Attack and recruit mechanics
   - Test suite and documentation

2. **Implementation Team Scripts** (`.claude/scripts/`):
   - Working combat.sh, expand.sh, promotion.sh, recruit.sh, status.sh
   - Test suite already passing
   - Direct integration with save.json
   - Production-ready JSON output

## Analysis

### Implementation Team Approach Strengths:
- ✅ More direct and practical
- ✅ Already tested and passing
- ✅ Simpler file structure
- ✅ Works directly with save.json
- ✅ Better real-world integration

### Systems Architect Design Strengths:
- ✅ More comprehensive architecture
- ✅ Better separation of concerns
- ✅ Reusable library modules
- ✅ Deterministic random seeding
- ✅ Narrative template system

## Recommended Strategy: Hybrid Integration

**Adopt the implementation team's direct approach** while incorporating key architectural improvements from the design.

### Action Plan

#### Phase 1: Consolidate Mechanics (Immediate)

1. **Keep** `.claude/scripts/mechanics/` as the primary location
2. **Adopt** deterministic random seeding from the design
3. **Add** narrative template rendering
4. **Standardize** JSON output format

#### Phase 2: Add Missing Mechanics

Create additional scripts following the established pattern:
- `intel.sh` - Espionage operations
- `turn.sh` - Turn processing (CRITICAL for token savings)
- `message.sh` - Message handling
- `claim.sh` - Territory claiming

#### Phase 3: Skill Integration

Update skills to call scripts:
```bash
# In /attack skill
RESULT=$(bash .claude/scripts/mechanics/combat.sh "$ATTACKER" "$DEFENDER" "$TYPE")
# Display formatted output
```

#### Phase 4: Turn Processing (Highest Impact)

Implement `turn.sh` to process all 22 AI characters without LLM:
- Deterministic action selection
- Mechanical state updates
- Order generation for player
- Random events

**Expected Savings**: ~50,000 tokens per turn

## Specific Integration Tasks

### Task 1: Add Deterministic Random (HIGH PRIORITY)

The current scripts use `$RANDOM` which is not deterministic. Add seeding:

```bash
# Add to .claude/scripts/mechanics/lib/random.sh
seeded_random() {
    local seed="$1"
    local max="${2:-100}"
    # Use MD5 hash for deterministic output
    local hash=$(echo "$seed" | md5sum | cut -c1-8)
    echo $((0x${hash} % max))
}
```

### Task 2: Standardize Output Format

All mechanics should return:
```json
{
  "success": true/false,
  "result": { ... },
  "narrative": { "template": "...", "variables": {...} },
  "state_changes": { ... }
}
```

### Task 3: Create Narrative Renderer

```bash
# .claude/scripts/narrative/render.sh
render_template() {
    local template="$1"
    local variables="$2"
    # Apply variables to template
    # Optionally enhance with LLM
}
```

### Task 4: Implement Turn Processor

```bash
# .claude/scripts/mechanics/turn.sh
process_turn() {
    local turn="$1"
    # For each of 22 characters:
    #   1. Deterministically select action
    #   2. Calculate mechanical outcome
    #   3. Update state
    #   4. Generate order if needed
    #   5. Log event
}
```

## File Structure (Unified)

```
.claude/
├── scripts/
│   ├── mechanics/
│   │   ├── combat.sh          ✅ (keep)
│   │   ├── expand.sh          ✅ (keep)
│   │   ├── promotion.sh       ✅ (keep)
│   │   ├── recruit.sh         ✅ (keep)
│   │   ├── status.sh          ✅ (keep)
│   │   ├── intel.sh           ⏳ (create)
│   │   ├── turn.sh            ⏳ (create - HIGH PRIORITY)
│   │   ├── message.sh         ⏳ (create)
│   │   └── lib/
│   │       ├── random.sh      ⏳ (add deterministic seeding)
│   │       └── state.sh       ⏳ (add state helpers)
│   ├── narrative/
│   │   ├── render.sh          ⏳ (create)
│   │   └── templates/
│   │       ├── attack-victory.txt
│   │       └── recruit-success.txt
│   └── test-game-mechanics.sh ✅ (keep)
└── game-engine/
    ├── DESIGN.md              ✅ (keep for reference)
    ├── README.md              ✅ (keep for documentation)
    └── MIGRATION.md           ✅ (keep for reference)
```

## Priority Order

### Immediate (This Session):
1. ✅ Review existing implementations
2. ⏳ Add deterministic random seeding
3. ⏳ Create intel.sh mechanic
4. ⏳ Test all mechanics together

### High Priority (Next Session):
1. ⏳ Implement turn.sh (BIGGEST TOKEN SAVER)
2. ⏳ Update /attack skill to use combat.sh
3. ⏳ Update /recruit skill to use recruit.sh
4. ⏳ Update /expand skill to use expand.sh

### Medium Priority:
1. ⏳ Update remaining skills
2. ⏳ Add narrative templates
3. ⏳ Add optional LLM enhancement

## Token Savings Projection

### Current State:
- `/next-turn`: ~22 agents × 2000 tokens = 44,000 tokens/turn
- Player actions: ~2000 tokens/action
- **Total**: ~50,000 tokens per turn cycle

### After Turn Processor:
- `/next-turn`: ~500 tokens (mechanical) + 1000 tokens (narrative) = 1,500 tokens/turn
- Player actions: ~100 tokens/action
- **Total**: ~2,000 tokens per turn cycle
- **Savings**: 96% reduction

## Recommendation

**Proceed with the implementation team's approach** in `.claude/scripts/mechanics/` but:

1. Add deterministic random seeding for reproducibility
2. Standardize JSON output format
3. Implement turn.sh immediately for maximum token savings
4. Keep game-engine/ folder as reference documentation

The implementation team has done excellent work. Their scripts are practical, tested, and ready for production. We should build on their foundation rather than starting over.
