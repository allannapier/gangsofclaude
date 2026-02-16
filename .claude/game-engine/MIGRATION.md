# Game Engine Migration Guide

## Overview

This guide explains how to migrate from LLM-based skills to the script-based game engine.

## Quick Start

### 1. Test the Engine

```bash
# Run attack mechanic tests
cd .claude/game-engine/tests
./test-attack.sh

# Test engine directly
cd ../..
bash engine.sh get-state "player.rank"
```

### 2. Update a Skill

**Before** (`.claude/skills/attack/SKILL.md`):
```markdown
1. Read game state
2. Calculate combat power using LLM
3. Determine outcome
4. Generate narrative
5. Write game state
```

**After** (`.claude/skills/attack/SKILL.md`):
```markdown
1. Parse arguments: $ARGUMENTS
2. Call engine: `bash .claude/game-engine/engine.sh attack "$TARGET" "$TYPE"`
3. Engine returns JSON with result and narrative template
4. Display narrative to user
5. Game state already updated by engine
```

### 3. Example Skill Integration

```markdown
---
name: attack
description: Launch a violent action against a target
user-invocable: true
allowed-tools: Bash, Read
---

# Attack

Launch a violent action against a target.

## Usage

`/attack [target_id] [attack_type]`

## Process

Parse arguments and call the game engine:

\`\`\`bash
# Parse arguments
TARGET="$ARGUMENTS[0]"
TYPE="${ARGUMENTS[1]:-beatdown}"

# Call engine
RESULT=$(bash .claude/game-engine/engine.sh attack "Player" "$TARGET" "$TYPE")

# Display narrative
echo "$RESULT" | jq -r '.narrative'
\`\`\`

The engine handles all mechanics deterministically.
```

## Engine API Reference

### Attack Command

```bash
bash engine.sh attack <attacker_id> <target_id> <attack_type>
```

**Returns:**
```json
{
  "success": true,
  "result": {
    "result": "decisive_victory",
    "attack_power": 75,
    "defense_power": 45,
    "attacker_losses": {"soldiers": 1, "wealth": 100},
    "defender_losses": {"soldiers": 3, "wealth": 500},
    "territory_gained": 1
  },
  "narrative": {
    "template": "attack-decisive_victory",
    "variables": {...}
  }
}
```

### Recruit Command

```bash
bash engine.sh recruit <recruiter_id> <target_id>
```

**Returns:**
```json
{
  "success": true,
  "result": {
    "status": "success",
    "changes": {
      "target": {"rank": "Associate", "family": "marinelli"},
      "recruiter": {"wealth": -25, "respect": +5}
    }
  },
  "narrative": {
    "template": "recruit-success",
    "variables": {...}
  }
}
```

## Testing Your Migration

### 1. Unit Test

```bash
# Test specific mechanic
bash .claude/game-engine/tests/test-attack.sh
```

### 2. Integration Test

```bash
# Start game
/start-game

# Test attack
/attack marco_rossetti beatdown

# Verify state updated
cat .claude/game-state/save.json | jq '.events[-1]'
```

### 3. Compare Results

Run the same action with old and new systems to verify consistency.

## Troubleshooting

### Engine Not Found

**Error:** `bash: engine.sh: No such file or directory`

**Solution:**
```bash
# Check path
ls -la .claude/game-engine/engine.sh

# Ensure executable
chmod +x .claude/game-engine/engine.sh
```

### Permission Denied

**Error:** `Permission denied`

**Solution:**
```bash
chmod +x .claude/game-engine/engine.sh
chmod +x .claude/game-engine/mechanics/*.sh
chmod +x .claude/game-engine/lib/*.sh
```

### JSON Parse Errors

**Error:** `parse error: Invalid literal`

**Solution:**
```bash
# Validate JSON output
bash engine.sh attack "Player" "marco_rossetti" "beatdown" | jq '.'
```

## Rollback Plan

If issues occur:

1. **Revert skill changes**
   ```bash
   git checkout .claude/skills/attack/SKILL.md
   ```

2. **Use old system**
   - Old skills will continue to work
   - Engine is additive, not breaking

3. **Report issues**
   - Document the problem
   - Include error messages
   - Share test results

## Best Practices

### 1. Always Validate Engine Output

```bash
RESULT=$(bash engine.sh attack "$ATTACKER" "$TARGET" "$TYPE")

# Check success
if echo "$RESULT" | jq -e '.success' >/dev/null; then
    # Process result
    echo "$RESULT" | jq -r '.narrative'
else
    # Handle error
    echo "Attack failed: $(echo "$RESULT" | jq -r '.error')"
fi
```

### 2. Use Deterministic Seeds for Testing

```bash
# Set seed for reproducible results
GAME_ENGINE_SEED="test-123" bash engine.sh attack "Player" "target" "beatdown"
```

### 3. Log Engine Operations

```bash
# Enable debug logging
GAME_ENGINE_DEBUG=true bash engine.sh attack "Player" "target" "beatdown"
```

## Next Steps

1. ✅ Review design document (DESIGN.md)
2. ✅ Test engine with provided tests
3. ⏳ Migrate `/attack` skill
4. ⏳ Migrate `/recruit` skill
5. ⏳ Migrate remaining skills
6. ⏳ Remove old LLM logic from skills
7. ⏳ Add more narrative templates
8. ⏳ Optimize performance

## Questions?

Refer to:
- `DESIGN.md` - Full architecture documentation
- `tests/` - Example tests
- `narrative/templates/` - Narrative templates
