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

Each turn you get **1 action** + **1 covert operation** + **1 free diplomacy message**:

| Action | Description |
|--------|-------------|
| **Hire** | Buy muscle ($50 each), station at your territory |
| **Attack** | Send muscle from your territories to attack enemy or unclaimed territory |
| **Upgrade** | Level up a territory ($200) to increase income |
| **Move** | Transfer muscle between your territories |
| **Message** | Send diplomacy (free — doesn't count as your action) |

### 🕵️ Covert Operations

Each turn you also get **1 free covert op** — a separate action that doesn't consume your main action:

| Operation | Cost | Description |
|-----------|------|-------------|
| **Spy** | $200 | Plant a mole — reveals target family's territories, muscle, and wealth for 3 turns |
| **Sabotage** | $300 | 60% chance to downgrade an enemy territory's business |
| **Bribe** | $150 | 70% chance to steal 1–2 muscle from an enemy territory |
| **Fortify** | $200 | +3 defense bonus on your own territory for 2 turns |

### Diplomacy Options

- **Partnership** — Propose alliance with another family (grants +2 defense to both allies)
- **Coordinate Attack** — Plan joint offensive against a rival
- **Declare War** — Openly declare hostility (breaks any existing alliance)
- **Share Intel** — Exchange information about rivals

### 🤝 Alliances & Betrayal

Alliances are now **meaningful**:
- Active partnerships grant **+2 defense** to both families' territories
- **Betraying an ally** (attacking a partner) costs you **2 muscle + $200** as a penalty
- AI families form, honor, and break alliances based on their personality

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
4. **Use Diplomacy:** Messages are free. Alliances give +2 defense and cost nothing.
5. **Don't Forget Covert Ops:** You get a free covert op every turn — use it or lose it.
6. **Spy Before Attacking:** Intel reveals enemy muscle counts so you can pick weak spots.
7. **Fortify Key Territories:** +3 defense can turn a vulnerable territory into a fortress.
8. **Watch for City Events:** Crackdowns freeze income, windfalls can swing the game.
9. **Betray Wisely:** Breaking an alliance costs 2 muscle + $200 — make sure it's worth it.
10. **Control the Map:** Territory = income = power. Expand or be consumed.

## Winning the Game

**Win Condition:** Eliminate all rival families (no territories remaining).

**Lose Condition:** Your family is eliminated (all territories lost).

## Game Features

- **4 LLM-Powered AI Families** — Each with unique personality and strategic decision-making
- **Dynamic Emergent Storytelling** — AI families act independently with reasoning and taunts
- **Diplomacy System** — Free messages each turn for alliances, threats, or intel sharing
- **Territory Control** — Grid-based map with upgradeable territories
- **Balanced Turns** — Player and AI each get 1 action + 1 covert op + 1 diplomacy per turn

### 🎲 The Underworld — Random City Events

Every turn has a **30% chance** of a city event — unpredictable chaos that keeps the game dynamic:

| Event | Effect |
|-------|--------|
| 🚔 **Police Crackdown** | A territory's income is frozen for 2 turns |
| 💰 **Black Market Opportunity** | The poorest family receives $500 (rubber-banding) |
| 🔥 **Turf War** | A random territory gains +2 defense for 2 turns |
| 🐀 **Rat in the Ranks** | 1 muscle deserts from a random territory |
| 📰 **Press Scandal** | A family's total income is halved for 2 turns |
| 💵 **Windfall** | A random family receives $300 |

City events appear with amber highlights in the event log and turn modal. Active effects (crackdowns, turf wars, scandals) are displayed on territory cards and in the action panel.

### 🕵️ Covert Operations System

The covert ops system adds a **strategic second layer** to each turn. Both the player and AI families get one covert op per turn, separate from their main action. AI families choose covert ops based on personality:

- **Falcone** (cunning) — favors spy and sabotage
- **Marinelli** (aggressive) — prefers fortify for attack preparation
- **Rossetti** (business) — uses bribe to weaken rivals cheaply
- **Moretti** (defensive) — fortifies key positions

Intel reports from successful spy operations show detailed breakdowns of enemy territories, muscle distribution, and business operations.

### 🤝 Alliance System

Alliances add real consequences to diplomacy:

- **Defense Bonus** — Allied families grant each other +2 territory defense
- **Betrayal Penalty** — Attacking an ally costs 2 muscle + $200
- **Visual Indicators** — 🤝 icons on family cards show active partnerships
- **AI Behavior** — Each family personality approaches alliances differently (Rossetti seeks them, Marinelli breaks them, Falcone manipulates them, Moretti honors them)

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
2. Active effects tick down (crackdowns, scandals, turf wars expire)
3. Server collects economy (income/upkeep) for all families, respecting active effects
4. City event rolls (30% chance) — may trigger crackdown, windfall, rat, etc.
5. Server spawns Claude CLI process with `--sdk-url`
6. For each AI family: sends prompt with personality + game state + available actions
7. LLM responds with JSON: `{action, target, reasoning, diplomacy, covert, taunt}`
8. Server executes the main action + covert op + diplomacy mechanics
9. Events broadcast to browser via WebSocket in real-time
10. Expired intel reports and fortifications cleaned up
11. Win condition checked after all families act

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
