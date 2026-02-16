#!/bin/bash
# Combat Resolution Script
# Calculates attack vs defense outcomes using deterministic formulas
# Usage: ./combat.sh <attacker_family> <defender_family> <attack_type>
# Returns: JSON with outcome, losses, gains

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAVE_FILE="$SCRIPT_DIR/../../game-state/save.json"
ATTACKER_FAMILY="$1"
DEFENDER_FAMILY="$2"
ATTACK_TYPE="$3"  # assassinate, beatdown, business, territory

# Get family stats
get_family_stat() {
    local family="$1"
    local stat="$2"
    jq -r ".families.\"$family\".$stat" "$SAVE_FILE"
}

# Get player stats if attacker is player
get_player_stat() {
    local stat="$1"
    jq -r ".player.$stat" "$SAVE_FILE"
}

ATTACKER_SOLDIERS=$(get_family_stat "$ATTACKER_FAMILY" "soldiers")
ATTACKER_TERRITORY=$(get_family_stat "$ATTACKER_FAMILY" "territory")
ATTACKER_WEALTH=$(get_family_stat "$ATTACKER_FAMILY" "wealth")

DEFENDER_SOLDIERS=$(get_family_stat "$DEFENDER_FAMILY" "soldiers")
DEFENDER_TERRITORY=$(get_family_stat "$DEFENDER_FAMILY" "territory")
DEFENDER_WEALTH=$(get_family_stat "$DEFENDER_FAMILY" "wealth")

# Get random values (seeded with timestamp for consistency)
RANDOM_ATTACK=$((1 + RANDOM % 20))
RANDOM_DEFENSE=$((1 + RANDOM % 20))

# Calculate combat power
ATTACK_POWER=$((ATTACKER_SOLDIERS * 10 + ATTACKER_TERRITORY * 5 + ATTACKER_WEALTH / 100 + RANDOM_ATTACK))
DEFENSE_POWER=$((DEFENDER_SOLDIERS * 10 + DEFENDER_TERRITORY * 5 + DEFENDER_WEALTH / 100 + RANDOM_DEFENSE))

# Calculate threshold for decisive victory (1.2x defense)
DECISIVE_THRESHOLD=$((DEFENSE_POWER * 12 / 10))

# Determine outcome
if [ "$ATTACK_POWER" -gt "$DECISIVE_THRESHOLD" ]; then
    OUTCOME="decisive_victory"
    ATTACKER_LOSS_PERCENT=$((5 + RANDOM % 11))  # 5-15%
    DEFENDER_LOSS_PERCENT=$((30 + RANDOM % 21)) # 30-50%
    TERRITORY_GAIN=$((1 + RANDOM % 3))
    WEALTH_STOLEN=$((DEFENDER_WEALTH * (10 + RANDOM % 10) / 100))
    RESPECT_GAIN=5
elif [ "$ATTACK_POWER" -gt "$DEFENSE_POWER" ]; then
    OUTCOME="marginal_victory"
    ATTACKER_LOSS_PERCENT=$((15 + RANDOM % 16)) # 15-30%
    DEFENDER_LOSS_PERCENT=$((15 + RANDOM % 16)) # 15-30%
    TERRITORY_GAIN=1
    WEALTH_STOLEN=$((DEFENDER_WEALTH * (5 + RANDOM % 5) / 100))
    RESPECT_GAIN=2
else
    OUTCOME="defeat"
    ATTACKER_LOSS_PERCENT=$((30 + RANDOM % 21)) # 30-50%
    DEFENDER_LOSS_PERCENT=$((5 + RANDOM % 11))  # 5-15%
    TERRITORY_GAIN=0
    WEALTH_STOLEN=0
    RESPECT_GAIN=-5
fi

# Calculate actual losses
ATTACKER_SOLDIERS_LOST=$((ATTACKER_SOLDIERS * ATTACKER_LOSS_PERCENT / 100))
DEFENDER_SOLDIERS_LOST=$((DEFENDER_SOLDIERS * DEFENDER_LOSS_PERCENT / 100))

# Output JSON result
jq -n \
    --arg outcome "$OUTCOME" \
    --arg attack_type "$ATTACK_TYPE" \
    --arg attacker "$ATTACKER_FAMILY" \
    --arg defender "$DEFENDER_FAMILY" \
    --argjson attack_power "$ATTACK_POWER" \
    --argjson defense_power "$DEFENSE_POWER" \
    --argjson attacker_soldiers_lost "$ATTACKER_SOLDIERS_LOST" \
    --argjson defender_soldiers_lost "$DEFENDER_SOLDIERS_LOST" \
    --argjson territory_gain "$TERRITORY_GAIN" \
    --argjson wealth_stolen "$WEALTH_STOLEN" \
    --argjson respect_gain "$RESPECT_GAIN" \
    '{
        outcome: $outcome,
        attackType: $attack_type,
        attacker: $attacker,
        defender: $defender,
        attackPower: $attack_power,
        defensePower: $defense_power,
        losses: {
            attacker: { soldiers: $attacker_soldiers_lost, percent: '"$ATTACKER_LOSS_PERCENT"' },
            defender: { soldiers: $defender_soldiers_lost, percent: '"$DEFENDER_LOSS_PERCENT"' }
        },
        gains: {
            territory: $territory_gain,
            wealth: $wealth_stolen,
            respect: $respect_gain
        }
    }'
