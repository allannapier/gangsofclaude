---
name: promote
description: Check if you qualify for rank promotion and attempt to advance within your family.
argument-hint:
user-invocable: true
allowed-tools: Read, Write, Edit, Bash
disable-model-invocation: false
---

# Promote

Check if you qualify for rank promotion and attempt to advance within your family.

## Usage

`/promote`

## Process

### STEP 1: Call Promotion Check Script

Execute the promotion.sh script to check eligibility:

```bash
RESULT=$(bash .claude/scripts/mechanics/promotion.sh)
```

The script returns JSON with:
- Current rank and next rank
- Eligibility status
- Missing requirements (if any)
- Success chance

### STEP 2: Display Results

Parse the JSON output and display:
- Current rank and next rank
- Whether you're eligible
- Missing requirements (if not eligible)
- Success chance percentage

### STEP 3: Attempt Promotion (If Eligible)

If eligible:
1. Calculate success roll
2. If successful:
   - Update player rank in save.json
   - Display success message
   - Add +10 respect
3. If failed:
   - Display failure message
   - Add -5 respect
   - Note 5-turn waiting period

### STEP 4: Save Game State

Write updated game state to save.json.

## Token Savings

**Before:** ~300 tokens per promotion check (LLM evaluation)
**After:** ~10 tokens per promotion check (script calculation)
**Savings:** 96%

## Promotion Requirements

### Outsider → Associate
- Complete `/seek-patronage` successfully

### Associate → Soldier
- Respect: 10+
- 1 successful mission
- Loyalty: 60+
- Wealth: 100

### Soldier → Capo
- Respect: 30+
- 5 successful actions
- 1 territory controlled
- Loyalty: 70+

### Capo → Underboss
- Respect: 60+
- 3 territories controlled
- 5 soldiers in crew
- Loyalty: 80+

### Underboss → Don
- Respect: 90+
- 5 territories controlled
- 10 soldiers
- Loyalty: 95+
- Current Don must die
