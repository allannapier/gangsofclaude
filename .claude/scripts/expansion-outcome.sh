#!/bin/bash
# Territory Expansion Outcome Calculator
# Calculates territory gain and provocation chance for expansion actions
# Usage: ./expansion-outcome.sh <family_id> <size> [territory_name]
# Output: JSON with territory gained, provocation status, and cost

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SAVE_JSON="$ROOT_DIR/.claude/game-state/save.json"

# Validate arguments
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <family_id> <size> [territory_name]" >&2
    echo "Size options: small, medium, large" >&2
    exit 1
fi

FAMILY_ID="$1"
SIZE="$2"
TERRITORY_NAME="${3:-}"

# Read game state
if [[ ! -f "$SAVE_JSON" ]]; then
    echo '{"error": "save.json not found"}' | jq
    exit 0
fi

# Get family data
FAMILY_DATA=$(jq -r --arg family "$FAMILY_ID" '.families[$family]' "$SAVE_JSON")

if [[ "$FAMILY_DATA" == "null" ]]; then
    echo "{\"error\": \"Family '$FAMILY_ID' not found\"}" | jq
    exit 0
fi

FAMILY_WEALTH=$(echo "$FAMILY_DATA" | jq -r '.wealth // 0')
FAMILY_TERRITORY=$(echo "$FAMILY_DATA" | jq -r '.territory // 0')
PLAYER_RESPECT=$(jq -r '.player.respect // 0' "$SAVE_JSON")

# Set cost and territory gain ranges based on size
case "$SIZE" in
    small)
        WEALTH_COST=50
        TERRITORY_MIN=1
        TERRITORY_MAX=3
        PROVOCATION_CHANCE=10
        ;;
    medium)
        WEALTH_COST=150
        TERRITORY_MIN=4
        TERRITORY_MAX=7
        PROVOCATION_CHANCE=30
        ;;
    large)
        WEALTH_COST=400
        TERRITORY_MIN=8
        TERRITORY_MAX=15
        PROVOCATION_CHANCE=60
        ;;
    *)
        echo '{"error": "Invalid size. Must be: small, medium, or large"}' | jq
        exit 0
        ;;
esac

# Check if family has enough wealth
CAN_AFFORD=false
if [[ $FAMILY_WEALTH -ge $WEALTH_COST ]]; then
    CAN_AFFORD=true
fi

# Calculate territory gain
# Formula: random(min, max) + (player.respect / 10)
BASE_GAIN=$((TERRITORY_MIN + RANDOM % (TERRITORY_MAX - TERRITORY_MIN + 1)))
RESPECT_BONUS=$((PLAYER_RESPECT / 10))
TERRITORY_GAIN=$((BASE_GAIN + RESPECT_BONUS))

# Calculate provocation roll
PROVOCATED=false
PROVOKING_FAMILY=""
PROVOCATION_EVENT=""

if [[ $((1 + RANDOM % 100)) -le $PROVOCATION_CHANCE ]]; then
    PROVOCATED=true

    # Determine which family is provoked (excluding attacker)
    FAMILIES=("marinelli" "rossetti" "falcone" "moretti")
    RIVALS=()

    for fam in "${FAMILIES[@]}"; do
        if [[ "$fam" != "$FAMILY_ID" ]]; then
            RIVALS+=("$fam")
        fi
    done

    # Select random rival
    PROVOKING_FAMILY=${RIVALS[$((RANDOM % ${#RIVALS[@]}))]}
    PROVOKING_FAMILY_NAME=$(jq -r --arg family "$PROVOKING_FAMILY" '.families[$family].name // "Unknown"' "$SAVE_JSON")

    # Generate provocation event based on size
    case "$SIZE" in
        small)
            PROVOCATION_EVENT="The $PROVOKING_FAMILY_NAME family has noticed your small expansion and is sending warnings."
            ;;
        medium)
            PROVOCATION_EVENT="The $PROVOKING_FAMILY_NAME family is alarmed by your expansion and is threatening retaliation."
            ;;
        large)
            PROVOCATION_EVENT="The $PROVOKING_FAMILY_NAME family is outraged by your massive expansion and preparing for conflict!"
            ;;
    esac
fi

# Handle specific territory claim
if [[ -n "$TERRITORY_NAME" ]]; then
    # Check if territory exists and is unowned
    CURRENT_OWNER=$(jq -r --arg territory "$TERRITORY_NAME" '.territoryOwnership[$territory] // ""' "$SAVE_JSON")

    if [[ "$CURRENT_OWNER" == "" ]]; then
        # Territory is unowned - can be claimed
        TERRITORY_GAIN=1
        TERRITORY_NAME_CLAIMED="$TERRITORY_NAME"
        TERRITORY_STATUS="unowned"
    elif [[ "$CURRENT_OWNER" == "$FAMILY_ID" ]]; then
        # Already owned
        TERRITORY_STATUS="already_owned"
        TERRITORY_NAME_CLAIMED="$TERRITORY_NAME"
        TERRITORY_GAIN=0
    else
        # Owned by another family - this is an attack
        TERRITORY_STATUS="contested"
        TERRITORY_NAME_CLAIMED="$TERRITORY_NAME"
        OWNER_FAMILY=$(jq -r --arg owner "$CURRENT_OWNER" '.families[$owner].name // "Unknown"' "$SAVE_JSON")
        PROVOCATED=true
        PROVOKING_FAMILY="$CURRENT_OWNER"
        PROVOCATION_EVENT="The $OWNER_FAMILY family controls $TERRITORY_NAME and will defend it!"
        TERRITORY_GAIN=0  # Must win combat to claim
    fi
else
    TERRITORY_STATUS="generic"
    TERRITORY_NAME_CLAIMED=""
fi

# Calculate new family wealth after cost
NEW_WEALTH=$((FAMILY_WEALTH - WEALTH_COST))
NEW_TERRITORY=$((FAMILY_TERRITORY + TERRITORY_GAIN))

# Build output
jq -n \
    --arg family_id "$FAMILY_ID" \
    --arg size "$SIZE" \
    --arg territory_name "$TERRITORY_NAME_CLAIMED" \
    --arg territory_status "$TERRITORY_STATUS" \
    --argjson can_afford "$CAN_AFFORD" \
    --argjson wealth_cost "$WEALTH_COST" \
    --argjson current_wealth "$FAMILY_WEALTH" \
    --argjson new_wealth "$NEW_WEALTH" \
    --argjson territory_gain "$TERRITORY_GAIN" \
    --argjson current_territory "$FAMILY_TERRITORY" \
    --argjson new_territory "$NEW_TERRITORY" \
    --argjson provoked "$PROVOCATED" \
    --arg provoking_family "$PROVOKING_FAMILY" \
    --arg provocation_event "$PROVOCATION_EVENT" \
    --argjson base_gain "$BASE_GAIN" \
    --argjson respect_bonus "$RESPECT_BONUS" \
    '{
        family_id: $family_id,
        expansion_size: $size,
        territory: {
            name: (if $territory_name == "" then null else $territory_name end),
            status: $territory_status,
            gain: $territory_gain,
            current: $current_territory,
            new: $new_territory,
            breakdown: {
                base: $base_gain,
                respect_bonus: $respect_bonus
            }
        },
        cost: {
            wealth: $wealth_cost,
            can_afford: $can_afford,
            current_wealth: $current_wealth,
            new_wealth: $new_wealth
        },
        provocation: {
            provoked: $provoked,
            rival_family: (if $provoking_family == "" then null else $provoking_family end),
            event: (if $provocation_event == "" then null else $provocation_event end)
        }
    }'
