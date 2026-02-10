---
name: message
description: Send a message to any character in the game. Messages are delivered and characters respond on their turn.
argument-hint: [recipient] [content]
user-invocable: true
allowed-tools: Read, Write, Edit
disable-model-invocation: false
---

# Message

Send a message to any character in the game.

## Usage

`/message [recipient_id] [your message]`

Example: `/message enzo_marinelli I'd like to discuss business opportunities.`

## Message Types

1. **Threats** - Warn or intimidate
2. **Offers** - Propose alliances, truces, information trades
3. **Flattery/Manipulation** - Build relationships
4. **Request Meeting** - Ask for face-to-face

## Status Modifiers

**Messaging way above your rank:**
- May be ignored (50% chance)
- May be punished (20% chance) - "Know your place"
- Don's won't respond to Outsiders/Associates directly

**Messaging at your level:**
- Normal response
- Relationship affects tone

**Messaging below your rank:**
- Character responds respectfully
- Eager to please

## Response System

Messages are added to the game state's message queue. Characters receive and process messages on their turn during `/next-turn`.

Response is determined by:
- Current relationship with sender
- Character's personality traits
- Message content and tone
- Rank difference

## Process

1. Read game state
2. Validate recipient exists
3. Check rank restrictions (warn if too high)
4. Add message to game state messages array
5. Inform player message has been sent
6. Save game state

**Note:** Actual response happens during `/next-turn` when the recipient character acts.
