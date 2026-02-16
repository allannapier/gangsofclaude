#!/bin/bash
# Promotion Eligibility Check Script
# Checks if player qualifies for rank promotion
# Usage: ./promotion.sh
# Returns: JSON with eligibility, requirements, success chance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAVE_FILE="$SCRIPT_DIR/../../game-state/save.json"

# Get player stats
PLAYER_RANK=$(jq -r '.player.rank' "$SAVE_FILE")
PLAYER_RESPECT=$(jq '.player.respect' "$SAVE_FILE")
PLAYER_LOYALTY=$(jq -r '.player.loyalty // 50' "$SAVE_FILE")
PLAYER_WEALTH=$(jq '.player.wealth' "$SAVE_FILE")
PLAYER_FAMILY=$(jq -r '.player.family' "$SAVE_FILE")

# Get family stats
FAMILY_SOLDIERS=$(jq -r ".families.\"$PLAYER_FAMILY\".soldiers" "$SAVE_FILE")
FAMILY_TERRITORY=$(jq -r ".families.\"$PLAYER_FAMILY\".territory" "$SAVE_FILE")

# Count successful actions (events where player acted)
PLAYER_ACTIONS=$(jq '[.events[] | select(.actor == "Player" and .type != "action")] | length' "$SAVE_FILE")

# Check requirements for each rank
check_requirements() {
    local current_rank="$1"
    local next_rank=""
    local eligible="false"
    local missing_requirements=[]
    local success_chance=0

    case "$current_rank" in
        "Outsider")
            next_rank="Associate"
            # Outsider -> Associate requires successful /seek-patronage
            if jq -e '.player.family != "none"' "$SAVE_FILE" >/dev/null; then
                eligible="true"
                success_chance=100
            else
                missing_requirements='["Complete /seek-patronage with any family"]'
            fi
            ;;
        "Associate")
            next_rank="Soldier"
            local respect_ok=false
            local loyalty_ok=false
            local wealth_ok=false
            local actions_ok=false

            [ "$PLAYER_RESPECT" -ge 10 ] && respect_ok=true
            [ "$PLAYER_LOYALTY" -ge 60 ] && loyalty_ok=true
            [ "$PLAYER_WEALTH" -ge 100 ] && wealth_ok=true
            [ "$PLAYER_ACTIONS" -ge 1 ] && actions_ok=true

            if $respect_ok && $loyalty_ok && $wealth_ok && $actions_ok; then
                eligible="true"
                # Calculate success chance
                success_chance=$((70 + PLAYER_RESPECT / 4 + PLAYER_LOYALTY / 10))
            else
                local missing=()
                $respect_ok || missing+=("Respect: $PLAYER_RESPECT/10")
                $loyalty_ok || missing+=("Loyalty: $PLAYER_LOYALTY/60")
                $wealth_ok || missing+=("Wealth: $PLAYER_WEALTH/100")
                $actions_ok || missing+=("Complete 1 mission")
                missing_requirements=$(printf '%s\n' "${missing[@]}" | jq -R . | jq -s .)
            fi
            ;;
        "Soldier")
            next_rank="Capo"
            local respect_ok=false
            local loyalty_ok=false
            local territory_ok=false
            local actions_ok=false

            [ "$PLAYER_RESPECT" -ge 30 ] && respect_ok=true
            [ "$PLAYER_LOYALTY" -ge 70 ] && loyalty_ok=true
            [ "$FAMILY_TERRITORY" -ge 1 ] && territory_ok=true
            [ "$PLAYER_ACTIONS" -ge 5 ] && actions_ok=true

            if $respect_ok && $loyalty_ok && $territory_ok && $actions_ok; then
                eligible="true"
                success_chance=$((60 + PLAYER_RESPECT / 4))
            else
                local missing=()
                $respect_ok || missing+=("Respect: $PLAYER_RESPECT/30")
                $loyalty_ok || missing+=("Loyalty: $PLAYER_LOYALTY/70")
                $territory_ok || missing+=("Control 1 territory (current: $FAMILY_TERRITORY)")
                $actions_ok || missing+=("Complete 5 actions (current: $PLAYER_ACTIONS)")
                missing_requirements=$(printf '%s\n' "${missing[@]}" | jq -R . | jq -s .)
            fi
            ;;
        "Capo")
            next_rank="Underboss"
            local respect_ok=false
            local loyalty_ok=false
            local territory_ok=false
            local soldiers_ok=false

            [ "$PLAYER_RESPECT" -ge 60 ] && respect_ok=true
            [ "$PLAYER_LOYALTY" -ge 80 ] && loyalty_ok=true
            [ "$FAMILY_TERRITORY" -ge 3 ] && territory_ok=true
            [ "$FAMILY_SOLDIERS" -ge 5 ] && soldiers_ok=true

            if $respect_ok && $loyalty_ok && $territory_ok && $soldiers_ok; then
                eligible="true"
                success_chance=$((50 + PLAYER_RESPECT / 5))
            else
                local missing=()
                $respect_ok || missing+=("Respect: $PLAYER_RESPECT/60")
                $loyalty_ok || missing+=("Loyalty: $PLAYER_LOYALTY/80")
                $territory_ok || missing+=("Control 3 territories (current: $FAMILY_TERRITORY)")
                $soldiers_ok || missing+=("Have 5 soldiers (current: $FAMILY_SOLDIERS)")
                missing_requirements=$(printf '%s\n' "${missing[@]}" | jq -R . | jq -s .)
            fi
            ;;
        "Underboss")
            next_rank="Don"
            local respect_ok=false
            local loyalty_ok=false
            local territory_ok=false
            local soldiers_ok=false

            [ "$PLAYER_RESPECT" -ge 90 ] && respect_ok=true
            [ "$PLAYER_LOYALTY" -ge 95 ] && loyalty_ok=true
            [ "$FAMILY_TERRITORY" -ge 5 ] && territory_ok=true
            [ "$FAMILY_SOLDIERS" -ge 10 ] && soldiers_ok=true

            if $respect_ok && $loyalty_ok && $territory_ok && $soldiers_ok; then
                eligible="true"
                success_chance=$((40 + PLAYER_RESPECT / 5))
            else
                local missing=()
                $respect_ok || missing+=("Respect: $PLAYER_RESPECT/90")
                $loyalty_ok || missing+=("Loyalty: $PLAYER_LOYALTY/95")
                $territory_ok || missing+=("Control 5 territories (current: $FAMILY_TERRITORY)")
                $soldiers_ok || missing+=("Have 10 soldiers (current: $FAMILY_SOLDIERS)")
                missing_requirements=$(printf '%s\n' "${missing[@]}" | jq -R . | jq -s .)
            fi
            ;;
        "Don")
            next_rank="Maximum Rank"
            eligible="false"
            missing_requirements='["You have reached the highest rank"]'
            success_chance=0
            ;;
    esac

    # Output JSON
    jq -n \
        --arg current_rank "$current_rank" \
        --arg next_rank "$next_rank" \
        --argjson eligible "$eligible" \
        --argjson missing "$missing_requirements" \
        --argjson success_chance "$success_chance" \
        --argjson respect "$PLAYER_RESPECT" \
        --argjson loyalty "$PLAYER_LOYALTY" \
        --argjson wealth "$PLAYER_WEALTH" \
        --argjson actions "$PLAYER_ACTIONS" \
        '{
            currentRank: $current_rank,
            nextRank: $next_rank,
            eligible: $eligible,
            missingRequirements: $missing,
            successChance: $success_chance,
            currentStats: {
                respect: $respect,
                loyalty: $loyalty,
                wealth: $wealth,
                actionsCompleted: $actions
            }
        }'
}

check_requirements "$PLAYER_RANK"
