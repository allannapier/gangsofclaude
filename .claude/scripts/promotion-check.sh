#!/bin/bash
# Promotion Eligibility Check Script
# Checks if player meets requirements for next rank promotion
# Usage: ./promotion-check.sh
# Output: JSON with eligibility status, requirements met, and success chance

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SAVE_JSON="$ROOT_DIR/.claude/game-state/save.json"

# Read game state
if [[ ! -f "$SAVE_JSON" ]]; then
    echo '{"error": "save.json not found"}' | jq
    exit 1
fi

# Extract player data
PLAYER_RANK=$(jq -r '.player.rank // "Outsider"' "$SAVE_JSON")
PLAYER_RESPECT=$(jq -r '.player.respect // 0' "$SAVE_JSON")
PLAYER_FAMILY=$(jq -r '.player.family // ""' "$SAVE_JSON")
PLAYER_LOYALTY=$(jq -r '.player.loyalty // 0' "$SAVE_JSON")
PLAYER_WEALTH=$(jq -r '.player.wealth // 0' "$SAVE_JSON")

# Count successful actions (events with type "action" and actor "Player")
SUCCESSFUL_ACTIONS=$(jq -r '[.events[] | select(.actor == "Player" and .type == "action")] | length' "$SAVE_JSON")

# Get family data for territory/soldier counts
FAMILY_DATA=$(jq -r --arg family "$PLAYER_FAMILY" '.families[$family] // {}' "$SAVE_JSON")
FAMILY_TERRITORY=$(echo "$FAMILY_DATA" | jq -r '.territory // 0')
FAMILY_SOLDIERS=$(echo "$FAMILY_DATA" | jq -r '.soldiers // 0')

# Define rank hierarchy
RANKS=("Outsider" "Associate" "Soldier" "Capo" "Underboss" "Don")

# Find current rank index
CURRENT_RANK_INDEX=0
for i in "${!RANKS[@]}"; do
    if [[ "${RANKS[$i]}" == "$PLAYER_RANK" ]]; then
        CURRENT_RANK_INDEX=$i
        break
    fi
done

# Check if already at max rank
if [[ $CURRENT_RANK_INDEX -eq $((${#RANKS[@]} - 1)) ]]; then
    jq -n \
        --arg rank "$PLAYER_RANK" \
        --arg eligible "false" \
        --arg reason "Already at maximum rank" \
        '{
            current_rank: $rank,
            eligible: ($eligible == "true"),
            reason: $reason,
            requirements: {},
            success_chance: 0
        }'
    exit 0
fi

NEXT_RANK="${RANKS[$((CURRENT_RANK_INDEX + 1))]}"

# Initialize requirements tracking
REQUIREMENTS_MET=()
REQUIREMENTS_MISSING=()
BASE_CHANCE=70
RANK_HOLDERS=0  # Simplified - in full version would count NPCs at this rank

# Check requirements based on next rank
case "$NEXT_RANK" in
    "Associate")
        # Outsider -> Associate: Complete seek-patronage (handled separately)
        REQUIREMENTS_MISSING+=("Seek patronage from a family member")
        BASE_CHANCE=100
        ;;
    "Soldier")
        # Associate -> Soldier
        # Requirements: Respect 10+, 1 successful mission, Loyalty 60+, 100 wealth
        if [[ $PLAYER_RESPECT -ge 10 ]]; then
            REQUIREMENTS_MET+=("Respect: $PLAYER_RESPECT/10")
        else
            REQUIREMENTS_MISSING+=("Respect: $PLAYER_RESPECT/10")
        fi

        if [[ $SUCCESSFUL_ACTIONS -ge 1 ]]; then
            REQUIREMENTS_MET+=("Successful actions: $SUCCESSFUL_ACTIONS/1")
        else
            REQUIREMENTS_MISSING+=("Successful actions: $SUCCESSFUL_ACTIONS/1")
        fi

        if [[ $PLAYER_LOYALTY -ge 60 ]]; then
            REQUIREMENTS_MET+=("Loyalty: $PLAYER_LOYALTY/60")
        else
            REQUIREMENTS_MISSING+=("Loyalty: $PLAYER_LOYALTY/60")
        fi

        if [[ $PLAYER_WEALTH -ge 100 ]]; then
            REQUIREMENTS_MET+=("Wealth: $PLAYER_WEALTH/100")
        else
            REQUIREMENTS_MISSING+=("Wealth: $PLAYER_WEALTH/100 (cost to buy in)")
        fi
        ;;
    "Capo")
        # Soldier -> Capo
        # Requirements: Respect 30+, 5 successful actions, 1+ territory, Loyalty 70+
        if [[ $PLAYER_RESPECT -ge 30 ]]; then
            REQUIREMENTS_MET+=("Respect: $PLAYER_RESPECT/30")
        else
            REQUIREMENTS_MISSING+=("Respect: $PLAYER_RESPECT/30")
        fi

        if [[ $SUCCESSFUL_ACTIONS -ge 5 ]]; then
            REQUIREMENTS_MET+=("Successful actions: $SUCCESSFUL_ACTIONS/5")
        else
            REQUIREMENTS_MISSING+=("Successful actions: $SUCCESSFUL_ACTIONS/5")
        fi

        # Count player-controlled territories
        PLAYER_TERRITORIES=$(jq -r '[.territoryOwnership // {} | to_entries[] | select(.value == $family) | .key] | length' \
            --arg family "$PLAYER_FAMILY" "$SAVE_JSON")

        if [[ $PLAYER_TERRITORIES -ge 1 ]]; then
            REQUIREMENTS_MET+=("Controlled territories: $PLAYER_TERRITORIES/1+")
        else
            REQUIREMENTS_MISSING+=("Controlled territories: $PLAYER_TERRITORIES/1+")
        fi

        if [[ $PLAYER_LOYALTY -ge 70 ]]; then
            REQUIREMENTS_MET+=("Loyalty: $PLAYER_LOYALTY/70")
        else
            REQUIREMENTS_MISSING+=("Loyalty: $PLAYER_LOYALTY/70")
        fi

        # Check if Capo position is available (simplified)
        REQUIREMENTS_MET+=("Capo position must be vacant or start your own crew")
        ;;
    "Underboss")
        # Capo -> Underboss
        # Requirements: Respect 60+, 3+ territories, 5+ soldiers, Loyalty 80+
        if [[ $PLAYER_RESPECT -ge 60 ]]; then
            REQUIREMENTS_MET+=("Respect: $PLAYER_RESPECT/60")
        else
            REQUIREMENTS_MISSING+=("Respect: $PLAYER_RESPECT/60")
        fi

        if [[ $PLAYER_TERRITORIES -ge 3 ]]; then
            REQUIREMENTS_MET+=("Controlled territories: $PLAYER_TERRITORIES/3")
        else
            REQUIREMENTS_MISSING+=("Controlled territories: $PLAYER_TERRITORIES/3")
        fi

        if [[ $FAMILY_SOLDIERS -ge 5 ]]; then
            REQUIREMENTS_MET+=("Family soldiers: $FAMILY_SOLDIERS/5")
        else
            REQUIREMENTS_MISSING+=("Family soldiers: $FAMILY_SOLDIERS/5")
        fi

        if [[ $PLAYER_LOYALTY -ge 80 ]]; then
            REQUIREMENTS_MET+=("Loyalty: $PLAYER_LOYALTY/80")
        else
            REQUIREMENTS_MISSING+=("Loyalty: $PLAYER_LOYALTY/80")
        fi

        REQUIREMENTS_MET+=("Underboss position must be vacant")
        ;;
    "Don")
        # Underboss -> Don
        # Requirements: Respect 90+, 5+ territories, 10+ soldiers, Loyalty 95+
        if [[ $PLAYER_RESPECT -ge 90 ]]; then
            REQUIREMENTS_MET+=("Respect: $PLAYER_RESPECT/90")
        else
            REQUIREMENTS_MISSING+=("Respect: $PLAYER_RESPECT/90")
        fi

        if [[ $PLAYER_TERRITORIES -ge 5 ]]; then
            REQUIREMENTS_MET+=("Controlled territories: $PLAYER_TERRITORIES/5")
        else
            REQUIREMENTS_MISSING+=("Controlled territories: $PLAYER_TERRITORIES/5")
        fi

        if [[ $FAMILY_SOLDIERS -ge 10 ]]; then
            REQUIREMENTS_MET+=("Family soldiers: $FAMILY_SOLDIERS/10")
        else
            REQUIREMENTS_MISSING+=("Family soldiers: $FAMILY_SOLDIERS/10")
        fi

        if [[ $PLAYER_LOYALTY -ge 95 ]]; then
            REQUIREMENTS_MET+=("Loyalty: $PLAYER_LOYALTY/95")
        else
            REQUIREMENTS_MISSING+=("Loyalty: $PLAYER_LOYALTY/95")
        fi

        REQUIREMENTS_MET+=("Current Don must die")
        ;;
esac

# Calculate success chance
# Formula: base_chance + (player.respect/4) + (family_loyalty/10) - (current_rank_holders * 5)
SUCCESS_CHANCE=$((BASE_CHANCE + (PLAYER_RESPECT / 4) + (PLAYER_LOYALTY / 10) - (RANK_HOLDERS * 5)))

# Cap success chance at 95% minimum 5%
if [[ $SUCCESS_CHANCE -gt 95 ]]; then
    SUCCESS_CHANCE=95
elif [[ $SUCCESS_CHANCE -lt 5 ]]; then
    SUCCESS_CHANCE=5
fi

# Determine eligibility
ELIGIBLE="false"
if [[ ${#REQUIREMENTS_MISSING[@]} -eq 0 ]]; then
    ELIGIBLE="true"
fi

# Build requirements object
REQUIREMENTS_JSON=$(jq -n \
    --argjson met "$(printf '%s\n' "${REQUIREMENTS_MET[@]}" | jq -R . | jq -s 'map(split(": ") | {requirement: (.[0]), current: (.[1] // "N/A")})')" \
    --argjson missing "$(printf '%s\n' "${REQUIREMENTS_MISSING[@]}" | jq -R . | jq -s 'map(split(": ") | {requirement: (.[0]), current: (.[1] // "N/A")})')" \
    '{met: $met, missing: $missing}')

# Output result
jq -n \
    --arg current_rank "$PLAYER_RANK" \
    --arg next_rank "$NEXT_RANK" \
    --arg eligible "$ELIGIBLE" \
    --argjson success_chance "$SUCCESS_CHANCE" \
    --argjson requirements "$REQUIREMENTS_JSON" \
    '{
        current_rank: $current_rank,
        next_rank: $next_rank,
        eligible: ($eligible == "true"),
        success_chance: $success_chance,
        requirements: $requirements
    }'
