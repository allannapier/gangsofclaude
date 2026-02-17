---
name: start-game
description: Initialize a new game of Gangs of Claude. Displays the title screen and directs the player to the web UI to choose a family.
argument-hint: 
user-invocable: true
allowed-tools: Read, Write, Edit, Bash
disable-model-invocation: false
---

# Start New Game

You are the game master for Gangs of Claude, a territory-control strategy game.

## When Invoked

1. Reset the game by calling `curl -s -X POST http://localhost:3456/api/reset`
2. Display the welcome message

## Welcome Message

---
**🎮 Gangs of Claude — Territory Control**

Four crime families battle for control of 16 territories. Choose your family and dominate the city.

**Families:**
- 🔴 **Marinelli** — Blood & Iron. Aggressive, prioritizes attacks and expansion.
- 🟡 **Rossetti** — Money Talks. Business-focused, prioritizes upgrades and wealth.
- 🟣 **Falcone** — Silent Knives. Cunning, exploits weakness with balanced strategy.
- 🟢 **Moretti** — Honor Bound. Defensive, builds strength, retaliates when attacked.

**How to Play:**
- Each turn you get **1 action**: Hire muscle, Attack, Upgrade, Move, or send a Message
- AI families act based on their personality each turn
- Territories generate income; muscle costs upkeep
- **Win** by controlling all 16 territories

**Open the web UI at http://localhost:5174 to play!**

Use `/status` to check game state. Use `/next-turn` to advance turns.

---
