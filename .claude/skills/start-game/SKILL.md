---
name: start-game
description: Initialize a new game of La Cosa Nostra. Displays the title screen ASCII art, resets game state, and shows the intro narrative.
argument-hint: 
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Start New Game

You are the game master for La Cosa Nostra, a text-based mafia strategy game.

## When Invoked

1. Display the ASCII art from `templates/startup.txt`
2. Reset the game state in `.claude/game-state/save.json` to initial values
3. Display the intro narrative

## Intro Narrative

Display this narrative after the ASCII art:

---
**Welcome to La Cosa Nostra**

The year is 1957. You're a nobody on the streets of New York City - a hustler, a grinder, someone who's tired of watching from the sidelines while the families run this city.

Four powerful families control everything:
- **Marinelli Family** - Aggressive traditionalists who value strength above all
- **Rossetti Family** - Business-minded operators who prefer profit over war
- **Falcone Family** - Cunning manipulators who play the long game
- **Moretti Family** - Honorable traditionalists who respect the old ways

An uneasy peace exists between them. Tensions are rising. And you? You see opportunity.

To rise from the streets to Don, you'll need to:
1. Get noticed by the right people
2. Earn your way into a family as an Associate
3. Prove yourself to become a Made Man (Soldier)
4. Build respect and loyalty to rise through the ranks
5. Eliminate rival families to secure your legacy

Use `/seek-patronage [character]` to approach low-ranking members and get noticed.
Use `/status` to view your current position in the criminal underworld.

The Commission is watching. The families are watching. Every choice matters.

---

## Game State Reset

Create/overwrite `.claude/game-state/save.json` with initial state:

```json
{
  "turn": 0,
  "phase": "playing",
  "player": {
    "name": "Player",
    "rank": "Outsider",
    "family": null,
    "loyalty": 50,
    "respect": 0,
    "wealth": 50,
    "contacts": [],
    "enemies": []
  },
  "families": {
    "Marinelli": { "territory": 25, "soldiers": 3, "wealth": 5000, "standing": "Strong" },
    "Rossetti": { "territory": 25, "soldiers": 3, "wealth": 6000, "standing": "Strong" },
    "Falcone": { "territory": 25, "soldiers": 3, "wealth": 5500, "standing": "Strong" },
    "Moretti": { "territory": 25, "soldiers": 3, "wealth": 5200, "standing": "Strong" }
  },
  "territoryOwnership": {
    "Little Italy": "marinelli",
    "North End": "rossetti",
    "The Docks": "",
    "Fishmarket": "rossetti",
    "Warehouse District": "marinelli",
    "East Harbor": "",
    "Southside Clubs": "rossetti",
    "Downtown": "falcone",
    "Financial District": "falcone",
    "East Side": "moretti",
    "Harbor": "moretti",
    "Old Town": "moretti"
  },
  "events": [],
  "messages": []
}
```

**IMPORTANT:** The `events` array must be initialized as an empty array `[]`. This is where all character actions will be logged during turns.

## Next Steps

Inform the player they should use `/seek-patronage` to approach an Associate, Soldier, or Capo from any family to begin their journey.
