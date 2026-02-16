#!/bin/bash
# Test Suite for Game Mechanics Scripts

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SAVE_JSON="$(cd "$SCRIPT_DIR/../.." && pwd)/.claude/game-state/save.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected="$3"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Test $TESTS_RUN: $test_name ... "

    local result
    result=$(eval "$test_command" 2>&1)

    if echo "$result" | jq -e "$expected" >/dev/null 2>&1; then
        echo -e "${GREEN}PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAILED${NC}"
        echo "  Got: $result"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "=========================================="
echo "Game Mechanics Test Suite"
echo "=========================================="
echo ""

if [[ ! -f "$SAVE_JSON" ]]; then
    echo -e "${RED}ERROR: save.json not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Combat Resolution Tests${NC}"
echo "----------------------------------------"
run_test "Combat outcome calculated" "$SCRIPT_DIR/combat-resolution.sh marinelli rossetti assassinate" '.outcome != null'
run_test "Combat power is valid" "$SCRIPT_DIR/combat-resolution.sh marinelli rossetti territory" '.combat_power.attacker > 0'
run_test "Losses are valid percentages" "$SCRIPT_DIR/combat-resolution.sh marinelli rossetti beatdown" '.losses.attacker.percentage >= 0 and .losses.attacker.percentage <= 100'
run_test "Invalid attacker returns error" "$SCRIPT_DIR/combat-resolution.sh invalid_family rossetti assassinate" '.error != null'
echo ""

echo -e "${YELLOW}Promotion Check Tests${NC}"
echo "----------------------------------------"
run_test "Returns current rank" "$SCRIPT_DIR/promotion-check.sh" '.current_rank != null'
run_test "Returns next rank" "$SCRIPT_DIR/promotion-check.sh" '.next_rank != null'
run_test "Success chance is valid" "$SCRIPT_DIR/promotion-check.sh" '.success_chance >= 0 and .success_chance <= 100'
run_test "Requirements structure valid" "$SCRIPT_DIR/promotion-check.sh" '.requirements.met != null and .requirements.missing != null'
echo ""

echo -e "${YELLOW}Expansion Outcome Tests${NC}"
echo "----------------------------------------"
run_test "Small expansion cost correct" "$SCRIPT_DIR/expansion-outcome.sh marinelli small" '.expansion_size == "small" and .cost.wealth == 50'
run_test "Medium expansion cost correct" "$SCRIPT_DIR/expansion-outcome.sh marinelli medium" '.expansion_size == "medium" and .cost.wealth == 150'
run_test "Large expansion cost correct" "$SCRIPT_DIR/expansion-outcome.sh marinelli large" '.expansion_size == "large" and .cost.wealth == 400'
run_test "Territory gain is valid" "$SCRIPT_DIR/expansion-outcome.sh marinelli medium" '.territory.gain >= 0'
run_test "Invalid family returns error" "$SCRIPT_DIR/expansion-outcome.sh invalid_family small" '.error != null'
run_test "Invalid size returns error" "$SCRIPT_DIR/expansion-outcome.sh marinelli invalid_size" '.error != null'
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Run:    $TESTS_RUN"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [[ $TESTS_FAILED -gt 0 ]]; then
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    exit 1
else
    echo "Tests Failed: $TESTS_FAILED"
    echo -e "${GREEN}All tests passed!${NC}"
fi
