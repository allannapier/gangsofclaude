#!/bin/bash
# Combat Resolution Script
# Calculates attack vs defense power and determines combat outcome
# Usage: ./combat-resolution.sh <attacker_family> <defender_family> <attack_type>
# Output: JSON with outcome, losses, and narrative

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SAVE_JSON="$ROOT_DIR/.claude/game-state/save.json"

# Validate arguments
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <attacker_family> <defender_family> [attack_type]" >&2
    exit 1
fi

ATTACKER_FAMILY="$1"
DEFENDER_FAMILY="$2"
ATTACK_TYPE="${3:-territory}"

# Read game state
if [[ ! -f "$SAVE_JSON" ]]; then
    echo '{"error": "save.json not found"}' | jq
    exit 0
fi

# Extract family stats
ATTACKER_STATS=$(jq -r --arg family "$ATTACKER_FAMILY" '.families[$family]' "$SAVE_JSON")
DEFENDER_STATS=$(jq -r --arg family "$DEFENDER_FAMILY" '.families[$family]' "$SAVE_JSON")

# Check if families exist
if [[ "$ATTACKER_STATS" == "null" ]]; then
    echo "{\"error\": \"Attacker family '$ATTACKER_FAMILY' not found\"}" | jq
    exit 0
fi

if [[ "$DEFENDER_STATS" == "null" ]]; then
    echo "{\"error\": \"Defender family '$DEFENDER_FAMILY' not found\"}" | jq
    exit 0
fi

# Extract combat values
ATTACKER_SOLDIERS=$(echo "$ATTACKER_STATS" | jq -r '.soldiers // 0')
ATTACKER_TERRITORY=$(echo "$ATTACKER_STATS" | jq -r '.territory // 0')
ATTACKER_WEALTH=$(echo "$ATTACKER_STATS" | jq -r '.wealth // 0')

DEFENDER_SOLDIERS=$(echo "$DEFENDER_STATS" | jq -r '.soldiers // 0')
DEFENDER_TERRITORY=$(echo "$DEFENDER_STATS" | jq -r '.territory // 0')
DEFENDER_WEALTH=$(echo "$DEFENDER_STATS" | jq -r '.wealth // 0')

# Generate random modifiers (1-20)
ATTACKER_ROLL=$((1 + RANDOM % 20))
DEFENDER_ROLL=$((1 + RANDOM % 20))

# Calculate combat power
# Formula: (soldiers * 10) + (territory * 5) + (wealth / 100) + random(1-20)
ATTACK_POWER=$(( (ATTACKER_SOLDIERS * 10) + (ATTACKER_TERRITORY * 5) + (ATTACKER_WEALTH / 100) + ATTACKER_ROLL ))
DEFENSE_POWER=$(( (DEFENDER_SOLDIERS * 10) + (DEFENDER_TERRITORY * 5) + (DEFENDER_WEALTH / 100) + DEFENDER_ROLL ))

# Determine outcome
DEFENSE_POWER_THRESHOLD=$((DEFENSE_POWER * 12 / 10))  # defense_power * 1.2

OUTCOME="defeat"
ATTACKER_LOSS_MIN=30
ATTACKER_LOSS_MAX=50
DEFENDER_LOSS_MIN=5
DEFENDER_LOSS_MAX=15
NARRATIVE="Your forces were overwhelmed and forced to retreat."

if [[ $ATTACK_POWER -gt $DEFENSE_POWER_THRESHOLD ]]; then
    OUTCOME="decisive_victory"
    ATTACKER_LOSS_MIN=5
    ATTACKER_LOSS_MAX=15
    DEFENDER_LOSS_MIN=30
    DEFENDER_LOSS_MAX=50
    NARRATIVE="A crushing victory! Your forces dominated the battlefield."
elif [[ $ATTACK_POWER -gt $DEFENSE_POWER ]]; then
    OUTCOME="marginal_victory"
    ATTACKER_LOSS_MIN=15
    ATTACKER_LOSS_MAX=30
    DEFENDER_LOSS_MIN=15
    DEFENDER_LOSS_MAX=30
    NARRATIVE="A hard-fought victory. Both sides took significant losses."
fi

# Calculate actual losses
ATTACKER_LOSS=$((ATTACKER_LOSS_MIN + RANDOM % (ATTACKER_LOSS_MAX - ATTACKER_LOSS_MIN + 1)))
DEFENDER_LOSS=$((DEFENDER_LOSS_MIN + RANDOM % (DEFENDER_LOSS_MAX - DEFENDER_LOSS_MIN + 1)))

# Calculate soldier casualties
ATTACKER_SOLDIERS_LOST=$((ATTACKER_SOLDIERS * ATTACKER_LOSS / 100))
DEFENDER_SOLDIERS_LOST=$((DEFENDER_SOLDIERS * DEFENDER_LOSS / 100))

# Ensure at least 1 soldier lost if there are any
if [[ $ATTACKER_SOLDIERS -gt 0 && $ATTACKER_SOLDIERS_LOST -eq 0 && $OUTCOME != "decisive_victory" ]]; then
    ATTACKER_SOLDIERS_LOST=1
fi
if [[ $DEFENDER_SOLDIERS -gt 0 && $DEFENDER_SOLDIERS_LOST -eq 0 ]]; then
    DEFENDER_SOLDIERS_LOST=1
fi

# Output result as JSON
jq -n \
    --arg outcome "$OUTCOME" \
    --arg attack_type "$ATTACK_TYPE" \
    --arg attack_power "$ATTACK_POWER" \
    --arg defense_power "$DEFENSE_POWER" \
    --arg attacker_roll "$ATTACKER_ROLL" \
    --arg defender_roll "$DEFENDER_ROLL" \
    --arg attacker_loss_pct "$ATTACKER_LOSS" \
    --arg defender_loss_pct "$DEFENDER_LOSS" \
    --arg attacker_soldiers_lost "$ATTACKER_SOLDIERS_LOST" \
    --arg defender_soldiers_lost "$DEFENDER_SOLDIERS_LOST" \
    --arg narrative "$NARRATIVE" \
    '{
        outcome: $outcome,
        attack_type: $attack_type,
        combat_power: {
            attacker: ($attack_power | tonumber),
            defender: ($defense_power | tonumber)
        },
        rolls: {
            attacker: ($attacker_roll | tonumber),
            defender: ($defender_roll | tonumber)
        },
        losses: {
            attacker: {
                percentage: ($attacker_loss_pct | tonumber),
                soldiers_lost: ($attacker_soldiers_lost | tonumber)
            },
            defender: {
                percentage: ($defender_loss_pct | tonumber),
                soldiers_lost: ($defender_soldiers_lost | tonumber)
            }
        },
        narrative: $narrative
    }'
