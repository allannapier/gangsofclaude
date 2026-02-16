#!/bin/bash
# Recruitment Success Calculator
# Calculates recruitment/mentoring success and outcomes
# Usage: ./recruit.sh <actor_family> <actor_rank> <target_id>
# Returns: JSON with success, costs, outcomes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAVE_FILE="$SCRIPT_DIR/../../game-state/save.json"
ACTOR_FAMILY="$1"
ACTOR_RANK="$2"  # Associate, Soldier, Capo, etc.
TARGET_ID="$3"

# Get player stats
PLAYER_RESPECT=$(jq -r '.player.respect' "$SAVE_FILE")
PLAYER_WEALTH=$(jq -r '.player.wealth' "$SAVE_FILE")

# Check if target exists and get their status
TARGET_FAMILY=$(jq -r ".families | to_entries[] | select(.value.members[]? == \"$TARGET_ID\") | .key" "$SAVE_FILE" 2>/dev/null || echo "")
TARGET_RANK=$(jq -r ".characters.\"$TARGET_ID\".rank // \"Outsider\"" "$SAVE_FILE" 2>/dev/null || echo "Outsider")

# Define requirements by actor rank
case "$ACTOR_RANK" in
    "Associate")
        # Associates can recruit outsiders
        WEALTH_COST=25
        BASE_CHANCE=50
        # Target must be unaffiliated
        if [ -n "$TARGET_FAMILY" ]; then
            jq -n '{success: false, error: "Associates can only recruit unaffiliated outsiders"}'
            exit 0
        fi
        ;;
    "Soldier")
        # Soldiers mentor lower-ranking family members
        WEALTH_COST=10
        BASE_CHANCE=70
        # Target must be in same family and lower rank
        if [ "$TARGET_FAMILY" != "$ACTOR_FAMILY" ]; then
            jq -n '{success: false, error: "Soldiers can only mentor their own family members"}'
            exit 0
        fi
        ;;
    "Capo"|"Consigliere"|"Underboss"|"Don")
        # Higher ranks recruit Associates to Soldiers
        WEALTH_COST=50
        BASE_CHANCE=70
        # Target must be Associate rank
        if [ "$TARGET_RANK" != "Associate" ]; then
            jq -n '{success: false, error: "Can only recruit Associates to become Soldiers"}'
            exit 0
        fi
        ;;
    *)
        jq -n '{success: false, error: "Invalid actor rank"}'
        exit 0
        ;;
esac

# Check wealth requirement
if [ "$PLAYER_WEALTH" -lt "$WEALTH_COST" ]; then
    jq -n \
        --argjson success false \
        --arg "error" "Insufficient wealth. Need $WEALTH_COST, have $PLAYER_WEALTH" \
        '{success: $success, error: $error}'
    exit 0
fi

# Calculate success chance
SUCCESS_CHANCE=$((BASE_CHANCE + PLAYER_RESPECT / 2))
if [ "$SUCCESS_CHANCE" -gt 95 ]; then
    SUCCESS_CHANCE=95
fi

# Roll for success
ROLL=$((1 + RANDOM % 100))
if [ "$ROLL" -le "$SUCCESS_CHANCE" ]; then
    SUCCESS=true
    RESPECT_GAIN=5
    LOYALTY_GAIN=5
    MESSAGE="recruit-success"
else
    SUCCESS=false
    RESPECT_GAIN=-2
    LOYALTY_GAIN=0
    MESSAGE="recruit-failed"
fi

# Output JSON result
jq -n \
    --argjson success "$SUCCESS" \
    --arg actor_rank "$ACTOR_RANK" \
    --arg target "$TARGET_ID" \
    --arg target_rank "$TARGET_RANK" \
    --argjson wealth_cost "$WEALTH_COST" \
    --argjson success_chance "$SUCCESS_CHANCE" \
    --argjson roll "$ROLL" \
    --argjson respect_gain "$RESPECT_GAIN" \
    --argjson loyalty_gain "$LOYALTY_GAIN" \
    --arg message "$MESSAGE" \
    '{
        success: $success,
        actor: { rank: $actor_rank },
        target: { id: $target, rank: $target_rank },
        cost: { wealth: $wealth_cost },
        roll: { value: $roll, chance: $success_chance },
        outcomes: {
            respect: $respect_gain,
            loyalty: $loyalty_gain,
            message: $message
        }
    }'
