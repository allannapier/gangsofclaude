# Gangs of Claude — AGENTS.md

> **Project:** Gangs of Claude  
> **Type:** Turn-based mafia strategy game  
> **Platform:** Claude Code (agents, skills, hooks) + Web UI (Bun/Hono + React)

---

## Related Documentation

- **[TESTING.md](TESTING.md)** — Comprehensive testing reference: expected game flow, UI behavior, economy formulas, contextual actions, event narratives, common bug patterns, and regression checklists. **Read this first when playtesting or bug-finding.**

---

## What Is This Project?

Gangs of Claude is an immersive text-based mafia game where **22 AI-controlled characters** across **4 rival families** act autonomously each turn. The player starts as an unaffiliated outsider, gets recruited into a family, and climbs the ranks — all while rival families scheme, fight, and negotiate around them.

The game is built entirely on **Claude Code extension features** — skills for player commands, subagents for NPC personalities, and hooks for game-state management — with a companion **React web UI** connected via WebSocket bridge.

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
│   ├── agents/                        # 22 AI character subagents
│   │   ├── marinelli-vito-don.md
│   │   ├── marinelli-salvatore-underboss.md
│   │   ├── marinelli-bruno-consigliere.md
│   │   ├── marinelli-marco-capo.md
│   │   ├── marinelli-luca-soldier.md
│   │   ├── marinelli-enzo-associate.md
│   │   ├── rossetti-marco-don.md
│   │   ├── rossetti-carla-underboss.md
│   │   ├── rossetti-antonio-consigliere.md
│   │   ├── rossetti-franco-capo.md
│   │   ├── rossetti-maria-soldier.md
│   │   ├── rossetti-paolo-associate.md
│   │   ├── falcone-sofia-don.md
│   │   ├── falcone-victor-underboss.md
│   │   ├── falcone-dante-consigliere.md
│   │   ├── falcone-iris-capo.md
│   │   ├── falcone-leo-soldier.md
│   │   ├── moretti-antonio-don.md
│   │   ├── moretti-giovanni-underboss.md
│   │   ├── moretti-elena-consigliere.md
│   │   ├── moretti-ricardo-capo.md
│   │   └── moretti-carlo-soldier.md
│   │
│   ├── skills/                        # Player slash commands
│   │   ├── start-game/SKILL.md        # Initialize a new game
│   │   ├── status/SKILL.md            # Display player stats & game state
│   │   ├── next-turn/SKILL.md         # Advance turn — all 22 AIs act
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
│                   CLAUDE CODE ENGINE                      │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Skills   │  │   Hooks      │  │   Subagents (22)   │ │
│  │ /attack   │  │ PreToolUse   │  │ marinelli-vito-don │ │
│  │ /recruit  │  │ PostToolUse  │  │ falcone-sofia-don  │ │
│  │ /next-turn│  │ SessionStart │  │ rossetti-marco-don │ │
│  │ ...       │  │              │  │ moretti-antonio-don│ │
│  └─────┬────┘  └──────┬───────┘  │ ... 18 more        │ │
│        │               │          └─────────┬──────────┘ │
│        │               │                    │            │
│        ▼               ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐│
│  │            .claude/game-state/save.json               ││
│  │            (Single Source of Truth)                    ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## Agent System — The 22 AI Characters

Each character is a **Claude Code subagent** defined in `.claude/agents/<family>-<name>-<rank>.md`. Every agent has a unique personality, goals, and decision-making style that drives autonomous behavior during turn processing.

### Agent Configuration Pattern

All agents share a common frontmatter structure:

```yaml
---
name: <family>-<name>-<rank>
description: "Use proactively for <family> Family <purpose>. <Character summary>."
tools: Read, Write, Grep, Glob, Bash, Edit
model: opus                    # Dons use opus; others may use sonnet/haiku
permissionMode: default
maxTurns: 50
memory: project                # Persistent memory in .claude/agent-memory/
---
```

### Family Roster

#### 🔴 Marinelli Family — _Aggressive Traditionalists_
| Character | Rank | Archetype | Agent File |
|-----------|------|-----------|------------|
| Vito Marinelli | **Don** | Aggressive patriarch, old-school values | `marinelli-vito-don.md` |
| Salvatore Marinelli | Underboss | Vito's loyal brother, enforcer | `marinelli-salvatore-underboss.md` |
| Bruno Marinelli | Consigliere | Cautious advisor, voice of reason | `marinelli-bruno-consigliere.md` |
| Marco Marinelli | Capo | Hot-headed captain, hungry for power | `marinelli-marco-capo.md` |
| Luca Marinelli | Soldier | Young, desperate to prove himself | `marinelli-luca-soldier.md` |
| Enzo Marinelli | Associate | Street recruiter, charm and smarts | `marinelli-enzo-associate.md` |

#### 🔵 Rossetti Family — _Business Diplomats_
| Character | Rank | Archetype | Agent File |
|-----------|------|-----------|------------|
| Marco Rossetti | **Don** | Business-minded, diplomatic, wealth-focused | `rossetti-marco-don.md` |
| Carla Rossetti | Underboss | Marco's sister, strategic and ruthless | `rossetti-carla-underboss.md` |
| Antonio Rossetti | Consigliere | Lawyer type, cautious, by-the-book | `rossetti-antonio-consigliere.md` |
| Franco Rossetti | Capo | Corrupt police connections, manipulative | `rossetti-franco-capo.md` |
| Maria Rossetti | Soldier | Skilled assassin, cold, professional | `rossetti-maria-soldier.md` |
| Paolo Rossetti | Associate | Gambling ring runner, risk-taker | `rossetti-paolo-associate.md` |

#### 🟣 Falcone Family — _Cunning Manipulators_
| Character | Rank | Archetype | Agent File |
|-----------|------|-----------|------------|
| Sofia Falcone | **Don** | Cunning widow, plays the long game | `falcone-sofia-don.md` |
| Victor Falcone | Underboss | Calculating, ambitious, ruthlessly efficient | `falcone-victor-underboss.md` |
| Dante Falcone | Consigliere | Information broker, paranoid, connected | `falcone-dante-consigliere.md` |
| Iris Falcone | Capo | Blackmail specialist, charming, dangerous | `falcone-iris-capo.md` |
| Leo Falcone | Soldier | Family spy, stealthy, observant | `falcone-leo-soldier.md` |

#### 🟢 Moretti Family — _Honorable Traditionalists_
| Character | Rank | Archetype | Agent File |
|-----------|------|-----------|------------|
| Antonio Moretti | **Don** | Traditional, respects omertà | `moretti-antonio-don.md` |
| Giovanni Moretti | Underboss | Antonio's cousin, most trusted lieutenant | `moretti-giovanni-underboss.md` |
| Elena Moretti | Consigliere | Wise voice of reason, legitimate-world ties | `moretti-elena-consigliere.md` |
| Ricardo Moretti | Capo | Manages restaurant empire, balances legal/illegal | `moretti-ricardo-capo.md` |
| Carlo Moretti | Soldier | Don's son, dedicated enforcer | `moretti-carlo-soldier.md` |

### Agent Invocation

Agents are invoked in two ways:

1. **During `/next-turn`** — The turn engine spawns each agent in rank order (Associates → Soldiers → Capos → Consiglieres → Underbosses → Dons). Each agent reads the current game state, decides its action, and writes results back to `save.json`.

2. **Proactively by Claude** — When the player interacts with a family (e.g., `/seek-patronage enzo_marinelli`), Claude delegates to the appropriate agent to roleplay the NPC response.

---

## Skills — Player Commands

Skills are defined in `.claude/skills/<name>/SKILL.md` and exposed as `/slash-commands`.

| Skill | Description | Category |
|-------|-------------|----------|
| `/start-game` | Initialize a new game with ASCII title screen | Core |
| `/status` | Display player stats, family standings, messages | Core |
| `/next-turn` | Advance turn — all 22 AI characters act in rank order | Core |
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
| Turn Increment | `PreToolUse` (Skill: next-turn) | Auto-increments turn counter in `save.json` before any AI characters act. Prevents turn desync. |
| Auto-Backup | `PostToolUse` (Edit/Write) | Copies `save.json` → `save.backup.json` after any state mutation. |
| Session Resume | `SessionStart` (startup/resume) | Checks for saved game and informs player of status or prompts `/start-game`. |

### Turn Increment Hook (Critical)

The `increment-turn.sh` hook runs **before** the `/next-turn` skill executes. This ensures the turn number in `save.json` is always correct when events are logged:

```
Player: /next-turn
  → PreToolUse hook fires → increment-turn.sh bumps turn counter
  → next-turn skill runs → 22 agents act using the correct turn number
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
3. **Turn skill** reads `save.json`, invokes game engine
4. **22 agents process in rank order:**
   - Associates act first (lowest stakes decisions)
   - Soldiers act (enforcement, small operations)
   - Capos act (territory management, crew orders)
   - Consiglieres act (advice, political maneuvering)
   - Underbosses act (operational decisions)
   - Dons act last (strategic moves, war declarations)
5. **Each agent** reads state → decides action → writes result to `save.json` events
6. **Web UI** polls `save.json` every 500ms → displays actions in real-time modal
7. **PostToolUse hook** backs up `save.json`

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
# Create agent file
cat > .claude/agents/<family>-<name>-<rank>.md << 'EOF'
---
name: <family>-<name>-<rank>
description: "Use proactively for <Family> Family <purpose>. <One-line personality>."
tools: Read, Write, Grep, Glob, Bash, Edit
model: sonnet
permissionMode: default
maxTurns: 50
memory: project
---

# <Name> <Surname> - <Rank> of the <Family> Family

**Identity:** ...
**Personality:** ...
**Goals:** ...
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
