# Gangs of Claude - Setup Instructions

## Prerequisites

You need to install **Bun** runtime to run this web UI:

```bash
# Install Bun (one-time setup)
curl -fsSL https://bun.sh/install | bash
```

Or visit [bun.sh](https://bun.sh/) for alternative installation methods.

## Quick Start

```bash
# Navigate to web directory
cd web

# Install dependencies
bun install

# Run in development mode
bun run dev
```

This will start:
- **Server**: `http://localhost:3456` (WebSocket bridge)
- **Client**: `http://localhost:5174` (Vite dev server)

Open `http://localhost:5174` in your browser to play.

## Project Structure

```
web/
├── server/           # Bun + Hono WebSocket bridge
│   ├── index.ts      # Main server with WebSocket endpoints
│   ├── protocol.ts   # Claude Code protocol types
│   └── package.json
├── client/           # React 19 + TypeScript UI
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── data/          # Family/character data
│   │   ├── store/         # Zustand state management
│   │   ├── App.tsx        # Main app
│   │   └── main.tsx       # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
└── package.json      # Root workspace config
```

## Features

- **Family Panel** - Expandable family cards with member lists
- **Character Cards** - Detailed view with stats, personality, traits
- **Command Palette** - Press `Ctrl+K` to open quick command menu
- **Territory Map** - Visual grid of family-controlled territories
- **Event Log** - Turn-by-turn game events
- **Claude Output** - Live AI response streaming
- **Player Stats** - Real-time rank, wealth, respect display

## Controls

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `↑↓` | Navigate commands |
| `Enter` | Execute command |
| `Esc` | Close palette |

## Game Commands

All 10 skills are available via the command palette:

**Core:** start-game, status, next-turn, promote
**Action:** seek-patronage, recruit, attack, intel, expand
**Social:** message
