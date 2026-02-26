# Complete Implementation Plan: Memory + Scenario Skills

**Goal:** Create 20 scenario skills + memory system for 4 AI families

**Architecture:**
- `.claude/agent-memory/<family>/MEMORY.md` - Persistent short-term memory
- `.claude/skills/<scenario>-<family>/SKILL.md` - 20 scenario-family skills
- `.claude/agents/<family>-family.md` - Updated agents with memory workflow

---

## Phase 1: Setup Memory Infrastructure

### Task 1: Create Memory Directories

**Files:**
- Create: `.claude/agent-memory/marinelli/`
- Create: `.claude/agent-memory/rossetti/`
- Create: `.claude/agent-memory/falcone/`
- Create: `.claude/agent-memory/moretti/`

**Step 1: Create directories**

```bash
mkdir -p .claude/agent-memory/{marinelli,rossetti,falcone,moretti}
```

**Step 2: Verify**

```bash
ls -la .claude/agent-memory/
```

Expected: 4 directories listed

**Step 3: Commit**

```bash
git add .claude/agent-memory/
git commit -m "chore: create agent memory directories for 4 families"
```

---

### Task 2: Create Initial Memory Files

**Files:**
- Create: `.claude/agent-memory/marinelli/MEMORY.md`
- Create: `.claude/agent-memory/rossetti/MEMORY.md`
- Create: `.claude/agent-memory/falcone/MEMORY.md`
- Create: `.claude/agent-memory/moretti/MEMORY.md`

**Step 1: Write marinelli memory file**

```markdown
# Marinelli Family Strategic Memory

Last Updated: Turn 0 (Initialization)

## Previous Turn Summary

**Turn 0 Actions:**
- Setup phase - no actions yet

## Strategic Assessment

### Current Situation
- Territories: 2 (Little Italy, Warehouse District)
- Wealth: $500
- Muscle: 4 total (2 per territory)
- Threat Level: LOW

### Enemy Observations
- Rossetti: 2 territories, unknown strength
- Falcone: 2 territories, unknown strength
- Moretti: 2 territories, unknown strength

### Relationship Status
- Allies: None
- Enemies: None
- Neutral: All families (watching for weakness)

## 3-Move Strategic Plan

### Turn 1 (Current)
**Goal:** Expand territory quickly
**Planned Actions:**
- Main: Claim unclaimed territory
- Covert: None (save money)
- Diplomacy: None (too early)

### Turn 2
**Goal:** Build military strength
**Conditions:** Claim successfully, wealth stable

### Turn 3
**Goal:** Identify first target
**Conditions:** Assess who is weakest after initial expansion

## Active Grudges & Debts

None yet. We're just getting started.

## Key Insights

- Free territories won't last long
- Need to establish presence before others claim everything
- Early aggression sets the tone

## Memory Rules

- Always retaliate when attacked (Marinelli honor)
- Claim free territory while available
- Build muscle over businesses (raw power)
