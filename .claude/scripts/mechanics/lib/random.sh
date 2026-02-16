#!/bin/bash
# Deterministic Random Number Generation
# Provides seedable random for reproducible game mechanics

# Generate deterministic random number
# Usage: random_max <max> [seed]
# Returns: 0 to max-1
random_max() {
    local max="$1"
    local seed="${2:-${RANDOM_SEED:-$(date +%s%N)}}"

    # Use MD5 hash for deterministic output
    local hash=$(echo "$seed" | md5sum | cut -c1-8)
    local num=$((0x${hash} % max))

    echo "$num"
}

# Generate random number in range
# Usage: random_range <min> <max> [seed]
random_range() {
    local min="$1"
    local max="$2"
    local seed="${3:-${RANDOM_SEED:-}}"
    local range=$((max - min + 1))
    local num=$(random_max "$range" "$seed")

    echo $((min + num))
}

# Seeded random for character actions
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
    local seed="${1:-${RANDOM_SEED:-}}"
    random_range 1 100 "$seed"
}

# Roll standard dice
# Usage: roll_dice <sides> [seed]
roll_dice() {
    local sides="$1"
    local seed="${2:-${RANDOM_SEED:-}}"
    random_range 1 "$sides" "$seed"
}

# Multiple dice roll
# Usage: roll_dice_pool <count> <sides> [seed]
roll_dice_pool() {
    local count="$1"
    local sides="$2"
    local seed="${3:-${RANDOM_SEED:-}}"
    local total=0

    for ((i=0; i<count; i++)); do
        local roll=$(roll_dice "$sides" "${seed}-${i}")
        total=$((total + roll))
    done

    echo "$total"
}

# Set global seed for testing
# Usage: set_seed <seed_value>
set_seed() {
    RANDOM_SEED="$1"
    export RANDOM_SEED
}
