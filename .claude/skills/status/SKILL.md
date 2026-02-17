---
name: status
description: Display your current game state, family standings, territories, and recent events.
argument-hint:
user-invocable: true
allowed-tools: Read, Bash
disable-model-invocation: false
---

# Status

Display current game state from the server.

## Usage

`/status`

## Process

Fetch current state from the game server:

```bash
curl -s http://localhost:3456/api/state | jq .
```

Display:
- Current turn number and phase
- Your family name and wealth
- All family standings (territories, muscle, wealth, income)
- Territory ownership summary
- Recent events (last 10)
- Any diplomacy messages

The web UI at http://localhost:5174 shows all this visually.

**Note:** This is a read-only operation. No game state changes.
