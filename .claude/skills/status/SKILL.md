---
name: status
description: Display your current character stats, family standings, recent messages, and current events.
argument-hint: 
user-invocable: true
allowed-tools: Read
disable-model-invocation: false
---

# Status

Display a comprehensive overview of your current position in the criminal underworld.

## Usage

`/status`

## Display Sections

### 1. Player Status
- Name
- Rank (Outsider, Associate, Soldier, Capo, Underboss, Don)
- Family affiliation
- Loyalty rating
- Respect level
- Wealth
- Contacts list
- Enemies list

### 2. Family Standings
For each of the 4 families:
- Family name
- Current Don
- Territory controlled
- Total wealth
- Relationship with player's family (if affiliated)
- Status (growing, stable, declining)

### 3. Recent Messages
- Last 5 messages received
- Sender name
- Message type (threat, offer, information)
- Brief preview

### 4. Current Events
- Recent game events
- Ongoing conflicts
- Opportunities available

### 5. Progress to Next Rank
- Current rank requirements
- Progress toward promotion
- What's needed to advance

## Process

1. Read game state from `.claude/game-state/save.json`
2. Format player information
3. Format family standings
4. Display recent messages
5. Display current events
6. Show rank progress

**Note:** This is a read-only operation. No game state changes.
