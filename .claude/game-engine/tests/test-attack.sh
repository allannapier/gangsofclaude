#!/bin/bash
# Test suite for attack mechanic

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$SCRIPT_DIR/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
tests_run=0
tests_passed=0
tests_failed=0

# Test functions
test_start() {
    echo -e "${YELLOW}Running: $1${NC}"
    ((tests_run++))
}

test_pass() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((tests_passed++))
}

test_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  Expected: $2${NC}"
    echo -e "${RED}  Got: $3${NC}"
    ((tests_failed++))
}

# Mock data for testing
MARINELLI_FAMILY='{"family":"marinelli","soldiers":5,"territory":3,"wealth":6000}'
ROSSETTI_FAMILY='{"family":"rossetti","soldiers":3,"territory":2,"wealth":4000}'

# Test 1: Attack mechanic exists and is executable
test_start "Attack mechanic exists"
if [[ -x "$ENGINE_DIR/mechanics/attack.sh" ]]; then
    test_pass "Attack mechanic is executable"
else
    test_fail "Attack mechanic executable" "executable file" "not found or not executable"
fi

# Test 2: Attack produces valid JSON output
test_start "Attack produces valid JSON"
output=$("$ENGINE_DIR/mechanics/attack.sh" "$MARINELLI_FAMILY" "$ROSSETTI_FAMILY" "beatdown" 2>/dev/null)
if echo "$output" | jq '.' >/dev/null 2>&1; then
    test_pass "Attack produces valid JSON"
else
    test_fail "Attack JSON output" "valid JSON" "invalid JSON: $output"
fi

# Test 3: Deterministic results
test_start "Attack produces deterministic results"
GAME_ENGINE_SEED="test-seed" \
    output1=$("$ENGINE_DIR/mechanics/attack.sh" "$MARINELLI_FAMILY" "$ROSSETTI_FAMILY" "beatdown" 2>/dev/null)
GAME_ENGINE_SEED="test-seed" \
    output2=$("$ENGINE_DIR/mechanics/attack.sh" "$MARINELLI_FAMILY" "$ROSSETTI_FAMILY" "beatdown" 2>/dev/null)

if [[ "$output1" == "$output2" ]]; then
    test_pass "Attack is deterministic with same seed"
else
    test_fail "Determinism" "same output" "different outputs"
fi

# Test 4: Result is one of expected outcomes
test_start "Attack returns valid result type"
output=$("$ENGINE_DIR/mechanics/attack.sh" "$MARINELLI_FAMILY" "$ROSSETTI_FAMILY" "beatdown" 2>/dev/null)
result=$(echo "$output" | jq -r '.result')

valid_results=("decisive_victory" "marginal_victory" "defeat")
is_valid=false
for valid in "${valid_results[@]}"; do
    if [[ "$result" == "$valid" ]]; then
        is_valid=true
        break
    fi
done

if [[ "$is_valid" == "true" ]]; then
    test_pass "Attack result is valid: $result"
else
    test_fail "Attack result" "valid result type" "got: $result"
fi

# Test 5: Casualties are non-negative
test_start "Attack casualties are non-negative"
output=$("$ENGINE_DIR/mechanics/attack.sh" "$MARINELLI_FAMILY" "$ROSSETTI_FAMILY" "beatdown" 2>/dev/null)
attacker_losses=$(echo "$output" | jq -r '.attacker_losses.soldiers')
defender_losses=$(echo "$output" | jq -r '.defender_losses.soldiers')

if [[ $attacker_losses -ge 0 ]] && [[ $defender_losses -ge 0 ]]; then
    test_pass "Casualties are non-negative"
else
    test_fail "Casualties" "non-negative" "attacker: $attacker_losses, defender: $defender_losses"
fi

# Test 6: Superior force wins more often
test_start "Superior force has advantage"
wins=0
trials=10

for i in $(seq 1 $trials); do
    output=$("$ENGINE_DIR/mechanics/attack.sh" "$MARINELLI_FAMILY" "$ROSSETTI_FAMILY" "beatdown" "seed-$i" 2>/dev/null)
    result=$(echo "$output" | jq -r '.result')
    if [[ "$result" =~ victory$ ]]; then
        ((wins++))
    fi
done

# Superior force should win at least 60% of the time
if [[ $wins -ge 6 ]]; then
    test_pass "Superior force wins $wins/$trials (expected >=6)"
else
    test_fail "Superior force advantage" ">=6 wins/$trials" "got $wins wins"
fi

# Summary
echo ""
echo "======================================"
echo "Test Results:"
echo "  Run: $tests_run"
echo -e "  ${GREEN}Passed: $tests_passed${NC}"
if [[ $tests_failed -gt 0 ]]; then
    echo -e "  ${RED}Failed: $tests_failed${NC}"
    exit 1
else
    echo -e "  ${GREEN}All tests passed!${NC}"
    exit 0
fi
