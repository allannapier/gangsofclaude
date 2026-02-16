#!/bin/bash
# Gangs of Claude - Game Engine
# Main entry point for all deterministic game mechanics
#
# Usage: engine.sh <command> [args...]
#
# Commands:
#   attack <attacker_id> <target_id> <attack_type>
#   recruit <recruiter_id> <target_id>
#   expand <character_id> <territory_id>
#   intel <character_id> <target_id> <intel_type>
#   promote <character_id>
#   process-turn <turn_number>
#   validate-state
#   get-state <path>

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"
MECHANICS_DIR="$SCRIPT_DIR/mechanics"
STATE_DIR="$SCRIPT_DIR/state"

# Source libraries
source "$LIB_DIR/json.sh"
source "$LIB_DIR/logging.sh"
source "$LIB_DIR/random.sh"

# Configuration
STATE_FILE="${GAME_ENGINE_STATE_PATH:-.claude/game-state/save.json}"
DEBUG="${GAME_ENGINE_DEBUG:-false}"

# Main dispatcher
main() {
    local command="$1"
    shift || true

    case "$command" in
        attack)
            mechanic_attack "$@"
            ;;
        recruit)
            mechanic_recruit "$@"
            ;;
        expand)
            mechanic_expand "$@"
            ;;
        intel)
            mechanic_intel "$@"
            ;;
        promote)
            mechanic_promote "$@"
            ;;
        process-turn)
            mechanic_process_turn "$@"
            ;;
        validate-state)
            state_validate
            ;;
        get-state)
            state_get "$@"
            ;;
        set-state)
            state_set "$@"
            ;;
        *)
            error "Unknown command: $command"
            echo "Available commands: attack, recruit, expand, intel, promote, process-turn, validate-state, get-state, set-state" >&2
            exit 1
            ;;
    esac
}

# Attack mechanic
mechanic_attack() {
    local attacker_id="$1"
    local target_id="$2"
    local attack_type="${3:-beatdown}"

    debug "Executing attack: $attacker_id -> $target_id ($attack_type)"

    # Get current state
    local state=$(state_read)
    local attacker=$(json_get "$state" "$attacker_id")
    local target=$(json_get "$state" "$target_id")

    # Call attack mechanics
    local result=$("$MECHANICS_DIR/attack.sh" "$attacker" "$target" "$attack_type")

    # Apply results to state
    local new_state=$(state_apply_attack "$state" "$result")

    # Write new state
    state_write "$new_state"

    # Return result with narrative
    engine_output "$result" "attack-$(json_get "$result" "result")"
}

# Recruit mechanic
mechanic_recruit() {
    local recruiter_id="$1"
    local target_id="$2"

    debug "Executing recruit: $recruiter_id -> $target_id"

    local state=$(state_read)
    local result=$("$MECHANICS_DIR/recruit.sh" "$recruiter_id" "$target_id")
    local new_state=$(state_apply_recruit "$state" "$result")

    state_write "$new_state"
    engine_output "$result" "recruit-$(json_get "$result" "status")"
}

# Expand mechanic
mechanic_expand() {
    local character_id="$1"
    local territory_id="$2"

    debug "Executing expand: $character_id -> $territory_id"

    local state=$(state_read)
    local result=$("$MECHANICS_DIR/expand.sh" "$character_id" "$territory_id")
    local new_state=$(state_apply_expand "$state" "$result")

    state_write "$new_state"
    engine_output "$result" "expand-$(json_get "$result" "status")"
}

# Intel mechanic
mechanic_intel() {
    local character_id="$1"
    local target_id="$2"
    local intel_type="${3:-survey}"

    debug "Executing intel: $character_id -> $target_id ($intel_type)"

    local state=$(state_read)
    local result=$("$MECHANICS_DIR/intel.sh" "$character_id" "$target_id" "$intel_type")

    # Intel doesn't change state, just returns information
    engine_output "$result" "intel-$intel_type"
}

# Promote mechanic
mechanic_promote() {
    local character_id="$1"

    debug "Executing promote: $character_id"

    local state=$(state_read)
    local result=$("$MECHANICS_DIR/promotion.sh" "$character_id")
    local new_state=$(state_apply_promote "$state" "$result")

    state_write "$new_state"
    engine_output "$result" "promote-$(json_get "$result" "status")"
}

# Process turn mechanic
mechanic_process_turn() {
    local turn_number="$1"

    debug "Processing turn: $turn_number"

    local state=$(state_read)
    local result=$("$MECHANICS_DIR/turn.sh" "$turn_number")
    local new_state=$(state_apply_turn "$state" "$result")

    state_write "$new_state"
    engine_output "$result" "turn-complete"
}

# State operations
state_read() {
    cat "$STATE_FILE" 2>/dev/null || echo '{"turn":0,"phase":"playing"}'
}

state_write() {
    local new_state="$1"
    echo "$new_state" | jq '.' > "$STATE_FILE"
}

state_validate() {
    "$STATE_DIR/validate.sh"
}

state_get() {
    local path="$1"
    state_read | jq -r ".$path // empty"
}

state_set() {
    local path="$1"
    local value="$2"
    local state=$(state_read)
    echo "$state" | jq ".$path = $value" > "$STATE_FILE"
}

# Helper: Apply attack results to state
state_apply_attack() {
    local state="$1"
    local result="$2"

    # Update casualties, territory, wealth
    # Returns modified state JSON
    echo "$state" | jq '
        .families[$attacker.family].soldiers -= $result.attacker_losses.soldiers |
        .families[$attacker.family].wealth -= $result.attacker_losses.wealth |
        .families[$defender.family].soldiers -= $result.defender_losses.soldiers |
        .families[$defender.family].wealth -= $result.defender_losses.wealth |
        if $result.territory_transfers then
            .territoryOwnership[$transfer.territory] = $transfer.to
        end
    ' --argjson result "$result"
}

# Helper: Apply recruit results to state
state_apply_recruit() {
    local state="$1"
    local result="$2"
    # Implementation similar to attack
    echo "$state"
}

# Helper: Apply expand results to state
state_apply_expand() {
    local state="$1"
    local result="$2"
    # Implementation
    echo "$state"
}

# Helper: Apply promote results to state
state_apply_promote() {
    local state="$1"
    local result="$2"
    # Implementation
    echo "$state"
}

# Helper: Apply turn results to state
state_apply_turn() {
    local state="$1"
    local result="$2"
    # Implementation
    echo "$state"
}

# Output format for engine
engine_output() {
    local result="$1"
    local template="${2:-default}"

    jq -n \
        --argjson result "$result" \
        --arg template "$template" \
        '{
            success: true,
            result: $result,
            narrative: {
                template: $template,
                variables: $result
            }
        }'
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
