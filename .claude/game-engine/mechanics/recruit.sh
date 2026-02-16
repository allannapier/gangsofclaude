#!/bin/bash
# Recruit mechanic - Deterministic recruitment resolution
#
# Usage: recruit.sh <recruiter_id> <target_id>
#
# Output: JSON with recruitment result, costs, changes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/json.sh"
source "$SCRIPT_DIR/../lib/random.sh"
source "$SCRIPT_DIR/../lib/logging.sh"

# Arguments
RECRUITER_ID="$1"
TARGET_ID="$2"

# Load state
STATE_FILE="${GAME_ENGINE_STATE_PATH:-.claude/game-state/save.json}"
STATE=$(cat "$STATE_FILE")

# Get recruiter data
recruiter_rank=$(echo "$STATE" | jq -r '.player.rank // "Associate"')
recruiter_respect=$(echo "$STATE" | jq -r '.player.respect // 5')
recruiter_wealth=$(echo "$STATE" | jq -r '.player.wealth // 0')
recruiter_family=$(echo "$STATE" | jq -r '.player.family // ""')

# Get target data
target_family=$(echo "$STATE" | jq -r ".characters.${TARGET_ID}.family // \"\"")
target_rank=$(echo "$STATE" | jq -r ".characters.${TARGET_ID}.rank // \"Outsider\"")

# Create seed
recruit_seed="${RECRUITER_ID}-${TARGET_ID}-$(date +%s)"

debug "Recruit attempt: $recruiter_rank ($recruiter_family) -> $target_rank ($target_family)"

# Check rank restrictions
can_recruit=false
cost=0
success_chance=0

if [[ "$recruiter_rank" == "Associate" ]]; then
    # Associates can recruit outsiders
    if [[ "$target_rank" == "Outsider" ]]; then
        can_recruit=true
        cost=25
        success_chance=$((50 + recruiter_respect / 2))
    fi
elif [[ "$recruiter_rank" == "Soldier" ]]; then
    # Soldiers can't recruit, only mentor
    can_recruit=false
elif [[ "$recruiter_rank" =~ ^(Capo|Consigliere|Underboss|Don)$ ]]; then
    # Higher ranks can recruit Associates to Soldiers
    if [[ "$target_rank" == "Associate" ]]; then
        can_recruit=true
        cost=50
        success_chance=$((60 + recruiter_respect))
    fi
fi

# Check wealth requirement
if [[ $recruiter_wealth -lt $cost ]]; then
    jq -n \
        --arg status "insufficient_funds" \
        --argjson cost "$cost" \
        --argjson current_wealth "$recruiter_wealth" \
        '{
            status: $status,
            cost: $cost,
            current_wealth: $current_wealth,
            message: "Insufficient wealth for recruitment"
        }'
    exit 0
fi

# Roll for success
if [[ "$can_recruit" == "true" ]]; then
    roll=$(roll_percentile "$recruit_seed")
    debug "Recruitment roll: $roll vs $success_chance"

    if [[ $roll -le $success_chance ]]; then
        # Success!
        new_rank="Associate"
        new_family="$recruiter_family"

        jq -n \
            --arg status "success" \
            --arg recruiter_id "$RECRUITER_ID" \
            --arg target_id "$TARGET_ID" \
            --arg new_rank "$new_rank" \
            --arg new_family "$new_family" \
            --argjson cost "$cost" \
            --argjson respect_gain 5 \
            '{
                status: $status,
                recruiter_id: $recruiter_id,
                target_id: $target_id,
                changes: {
                    target: {
                        rank: $new_rank,
                        family: $new_family
                    },
                    recruiter: {
                        wealth: -$cost,
                        respect: +$respect_gain
                    }
                },
                message: "Successfully recruited \($target_id) as \($new_rank) of \($new_family)"
            }'
    else
        # Failure
        jq -n \
            --arg status "failure" \
            --arg recruiter_id "$RECRUITER_ID" \
            --arg target_id "$TARGET_ID" \
            --argjson cost "$cost" \
            --argjson respect_loss 2 \
            '{
                status: $status,
                recruiter_id: $recruiter_id,
                target_id: $target_id,
                changes: {
                    recruiter: {
                        wealth: -$cost,
                        respect: -$respect_loss
                    }
                },
                message: "Failed to recruit \($target_id)"
            }'
    fi
else
    # Can't recruit this target
    jq -n \
        --arg status "invalid_target" \
        --arg recruiter_rank "$recruiter_rank" \
        --arg target_rank "$target_rank" \
        '{
            status: $status,
            message: "\($recruiter_rank) cannot recruit \($target_rank)"
        }'
fi
