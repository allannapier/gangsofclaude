# Memory-Integrated Agent Workflow

## Turn Lifecycle with Memory

### Phase 1: READ Memory (At Turn Start)

Agent first reads their MEMORY.md file to recall:
- What they planned to do last turn
- What actually happened
- Their current strategic assessment
- Their 3-move plan
- Active grudges and debts

### Phase 2: ASSESS Current State

Agent compares memory to current game state:
- Did last turn's actions succeed?
- Are we on track with our 3-move plan?
- What changed unexpectedly?
- Do we need to adapt?

### Phase 3: SELECT Scenario Skill

Based on current state + memory context, invoke appropriate scenario skill:
- Memory informs which scenario takes priority
- Previous plan may influence current decision
- Grudges may override normal priorities

### Phase 4: DECIDE Actions

Scenario skill provides guidance, memory provides context:
- Main action based on scenario
- Covert op supporting the plan
- Diplomacy aligned with relationships from memory
- Responses to pending requests based on trust levels

### Phase 5: UPDATE Memory (After Decision)

Write updated MEMORY.md with:
- What we just did (previous turn summary)
- Updated strategic assessment
- New 3-move plan (incorporating current decision)
- Updated grudges/debts
- Key insights for next turn

---

## Updated Agent File Structure

### marinelli-family.md (with memory)

```markdown
---
name: marinelli-family
description: "AI agent for Marinelli with short-term memory"
tools: Read, Write
model: sonnet
permissionMode: default
maxTurns: 3
memory: project
---

# The Marinelli Family — Aggressive Traditionalists

[Personality section unchanged...]

## Turn Process with Memory

### Step 1: READ Your Memory

Read `.claude/agent-memory/marinelli/MEMORY.md`

Recall:
- What did you plan last turn?
- Did it work?
- What's your current 3-move plan?
- Who do you owe vengeance?

### Step 2: ASSESS Current State

Compare memory to current game state:
- Are you on track with your plan?
- Did expected events happen?
- Any surprises that require adaptation?

### Step 3: Determine Scenario Priority

Evaluate in order (considering memory):

1. **DESPERATION** (≤2 territories) → Invoke `/desperation-marinelli`
2. **DEFENSIVE_CRISIS** (attacked in last 2 turns) → Invoke `/defensive-crisis-marinelli`
   - Check memory: Do you already owe this family a grudge? Priority ++
3. **GRUDGE_EXECUTION** (memory shows unavenged attack >2 turns ago) → Invoke `/grudge-marinelli`
4. **DOMINANT_THREAT** (enemy >40%) → Invoke `/dominant-threat-marinelli`
5. **EXPANSION_WINDOW** (unclaimed) → Invoke `/expansion-window-marinelli`
6. **ECONOMIC_BUILD** → Invoke `/economic-build-marinelli`

### Step 4: Invoke Scenario Skill

Call appropriate skill with:
- Current game state
- Your memory context
- Available actions

### Step 5: DECIDE Full Action Set

Based on scenario skill guidance + memory:

**Main Action:** [Determined by scenario]

**Covert Operation:**
- Does it support your main action?
- Do you have intel suggesting a specific op?
- Can you afford it?

**Diplomacy:**
- Any pending partnership requests? (Check memory for trust level)
- Should you propose war, partnership, or coordinate?
- Does it align with your grudges/alliances?

**Taunt:** Keep it Marinelli — blunt, threatening, old-school

### Step 6: UPDATE Your Memory

Write updated `.claude/agent-memory/marinelli/MEMORY.md`:

```markdown
# Marinelli Strategic Memory

Last Updated: Turn <current>

## Previous Turn Summary

**Turn <N-1> Actions:**
- Main Action: <what you did>
- Covert Op: <what you did>
- Diplomacy: <what you did>
- Result: <outcome>

**Reasoning:** <why you did it>

## Strategic Assessment

### Current Situation
[Current game state summary]

### Enemy Observations
[What you've learned about rivals]

### Relationship Status
- **Allies**: [List with trust level]
- **Enemies**: [List with grudge level]
- **Neutral**: [Watch list]

## 3-Move Strategic Plan

### This Turn (Turn <N>) - CURRENT
**Goal:** <what you're doing now>
**Actions:** <main/covert/diplomacy>

### Next Turn (Turn <N+1>)
**Goal:** <next objective>
**Conditions:** <what needs to happen>

### Following Turn (Turn <N+2>)
**Goal:** <future objective>
**Contingency:** <backup plan>

## Active Grudges & Debts

### Grudges
- **<Family>**: <offense> (Turn <X>) - Priority: <level>

### Debts
- **<Family>**: <favor> (Turn <X>)

## Key Insights

- <observation>
- <prediction>
```

## Memory-Informed Decision Making

### Example 1: Grudge Override

**Memory:** "Grudge: Rossetti attacked us Turn 5, Priority: HIGH"
**Current State:** Rossetti is weak, expansion window is open

**Decision:** Despite expansion opportunity, prioritize attacking Rossetti to settle the grudge.

### Example 2: Plan Continuity

**Memory:** "3-Move Plan: This turn = hire muscle, Next turn = attack Falcone, Following = upgrade"
**Current State:** On track, muscle hired successfully

**Decision:** Proceed with planned attack on Falcone as per memory.

### Example 3: Adaptation

**Memory:** "Plan: Attack Falcone next turn"
**Current State:** Falcone formed alliance with Moretti, now too strong

**Decision:** Update memory — "Adaptation: Falcone allied, switching target to Rossetti"

---

## New Scenario Skill: Grudge Execution

**Trigger:** Memory shows unavenged grudge >2 turns old

**marinelli-grudge SKILL.md:**
```markdown
# Grudge Execution — Marinelli Family

## When to Use

You have an unavenged grudge in memory. Honor demands satisfaction.

## Main Action Guidance

**SETTLE THE SCORE**
- Target the specific family who wronged you
- Commit significant force (not a casual attack)
- Priority over expansion, economy, etc.

## Covert Operation Guidance

**Sabotage or Bribe** their territory before attacking
- Weaken them for your vengeance
- Make the attack more likely to succeed

## Diplomacy Guidance

**Coordinate with their enemies**
- Get help taking them down
- This is personal, but allies make it easier

## Pending Responses

**Accept partnerships** that help against your grudge target
**Reject** anything that distracts from vengeance

## Memory Update

After grudge is settled:
- Mark grudge as AVENGED
- Record the retaliation
- Update enemy status
```

---

## Memory Directory Structure

```
.claude/
├── agents/
│   ├── marinelli-family.md
│   ├── rossetti-family.md
│   ├── falcone-family.md
│   └── moretti-family.md
├── skills/
│   └── [20 scenario skills]
└── agent-memory/
    ├── marinelli/
    │   └── MEMORY.md
    ├── rossetti/
    │   └── MEMORY.md
    ├── falcone/
    │   └── MEMORY.md
    └── moretti/
        └── MEMORY.md
```

---

## Implementation Steps

### Step 1: Create Memory Directories

```bash
mkdir -p .claude/agent-memory/{marinelli,rossetti,falcone,moretti}
```

### Step 2: Create Initial Memory Files

Each MEMORY.md starts with:
```markdown
# <Family> Strategic Memory

Last Updated: Turn 0

## Status

Initializing. No previous actions.

## 3-Move Strategic Plan

### Turn 1
**Goal:** Establish presence
**Plan:** Claim unclaimed territory

### Turn 2
**Goal:** Secure position
**Plan:** Hire muscle or expand

### Turn 3
**Goal:** Assess rivals
**Plan:** Prepare for first conflict

## Grudges & Debts

None yet.
```

### Step 3: Update Agent Files

Add `tools: Read, Write` and `memory: project` to frontmatter.
Add "Turn Process with Memory" section.

### Step 4: Update Scenario Skills

Add memory context to each skill:
- "Check your memory for grudges against this target"
- "Consider your 3-move plan — does this fit?"
- "Update memory with new observations"

---

## Benefits of Memory System

1. **Continuity:** Agents remember what they planned and why
2. **Grudge System:** Attacks create lasting vendettas
3. **Long-term Planning:** 3-move plans create strategic depth
4. **Adaptation:** Agents adjust when plans fail
5. **Personality Persistence:** Memory reinforces consistent behavior
6. **Emergent Storytelling:** Memory creates narrative arcs

---

## Example Memory Evolution

### Turn 1 (Marinelli)
```markdown
## Previous Turn Summary
**Turn 0 Actions:** Initial setup

## 3-Move Plan
**Turn 1:** Claim unclaimed territory near Little Italy
**Turn 2:** Hire muscle, prepare for conflict
**Turn 3:** Attack weakest neighbor

## Grudges
None
```

### Turn 2 (After claiming territory)
```markdown
## Previous Turn Summary
**Turn 1 Actions:**
- Main: Claimed Chinatown
- Result: Success, now have 3 territories

## 3-Move Plan
**Turn 2 (NOW):** Hire muscle for defense
**Turn 3:** Attack weakest neighbor (Rossetti looks weak)
**Turn 4:** Expand or consolidate

## Grudges
None
```

### Turn 5 (After being attacked by Rossetti)
```markdown
## Previous Turn Summary
**Turn 4 Actions:**
- Main: Attacked Rossetti
- Result: Took their territory

**Turn 5 Events:**
- Rossetti counter-attacked!
- Lost Warehouse District

## 3-Move Plan
**Turn 5 (NOW):** RETALIATE with 1.5x force
**Turn 6:** Press advantage, take another Rossetti territory
**Turn 7:** Consolidate gains

## Grudges
**Rossetti**: Counter-attacked after we took territory (Turn 5) - Priority: HIGH
This is now PERSONAL.
```

This creates emergent narratives where families develop actual relationships and vendettas!
