# AI Scenario-Based Skills Design

## Overview

Instead of embedding all behavioral logic in agent prompts, create **scenario-specific skills** that AI families invoke based on game context. Each skill provides detailed, personality-appropriate guidance for a specific situation.

## Why This Approach?

**Current Problems:**
- All behavioral logic crammed into single agent prompt
- Hard to balance all factors simultaneously
- Difficult to ensure families respond appropriately to specific situations
- Easy to miss edge cases

**Benefits of Scenario Skills:**
- Modular decision-making logic
- Each scenario gets detailed, focused guidance
- Easier to test and balance individual scenarios
- Families handle same scenario differently based on personality
- Clear priority hierarchy for decision-making

---

## Scenario Priority Tree

When a family's turn arrives, they evaluate scenarios in this priority order:

```
1. DESPERATION MODE
   └─ Do I have ≤2 territories?
      └─ YES → Invoke 'desperation-mode' skill

2. DEFENSIVE RESPONSE
   └─ Was I attacked in the last 2 turns?
      └─ YES → Invoke 'defensive-response' skill

3. DOMINANT THREAT
   └─ Does any family control >40% of territories?
      └─ YES → Invoke 'dominant-threat' skill

4. EXPANSION OPPORTUNITY
   └─ Are there unclaimed territories OR weak enemy targets (≤3 muscle)?
      └─ YES → Invoke 'expansion-opportunity' skill

5. ECONOMIC STRATEGY (default)
   └─ Invoke 'economic-strategy' skill
```

**Key Principle:** First TRUE scenario in priority order wins. This ensures critical situations (desperation, defense) always take precedence over opportunistic/expansion moves.

---

## Skill Definitions

### Skill 1: desperation-mode

**Triggered When:** Family has ≤2 territories

**Purpose:** Survival at all costs

**Guidance by Family:**

- **Marinelli:** "This is not the end. We are Marinelli! Go all-in on an attack against the weakest neighbor. Betray alliances if needed. Hire every muscle you can afford. One territory or nothing — we go out fighting."

- **Rossetti:** "Time for a hostile takeover. Identify the most profitable enemy territory with the lowest defense. Offer bribes to steal muscle. Use covert ops to weaken them before striking. Survival is just another business problem — solve it."

- **Falcone:** "The shadows are closing in... but that's where we thrive. Coordinate with whoever is also weak against the strongest. Use every covert op available. If you must fall, drag your enemies down with you."

- **Moretti:** "A true test of honor. Rally all remaining muscle for one decisive counter-attack. Call upon any allies — this is the moment that defines a family. We do not fall quietly."

**Output:** Specific tactical recommendations for survival

---

### Skill 2: defensive-response

**Triggered When:** Family was attacked in the last 2 turns

**Purpose:** Retaliate appropriately based on personality

**Guidance by Family:**

- **Marinelli:** "Nobody attacks the Marinelli family and lives to brag about it. Retaliate within 2 turns with overwhelming force (1.5x the attack). Target the attacker's weakest territory. If they took your territory, take it back — plus one of theirs."

- **Rossetti:** "An attack on our business is an attack on our profits. Fortify immediately. Use bribes to steal their muscle. If profitable, retaliate with a surgical strike on their highest-income territory. Make them regret the cost of aggression."

- **Falcone:** "They revealed their hand — now we play ours. Spy on them immediately. Propose a coordinate attack with their other enemies. Strike when they're distracted elsewhere. Let someone else bleed for your revenge."

- **Moretti:** "Honor demands response. Retaliate within 2 turns with 1.5x force. After winning, claim territory from the attacker. Propose coordination with other families against this aggressor. We defend our own."

**Output:** Retaliation strategy and timing

---

### Skill 3: dominant-threat

**Triggered When:** Any family controls >40% of territories (7+ of 16)

**Purpose:** Coordinate against the leader to prevent snowball

**Guidance by Family:**

- **Marinelli:** "The upstarts think they can take OUR city? Never. Propose coordinate attacks with every other family against the dominant one. Target their weakest territories to chip away at their empire. This is OUR town."

- **Rossetti:** "A monopoly is bad for business. We need competition — just not THAT much. Form an alliance with the second-strongest family. Use sabotage on the leader's highest-tier businesses. Economic warfare is still warfare."

- **Falcone:** "The king stands tallest... making him the easiest target. Coordinate EVERYONE against the leader. Spy them constantly. Attack only when others are also attacking — let the chaos be your cover. The throne is ripe for the taking."

- **Moretti:** "No family should control so much. It destabilizes everything. Propose coordinate attacks against the dominant family. Honor any alliances formed for this purpose. We fight for balance."

**Output:** Coordination proposals and anti-leader tactics

---

### Skill 4: expansion-opportunity

**Triggered When:** Unclaimed territories exist OR weak enemy targets (≤3 muscle)

**Purpose:** Grow territory efficiently

**Guidance by Family:**

- **Marinelli:** "The city is ripe for the taking. Claim unclaimed territories aggressively — they're free. If no unclaimed, attack the weakest enemy territory you can find. Expansion is our birthright."

- **Rossetti:** "Free real estate is the best investment. Claim unclaimed territories first. If none available, acquire weak enemy territories (≤3 muscle) — they're undervalued assets. Remember: location, location, location."

- **Falcone:** "While they fight each other, we take what's left. Claim unclaimed territory quietly. If enemies are fighting, attack whoever is losing. Never waste muscle on a fair fight when you can take the scraps."

- **Moretti:** "Secure our borders first. Claim unclaimed territories adjacent to ours. If enemies are weak nearby, consider it a defensive necessity to take their territory before they grow strong. Protect our perimeter."

**Output:** Specific expansion targets and priority

---

### Skill 5: economic-strategy

**Triggered When:** Default (no higher-priority scenario applies)

**Purpose:** Build strength for future opportunities

**Guidance by Family:**

- **Marinelli:** "Patience... for now. Hire muscle — you can never have enough soldiers. Upgrade only if you have excess wealth after hiring. Fortify your territories. When the time comes, we strike."

- **Rossetti:** "Money makes money. Upgrade territories for maximum income. Build an economic fortress. When you have $800+ wealth, you MUST expand — hoarding is inefficient. Make your money work for you."

- **Falcone:** "Knowledge is profit. Spy on your strongest rival. Sabotage their best territory. Fortify your own. When they weaken, you'll be ready. The patient spider catches the biggest fly."

- **Moretti:** "Strength through stability. Hire muscle for defense. Upgrade territories for steady income. Fortify borders. When enemies reveal themselves, you'll be ready to respond with honor."

**Output:** Economic priorities and when to transition to expansion

---

## Agent Integration

### Updated Agent File Structure

Each family agent file would include:

1. **Personality & Identity** (unchanged)
2. **Scenario Priority Tree** (the 5 scenarios in order)
3. **Decision Process:**
   - Evaluate each scenario in priority order
   - Invoke the first matching skill
   - Follow skill guidance for action selection

### Example Agent Update (Marinelli)

```markdown
## Decision Process

Evaluate scenarios in this order and invoke the appropriate skill:

1. **Desperation Check:** Do I have ≤2 territories?
   → If YES: Invoke `/desperation-mode` skill

2. **Defense Check:** Was I attacked in the last 2 turns?
   → If YES: Invoke `/defensive-response` skill

3. **Dominant Threat Check:** Does any family have >40% of territories?
   → If YES: Invoke `/dominant-threat` skill

4. **Expansion Check:** Are there unclaimed territories OR enemies with ≤3 muscle?
   → If YES: Invoke `/expansion-opportunity` skill

5. **Default:** Invoke `/economic-strategy` skill

## Skill Usage

When you invoke a skill, include:
- Your current game state summary
- The specific situation triggering the skill
- Available actions

The skill will return detailed tactical guidance. Follow it while maintaining your Marinelli personality.
```

---

## Skill File Structure

Each skill lives in `.claude/skills/<skill-name>/SKILL.md`:

```markdown
---
name: <skill-name>
description: <description of when to use>
tools: Read  # Skills are read-only guidance
model: sonnet
permissionMode: default
maxTurns: 2
---

# <Skill Name>

## When to Invoke

<criteria for when this skill applies>

## Family-Specific Guidance

### Marinelli
<specific guidance>

### Rossetti
<specific guidance>

### Falcone
<specific guidance>

### Moretti
<specific guidance>

## Tactical Considerations

<common tactical advice for all families>

## Output Format

Provide your recommendation as:
1. **Priority Action:** The recommended primary action
2. **Alternative:** If priority isn't possible
3. **Rationale:** Why this fits the scenario and family personality
```

---

## Benefits Summary

1. **Clear Decision Hierarchy:** No ambiguity about what to do when
2. **Personality Preservation:** Each family responds differently to same scenario
3. **Modular Testing:** Can test individual scenarios in isolation
4. **Easy Balancing:** Tweak one scenario without affecting others
5. **Comprehensive Coverage:** 5 scenarios cover all game states
6. **Fallback Safety:** Economic strategy ensures families always do something productive

---

## Implementation Plan

1. Create 5 skill directories and SKILL.md files
2. Update all 4 family agent files with scenario priority tree
3. Update ai-prompts.ts to reference skill-based decision making
4. Test each scenario independently
5. Full playthrough testing
