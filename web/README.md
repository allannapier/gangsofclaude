# Gangs of Claude - Web UI

A companion-style web interface for the Gangs of Claude mafia strategy game.

## Features

- **Family Panel** - View all 4 families (Marinelli, Rossetti, Falcone, Moretti) with territory and muscle info
- **Turn Processing Modal** - Real-time visualization of each AI family's action with animated progress
- **Territory Grid** - Interactive map showing family-controlled territories
- **Action Panel** - Hire muscle, attack, upgrade, move, and send diplomacy
- **Event Log** - Track all game events and turn history
- **Real-time Updates** - WebSocket-based instant feedback on game state changes

### Recent Improvements

- **LLM-powered AI** - Each family's decisions driven by Claude CLI via `--sdk-url` WebSocket
- **Mechanical fallback** - Random AI when Claude CLI is unavailable
- **Balanced turns** - Player and AI each get 1 action + 1 diplomacy per turn

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
Browser (React) ←→ WebSocket (JSON) ←→ Bun/Hono Server (:3456) ←→ Claude CLI (--sdk-url)
```

The server:
1. Handles HTTP API and WebSocket connections for the game
2. Spawns Claude CLI processes via `--sdk-url` for LLM AI decisions
3. Executes game mechanics (combat, economy, territory) server-side

## Player Actions

Each turn you get **1 action** + **1 free diplomacy message**:

| Action | Description |
|--------|-------------|
| **Hire** | Buy muscle ($50 each), station at territory |
| **Attack** | Send muscle to attack enemy/unclaimed territory |
| **Upgrade** | Level up territory ($200) to increase income |
| **Move** | Transfer muscle between your territories |
| **Message** | Send diplomacy to another family (free) |

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
