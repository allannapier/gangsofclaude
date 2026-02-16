#!/bin/bash
# Attack mechanic - Deterministic combat resolution
#
# Usage: attack.sh <attacker_json> <defender_json> <attack_type>
#
# Output: JSON with combat result, casualties, territory changes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/json.sh"
source "$SCRIPT_DIR/../lib/random.sh"
source "$SCRIPT_DIR/../lib/logging.sh"

# Arguments
ATTACKER_JSON="$1"
DEFENDER_JSON="$2"
ATTACK_TYPE="${3:-beatdown}"

# Parse inputs
attacker_family=$(echo "$ATTACKER_JSON" | jq -r '.family // ""')
attacker_soldiers=$(echo "$ATTACKER_JSON" | jq -r '.soldiers // 3')
attacker_territory=$(echo "$ATTACKER_JSON" | jq -r '.territory // 1')
attacker_wealth=$(echo "$ATTACKER_JSON" | jq -r '.wealth // 5000')

defender_family=$(echo "$DEFENDER_JSON" | jq -r '.family // ""')
defender_soldiers=$(echo "$DEFENDER_JSON" | jq -r '.soldiers // 3')
defender_territory=$(echo "$DEFENDER_JSON" | jq -r '.territory // 1')
defender_wealth=$(echo "$DEFENDER_JSON" | jq -r '.wealth // 5000')

# Create deterministic seed from inputs
attack_seed="${attacker_family}-${defender_family}-${ATTACK_TYPE}"

# Calculate attack power
attack_power=$(( (attacker_soldiers * 10) +
                (attacker_territory * 5) +
                (attacker_wealth / 100) +
                $(random_max 20 "${attack_seed}-attack") ))

# Calculate defense power
defense_power=$(( (defender_soldiers * 10) +
                (defender_territory * 5) +
                (defender_wealth / 100) +
                $(random_max 20 "${attack_seed}-defense") ))

debug "Attack: $attacker_family (power: $attack_power) vs $defender_family (power: $defense_power)"

# Determine outcome
if [[ $attack_power -gt $((defense_power * 12 / 10)) ]]; then
    result="decisive_victory"
    attacker_soldier_loss=$((attacker_soldiers * 5 / 100 + 1))
    defender_soldier_loss=$((defender_soldiers * 40 / 100))
    attacker_wealth_loss=100
    defender_wealth_loss=500
    territory_gained=1
elif [[ $attack_power -gt $defense_power ]]; then
    result="marginal_victory"
    attacker_soldier_loss=$((attacker_soldiers * 20 / 100 + 1))
    defender_soldier_loss=$((defender_soldiers * 20 / 100))
    attacker_wealth_loss=200
    defender_wealth_loss=200
    territory_gained=0
else
    result="defeat"
    attacker_soldier_loss=$((attacker_soldiers * 40 / 100))
    defender_soldier_loss=$((defender_soldiers * 10 / 100))
    attacker_wealth_loss=500
    defender_wealth_loss=100
    territory_gained=0
fi

# Special: Assassination attempt
if [[ "$ATTACK_TYPE" == "assassinate" ]]; then
    if [[ "$result" == "decisive_victory" ]]; then
        # Roll for assassination success
        assassinate_roll=$(roll_percentile "${attack_seed}-assassinate")
        if [[ $assassinate_roll -le 70 ]]; then
            assassination_success=true
            result="assassination_success"
        else
            assassination_success=false
        fi
    fi
fi

# Build output JSON
jq -n \
    --arg result "$result" \
    --arg attack_type "$ATTACK_TYPE" \
    --arg attacker_family "$attacker_family" \
    --arg defender_family "$defender_family" \
    --argjson attack_power "$attack_power" \
    --argjson defense_power "$defense_power" \
    --argjson attacker_losses "{\"soldiers\":$attacker_soldier_loss,\"wealth\":$attacker_wealth_loss,\"territory\":0}" \
    --argjson defender_losses "{\"soldiers\":$defender_soldier_loss,\"wealth\":$defender_wealth_loss,\"territory\":$territory_gained}" \
    --argjson assassination_success "${assassination_success:-false}" \
    '{
        result: $result,
        attack_type: $attack_type,
        attacker_family: $attacker_family,
        defender_family: $defender_family,
        attack_power: $attack_power,
        defense_power: $defense_power,
        attacker_losses: $attacker_losses,
        defender_losses: $defender_losses,
        assassination_success: $assassination_success,
        territory_gained: ($result == "decisive_victory" and $attack_type == "territory") ? 1 : 0
    }'
