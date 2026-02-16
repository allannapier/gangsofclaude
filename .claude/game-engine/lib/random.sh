#!/bin/bash
# Deterministic random number generation for game engine
# Uses seedable random for reproducible game mechanics

# Current seed (can be set for testing)
GAME_ENGINE_SEED="${GAME_ENGINE_SEED:-}"

# Set seed for reproducible results
# Usage: random_seed <seed_value>
random_seed() {
    GAME_ENGINE_SEED="$1"
    export GAME_ENGINE_SEED
}

# Generate deterministic random number
# Usage: random_max <max_value> [seed]
# Returns: 0 to max_value-1
random_max() {
    local max="$1"
    local seed="${2:-${GAME_ENGINE_SEED:-$(date +%s%N)}}"

    # Use seed for deterministic output
    local hash=$(echo "$seed" | md5sum | cut -c1-8)
    local num=$((0x${hash} % max))

    echo "$num"
}

# Generate random number in range
# Usage: random_range <min> <max> [seed]
random_range() {
    local min="$1"
    local max="$2"
    local seed="${3:-${GAME_ENGINE_SEED:-}}"
    local range=$((max - min + 1))
    local num=$(random_max "$range" "$seed")

    echo $((min + num))
}

# Seeded random for consistent character actions
# Usage: character_random <character_id> <turn_number> <max>
character_random() {
    local char_id="$1"
    local turn="$2"
    local max="$3"

    # Create seed from character and turn
    local seed="${char_id}-${turn}"
    random_max "$max" "$seed"
}

# Roll percentile dice
# Usage: roll_percentile [seed]
roll_percentile() {
    local seed="${1:-${GAME_ENGINE_SEED:-}}"
    random_range 1 100 "$seed"
}

# Roll standard dice
# Usage: roll_dice <sides> [seed]
roll_dice() {
    local sides="$1"
    local seed="${2:-${GAME_ENGINE_SEED:-}}"
    random_range 1 "$sides" "$seed"
}

# Multiple dice roll
# Usage: roll_dice_pool <count> <sides> [seed]
roll_dice_pool() {
    local count="$1"
    local sides="$2"
    local seed="${3:-${GAME_ENGINE_SEED:-}}"
    local total=0

    for ((i=0; i<count; i++)); do
        local roll=$(roll_dice "$sides" "${seed}-${i}")
        total=$((total + roll))
    done

    echo "$total"
}
