# Staged Implementation Plan: AI Memory + Scenario Skills

## Overview

Implement the complete AI behavior improvement system in 6 manageable stages.
Each stage builds on the previous and can be tested independently.

## Stage Breakdown

### Stage 1: Memory Infrastructure (Foundation)
- Create memory directories
- Create initial MEMORY.md files for all 4 families
- Update agent files with memory workflow
- Test: Agents can read/write memory

### Stage 2: Core Scenario Skills (Highest Priority)
- Create 4 desperation skills (all families)
- Create 4 defensive-crisis skills (all families)
- These cover critical scenarios (survival + defense)
- Test: Desperation and defense behaviors work

### Stage 3: Expansion Skills (Early Game)
- Create 4 expansion-window skills (all families)
- Update for unclaimed territory claiming
- Test: Early game claiming behaviors

### Stage 4: Threat Response Skills (Mid Game)
- Create 4 dominant-threat skills (all families)
- Create 4 economic-build skills (all families)
- Test: Mid-game dynamics, leader suppression

### Stage 5: Integration & Polish
- Update ai-prompts.ts with memory context
- Create grudge-tracking system
- Add memory cleanup (old grudges expire)
- Test: Full game flow

### Stage 6: Testing & Balancing
- Play test games
- Balance scenarios based on observations
- Fix any issues
- Document behaviors

---

## Team Structure

### Team Lead (You)
- Coordinate stages
- Review work between stages
- Test and validate
- Make architectural decisions

### Subagents (Spawn per stage)

**Stage 1: Infrastructure Agent**
- Type: general-purpose
- Task: Create directories, memory files, update agents
- Tools: Read, Write, Bash

**Stage 2: Critical Skills Agent**
- Type: general-purpose
- Task: Create desperation + defensive-crisis skills
- Tools: Read, Write

**Stage 3: Expansion Skills Agent**
- Type: general-purpose
- Task: Create expansion-window skills
- Tools: Read, Write

**Stage 4: Threat Skills Agent**
- Type: general-purpose
- Task: Create dominant-threat + economic-build skills
- Tools: Read, Write

**Stage 5: Integration Agent**
- Type: general-purpose
- Task: Update prompts, add grudge system
- Tools: Read, Write, Edit

**Stage 6: Test Agent**
- Type: general-purpose
- Task: Run tests, document issues
- Tools: Read, Bash, WebFetch (for game UI)

---

## Stage 1: Memory Infrastructure

### Deliverables
1. `.claude/agent-memory/{marinelli,rossetti,falcone,moretti}/MEMORY.md`
2. Updated `.claude/agents/*-family.md` with memory workflow

### Success Criteria
- [ ] All 4 memory directories exist
- [ ] All 4 initial MEMORY.md files created
- [ ] All 4 agent files updated with memory workflow
- [ ] Agents can successfully read their memory
- [ ] Agents can successfully write updated memory

---

## Stage 2: Critical Scenario Skills (Desperation + Defense)

### Deliverables
1. `.claude/skills/desperation-{family}/SKILL.md` (4 files)
2. `.claude/skills/defensive-crisis-{family}/SKILL.md` (4 files)

### Success Criteria
- [ ] All 8 skill files created
- [ ] Each skill includes: main action, covert, diplomacy, pending responses
- [ ] Family personalities distinct in each skill
- [ ] Marinelli: all-in attack / 1.5x retaliation
- [ ] Rossetti: hostile takeover / economic warfare
- [ ] Falcone: coordinate the weak / spy & manipulate
- [ ] Moretti: honorable stand / measured response

---

## Stage 3: Expansion Skills

### Deliverables
1. `.claude/skills/expansion-window-{family}/SKILL.md` (4 files)

### Success Criteria
- [ ] All 4 expansion skills created
- [ ] Early game claiming behavior defined per family
- [ ] Marinelli: aggressive claiming
- [ ] Rossetti: strategic acquisition
- [ ] Falcone: quiet expansion
- [ ] Moretti: defensive perimeter

---

## Stage 4: Threat + Economy Skills

### Deliverables
1. `.claude/skills/dominant-threat-{family}/SKILL.md` (4 files)
2. `.claude/skills/economic-build-{family}/SKILL.md` (4 files)

### Success Criteria
- [ ] All 8 skills created
- [ ] Dominant threat: families coordinate against leader
- [ ] Economic build: appropriate default behaviors
- [ ] Marinelli: rally troops / hire muscle
- [ ] Rossetti: economic warfare / upgrade businesses
- [ ] Falcone: chaos strategy / gather intel
- [ ] Moretti: coalition / balanced growth

---

## Stage 5: Integration

### Deliverables
1. Updated `web/server/ai-prompts.ts` with memory context
2. Grudge tracking in memory system
3. Memory expiration (old grudges fade)

### Success Criteria
- [ ] AI prompts reference memory in context
- [ ] Grudges automatically added to memory when attacked
- [ ] Grudges expire after 10 turns if not avenged
- [ ] Memory informs scenario priority

---

## Stage 6: Testing & Balance

### Deliverables
1. Test game results documented
2. Balance adjustments made
3. Final documentation

### Success Criteria
- [ ] 3+ test games played
- [ ] All families show distinct behaviors
- [ ] No family is too passive
- [ ] No family is too aggressive early
- [ ] Late game remains competitive

---

## Implementation Order

```
Stage 1: Infrastructure → Test → Review
    ↓
Stage 2: Critical Skills → Test → Review
    ↓
Stage 3: Expansion Skills → Test → Review
    ↓
Stage 4: Threat/Econ Skills → Test → Review
    ↓
Stage 5: Integration → Test → Review
    ↓
Stage 6: Full Testing → Balance → Document
```

Each stage:
1. Create task for the stage
2. Spawn agent to implement
3. Agent completes work
4. Review and test
5. Approve or request fixes
6. Commit changes
7. Move to next stage

---

## Rollback Plan

If a stage fails:
1. Document what didn't work
2. Decide: fix forward or rollback
3. If rollback: `git reset --hard HEAD~N` to previous stage
4. Redesign and retry

---

## Communication Protocol

### Team Lead to Agent
- "Start Stage X: [specific task description]"
- Include any context from previous stages
- Specify success criteria

### Agent to Team Lead
- Progress updates as work completes
- Blockers reported immediately
- Completion summary with what was created/modified

### Between Stages
- Team lead reviews all changes
- Runs tests
- Approves or requests changes
- Only then starts next stage
