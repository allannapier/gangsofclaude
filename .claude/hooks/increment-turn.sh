#!/bin/bash
# Pre-hook for /next-turn skill
# Automatically increments the turn counter BEFORE the skill processes characters
# This ensures all actions logged during turn processing use the correct turn number

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SAVE_JSON="$ROOT_DIR/.claude/game-state/save.json"

# Read current turn
if [[ -f "$SAVE_JSON" ]]; then
    CURRENT_TURN=$(jq -r '.turn // 0' "$SAVE_JSON")
    NEW_TURN=$((CURRENT_TURN + 1))

    # Increment turn in save.json
    jq --argjson new_turn "$NEW_TURN" '.turn = $new_turn' "$SAVE_JSON" > "$SAVE_JSON.tmp" && mv "$SAVE_JSON.tmp" "$SAVE_JSON"

    echo "🎯 Pre-hook: Turn incremented from $CURRENT_TURN to $NEW_TURN" >&2
    echo "   All character actions will now be logged under turn $NEW_TURN" >&2
else
    echo "⚠️  Pre-hook: save.json not found at $SAVE_JSON" >&2
    exit 1
fi
