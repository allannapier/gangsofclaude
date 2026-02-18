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

**IMPORTANT:** You MUST call the game server API to advance the turn. Do NOT try to execute bash scripts or update save.json directly.

```bash
curl -s -X POST http://localhost:3456/api/next-turn
```

This triggers the server to:
1. Process economy for all 4 families (income, upkeep, muscle desertion)
2. Invoke LLM-powered AI agents for each family — they make strategic decisions with full narrative reasoning based on their personality:
   - **Marinelli** (aggressive traditionalists) — rule through fear and force
   - **Rossetti** (business diplomats) — rule through wealth and influence  
   - **Falcone** (cunning manipulators) — rule through intelligence and deception
   - **Moretti** (honorable traditionalists) — rule through loyalty and measured strength
3. Check win/lose conditions

The server spawns Claude CLI processes for each family using the family agent definitions in `.claude/agents/`. Each family gets rich narrative about their strategic reasoning, personality-driven decisions, and tactical choices.

Display a brief turn summary to the player. The web UI at http://localhost:5174 shows full event details in real-time via WebSocket.
