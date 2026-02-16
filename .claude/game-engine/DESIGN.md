# Gangs of Claude - Script-Based Game Engine Design

## Executive Summary

This document outlines a comprehensive script-based game engine architecture that moves deterministic game mechanics from LLM-based skills to bash/Node.js scripts while keeping LLMs for narrative and creative elements only.

## Current Architecture Analysis

### Current Problems
1. **Token Inefficiency**: Every action invokes an LLM through skills, consuming expensive tokens
2. **Non-Deterministic**: Same inputs can produce different outputs due to LLM randomness
3. **Testing Complexity**: Cannot unit test game mechanics without invoking LLMs
4. **Performance**: Each action requires full skill execution with tool calls

### Current Architecture
```
User → Browser → WebSocket Server → Claude CLI → Skill → LLM → Read/Write Tools → save.json
```

### Target Architecture
```
User → Browser → WebSocket Server → Game Engine Script → save.json → LLM (narrative only)
```

## System Architecture

### Core Components

#### 1. Game Engine (`game-engine/engine.sh`)
Main entry point that routes commands to appropriate mechanics modules.

```bash
game-engine/
├── engine.sh              # Main entry point
├── mechanics/             # Deterministic game mechanics
│   ├── attack.sh          # Combat resolution
│   ├── recruit.sh         # Recruitment mechanics
│   ├── expand.sh          # Territory expansion
│   ├── intel.sh           # Espionage operations
│   ├── promotion.sh       # Rank advancement
│   └── turn.sh            # Turn processing
├── state/                 # State management
│   ├── read.sh            # Read game state
│   ├── write.sh           # Write game state
│   └── validate.sh        # Validate state integrity
├── narrative/             # LLM narrative integration
│   ├── generate.sh        # Generate narrative text
│   └── templates/         # Narrative templates
└── tests/                 # Unit tests
    ├── test-attack.sh
    ├── test-recruit.sh
    └── test-state.sh
```

#### 2. State Management Layer

**File**: `game-engine/state/read.sh`
```bash
#!/bin/bash
# Read game state with caching
# Usage: read-state <key> [default]
# Example: read-state "player.rank" "Outsider"
```

**File**: `game-engine/state/write.sh`
```bash
#!/bin/bash
# Write game state with validation
# Usage: write-state <key> <value>
# Example: write-state "player.rank" "Soldier"
```

**File**: `game-engine/state/validate.sh`
```bash
#!/bin/bash
# Validate state integrity before writes
# Checks: ranges, relationships, invariants
```

#### 3. Mechanics Modules

**File**: `game-engine/mechanics/attack.sh`
```bash
#!/bin/bash
# Resolve combat deterministically
# Usage: attack.sh <attacker> <defender> <attack_type>
# Output: JSON with result, casualties, territory_changes
```

**File**: `game-engine/mechanics/recruit.sh`
```bash
#!/bin/bash
# Handle recruitment mechanics
# Usage: recruit.sh <recruiter> <target>
# Output: JSON with success, cost, changes
```

**File**: `game-engine/mechanics/turn.sh`
```bash
#!/bin/bash
# Process AI character turns
# Usage: turn.sh <turn_number>
# Output: Array of character actions
```

## API Specification

### Engine API

#### `game-engine/engine.sh <command> [args]`

**Commands:**
- `attack <attacker_id> <target_id> <attack_type>`
- `recruit <recruiter_id> <target_id>`
- `expand <character_id> <territory_id>`
- `intel <character_id> <target_id> <intel_type>`
- `promote <character_id>`
- `process-turn <turn_number>`
- `validate-state`
- `get-state <path>`

**Output Format:**
```json
{
  "success": true,
  "result": {
    "casualties": {...},
    "territory_changes": {...},
    "wealth_changes": {...}
  },
  "narrative": {
    "template": "attack-success",
    "variables": {...}
  },
  "events": [...]
}
```

### State API

#### Read Operations
```bash
# Get single value
state-get "player.rank"

# Get nested value
state-get "families.marinelli.soldiers"

# Get entire object
state-get "families.marinelli"
```

#### Write Operations
```bash
# Set single value
state-set "player.rank" "Soldier"

# Set nested value
state-set "families.marinelli.soldiers" 4

# Merge object
state-merge "families.marinelli" '{"soldiers": 4, "wealth": 5500}'
```

#### Transaction Support
```bash
# Begin transaction
state-begin-transaction

# Multiple operations
state-set "player.wealth" 100
state-set "player.respect" 55

# Commit or rollback
state-commit-transaction
# or
state-rollback-transaction
```

## Mechanics Specification

### Combat Mechanics (`attack.sh`)

**Algorithm:**
```bash
attack_power = (attacker.soldiers * 10) +
               (attacker.territory * 5) +
               (attacker.wealth / 100) +
               random_seed(attack_id)

defense_power = (defender.soldiers * 10) +
                (defender.territory * 5) +
                (defender.wealth / 100) +
                random_seed(defend_id)

if attack_power > defense_power * 1.2:
    result = "decisive_victory"
elif attack_power > defense_power:
    result = "marginal_victory"
else:
    result = "defeat"
```

**Output:**
```json
{
  "result": "decisive_victory",
  "attacker_losses": {
    "soldiers": 1,
    "wealth": 100,
    "territory": 0
  },
  "defender_losses": {
    "soldiers": 3,
    "wealth": 500,
    "territory": 1
  },
  "territory_transfers": [
    {"from": "rossetti", "to": "marinelli", "territory": "Fishmarket"}
  ]
}
```

### Recruitment Mechanics (`recruit.sh`)

**Algorithm:**
```bash
success_chance = 50 + (recruiter.respect / 2)
roll = random_seed(recruiter_id + target_id + turn_number) % 100

if roll < success_chance:
    result = "success"
else:
    result = "failure"
```

### Turn Processing (`turn.sh`)

**Algorithm for each character:**
```bash
# Deterministic action selection
seed = turn_number + character_index + character.loyalty + character.respect
action_index = seed % 6
action = ["attack", "recruit", "expand", "intel", "message", "hold"][action_index]

# Override low loyalty
if character.loyalty < 30:
    action = "hold"

# Deterministic target selection
target_seed = seed + character.family_id
target = select_target_deterministically(target_seed, action)
```

## Narrative Integration

### Template-Based Narrative

**File**: `game-engine/narrative/templates/attack-success.txt`
```
═══════════════════════════════════════════════════════════
                  VICTORY ON THE STREETS
═══════════════════════════════════════════════════════════

Your forces have triumphed over {enemy_family}!

Casualties:
  Your losses: {attacker_losses} soldiers
  Their losses: {defender_losses} soldiers

Territory gained: {territory_gained}
Respect earned: +{respect_gained}

{commentary}
═══════════════════════════════════════════════════════════
```

### LLM Enhancement

**File**: `game-engine/narrative/generate.sh`
```bash
#!/bin/bash
# Generate enhanced narrative using LLM
# Usage: generate.sh <template> <variables_json>

TEMPLATE=$1
VARIABLES=$2

# Load base template
BASE_TEXT=$(cat "narrative/templates/${TEMPLATE}.txt")

# Apply variables
for var in $(echo "$VARIABLES" | jq -r 'keys[]'); do
    value=$(echo "$VARIABLES" | jq -r ".$var")
    BASE_TEXT=$(echo "$BASE_TEXT" | sed "s/{{$var}}/$value/g")
done

# Optional: LLM enhancement for commentary
if [[ "$ENABLE_LLM_ENHANCEMENT" == "true" ]]; then
    COMMENTARY=$(curl -s http://localhost:8080/completion \
        -H "Content-Type: application/json" \
        -d "{
            \"prompt\": \"Write one sentence of mafia-style commentary for: $BASE_TEXT\",
            \"n_predict\": 50
        }" | jq -r '.content')

    BASE_TEXT=$(echo "$BASE_TEXT" | sed "s/{commentary}/$COMMENTARY/g")
else
    BASE_TEXT=$(echo "$BASE_TEXT" | sed "s/{commentary}//g")
fi

echo "$BASE_TEXT"
```

## Skill Integration

### Modified Skill Structure

**Before** (LLM-based):
```markdown
# Attack Skill

1. Read game state
2. LLM decides outcome
3. LLM generates narrative
4. Write game state
```

**After** (Script-based):
```markdown
# Attack Skill

1. Parse arguments
2. Call: `game-engine/engine.sh attack $ATTACKER $TARGET $TYPE`
3. Engine returns: JSON result + narrative template
4. Display narrative to user
5. State already updated by engine
```

**Example**: `.claude/skills/attack/SKILL.md`
```markdown
---
name: attack
description: Launch a violent action against a target
user-invocable: true
allowed-tools: Bash, Read
---

# Attack

Launch a violent action against a target character or family.

## Usage

`/attack [target_id] [attack_type]`

## Process

1. Parse arguments: $ARGUMENTS
2. Call engine: `bash .claude/game-engine/engine.sh attack "$TARGET" "$TYPE"`
3. Engine returns JSON with result and narrative
4. Display narrative to user
5. Game state already updated by engine

The engine handles all mechanics deterministically. This skill only provides user interface.
```

## Migration Strategy

### Phase 1: Core Mechanics (Week 1)
1. Implement `game-engine/state/` modules
2. Implement `game-engine/mechanics/attack.sh`
3. Implement `game-engine/mechanics/recruit.sh`
4. Add unit tests
5. Update `/attack` and `/recruit` skills

### Phase 2: Advanced Mechanics (Week 2)
1. Implement `game-engine/mechanics/expand.sh`
2. Implement `game-engine/mechanics/intel.sh`
3. Implement `game-engine/mechanics/promotion.sh`
4. Update corresponding skills
5. Add integration tests

### Phase 3: Turn Processing (Week 3)
1. Implement `game-engine/mechanics/turn.sh`
2. Update `/next-turn` skill
3. Optimize for performance
4. Add stress tests

### Phase 4: Narrative Enhancement (Week 4)
1. Implement narrative templates
2. Add optional LLM enhancement
3. Polish user experience
4. Final testing

## Testing Strategy

### Unit Tests
```bash
# Test individual mechanics
test-attack-mechanics() {
    # Setup test state
    setup_test_state

    # Execute attack
    result=$(bash mechanics/attack.sh "marinelli" "rossetti" "beatdown")

    # Assert expected outcomes
    assert_equals "$(echo $result | jq -r '.result')" "decisive_victory"
    assert_equals "$(echo $result | jq -r '.attacker_losses.soldiers')" "1"

    # Cleanup
    cleanup_test_state
}
```

### Integration Tests
```bash
# Test full turn processing
test-turn-processing() {
    setup_test_state
    result=$(bash mechanics/turn.sh 1)

    # Assert all 22 characters acted
    assert_equals "$(echo $result | jq '.actions | length')" "22"

    # Assert state integrity
    bash state/validate.sh
}
```

### Determinism Tests
```bash
# Test same inputs produce same outputs
test-determinism() {
    result1=$(bash mechanics/attack.sh "marinelli" "rossetti" "beatdown" 42)
    result2=$(bash mechanics/attack.sh "marinelli" "rossetti" "beatdown" 42)

    assert_equals "$result1" "$result2"
}
```

## Performance Benefits

### Token Savings
- **Current**: ~2000 tokens per action (LLM execution)
- **After**: ~100 tokens per action (narrative generation only)
- **Savings**: 95% reduction

### Execution Speed
- **Current**: 5-10 seconds per action
- **After**: 0.1-0.5 seconds per action
- **Improvement**: 10-100x faster

### Testing
- **Current**: Cannot test without LLM
- **After**: Full unit test coverage
- **Benefit**: Catch bugs before runtime

## File Structure Summary

```
.claude/
├── game-engine/
│   ├── engine.sh                    # Main entry point
│   ├── mechanics/                   # Deterministic mechanics
│   │   ├── attack.sh
│   │   ├── recruit.sh
│   │   ├── expand.sh
│   │   ├── intel.sh
│   │   ├── promotion.sh
│   │   └── turn.sh
│   ├── state/                       # State management
│   │   ├── read.sh
│   │   ├── write.sh
│   │   ├── validate.sh
│   │   └── transactions.sh
│   ├── narrative/                   # Narrative system
│   │   ├── generate.sh
│   │   └── templates/
│   │       ├── attack-success.txt
│   │       ├── attack-failure.txt
│   │       └── recruit-success.txt
│   ├── lib/                         # Shared utilities
│   │   ├── json.sh
│   │   ├── random.sh
│   │   └── logging.sh
│   └── tests/                       # Test suite
│       ├── test-mechanics.sh
│       ├── test-state.sh
│       └── test-integration.sh
├── game-state/
│   └── save.json                    # Game state (unchanged)
└── skills/                          # Updated skills
    ├── attack/SKILL.md              # Simplified to call engine
    ├── recruit/SKILL.md
    └── ...
```

## Configuration

### Environment Variables
```bash
# Enable/disable LLM enhancement
GAME_ENGINE_LLM_ENHANCEMENT=true

# LLM endpoint for narrative generation
GAME_ENGINE_LLM_ENDPOINT=http://localhost:8080/completion

# Game state location
GAME_ENGINE_STATE_PATH=.claude/game-state/save.json

# Verbosity
GAME_ENGINE_DEBUG=false
```

## Next Steps

1. **Review and Approval**: Team lead to review this design
2. **Prototype Implementation**: Build engine.sh and one mechanic (attack.sh)
3. **Testing**: Verify determinism and performance
4. **Integration**: Update attack skill to use engine
5. **Iteration**: Refine based on feedback
6. **Full Migration**: Migrate all mechanics

## Success Criteria

- [ ] All game mechanics are deterministic
- [ ] Token usage reduced by 90%+
- [ ] Execution time under 1 second per action
- [ ] Full unit test coverage
- [ ] Skills simplified to interface layer only
- [ ] LLM used only for narrative enhancement
- [ ] Backward compatibility with existing save files
