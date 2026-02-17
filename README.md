# Gangs of Claude

A turn-based mafia strategy game where **4 LLM-powered AI families** compete for territory control, built with Claude Code and a React web UI.

## Overview

Gangs of Claude pits you against **4 rival AI families**, each with unique personalities and strategies driven by LLM decisions. Pick a family and compete against the other 3 — hiring muscle, attacking territories, upgrading operations, and using diplomacy to forge or break alliances. Each turn, you get 1 action + 1 free diplomacy message, then each AI family gets the same.

## Quick Start

```bash
cd web
bun install
bun run dev
# Open http://localhost:5174
```

The web UI provides:
- Real-time turn processing with visual feedback
- Family panels showing territory, wealth, and muscle
- Interactive territory grid and event log
- Live WebSocket streaming of AI decisions

## Player Actions

Each turn you get **1 action** plus **1 free diplomacy message**:

| Action | Description |
|--------|-------------|
| **Hire** | Buy muscle ($50 each), station at your territory |
| **Attack** | Send muscle from your territories to attack enemy or unclaimed territory |
| **Upgrade** | Level up a territory ($200) to increase income |
| **Move** | Transfer muscle between your territories |
| **Message** | Send diplomacy (free — doesn't count as your action) |

### Diplomacy Options

- **Partnership** — Propose alliance with another family
- **Coordinate Attack** — Plan joint offensive against a rival
- **Declare War** — Openly declare hostility
- **Share Intel** — Exchange information about rivals

## The Four Families

Each family is an **LLM-powered agent** with distinct personality and strategy:

### 🔴 Marinelli Family — Aggressive Traditionalists
- **Strategy:** Attack-first, respect through power
- **Style:** Direct confrontation, violent enforcement, territorial expansion by force

### 🟡 Rossetti Family — Business Diplomats
- **Strategy:** Wealth accumulation, strategic partnerships
- **Style:** Economic warfare, diplomacy, avoid conflict unless profitable

### 🟣 Falcone Family — Cunning Manipulators
- **Strategy:** Exploitation, information warfare
- **Style:** Patience, blackmail, playing both sides, long-game manipulation

### 🟢 Moretti Family — Honorable Traditionalists
- **Strategy:** Defensive buildup, measured expansion
- **Style:** Traditional values, avoids unnecessary conflict, builds from strength

## Tips for New Players

1. **Hire Early:** Muscle is cheap — territories without defenders are easy targets.
2. **Choose Your Battles:** Attacking costs muscle on both sides. Pick weak targets.
3. **Upgrade Strategically:** Higher-level territories generate more income per turn.
4. **Use Diplomacy:** Messages are free. Alliances can turn the tide.
5. **Watch the AI:** Each family has tendencies — learn their patterns.
6. **Control the Map:** Territory = income = power. Expand or be consumed.

## Winning the Game

**Win Condition:** Eliminate all rival families (no territories remaining).

**Lose Condition:** Your family is eliminated (all territories lost).

## Game Features

- **4 LLM-Powered AI Families** — Each with unique personality and strategic decision-making
- **Dynamic Emergent Storytelling** — AI families act independently with reasoning and taunts
- **Diplomacy System** — Free messages each turn for alliances, threats, or intel sharing
- **Territory Control** — Grid-based map with upgradeable territories
- **Balanced Turns** — Player and AI each get 1 action + 1 diplomacy per turn

## Technical Details

### Architecture

```
Browser (React + Zustand) ←→ WebSocket ←→ Bun/Hono Server (port 3456) ←→ Claude CLI (--sdk-url)
                                                    ↕
                                          .claude/game-state/save.json
```

- **Server:** Bun + Hono (port 3456) — HTTP API + WebSocket handlers
- **Client:** React + Zustand + Vite (port 5174)
- **AI:** Claude CLI spawned via `--sdk-url` WebSocket protocol; falls back to mechanical AI if unavailable

### Turn Processing

1. Player clicks "Next Turn"
2. Server collects economy (income/upkeep) for all families
3. Server spawns Claude CLI process with `--sdk-url`
4. For each AI family: sends prompt with personality + game state + available actions
5. LLM responds with JSON: `{action, target, reasoning, diplomacy, taunt}`
6. Server executes the action mechanics
7. Events broadcast to browser via WebSocket in real-time
8. Win condition checked after all families act

### Key Server Files

| File | Purpose |
|------|---------|
| `web/server/index.ts` | Main server, HTTP API, WebSocket handlers |
| `web/server/mechanics.ts` | Game mechanics (combat, economy, territory) |
| `web/server/claude-bridge.ts` | Spawns Claude CLI via `--sdk-url` for LLM AI |
| `web/server/ai-prompts.ts` | Builds rich prompts per AI family |
| `web/server/dev.ts` | Dev server entry |

### Implementation

- **Agents** — 4 family personality definitions (`.claude/agents/`) drive LLM AI decisions
- **Game state** — Persisted in `.claude/game-state/save.json`

## License

This is a game for educational and entertainment purposes.
