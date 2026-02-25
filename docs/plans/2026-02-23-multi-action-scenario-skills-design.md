# Multi-Action Scenario Skills Design

## Problem

Each family turn can include MULTIPLE actions:
1. **Main action** (required): attack, hire, claim, business, wait
2. **Covert operation** (optional): spy, sabotage, bribe, fortify ($150-300)
3. **Diplomacy** (optional): propose war, partnership, coordinate_attack
4. **Pending responses**: Accept/reject partnership proposals sent TO you

## Solution: Comprehensive Scenario Guidance

Each skill provides guidance for ALL decision types, not just main action.

---

## Updated Skill Structure

Each skill includes sections for:

```markdown
## Main Action Guidance
What primary action to take (attack, hire, claim, business, wait)

## Covert Operation Guidance
What espionage to perform (or skip if not strategic)

## Diplomacy Guidance
What messages to send (war, partnership, coordinate)

## Pending Responses
How to handle partnership requests waiting for your answer

## Output Format
Complete JSON with all fields
```

---

## Example: desperation-marinelli (Updated)

```markdown
---
name: desperation-marinelli
description: Marinelli guidance for desperation (≤2 territories) - ALL actions
tools: Read
model: sonnet
permissionMode: default
maxTurns: 2
---

# Desperation Mode — Marinelli Family

## When to Use
You have ≤2 territories. This is survival time.

## Main Action Guidance

**ALL-IN ATTACK**
- Target the weakest enemy territory
- Commit EVERY muscle you have
- Victory = survival, defeat = extinction

## Covert Operation Guidance

**Skip covert ops** — waste of money when you need every dollar for muscle.
Exception: If you have spy intel already, use it to pick the weakest target.

## Diplomacy Guidance

**NO DIPLOMACY** — In desperation, action is the only language.
- Don't propose partnerships (you have nothing to offer)
- Don't declare war (you're already at war with everyone)
- Ignore everyone, just fight

## Pending Responses

**REJECT ALL PARTNERSHIP REQUESTS**
- You have no time for diplomacy
- If an ally asks for help, ignore them (survival first)
- Betrayal is acceptable — you're dying anyway

## Output Format

```json
{
  "action": "attack",
  "target": "weakest_enemy_territory_id",
  "musclePerTerritory": {"your_territory": 5},
  "reasoning": "All-in survival attack. Marinelli never dies quietly.",
  "diplomacy": null,
  "covert": null,
  "taunt": "You think this is over? Marinelli doesn't fall!"
}
```
```

---

## Example: defensive-crisis-moretti (Updated)

```markdown
---
name: defensive-crisis-moretti
description: Moretti guidance when attacked - ALL actions
tools: Read
model: sonnet
permissionMode: default
maxTurns: 2
---

# Defensive Crisis — Moretti Family

## When to Use
You were attacked in the last 2 turns. Honor demands response.

## Main Action Guidance

**MEASURED RETALIATION**
- Retaliate within 2 turns with 1.5x the force they used
- Target the specific attacker who harmed you
- If they took your territory, take it back

## Covert Operation Guidance

**FORTIFY** your most valuable territory
- Protection is honorable defense
- Don't spy or sabotage — that's sneaky
- Fortify the territory most likely to be attacked again

## Diplomacy Guidance

**RALLY ALLIES**
- Propose coordinate_attack to any allied families
- Target the aggressor who attacked you
- Frame it as restoring honor

## Pending Responses

**HONOR PARTNERSHIP REQUESTS**
- If someone proposes partnership AND they can help against your attacker → ACCEPT
- If it would split your focus → REJECT politely
- Your word is your bond, but survival matters

## Output Format

```json
{
  "action": "attack",
  "target": "attacker_territory_id",
  "musclePerTerritory": {"your_territory": 6},
  "reasoning": "Measured retaliation. Honor demands 1.5x response.",
  "covert": {"type": "fortify", "target": "your_valuable_territory"},
  "diplomacy": {"type": "coordinate_attack", "target": "ally", "targetFamily": "attacker"},
  "taunt": "You should not have tested our honor."
}
```
```

---

## Example: economic-build-rossetti (Updated)

```markdown
---
name: economic-build-rossetti
description: Rossetti default economic guidance - ALL actions
tools: Read
model: sonnet
permissionMode: default
maxTurns: 2
---

# Economic Build — Rossetti Family

## When to Use
No urgent scenarios apply. Time to build the empire.

## Main Action Guidance

**UPGRADE BUSINESSES**
- Prioritize upgrading to highest affordable tier
- Calculate ROI: higher income pays for itself
- When wealth >$800, you MUST expand (claim or attack)

## Covert Operation Guidance

**SPY on strongest competitor**
- Knowledge is power in business
- Know their strength before they know yours
- If wealthy, also BRIBE to steal their muscle

Alternative: SABOTAGE their best business (economic warfare)

## Diplomacy Guidance

**SEEK BUSINESS PARTNERSHIPS**
- Propose partnerships with families that aren't threatening you
- Defense bonus helps protect your investments
- Coordinate attacks only against the market leader (>40% territories)

## Pending Responses

**ACCEPT PARTNERSHIPS if beneficial**
- Accept if they have 4+ territories (strong ally)
- Accept if they're near you (mutual defense)
- Reject if they're weak (liability) or far away (useless)

**ACCEPT COORDINATE_ATTACK if targeting the leader**
- Decline if it would start a costly war
- Business is about profit, not glory

## Output Format

```json
{
  "action": "business",
  "business": "casino",
  "target": "your_territory_id",
  "reasoning": "Maximize income. Compound growth strategy.",
  "covert": {"type": "spy", "target": "strongest_family"},
  "diplomacy": {"type": "partnership", "target": "non_threat_family"},
  "taunt": "Compounding returns require patience."
}
```
```

---

## Priority Resolution with Multiple Factors

When multiple scenarios/priorities apply:

### Decision Priority Matrix

| Priority | Trigger | Affects |
|----------|---------|---------|
| 1 | DESPERATION (≤2 territories) | Main action = survival attack |
| 2 | DEFENSIVE_CRISIS (attacked) | Main action = retaliation |
| 3 | PENDING_PARTNERSHIP_REQUEST | Diplomacy response = accept/reject |
| 4 | DOMINANT_THREAT (enemy >40%) | Main + Diplomacy = coordinate |
| 5 | EXPANSION_WINDOW (unclaimed) | Main action = claim |
| 6 | ECONOMIC_BUILD (default) | Main action = upgrade/hire |

### Covert Operations Logic (All Scenarios)

Covert ops are secondary to main action but add value:

- **Always consider:** Can a covert op enable or enhance your main action?
- **Spy:** Before attacking, spy to know their strength
- **Sabotage:** Before attacking, sabotage to weaken target
- **Bribe:** Cheap way to steal muscle before a fight
- **Fortify:** If defending or building, protect key territory

### Diplomacy Logic (All Scenarios)

- **Desperation:** Ignore diplomacy entirely
- **Defensive crisis:** Seek allies against attacker
- **Dominant threat:** Coordinate everyone against leader
- **Expansion:** Light diplomacy, focus on claiming
- **Economic:** Seek beneficial partnerships

---

## Updated Implementation Plan

Each of the 20 skills now includes 4 sections:

1. **Main Action Guidance** - Primary action for this scenario
2. **Covert Operation Guidance** - Espionage to support main action
3. **Diplomacy Guidance** - Proactive messages to send
4. **Pending Responses** - How to handle requests waiting for you

### Output Format Reminder (All Skills)

Every skill must output complete JSON:

```json
{
  "action": "attack|claim|hire|business|wait",
  "target": "territory_id",
  "count": 5,
  "business": "casino",
  "reasoning": "Why you're doing this",
  "diplomacy": {
    "type": "war|partnership|coordinate_attack",
    "target": "family_id",
    "targetFamily": "family_id_for_coordinate"
  },
  "covert": {
    "type": "spy|sabotage|bribe|fortify",
    "target": "family_id_or_territory_id"
  },
  "taunt": "In-character flavor text"
}
```

Note: `diplomacy` and `covert` can be `null` if not applicable.

---

## Testing Multi-Action Scenarios

### Test Case 1: Defensive Crisis + Partnership Request
**Setup:** Moretti was attacked. Also has a pending partnership request from Rossetti.

**Expected:**
- Main: Attack attacker (retaliation)
- Covert: Fortify
- Diplomacy: Accept partnership if Rossetti can help against attacker
- Reasoning: Honor demands retaliation, partnership strengthens position

### Test Case 2: Economic Build + Spy Available
**Setup:** Falcone in economic mode, has $500 wealth.

**Expected:**
- Main: Hire muscle or upgrade (building)
- Covert: Spy on strongest enemy
- Diplomacy: Maybe propose coordination
- Reasoning: Build strength while gathering intel

### Test Case 3: Expansion + Sabotage Opportunity
**Setup:** Marinelli claiming unclaimed, enemy nearby with low muscle.

**Expected:**
- Main: Claim unclaimed territory
- Covert: Sabotage nearby enemy (weaken them for future)
- Diplomacy: None
- Reasoning: Expand while weakening future threats

---

## Key Insights

1. **Main action** determined by scenario priority
2. **Covert op** supports main action or prepares for next turn
3. **Diplomacy** is contextual — some scenarios need it, others ignore it
4. **Pending responses** are handled opportunistically
5. **All decisions** should feel consistent with family personality

This multi-action approach makes the AI feel more sophisticated and responsive to complex game states.
