#!/bin/bash
# Status Display Script
# Generates formatted status output without LLM
# Usage: ./status.sh
# Returns: Formatted text output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAVE_FILE="$SCRIPT_DIR/../../game-state/save.json"

# Get player stats
PLAYER_NAME=$(jq -r '.player.name' "$SAVE_FILE")
PLAYER_RANK=$(jq -r '.player.rank' "$SAVE_FILE")
PLAYER_FAMILY=$(jq -r '.player.family' "$SAVE_FILE")
PLAYER_LOYALTY=$(jq -r '.player.loyalty' "$SAVE_FILE")
PLAYER_RESPECT=$(jq -r '.player.respect' "$SAVE_FILE")
PLAYER_WEALTH=$(jq -r '.player.wealth' "$SAVE_FILE")
PLAYER_CONTACTS=$(jq -r '.player.contacts // []' "$SAVE_FILE")
PLAYER_ENEMIES=$(jq -r '.player.enemies // []' "$SAVE_FILE")

# Get family color
FAMILY_COLOR=$(jq -r ".families.\"$PLAYER_FAMILY\".color // \"#ffffff\"" "$SAVE_FILE")

# Get family standings
FAMILY_STANDINGS=$(jq -r '.families | to_entries[] | "\(.key)|\(.key)|\(.value.territory)|\(.value.soldiers)|\(.value.wealth)|\(.value.standing)"' "$SAVE_FILE")

# Get recent messages (last 5)
RECENT_MESSAGES=$(jq -r '[.messages[] | select(.status == "unread")] | reverse | .[0:5] | .[] | "\(.from)|\(.type)|\(.content[0:50])..."' "$SAVE_FILE" 2>/dev/null || echo "")

# Get current events (last 5)
CURRENT_EVENTS=$(jq -r '[.events[]] | reverse | .[0:5] | .[] | "\(.type)|\(.description[0:80])..."' "$SAVE_FILE" 2>/dev/null || echo "")

# Calculate next rank requirements
NEXT_RANK=""
MISSING_REQUIREMENTS=""
case "$PLAYER_RANK" in
    "Outsider")
        NEXT_RANK="Associate"
        MISSING_REQUIREMENTS="• Complete /seek-patronage with any family"
        ;;
    "Associate")
        NEXT_RANK="Soldier"
        MISSING_REQUIREMENTS="• Respect: $PLAYER_RESPECT/10\n• Loyalty: $PLAYER_LOYALTY/60\n• Wealth: $PLAYER_WEALTH/100\n• Complete 1 successful mission"
        ;;
    "Soldier")
        NEXT_RANK="Capo"
        FAMILY_TERRITORY=$(jq -r ".families.\"$PLAYER_FAMILY\".territory" "$SAVE_FILE")
        ACTIONS=$(jq '[.events[] | select(.actor == "Player" and .type != "action")] | length' "$SAVE_FILE")
        MISSING_REQUIREMENTS="• Respect: $PLAYER_RESPECT/30\n• Loyalty: $PLAYER_LOYALTY/70\n• Territory: $FAMILY_TERRITORY/1\n• Actions: $ACTIONS/5"
        ;;
    "Capo")
        NEXT_RANK="Underboss"
        FAMILY_TERRITORY=$(jq -r ".families.\"$PLAYER_FAMILY\".territory" "$SAVE_FILE")
        FAMILY_SOLDIERS=$(jq -r ".families.\"$PLAYER_FAMILY\".soldiers" "$SAVE_FILE")
        MISSING_REQUIREMENTS="• Respect: $PLAYER_RESPECT/60\n• Loyalty: $PLAYER_LOYALTY/80\n• Territory: $FAMILY_TERRITORY/3\n• Soldiers: $FAMILY_SOLDIERS/5"
        ;;
    "Underboss")
        NEXT_RANK="Don"
        FAMILY_TERRITORY=$(jq -r ".families.\"$PLAYER_FAMILY\".territory" "$SAVE_FILE")
        FAMILY_SOLDIERS=$(jq -r ".families.\"$PLAYER_FAMILY\".soldiers" "$SAVE_FILE")
        MISSING_REQUIREMENTS="• Respect: $PLAYER_RESPECT/90\n• Loyalty: $PLAYER_LOYALTY/95\n• Territory: $FAMILY_TERRITORY/5\n• Soldiers: $FAMILY_SOLDIERS/10\n• Current Don must die"
        ;;
    "Don")
        NEXT_RANK="Maximum Rank"
        MISSING_REQUIREMENTS="You have reached the highest rank"
        ;;
esac

# Output formatted status
cat << EOF
═══════════════════════════════════════════════════════════════
                    YOUR STATUS
═══════════════════════════════════════════════════════════════

Name:     $PLAYER_NAME
Rank:     $PLAYER_RANK
Family:   $PLAYER_FAMILY

───────────────────────────────────────────────────────────────
ATTRIBUTES
───────────────────────────────────────────────────────────────
Loyalty:  $PLAYER_LOYALTY/100
Respect:  $PLAYER_RESPECT/100
Wealth:   $PLAYER_WEALTH

───────────────────────────────────────────────────────────────
FAMILY STANDINGS
───────────────────────────────────────────────────────────────
EOF

echo "$FAMILY_STANDINGS" | while IFS='|' read -r id name territory soldiers wealth standing; do
    if [ "$id" = "$PLAYER_FAMILY" ]; then
        echo "★ $name (Your Family)"
    else
        echo "  $name"
    fi
    echo "    Territory: $territory | Soldiers: $soldiers | Wealth: $wealth | Status: $standing"
    echo ""
done

cat << EOF
───────────────────────────────────────────────────────────────
RECENT MESSAGES
───────────────────────────────────────────────────────────────
EOF

if [ -n "$RECENT_MESSAGES" ]; then
    echo "$RECENT_MESSAGES" | while IFS='|' read -r from type content; do
        echo "• $from [$type]: $content"
    done
else
    echo "No new messages"
fi

cat << EOF

───────────────────────────────────────────────────────────────
CURRENT EVENTS
───────────────────────────────────────────────────────────────
EOF

if [ -n "$CURRENT_EVENTS" ]; then
    echo "$CURRENT_EVENTS" | while IFS='|' read -r type description; do
        echo "• [$type] $description"
    done
else
    echo "No current events"
fi

cat << EOF

───────────────────────────────────────────────────────────────
PROGRESS TO NEXT RANK: $NEXT_RANK
───────────────────────────────────────────────────────────────
EOF

echo -e "$MISSING_REQUIREMENTS"

cat << EOF

═══════════════════════════════════════════════════════════════
EOF
