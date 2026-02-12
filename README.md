# Gangs of Claude

A text-based mafia strategy game built entirely within Claude Code using agents, skills, and hooks, with a companion-style web interface.

## Overview

Gangs of Claude creates a **true multiplayer experience** where **22 AI-controlled characters** across 4 rival families each have unique personalities, motivations, and decision-making patterns. You start as an unaffiliated street hustler, must get recruited into a family, and climb the ranks while navigating an unstable peace between families.

## Quick Start

### Option 1: Web UI (Recommended)

1. **Start the web interface:**
   ```bash
   cd web
   bun install
   bun run dev
   ```

2. **Open browser:** `http://localhost:5174`

3. **Start a new game** via the command palette (`Ctrl+K`) or type `/start-game`

The web UI provides:
- Real-time turn processing with visual feedback
- Family panels showing all 22 AI characters
- Territory map and event log
- Live streaming of Claude responses

### Option 2: CLI Only

1. **Start a new game:**
   ```
   /start-game
   ```

2. **Get recruited:**
   ```
   /seek-patronage enzo_marinelli
   ```
   (Target Associates, Soldiers, or Capos - Dons won't meet with outsiders)

3. **Check your status:**
   ```
   /status
   ```

4. **Advance time:**
   ```
   /next-turn
   ```
   (All 22 AI characters act in rank order)

## Game Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `/start-game` | Initialize a new game |
| `/status` | View your current state |
| `/next-turn` | Advance turn (all AI characters act) |
| `/promote` | Check for rank promotion |

### Player Actions

| Command | Description |
|---------|-------------|
| `/seek-patronage [character]` | Try to get recruited (Outsiders only) |
| `/attack [target] [type]` | Launch violent action |
| `/recruit [target]` | Build your network/mentor others |
| `/message [recipient] [content]` | Send message to any character |
| `/expand [amount]` | Grow family territory |
| `/intel [target] [type]` | Espionage operations |

### Attack Types

- `assassinate` - Attempt to kill target (high risk)
- `beatdown` - Send message by injuring target
- `business` - Destroy their income sources
- `territory` - Challenge for control

### Intel Operations

- `spy` - Plant mole in enemy family
- `steal` - Steal resources
- `blackmail` - Get compromising information
- `survey` - Assess enemy strength

## Rank Progression

```
Outsider (unaffiliated)
   ↓
Associate (recruited)
   ↓ Requirements: 10 respect, 1 mission, 100 wealth
Soldier (made man)
   ↓ Requirements: 30 respect, 5 successful actions
Capo (captain)
   ↓ Requirements: 60 respect, control territory
Underboss (second-in-command)
   ↓ Requirements: 90 respect, Don dies, survive challenges
Don (family head)
```

## The Four Families

### Marinelli Family - Aggressive Traditionalists
- **Don:** Vito Marinelli - Patriarch, old-school values
- **Style:** Direct confrontation, honor, family first
- **Territory:** Little Italy, North End

### Rossetti Family - Business Diplomats
- **Don:** Marco Rossetti - Wealthy, diplomatic
- **Style:** Economic warfare, bribery, profit-focused
- **Territory:** Fishmarket, Warehouse District

### Falcone Family - Cunning Manipulators
- **Don:** Sofia Falcone - Widow, strategic
- **Style:** Espionage, blackmail, playing both sides
- **Territory:** Southside Clubs, Downtown

### Moretti Family - Honorable Traditionalists
- **Don:** Antonio Moretti - Traditional, respects omertà
- **Style:** Balanced approach, values respect
- **Territory:** East Side, Harbor

## Tips for New Players

1. **Start Small:** Don't attack immediately. Build relationships first.
2. **Choose Your Family Carefully:** Each has different strengths and playstyles.
3. **Respect Rank:** Don't message Dons as an outsider. Work your way up.
4. **Use Messages:** Diplomacy is often cheaper than war.
5. **Watch Your Back:** Allies can become enemies. Trust no one completely.
6. **Think Ahead:** Every action has consequences. Plan accordingly.

## Winning the Game

**Win Condition:** Become Don and eliminate all rival families (0 soldiers, 0 territory)

**Lose Conditions:**
- Your family is eliminated
- You are assassinated
- Your loyalty reaches 0 (kicked out of family)

## Game Features

- **22 AI Characters** - Each with unique personality and decision-making
- **Dynamic Emergent Storytelling** - Characters act independently each turn
- **Rank-Appropriate Interactions** - Status affects how characters respond
- **Message System** - Send communications to any character
- **ASCII Art** - Visual feedback at key moments

## Technical Details

### Web UI Architecture

The web UI provides a real-time companion interface:

```
Browser UI ←→ WebSocket (JSON) ←→ Bun/Hono Server ←→ WebSocket (NDJSON) ←→ Claude Code CLI
```

Key features:
- **Turn Processing Modal** - Visual feedback showing each AI character's action as it executes
- **Real-time Event Polling** - Server polls `save.json` every 500ms for updates
- **State Persistence** - Zustand store with localStorage backup
- **Command Palette** - Quick access via `Ctrl+K`

### Turn Processing System

The game uses a **PreToolUse hook** to ensure turn consistency:

1. User invokes `/next-turn`
2. **Hook automatically increments turn** before skill executes
3. All 22 AI characters process in rank order (Associates → Soldiers → Capos → Consiglieres → Underbosses → Dons)
4. Each character's action is logged immediately to `save.json` events array
5. Web UI polls `save.json` and displays actions in real-time

This prevents the turn counter from getting out of sync with logged events.

### Claude Code Extension Features

- **Skills** (`/start-game`, `/next-turn`, `/status`, etc.) for game commands
- **Sub-agents** for 22 unique AI characters with distinct personalities
- **Hooks** for auto-save and turn management
- **Memory** for persistent game state

## License

This is a game for educational and entertainment purposes.
