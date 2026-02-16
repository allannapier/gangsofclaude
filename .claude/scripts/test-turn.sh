#!/bin/bash
# Test script for turn.sh
# Tests the turn processing functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MECHANICS_DIR="$SCRIPT_DIR/mechanics"
TEST_SAVE_FILE="/tmp/test-turn-save.json"

# 创建测试游戏状态
create_test_save() {
    cat > "$TEST_SAVE_FILE" << 'EOF'
{
  "turn": 1,
  "phase": "playing",
  "player": {
    "name": "Player",
    "rank": "Associate",
    "family": "marinelli",
    "loyalty": 50,
    "respect": 5,
    "wealth": 100,
    "contacts": [],
    "enemies": []
  },
  "families": {
    "marinelli": {
      "id": "marinelli",
      "name": "Marinelli",
      "soldiers": 3,
      "territory": 2,
      "wealth": 5000
    },
    "rossetti": {
      "id": "rossetti",
      "name": "Rossetti",
      "soldiers": 3,
      "territory": 2,
      "wealth": 6000
    },
    "falcone": {
      "id": "falcone",
      "name": "Falcone",
      "soldiers": 3,
      "territory": 2,
      "wealth": 5500
    },
    "moretti": {
      "id": "moretti",
      "name": "Moretti",
      "soldiers": 3,
      "territory": 2,
      "wealth": 5200
    }
  },
  "territoryOwnership": {},
  "events": [],
  "messages": []
}
EOF
}

echo "=== Turn Processing Test Suite ==="
echo ""

# 创建测试状态
echo "Creating test game state..."
create_test_save

# 备份原始save.json
if [[ -f "$SCRIPT_DIR/../game-state/save.json" ]]; then
    cp "$SCRIPT_DIR/../game-state/save.json" "/tmp/save-backup-$(date +%s).json"
    # 使用测试文件
    cp "$TEST_SAVE_FILE" "$SCRIPT_DIR/../game-state/save.json"
fi

echo "Running turn processing for turn 1..."
echo ""

# 运行turn.sh
RESULT=$("$MECHANICS_DIR/turn.sh" 1)

echo "Result:"
echo "$RESULT" | jq '.'

# 恢复原始save.json
if [[ -f "/tmp/save-backup-"*".json" ]]; then
    latest_backup=$(ls -t /tmp/save-backup-*.json | head -1)
    cp "$latest_backup" "$SCRIPT_DIR/../game-state/save.json"
    rm "$latest_backup"
fi

# 检查结果
SUCCESS=$(echo "$RESULT" | jq -r '.success')
PROCESSED=$(echo "$RESULT" | jq -r '.characters_processed')

echo ""
echo "=== Test Results ==="
if [[ "$SUCCESS" == "true" ]] && [[ "$PROCESSED" == "22" ]]; then
    echo "✅ PASS: All 22 characters processed successfully"
    exit 0
else
    echo "❌ FAIL: Expected 22 characters processed, got $PROCESSED"
    exit 1
fi
