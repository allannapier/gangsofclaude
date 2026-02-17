# Gangs of Claude — AGENTS.md

> **Project:** Gangs of Claude  
> **Type:** Turn-based mafia strategy game  
> **Platform:** Claude Code (agents, skills, hooks) + Web UI (Bun/Hono + React)

---

## Related Documentation

- **[TESTING.md](TESTING.md)** — Comprehensive testing reference: expected game flow, UI behavior, economy formulas, contextual actions, event narratives, common bug patterns, and regression checklists. **Read this first when playtesting or bug-finding.**

---

## What Is This Project?

Gangs of Claude is an immersive text-based mafia game where **4 LLM-powered family agents** control **4 rival families** that act autonomously each turn. The player starts as an unaffiliated outsider, gets recruited into a family, and climbs the ranks — all while rival families scheme, fight, and negotiate around them.

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
│   │   ├── next-turn/SKILL.md         # Advance turn — all 4 family AIs act
│   │   ├── seek-patronage/SKILL.md    # Get recruited by a family
│   │   ├── attack/SKILL.md            # Violent actions (assassinate, beatdown, etc.)
│   │   ├── recruit/SKILL.md           # Build network / mentor others
│   │   ├── expand/SKILL.md            # Grow family territory
│   │   ├── claim/SKILL.md             # Claim unowned territory
│   │   ├── intel/SKILL.md             # Espionage (spy, steal, blackmail, survey)
│   │   ├── message/SKILL.md           # Send messages to characters
│   │   └── promote/SKILL.md           # Attempt rank advancement
│   │
│   ├── hooks/
│   │   └── increment-turn.sh          # PreToolUse hook — increments turn before /next-turn
│   │
│   ├── game-state/
│   │   ├── save.json                  # Canonical game state (single source of truth)
│   │   ├── save.backup.json           # Auto-backup (PostToolUse hook)
│   │   └── log-action.ts              # Action logging utility
│   │
│   ├── game-engine/
│   │   ├── engine.sh                  # Core turn processing engine
│   │   ├── lib/
│   │   │   ├── json.sh                # JSON manipulation helpers
│   │   │   ├── logging.sh             # Game event logging
│   │   │   └── random.sh              # RNG utilities
│   │   ├── mechanics/
│   │   │   ├── attack.sh              # Combat resolution
│   │   │   └── recruit.sh             # Recruitment mechanics
│   │   └── narrative/
│   │       └── templates/             # Story text templates
│   │
│   └── scripts/                       # Utility scripts
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
│  ┌─────────────┐          ┌────────────────────────────┐ │
│  │  Claude CLI  │          │     React Web UI           │ │
│  │  /commands   │          │  localhost:5174            │ │
│  └──────┬──────┘          └─────────────┬──────────────┘ │
│         │                               │                │
│         │                     WebSocket (JSON)           │
│         │                               │                │
│         │                  ┌────────────┴─────────────┐  │
│         │                  │  Bun/Hono Bridge Server   │  │
│         │                  │  WebSocket (NDJSON) ←→ CLI│  │
│         │                  └────────────┬─────────────┘  │
│         │                               │                │
└─────────┼───────────────────────────────┼────────────────┘
          │                               │
          ▼                               ▼
┌──────────────────────────────────────────────────────────┐
│                   GAME ENGINE LAYER                       │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Skills   │  │   Hooks      │  │  Claude CLI Bridge │ │
│  │ /attack   │  │ PreToolUse   │  │  (--sdk-url WS)    │ │
│  │ /recruit  │  │ PostToolUse  │  │                    │ │
│  │ /next-turn│  │ SessionStart │  │  ┌──────────────┐  │ │
│  │ ...       │  │              │  │  │ Family Agents │  │ │
│  └─────┬────┘  └──────┬───────┘  │  │ (4 LLM calls)│  │ │
│        │               │          │  └──────┬───────┘  │ │
│        │               │          └─────────┤          │ │
│        │               │                    │          │ │
│        ▼               ▼                    ▼          │ │
│  ┌──────────────────────────────────────────────────┐  │ │
│  │          .claude/game-state/save.json             │  │ │
│  │          (Single Source of Truth)                  │  │ │
│  └──────────────────────────────────────────────────┘  │ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  ai-prompts.ts → builds rich prompt per family    │    │
│  │  claude-bridge.ts → spawns Claude CLI process     │    │
│  │  mechanics.ts → executes returned JSON actions    │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## Agent System — LLM-Driven Family AI

Each of the 4 rival families is controlled by a **single LLM-powered agent** defined in `.claude/agents/<family>-family.md`. Rather than 22 individual character subagents, the game uses 4 family-level agents that encapsulate the entire personality, strategy, and decision-making style of each family.

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

2. **Proactively by Claude** — When the player interacts with a family (e.g., `/seek-patronage`), Claude uses the family's agent definition to roleplay the NPC response in character.

---

## Skills — Player Commands

Skills are defined in `.claude/skills/<name>/SKILL.md` and exposed as `/slash-commands`.

| Skill | Description | Category |
|-------|-------------|----------|
| `/start-game` | Initialize a new game with ASCII title screen | Core |
| `/status` | Display player stats, family standings, messages | Core |
| `/next-turn` | Advance turn — all 4 family AIs act sequentially | Core |
| `/promote` | Check qualifications and attempt rank advancement | Core |
| `/seek-patronage [character]` | Get recruited by a family (Outsider only) | Social |
| `/message [recipient] [content]` | Send messages to any character | Social |
| `/attack [target] [type]` | Violent actions: assassinate, beatdown, business, territory | Combat |
| `/recruit [target]` | Build network, mentor others | Growth |
| `/expand [amount]` | Grow family territory and business operations | Growth |
| `/claim` | Claim unowned territory for your family | Growth |
| `/intel [target] [type]` | Espionage: spy, steal, blackmail, survey | Intelligence |

---

## Hooks — Automated Game Systems

Hooks are configured in `.claude/settings.json` and fire at specific lifecycle points.

| Hook | Event | Purpose |
|------|-------|---------|
| Turn Increment | `PreToolUse` (Skill: next-turn) | Auto-increments turn counter in `save.json` before any family AIs act. Prevents turn desync. |
| Auto-Backup | `PostToolUse` (Edit/Write) | Copies `save.json` → `save.backup.json` after any state mutation. |
| Session Resume | `SessionStart` (startup/resume) | Checks for saved game and informs player of status or prompts `/start-game`. |

### Turn Increment Hook (Critical)

The `increment-turn.sh` hook runs **before** the `/next-turn` skill executes. This ensures the turn number in `save.json` is always correct when events are logged:

```
Player: /next-turn
  → PreToolUse hook fires → increment-turn.sh bumps turn counter
  → next-turn skill runs → 4 family AIs act using the correct turn number
  → PostToolUse hook fires → save.json backed up
```

---

## Game State — `save.json`

All game state lives in a single JSON file at `.claude/game-state/save.json`. This is the **single source of truth** read by agents, skills, the game engine, and the web UI.

```json
{
  "turn": 4,
  "phase": "playing",
  "player": {
    "name": "Player",
    "rank": "Outsider",
    "family": null,
    "respect": 0,
    "wealth": 100,
    "heat": 0,
    "loyalty": 50
  },
  "families": {
    "Marinelli": { "territory": [...], "wealth": 500, "members": [...] },
    "Rossetti": { "territory": [...], "wealth": 600, "members": [...] },
    "Falcone": { "territory": [...], "wealth": 450, "members": [...] },
    "Moretti": { "territory": [...], "wealth": 400, "members": [...] }
  },
  "events": [
    { "turn": 3, "actor": "Marco Marinelli", "action": "expand", "result": "..." }
  ],
  "messages": [
    { "from": "Enzo Marinelli", "to": "Player", "content": "...", "turn": 2 }
  ]
}
```

---

## Game Engine

The deterministic game engine lives in `.claude/game-engine/` and provides shell-based mechanics:

| Component | Path | Purpose |
|-----------|------|---------|
| Core engine | `engine.sh` | Orchestrates turn processing |
| JSON helpers | `lib/json.sh` | Read/write JSON game state |
| Logging | `lib/logging.sh` | Structured event logging |
| RNG | `lib/random.sh` | Deterministic random number generation |
| Combat | `mechanics/attack.sh` | Attack resolution and damage |
| Recruitment | `mechanics/recruit.sh` | Recruitment success/failure logic |
| Story templates | `narrative/templates/` | Flavor text and narrative output |

---

## Web UI

The web interface at `web/` is a **companion app** that provides visual feedback alongside the Claude Code CLI.

### Tech Stack
- **Server:** Bun + Hono (WebSocket bridge)
- **Client:** React + Zustand + TypeScript
- **Communication:** WebSocket (JSON ↔ NDJSON bridge)

### Data Flow

```
Browser (React)
    ↕ WebSocket (JSON)
Bun/Hono Server
    ↕ WebSocket (NDJSON)
Claude Code CLI
    ↕ File I/O
save.json
    ↑ Polling (500ms)
Bun/Hono Server → broadcasts changes to browser
```

### Key Components

| File | Purpose |
|------|---------|
| `web/server/index.ts` | WebSocket bridge between browser and Claude CLI |
| `web/server/protocol.ts` | NDJSON protocol serialization |
| `web/server/mechanics.ts` | Server-side game mechanics |
| `web/server/claude-bridge.ts` | Claude CLI WebSocket bridge for LLM-driven AI |
| `web/server/ai-prompts.ts` | Prompt builder for family agents |
| `web/client/src/App.tsx` | Root application component |
| `web/client/src/store/` | Zustand game state management |
| `web/client/src/components/TurnProcessingModal.tsx` | Real-time turn visualization |

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

1. **Player invokes `/next-turn`** (via CLI or Web UI)
2. **PreToolUse hook** fires `increment-turn.sh` → bumps turn counter in `save.json`
3. **Turn skill** reads `save.json`, invokes the turn engine
4. **4 family agents process sequentially:**
   - For each family, `claude-bridge.ts` spawns a Claude CLI process via `--sdk-url` WebSocket
   - `ai-prompts.ts` builds a rich prompt with game state, family personality, and available actions
   - The LLM returns a structured JSON action (action, target, reasoning, diplomacy, taunt)
   - `mechanics.ts` validates and executes the action, updating `save.json`
   - If Claude CLI is unavailable, falls back to mechanical AI (weighted random based on family personality)
5. **Web UI** polls `save.json` every 500ms → displays actions in real-time modal
6. **PostToolUse hook** backs up `save.json`

---

## Rank Progression

```
Outsider (unaffiliated)
   ↓  /seek-patronage
Associate (recruited into a family)
   ↓  10 respect, 1 mission, 100 wealth
Soldier (made man)
   ↓  30 respect, 5 successful actions
Capo (captain — runs a crew)
   ↓  60 respect, control territory
Underboss (second-in-command)
   ↓  90 respect, Don dies/removed, survive challenges
Don (family head)
```

**Win condition:** Become Don and eliminate all rival families.  
**Lose conditions:** Family eliminated, assassinated, or loyalty drops to 0.

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
