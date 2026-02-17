---
name: next-turn
description: Advance the turn. All AI families act based on their personality, processing economy and making strategic decisions.
argument-hint:
user-invocable: true
allowed-tools: Read, Bash
disable-model-invocation: false
---

# Next Turn

Advance the game turn via the game server.

## Usage

`/next-turn`

## Process

Call the game server API to advance the turn:

```bash
curl -s -X POST http://localhost:3456/api/next-turn | jq .
```

This will:
1. Process economy for all 4 families (income, upkeep, muscle desertion)
2. Each AI family takes 1 action based on personality:
   - **Marinelli** (aggressive) — prioritizes attacks
   - **Rossetti** (business) — prioritizes upgrades and wealth
   - **Falcone** (cunning) — exploits weakness, balanced
   - **Moretti** (defensive) — builds strength, retaliates
3. Check win/lose conditions (control all 16 territories = win)

Display the returned events to the player as a turn summary.

The web UI at http://localhost:5174 shows these events in real-time via WebSocket.
