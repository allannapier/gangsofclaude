# Game Mechanics Implementation

This directory contains working implementations of core game mechanics for Gangs of Claude.

## Overview

The game mechanics system provides deterministic, testable functions for:
1. **Combat Resolution** - Calculate attack outcomes and losses
2. **Promotion Eligibility** - Check rank advancement requirements
3. **Territory Expansion** - Calculate expansion results and provocation

## Scripts

### Bash Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `combat-resolution.sh` | Calculate combat outcomes | `./combat-resolution.sh <attacker> <defender> [type]` |
| `promotion-check.sh` | Check promotion eligibility | `./promotion-check.sh` |
| `expansion-outcome.sh` | Calculate expansion results | `./expansion-outcome.sh <family> <size> [territory]` |
| `test-game-mechanics.sh` | Run test suite | `./test-game-mechanics.sh` |

### TypeScript Library

| File | Purpose |
|------|---------|
| `game-mechanics.ts` | TypeScript implementations for web UI |

## Quick Start

### Testing

Run the test suite to verify all scripts work correctly:

```bash
./test-game-mechanics.sh
```

### Example Usage

**Combat Resolution:**
```bash
./combat-resolution.sh marinelli rossetti assassinate | jq '.'
```

**Promotion Check:**
```bash
./promotion-check.sh | jq '.requirements'
```

**Territory Expansion:**
```bash
./expansion-outcome.sh marinelli medium "East Harbor" | jq '.'
```

## Documentation

- **INTEGRATION_GUIDE.md** - Detailed integration guide for skills
- **game-mechanics.ts** - TypeScript library with JSDoc comments

## Design Principles

1. **Deterministic** - Same inputs produce same outputs
2. **Stateless** - Scripts calculate outcomes but don't modify game state
3. **JSON Output** - Easy to parse and integrate
4. **Error Handling** - Structured error messages for graceful failure
5. **Testable** - Comprehensive test suite included

## Integration

Skills can integrate these scripts by:

1. Calling the script with appropriate parameters
2. Parsing JSON output with `jq`
3. Using results to update game state
4. Displaying narrative to player

See INTEGRATION_GUIDE.md for detailed examples.

## Testing Status

All 14 tests passing:
- Combat Resolution: 4/4 tests pass
- Promotion Check: 4/4 tests pass
- Expansion Outcome: 6/6 tests pass

## Next Steps

1. Update skill SKILL.md files to use these scripts
2. Add scripts to allowed-tools for relevant skills
3. Create additional mechanics (intel, recruit, etc.)
4. Add unit tests for edge cases
5. Document game balance formulas
