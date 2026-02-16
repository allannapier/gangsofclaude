#!/bin/bash
# Territory Expansion Outcome Calculator
# Calculates territory gain and provocation chance
# Usage: ./expand.sh <family_id> <size> [territory_name]
# Returns: JSON with territory gained, cost, provocation status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAVE_FILE="$SCRIPT_DIR/../../game-state/save.json"
FAMILY_ID="$1"
SIZE="$2"  # small, medium, large
TERRITORY_NAME="${3:-}"  # Optional specific territory

# Get player stats for bonus
PLAYER_RESPECT=$(jq -r '.player.respect' "$SAVE_FILE")

# Define costs and benefits by size
case "$SIZE" in
    small)
        WEALTH_COST=50
        MIN_TERRITORY=1
        MAX_TERRITORY=3
        PROVOCATION_CHANCE=10  # 10%
        ;;
    medium)
        WEALTH_COST=150
        MIN_TERRITORY=4
        MAX_TERRITORY=7
        PROVOCATION_CHANCE=30  # 30%
        ;;
    large)
        WEALTH_COST=400
        MIN_TERRITORY=8
        MAX_TERRITORY=15
        PROVOCATION_CHANCE=60  # 60%
        ;;
    *)
        echo '{"error": "Invalid size. Use: small, medium, or large"}' >&2
        exit 1
        ;;
esac

# Check if family has enough wealth
FAMILY_WEALTH=$(jq -r ".families.\"$FAMILY_ID\".wealth" "$SAVE_FILE")
if [ "$FAMILY_WEALTH" -lt "$WEALTH_COST" ]; then
    jq -n \
        --argjson success false \
        --arg "error" "Insufficient wealth. Need $WEALTH_COST, have $FAMILY_WEALTH" \
        '{success: $success, error: $error}'
    exit 0
fi

# Calculate territory gain with respect bonus
BASE_GAIN=$((MIN_TERRITORY + RANDOM % (MAX_TERRITORY - MIN_TERRITORY + 1)))
RESPECT_BONUS=$((PLAYER_RESPECT / 10))
TERRITORY_GAIN=$((BASE_GAIN + RESPECT_BONUS))

# Roll for provocation
PROVOCATION_ROLL=$((1 + RANDOM % 100))
PROVOKED=false
if [ "$PROVOCATION_ROLL" -le "$PROVOCATION_CHANCE" ]; then
    PROVOKED=true
fi

# Determine rival families (excluding attacker)
RIVAL_FAMILIES=$(jq -r '[.families | to_entries[] | select(.key != "'"$FAMILY_ID"'") | .key] | join(",")' "$SAVE_FILE")
IFS=',' read -ra RIVALS <<< "$RIVAL_FAMILIES"
RIVAL_COUNT=${#RIVALS[@]}

# Select random rival if provoked
PROVOKING_FAMILY=""
if [ "$PROVOKED" = true ] && [ "$RIVAL_COUNT" -gt 0 ]; then
    RIVAL_INDEX=$((RANDOM % RIVAL_COUNT))
    PROVOKING_FAMILY="${RIVALS[$RIVAL_INDEX]}"
fi

# Check if specific territory was requested and handle ownership
TERRITORY_GRANTED=""
TERRITORY_ALREADY_OWNED=false
OWNER=""
if [ -n "$TERRITORY_NAME" ]; then
    CURRENT_OWNER=$(jq -r ".territoryOwnership.\"$TERRITORY_NAME\" // \"\"" "$SAVE_FILE")
    if [ -n "$CURRENT_OWNER" ] && [ "$CURRENT_OWNER" != "\"$FAMILY_ID\"" ]; then
        OWNER="$CURRENT_OWNER"
    elif [ "$CURRENT_OWNER" = "\"$FAMILY_ID\"" ]; then
        TERRITORY_ALREADY_OWNED=true
    fi
fi

# Output JSON result
jq -n \
    --argjson success true \
    --arg family "$FAMILY_ID" \
    --arg size "$SIZE" \
    --argjson wealth_cost "$WEALTH_COST" \
    --argjson territory_gain "$TERRITORY_GAIN" \
    --argjson provoked "$PROVOKED" \
    --arg provoking_family "$PROVOKING_FAMILY" \
    --arg territory_name "$TERRITORY_NAME" \
    --argjson territory_already_owned "$TERRITORY_ALREADY_OWNED" \
    --arg current_owner "$OWNER" \
    '{
        success: $success,
        family: $family,
        size: $size,
        cost: { wealth: $wealth_cost },
        gains: {
            territory: $territory_gain,
            specificTerritory: (if $territory_name != "" then { name: $territory_name, alreadyOwned: $territory_already_owned, currentOwner: $current_owner } else null end)
        },
        provocation: {
            provoked: $provoked,
            family: (if $provoking_family != "" then $provoking_family else null end)
        }
    }'
