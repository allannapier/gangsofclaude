# Gangs of Claude - Web UI

A companion-style web interface for the Gangs of Claude mafia strategy game.

## Features

- **Family Panel** - View all 4 families (Marinelli, Rossetti, Falcone, Moretti) with expandable character cards
- **Turn Processing Modal** - Real-time visualization of each AI character's action with animated progress
- **Command Palette** - Quick access to all game commands via `Ctrl+K`
- **Territory Map** - Visual grid showing family-controlled territories
- **Character Details** - Click any character to view stats, personality, and available actions
- **Event Log** - Track all game events and turn history
- **Claude Output** - Live streaming of Claude AI responses
- **Real-time Updates** - Server polls game state every 500ms for instant feedback

### Recent Improvements

- **Fixed turn counter sync** - PreToolUse hook ensures turn increments before processing
- **Object serialization fix** - Proper handling of complex objects in event logging
- **Turn number auto-adjustment** - Modal automatically adapts when events arrive for different turns
- **Improved action display** - Each AI character's action shown with appropriate icons and descriptions

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Claude Code CLI](https://claude.ai/code) installed and authenticated
- Game project renamed to `gangs_of_claude`

## Quick Start

```bash
cd web

# Install dependencies
bun install

# Run development server
bun run dev
```

This starts:
- WebSocket bridge server on `http://localhost:3456`
- Vite dev server on `http://localhost:5174`

Open `http://localhost:5174` in your browser to access the web UI.

## Architecture

```
Browser UI ←→ WebSocket (JSON) ←→ Bun/Hono Server ←→ WebSocket (NDJSON) ←→ Claude Code CLI
```

The server:
1. Spawns `claude --sdk-url` processes for each session
2. Bridges messages between browser and CLI
3. Translates between JSON (browser) and NDJSON (CLI) protocols

## Game Commands

### Core Commands
| Command | Description |
|---------|-------------|
| `/start-game` | Initialize a new game |
| `/status` | View your current state |
| `/next-turn` | Advance turn (all AI characters act) |
| `/promote` | Check for rank promotion |

### Action Commands
| Command | Description |
|---------|-------------|
| `/seek-patronage [character]` | Try to get recruited (Outsiders only) |
| `/attack [target] [type]` | Launch violent action |
| `/recruit [target]` | Build your network/mentor others |
| `/intel [target] [type]` | Espionage operations |
| `/expand [amount]` | Grow family territory |

### Social Commands
| Command | Description |
|---------|-------------|
| `/message [recipient] [content]` | Send message to any character |

## Development

```bash
# Build for production
bun run build

# Run production server
bun run start
```

## Tech Stack

- **Runtime**: Bun
- **Server**: Hono + native Bun WebSocket
- **Frontend**: React 19 + TypeScript
- **State**: Zustand
- **Styling**: Tailwind CSS v4
- **Build**: Vite

## License

MIT
