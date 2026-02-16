#!/bin/bash
# Turn Processing Script - Simplified version
# Processes all 22 AI characters' turns deterministically without LLM
# Usage: ./turn.sh <turn_number>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SAVE_FILE="$PROJECT_ROOT/game-state/save.json"
TURN_NUMBER="$1"

# Source random library
RANDOM_LIB="$SCRIPT_DIR/lib/random.sh"
if [[ -f "$RANDOM_LIB" ]]; then
    source "$RANDOM_LIB"
else
    echo "Warning: random.sh not found, using $RANDOM" >&2
fi

# Simple random function fallback
random_max() {
    local max="$1"
    echo $((RANDOM % max))
}

# Read deceased list from save.json
get_deceased() {
    jq -r '.deceased[]? // empty' "$SAVE_FILE" 2>/dev/null || true
}

# Get all territories and their current ownership
get_territory_ownership() {
    jq -r '.territoryOwnership // {}' "$SAVE_FILE" 2>/dev/null || echo '{}'
}

# Hash function for better action variety
char_hash() {
    local name="$1"
    local turn="$2"
    # Create a simple hash from character name + turn for variety
    local hash=0
    local str="${name}_turn_${turn}_salt"
    for ((i=0; i<${#str}; i++)); do
        local c=$(printf '%d' "'${str:$i:1}" 2>/dev/null || echo 65)
        hash=$(( (hash * 31 + c) % 1000000 ))
    done
    echo $hash
}

# Process single character action
process_action() {
    local char_name="$1"
    local char_family="$2"
    local char_rank="$3"
    local char_index="$4"

    # Use hash-based seed for better variety across turns and characters
    local seed=$(char_hash "$char_name" "$TURN_NUMBER")
    
    # Different action pools by rank for more realistic behavior
    local action=""
    case "$char_rank" in
        "Associate")
            local actions=("recruit" "intel" "message" "hold" "recruit" "expand")
            action="${actions[$((seed % 6))]}"
            ;;
        "Soldier")
            local actions=("attack" "intel" "expand" "recruit" "hold" "attack" "guard")
            action="${actions[$((seed % 7))]}"
            ;;
        "Capo")
            local actions=("expand" "attack" "recruit" "intel" "message" "expand" "attack")
            action="${actions[$((seed % 7))]}"
            ;;
        "Consigliere")
            local actions=("intel" "message" "negotiate" "advise" "intel" "recruit")
            action="${actions[$((seed % 6))]}"
            ;;
        "Underboss")
            local actions=("expand" "attack" "recruit" "intel" "message" "expand")
            action="${actions[$((seed % 6))]}"
            ;;
        "Don")
            local actions=("message" "expand" "intel" "negotiate" "hold" "attack")
            action="${actions[$((seed % 6))]}"
            ;;
        *)
            local actions=("hold" "recruit" "intel" "message" "expand" "attack")
            action="${actions[$((seed % 6))]}"
            ;;
    esac

    # Select target — vary rival targets based on hash
    local target="$char_family"
    if [[ "$action" == "attack" || "$action" == "intel" ]]; then
        # Select rival family based on hash for variety
        local rivals=()
        case "$char_family" in
            "marinelli") rivals=("rossetti" "falcone" "moretti") ;;
            "rossetti") rivals=("marinelli" "falcone" "moretti") ;;
            "falcone") rivals=("moretti" "marinelli" "rossetti") ;;
            "moretti") rivals=("falcone" "rossetti" "marinelli") ;;
        esac
        local rival_idx=$(( (seed / 7) % 3 ))
        target="${rivals[$rival_idx]}"
    fi

    # Create richer descriptions based on action
    local description=""
    case "$action" in
        "attack")
            local attack_descs=("led a raid against" "orchestrated a hit on" "attacked operations of" "struck at" "targeted")
            local desc_idx=$(( (seed / 11) % 5 ))
            description="$char_name ${attack_descs[$desc_idx]} the $(echo "$target" | sed 's/.*/\u&/') family"
            ;;
        "expand")
            description="$char_name expanded $(echo "$char_family" | sed 's/.*/\u&/') family operations"
            ;;
        "recruit")
            description="$char_name recruited new members for the $(echo "$char_family" | sed 's/.*/\u&/') family"
            ;;
        "intel")
            description="$char_name gathered intelligence on the $(echo "$target" | sed 's/.*/\u&/') family"
            ;;
        "message"|"negotiate"|"advise")
            description="$char_name coordinated with $(echo "$char_family" | sed 's/.*/\u&/') leadership"
            ;;
        "guard")
            description="$char_name guarded $(echo "$char_family" | sed 's/.*/\u&/') territory"
            ;;
        *)
            description="$char_name consolidated power within the $(echo "$char_family" | sed 's/.*/\u&/') family"
            ;;
    esac

    # Create event
    local event=$(jq -n \
        --argjson turn "$TURN_NUMBER" \
        --arg type "action" \
        --arg actor "$char_name" \
        --arg action "$action" \
        --arg target "$target" \
        --arg description "$description" \
        --argjson timestamp "$(date +%s)000" \
        '{
            turn: $turn,
            type: $type,
            actor: $actor,
            action: $action,
            target: $target,
            description: $description,
            timestamp: $timestamp
        }')

    # Add to events array
    jq ".events += [$event]" "$SAVE_FILE" > "${SAVE_FILE}.tmp"
    mv "${SAVE_FILE}.tmp" "$SAVE_FILE"
}

# Process territory changes from AI expand/attack actions
process_territory_changes() {
    local turn="$1"
    
    # Get current events for this turn
    local expand_events=$(jq -r --argjson t "$turn" '[.events[] | select(.turn == $t and (.action == "expand" or .action == "attack"))] | length' "$SAVE_FILE")
    
    if [[ "$expand_events" -eq 0 ]]; then
        return
    fi

    # Get list of all territory names
    local all_territories=$(jq -r '.territoryOwnership | keys[]' "$SAVE_FILE" 2>/dev/null)
    if [[ -z "$all_territories" ]]; then
        return
    fi

    # Find unowned territories
    local unowned=$(jq -r '[.territoryOwnership | to_entries[] | select(.value == "unowned" or .value == "" or .value == null) | .key] | .[]' "$SAVE_FILE" 2>/dev/null)
    
    # For each expand event by Capos/Underbosses/Dons, try to claim unowned territory
    local expand_actors=$(jq -r --argjson t "$turn" '.events[] | select(.turn == $t and .action == "expand") | .actor' "$SAVE_FILE")
    
    while IFS= read -r actor; do
        [[ -z "$actor" ]] && continue
        
        # Get actor's family from events
        local family=$(jq -r --argjson t "$turn" --arg a "$actor" '.events[] | select(.turn == $t and .actor == $a) | .target' "$SAVE_FILE" | head -1)
        [[ -z "$family" || "$family" == "null" ]] && continue
        
        # 30% chance an expand action actually claims territory
        local roll=$((RANDOM % 100))
        if [[ $roll -lt 30 ]]; then
            # Pick first available unowned territory
            local claimed_territory=""
            while IFS= read -r terr; do
                [[ -z "$terr" ]] && continue
                # Verify still unowned
                local current_owner=$(jq -r --arg t "$terr" '.territoryOwnership[$t] // "unowned"' "$SAVE_FILE")
                if [[ "$current_owner" == "unowned" || "$current_owner" == "" || "$current_owner" == "null" ]]; then
                    claimed_territory="$terr"
                    break
                fi
            done <<< "$unowned"
            
            if [[ -n "$claimed_territory" ]]; then
                local family_cap=$(echo "$family" | sed 's/.*/\u&/')
                # Update territory ownership
                jq --arg t "$claimed_territory" --arg f "$family" '.territoryOwnership[$t] = $f' "$SAVE_FILE" > "${SAVE_FILE}.tmp"
                mv "${SAVE_FILE}.tmp" "$SAVE_FILE"
                
                # Log territory claim event
                local claim_event=$(jq -n \
                    --argjson turn "$turn" \
                    --arg actor "$actor" \
                    --arg action "territory_claim" \
                    --arg target "$claimed_territory" \
                    --arg description "$actor claimed $claimed_territory for the $family_cap family" \
                    --arg result "🏴 $claimed_territory is now controlled by the $family_cap family" \
                    --arg outcome "success" \
                    --argjson timestamp "$(date +%s)000" \
                    '{turn: $turn, type: "territory", actor: $actor, action: $action, target: $target, description: $description, result: $result, outcome: $outcome, timestamp: $timestamp}')
                
                jq ".events += [$claim_event]" "$SAVE_FILE" > "${SAVE_FILE}.tmp"
                mv "${SAVE_FILE}.tmp" "$SAVE_FILE"
                
                # Remove claimed from unowned list
                unowned=$(echo "$unowned" | grep -v "^${claimed_territory}$" || true)
                
                echo "🏴 $actor claimed $claimed_territory for $family" >&2
            fi
        fi
    done <<< "$expand_actors"
}

# Main processing
main() {
    local turn="$1"

    # Get deceased list to skip dead characters
    local deceased_list=$(get_deceased)

    # Characters in order (rank-based)
    declare -a characters=(
        "Enzo Marinelli:Associate:marinelli:0:enzo_marinelli"
        "Paolo Rossetti:Associate:rossetti:1:paolo_rossetti"
        "Luca Marinelli:Soldier:marinelli:2:luca_marinelli"
        "Maria Rossetti:Soldier:rossetti:3:maria_rossetti"
        "Carlo Moretti:Soldier:moretti:4:carlo_moretti"
        "Leo Falcone:Soldier:falcone:5:leo_falcone"
        "Marco Marinelli:Capo:marinelli:6:marco_marinelli"
        "Franco Rossetti:Capo:rossetti:7:franco_rossetti"
        "Ricardo Moretti:Capo:moretti:8:ricardo_moretti"
        "Iris Falcone:Capo:falcone:9:iris_falcone"
        "Bruno Marinelli:Consigliere:marinelli:10:bruno_marinelli"
        "Antonio Rossetti:Consigliere:rossetti:11:antonio_rossetti"
        "Elena Moretti:Consigliere:moretti:12:elena_moretti"
        "Dante Falcone:Consigliere:falcone:13:dante_falcone"
        "Salvatore Marinelli:Underboss:marinelli:14:salvatore_marinelli"
        "Carla Rossetti:Underboss:rossetti:15:carla_rossetti"
        "Giovanni Moretti:Underboss:moretti:16:giovanni_moretti"
        "Victor Falcone:Underboss:falcone:17:victor_falcone"
        "Vito Marinelli:Don:marinelli:18:vito_marinelli"
        "Marco Rossetti:Don:rossetti:19:marco_rossetti"
        "Antonio Moretti:Don:moretti:20:antonio_moretti"
        "Sofia Falcone:Don:falcone:21:sofia_falcone"
    )

    local processed=0
    local skipped=0

    # Process each character
    for char_data in "${characters[@]}"; do
        IFS=':' read -r name rank family index char_id <<< "$char_data"
        
        # Skip deceased characters
        if echo "$deceased_list" | grep -q "^${char_id}$"; then
            echo "💀 Skipping deceased character: $name" >&2
            skipped=$((skipped + 1))
            continue
        fi
        
        process_action "$name" "$family" "$rank" "$index"
        processed=$((processed + 1))
    done

    # Process territory changes from expand/attack actions
    process_territory_changes "$turn"

    # Return JSON result
    jq -n \
        --argjson turn "$turn" \
        --argjson processed "$processed" \
        --argjson skipped "$skipped" \
        '{
            success: true,
            turn: $turn,
            characters_processed: $processed,
            characters_skipped: $skipped,
            message: "\($processed) characters processed (\($skipped) deceased skipped) for turn \($turn)"
        }'
}

# Run main function
main "$TURN_NUMBER"
