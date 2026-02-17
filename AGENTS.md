# Gangs of Claude — AGENTS.md

> **Project:** Gangs of Claude  
> **Type:** Turn-based mafia strategy game  
> **Platform:** Claude Code (agents, skills, hooks) + Web UI (Bun/Hono + React)

---

## Related Documentation

- **[TESTING.md](TESTING.md)** — Comprehensive testing reference: expected game flow, UI behavior, economy formulas, contextual actions, event narratives, common bug patterns, and regression checklists. **Read this first when playtesting or bug-finding.**

---

## What Is This Project?

Gangs of Claude is a turn-based mafia strategy game where **4 LLM-powered AI families** compete for territory control. The player picks a family and competes against the other 3 AI families — hiring muscle, attacking territories, upgrading operations, and using diplomacy. Each turn, the player gets 1 action + 1 free diplomacy message, then each AI family gets the same.

The game is built on **Claude Code extension features** — skills for player commands, LLM-driven family agents for NPC decisions, and hooks for game-state management — with a companion **React web UI** connected via WebSocket bridge. During each turn, the server spawns a Claude CLI process per family using the `--sdk-url` WebSocket protocol, feeding each a rich prompt with full game state and personality context.

---

## Repository Structure

```
la_cosa_nostra/
├── CLAUDE.md                          # Claude Code development instructions
├── AGENTS.md                          # ← You are here
├── README.md                          # Player-facing docs & quick start
├── mafia_map.html                     # Standalone territory map
│
├── .claude/
│   ├── settings.json                  # Hook configuration (PreToolUse, PostToolUse, SessionStart)
│   ├── settings.local.json            # Local overrides (not committed)
│   │
│   ├── agents/                        # 4 LLM-powered family agents
│   │   ├── marinelli-family.md
│   │   ├── rossetti-family.md
│   │   ├── falcone-family.md
│   │   └── moretti-family.md
│   │
│   ├── skills/                        # Player slash commands
│   │   ├── start-game/SKILL.md        # Initialize a new game
│   │   ├── status/SKILL.md            # Display player stats & game state
│   │   └── next-turn/SKILL.md         # Advance turn — all 4 family AIs act
│   │
│   └── game-state/
│       ├── save.json                  # Canonical game state (single source of truth)
│       └── save.backup.json           # Auto-backup
│
├── web/                               # Web UI (companion interface)
│   ├── package.json                   # Bun workspace root
│   ├── server/
│   │   ├── index.ts                   # Bun/Hono WebSocket bridge server
│   │   ├── protocol.ts                # NDJSON protocol handling
│   │   ├── mechanics.ts               # Server-side game mechanics
│   │   ├── claude-bridge.ts           # Claude CLI WebSocket bridge for LLM-driven AI
│   │   ├── ai-prompts.ts             # Prompt builder for family agents
│   │   └── dev.ts                     # Dev server entry
│   └── client/
│       └── src/
│           ├── App.tsx                # Root React component
│           ├── main.tsx               # Entry point
│           ├── store/                 # Zustand state management
│           ├── components/            # UI components (TurnProcessingModal, etc.)
│           ├── hooks/                 # React hooks
│           ├── data/                  # Static data / lookups
│           └── types/                 # TypeScript type definitions
│
└── templates/                         # Game templates
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    PLAYER INTERFACE                       │
│                                                          │
│            ┌────────────────────────────┐                │
│            │     React Web UI           │                │
│            │  localhost:5174            │                │
│            └─────────────┬──────────────┘                │
│                          │                               │
│                WebSocket (JSON)                          │
│                          │                               │
│             ┌────────────┴─────────────┐                 │
│             │  Bun/Hono Server :3456   │                 │
│             │  HTTP API + WebSocket    │                 │
│             └────────────┬─────────────┘                 │
│                          │                               │
└──────────────────────────┼───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   GAME ENGINE LAYER                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  mechanics.ts  — combat, economy, territory       │    │
│  │  claude-bridge.ts — spawns Claude CLI (--sdk-url) │    │
│  │  ai-prompts.ts — builds prompt per AI family      │    │
│  └──────────────────────────┬───────────────────────┘    │
│                             │                            │
│                  ┌──────────┴──────────┐                 │
│                  │  Claude CLI Bridge  │                 │
│                  │  (4 LLM calls/turn) │                 │
│                  └──────────┬──────────┘                 │
│                             │                            │
│                             ▼                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │          .claude/game-state/save.json             │    │
│  │          (Single Source of Truth)                  │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## Agent System — LLM-Driven Family AI

Each of the 4 rival families is controlled by a **single LLM-powered agent** defined in `.claude/agents/<family>-family.md`. Each family-level agent encapsulates the personality, strategy, and decision-making style of that family.

### How It Works

1. **Agent definition files** (`.claude/agents/<family>-family.md`) define personality, goals, and decision-making style for each family
2. **During `/next-turn`**, the server spawns a Claude CLI process per family using the `--sdk-url` WebSocket protocol
3. **`ai-prompts.ts`** builds a rich prompt for each family containing:
   - Full game state (territories, wealth, members, events)
   - Family personality and strategic tendencies
   - Available actions and their mechanics
   - Recent events and diplomatic context
4. **The LLM responds** with a structured JSON action:
   ```json
   {
     "action": "expand",
     "target": "Little Italy",
     "reasoning": "Consolidating our northern holdings before the Falcones move in",
     "diplomacy": { "to": "Moretti", "message": "We respect your southern border" },
     "taunt": "The Falcones will learn that these streets belong to us"
   }
   ```
5. **`mechanics.ts` executes** the returned action — the LLM only decides _what_ to do, not _how_
6. **Fallback:** If the Claude CLI is unavailable, the system falls back to mechanical AI (weighted random actions based on family personality)

### The 4 Families

#### 🔴 Marinelli Family — _Aggressive Traditionalists_

- **Agent file:** `marinelli-family.md`
- **Strategy:** Attack-first, respect through power
- **Personality:** Old-school values, violent enforcement, territorial expansion by force
- **Tendencies:** Prioritize attack and territory actions, respond aggressively to perceived slights, value loyalty above all

#### 🟡 Rossetti Family — _Business Diplomats_

- **Agent file:** `rossetti-family.md`
- **Strategy:** Wealth accumulation, strategic partnerships
- **Personality:** Business-minded, diplomatic, calculating
- **Tendencies:** Prioritize expand and recruit actions, form alliances, avoid conflict unless profitable

#### 🟣 Falcone Family — _Cunning Manipulators_

- **Agent file:** `falcone-family.md`
- **Strategy:** Exploitation, diplomacy, information warfare
- **Personality:** Cunning, patient, plays the long game
- **Tendencies:** Prioritize intel and diplomacy actions, blackmail rivals, manipulate alliances

#### 🟢 Moretti Family — _Honorable Traditionalists_

- **Agent file:** `moretti-family.md`
- **Strategy:** Defensive buildup, measured expansion
- **Personality:** Traditional, respects omertà, honorable but firm
- **Tendencies:** Prioritize defend and expand actions, avoid unnecessary conflict, build from a position of strength

### Agent Invocation

Agents are invoked in two ways:

1. **During `/next-turn`** — The server processes families sequentially. For each family, `claude-bridge.ts` spawns a Claude CLI process, sends the prompt built by `ai-prompts.ts`, receives a JSON action, and `mechanics.ts` applies it to `save.json`.

2. **Proactively by Claude** — When the player interacts with a family (e.g., via diplomacy messages), Claude uses the family's agent definition to roleplay the NPC response in character.

---

## Skills — Player Commands

Skills are defined in `.claude/skills/<name>/SKILL.md` and exposed as `/slash-commands`.

| Skill | Description |
|-------|-------------|
| `/start-game` | Initialize a new game |
| `/status` | Display player stats, family standings, messages |
| `/next-turn` | Advance turn — all 4 family AIs act sequentially |

Player actions (hire, attack, upgrade, move, message) are handled through the web UI action panel, not CLI skills.

---

## Hooks — Automated Game Systems

Hooks are configured in `.claude/settings.json` and fire at specific lifecycle points.

| Hook | Event | Purpose |
|------|-------|---------|
| Auto-Backup | `PostToolUse` (Edit/Write) | Copies `save.json` → `save.backup.json` after any state mutation. |
| Session Resume | `SessionStart` (startup/resume) | Checks for saved game and informs player of status or prompts `/start-game`. |

---

## Game State — `save.json`

All game state lives in a single JSON file at `.claude/game-state/save.json`. This is the **single source of truth** read by agents, skills, the game engine, and the web UI.

```json
{
  "turn": 4,
  "phase": "playing",
  "player": { "family": "Marinelli" },
  "families": {
    "Marinelli": { "territory": [...], "wealth": 500, "muscle": 10 },
    "Rossetti": { "territory": [...], "wealth": 600, "muscle": 8 },
    "Falcone": { "territory": [...], "wealth": 450, "muscle": 7 },
    "Moretti": { "territory": [...], "wealth": 400, "muscle": 9 }
  },
  "events": [
    { "turn": 3, "actor": "Marinelli", "action": "attack", "result": "..." }
  ],
  "messages": [
    { "from": "Marinelli", "to": "Rossetti", "content": "...", "turn": 2 }
  ]
}
```

---

## Web UI

The web interface at `web/` is a **companion app** that provides visual feedback alongside the Claude Code CLI.

### Tech Stack
- **Server:** Bun + Hono (port 3456)
- **Client:** React + Zustand + Vite (port 5174)
- **Communication:** WebSocket for real-time events

### Data Flow

```
Browser (React + Zustand)
    ↕ WebSocket (JSON)
Bun/Hono Server (port 3456)
    ↕ Claude CLI (--sdk-url WebSocket)
LLM AI decisions
    ↕ mechanics.ts
.claude/game-state/save.json
```

### Key Components

| File | Purpose |
|------|---------|
| `web/server/index.ts` | Main server, HTTP API, WebSocket handlers |
| `web/server/mechanics.ts` | Game mechanics (combat, economy, territory) |
| `web/server/claude-bridge.ts` | Spawns Claude CLI via `--sdk-url` for LLM AI |
| `web/server/ai-prompts.ts` | Builds rich prompts per AI family |
| `web/server/dev.ts` | Dev server entry |
| `web/client/src/App.tsx` | Root application component |
| `web/client/src/store/` | Zustand game state management |
| `web/client/src/components/` | ActionPanel, FamilyOverview, TerritoryGrid, TurnModal, EventLog |

### Running the Web UI

```bash
cd web
bun install
bun run dev
# Open http://localhost:5174
```

---

## Turn Processing — How It Works

Each turn follows this sequence:

1. **Player clicks "Next Turn"** in the web UI
2. **Server collects economy** (income/upkeep) for all families
3. **Player gets 1 action** (hire/attack/upgrade/move) + **1 free message** (diplomacy)
4. **For each AI family**, the server:
   - Spawns a Claude CLI process via `--sdk-url` WebSocket (`claude-bridge.ts`)
   - Builds a rich prompt with game state + family personality (`ai-prompts.ts`)
   - Receives a JSON response: `{action, target, reasoning, diplomacy, taunt}`
   - Executes the action mechanics (`mechanics.ts`), updating `save.json`
   - Falls back to mechanical AI if Claude CLI is unavailable
5. **Events broadcast** to browser via WebSocket in real-time
6. **Win condition checked** after all families act

**Win condition:** Eliminate all rival families (no territories remaining).  
**Lose condition:** Your family is eliminated (all territories lost).

---

## Development Workflow

1. **Start the web UI:** `cd web && bun run dev`
2. **Make changes** to skills, agents, hooks, or web code
3. **Test in browser** at `http://localhost:5174`
4. **Verify turn processing**, action commands, and territory map
5. **Do not commit** until all UI tests pass (see CLAUDE.md for checklist)

### Testing Checklist

- [ ] **New Turn:** Click next turn → modal appears → turn number increments → messages show progress → modal closes
- [ ] **Actions:** Type `/status` manually → runs correctly; select `/attack` → choices modal appears
- [ ] **Territories:** Map displays correct territories for each family

---

## Adding New Content

### New Agent

```bash
# Create family agent file
cat > .claude/agents/<family>-family.md << 'EOF'
---
name: <family>-family
description: "LLM-powered agent for the <Family> Family. <One-line personality>."
tools: Read, Write, Grep, Glob, Bash, Edit
model: sonnet
permissionMode: default
maxTurns: 50
memory: project
---

# The <Family> Family

**Identity:** ...
**Strategy:** ...
**Personality:** ...
**Tendencies:** ...
**Decision-making style:** ...
EOF
```

### New Skill

```bash
mkdir -p .claude/skills/<skill-name>
cat > .claude/skills/<skill-name>/SKILL.md << 'EOF'
---
name: <skill-name>
description: What the skill does
user-invocable: true
allowed-tools: Read, Write, Edit, Bash
---

# Skill instructions here
EOF
```

### New Hook

Add to `.claude/settings.json` under the appropriate event key (`PreToolUse`, `PostToolUse`, `SessionStart`, etc.).
