#!/bin/bash
# Simplified Turn Processing Script for testing
set -e

SCRIPT_DIR="/home/allan/code/la_cosa_nostra/.claude/scripts/mechanics"
source "$SCRIPT_DIR/lib/random.sh"

CLAUDE_DIR="/home/allan/code/la_cosa_nostra/.claude"
SAVE_FILE="$CLAUDE_DIR/game-state/save.json"
TURN_NUMBER="$1"

echo "Processing turn $TURN_NUMBER..." >&2

# 测试处理一个角色
CHAR_ID="marinelli_enzo"
CHAR_RANK="Associate"
CHAR_FAMILY="marinelli"
CHAR_NAME="Enzo Marinelli"
CHAR_INDEX=0

# 选择行动
SEED=$((TURN_NUMBER + CHAR_INDEX + 50 + 50))
ACTION_INDEX=$((SEED % 6))
ACTIONS=("attack" "recruit" "expand" "intel" "message" "hold")
ACTION="${ACTIONS[$ACTION_INDEX]}"

echo "Selected action: $ACTION" >&2

# 创建事件
EVENT=$(jq -n \
    --argjson turn "$TURN_NUMBER" \
    --arg type "action" \
    --arg actor "$CHAR_NAME" \
    --arg action "$ACTION" \
    --arg target "$CHAR_FAMILY" \
    --arg description "$CHAR_NAME ($CHAR_FAMILY $CHAR_RANK) - $ACTION action" \
    --argjson timestamp $(date +%s)000 \
    '{
        turn: $turn,
        type: $type,
        actor: $actor,
        action: $action,
        target: $target,
        description: $description,
        timestamp: $timestamp
    }')

echo "Event: $EVENT" >&2

# 添加事件到save.json
jq ".events += [$EVENT]" "$SAVE_FILE" > "${SAVE_FILE}.tmp"
mv "${SAVE_FILE}.tmp" "$SAVE_FILE"

echo "✅ Character processed successfully" >&2

# 返回结果
jq -n \
    --argjson turn "$TURN_NUMBER" \
    --argjson processed 1 \
    '{
        success: true,
        turn: $turn,
        characters_processed: $processed,
        message: "\($processed) characters processed for turn \($turn)"
    }'
