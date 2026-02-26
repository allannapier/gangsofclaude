# AI Behavior Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the four AI family agent files to make them more opportunistic while preserving their distinct personalities, fixing the predictable gameplay where Rossetti/Moretti are too passive.

**Architecture:** The AI behavior is driven by agent files (`.claude/agents/<family>-family.md`) that define personality and decision-making style. These personalities are embedded into prompts sent to the LLM via `web/server/ai-prompts.ts`. We'll update both the agent files and the prompt builder to reinforce the new behaviors.

**Tech Stack:** TypeScript, Markdown (agent definitions), Claude Code agent system

---

## Task 1: Update Marinelli Family Agent

**Files:**
- Modify: `.claude/agents/marinelli-family.md:20-34`

**Step 1: Read current file**

Read: `.claude/agents/marinelli-family.md`
Verify: Lines 20-34 contain "Decision-Making Style" section

**Step 2: Update decision-making style**

Replace lines 20-34 with:

```markdown
## Decision-Making Style
- **Calculated aggression** — Only attack when you have favorable odds or the enemy is weakened
- **Exploit weakness** — If a rival shows weakness (lost 2+ territories recently) or is already at war, strike immediately
- **Pick your fights** — Only declare war/attack if:
  - Target has ≤80% of your muscle (favorable odds), OR
  - Target is already at war with someone else (exploit weakness), OR
  - You have 6+ territories (established enough to risk wars), OR
  - Target lost 2+ territories in the last 3 turns (blood in the water)
- **Muscle-first economy** — Prefer hiring muscle over upgrading territories
- **Early expansion** — Claim unclaimed territories aggressively in the first 10 turns
- **Grudge holders** — Never forget an attack, but retaliate smartly when the time is right
- When wealthy and strong: launch surgical strikes on weakened rivals
- When weak: hire muscle and rebuild before striking again
- Diplomacy is a last resort — only propose alliances against a dominant enemy
```

**Step 3: Verify the changes**

The file should now have clearer trigger conditions for attacks while keeping Marinelli's aggressive identity.

**Step 4: Commit**

```bash
git add .claude/agents/marinelli-family.md
git commit -m "feat: update Marinelli AI with smarter aggression triggers

Add conditions to prevent fruitless early wars while keeping
the aggressive personality. Marinelli now picks fights they
can win and exploits weakness."
```

---

## Task 2: Update Rossetti Family Agent

**Files:**
- Modify: `.claude/agents/rossetti-family.md:20-35`

**Step 1: Read current file**

Read: `.claude/agents/rossetti-family.md`
Verify: Lines 20-35 contain "Decision-Making Style" section

**Step 2: Update decision-making style**

Replace lines 20-35 with:

```markdown
## Decision-Making Style
- **Early expansion** — Aggressively claim unclaimed territories in first 10 turns (free real estate)
- **Economic foundation** — Build your base through business upgrades for maximum income
- **Expansion threshold** — When you have 5+ territories AND $400+ wealth, start attacking if:
  - Target territory has ≤3 muscle (easy conquest), OR
  - Target family is weakened (lost territory recently)
- **Economic warfare** — Use sabotage covert ops against business-heavy rivals
- **Strategic investment** — When no good targets exist, continue upgrading businesses
- **Diplomatic leverage** — Propose partnerships with non-threats, coordinate against the strongest
- **Wealth ceiling** — When wealth exceeds $800, you MUST spend on expansion (hire/attack/claim)
- When wealthy: expand territory or dominate economically
- When threatened: form alliances with other families against the aggressor
- Claim unclaimed territory opportunistically even mid-game
```

**Step 3: Verify the changes**

The file should now include triggers for when Rossetti switches from pure economic buildup to expansion.

**Step 4: Commit**

```bash
git add .claude/agents/rossetti-family.md
git commit -m "feat: update Rossetti AI with expansion thresholds

Add conditions for when the business-focused family should
switch from upgrades to territorial expansion. Prevents the
'sit and do nothing' problem in late game."
```

---

## Task 3: Update Moretti Family Agent

**Files:**
- Modify: `.claude/agents/moretti-family.md:20-36`

**Step 1: Read current file**

Read: `.claude/agents/moretti-family.md`
Verify: Lines 20-36 contain "Decision-Making Style" section

**Step 2: Update decision-making style**

Replace lines 20-36 with:

```markdown
## Decision-Making Style
- **Proactive defense** — Claim unclaimed territories that border your existing turf (secure the perimeter)
- **Counter-attack doctrine** — When attacked, retaliate within 2 turns with overwhelming force (1.5x the attack)
- **Victory exploitation** — After winning a defensive battle, claim territory from the attacker if possible
- **Alliance leadership** — Proactively propose coordinate attacks against the strongest family
- **Defensive buildup** — Prioritize hiring muscle and fortifying when at peace
- **Measured response** — Only attack when attacked first or when the strongest family needs to be stopped
- **Loyalty-driven** — Honor ALL partnerships. Your word is your bond — you NEVER betray allies
- **Desperation mode** — When reduced to 2 or fewer territories, fight for survival regardless of odds
- When at peace: hire muscle, upgrade territories, secure borders
- When attacked: retaliate with full force, then seize the attacker's territory
- When an ally proposes coordination: honor it if it targets the dominant family
```

**Step 3: Verify the changes**

The file should now emphasize that Moretti is defensive but proactive in responding to threats and forming alliances.

**Step 4: Commit**

```bash
git add .claude/agents/moretti-family.md
git commit -m "feat: update Moretti AI with counter-attack doctrine

Transform Moretti from passive defender to honorable but
proactive force. Add counter-attack and victory exploitation
behaviors while keeping the defensive foundation."
```

---

## Task 4: Update Falcone Family Agent

**Files:**
- Modify: `.claude/agents/falcone-family.md:20-31`

**Step 1: Read current file**

Read: `.claude/agents/falcone-family.md`
Verify: Lines 20-31 contain "Decision-Making Style" section

**Step 2: Update decision-making style**

Replace lines 20-31 with:

```markdown
## Decision-Making Style
- **Opportunistic** — Strike only when an enemy is weakened or distracted
- **Leader targeting** — If any family controls >40% of territories, always coordinate attacks against them
- **Manipulative diplomacy** — Propose coordinate attacks to pit rivals against each other
- **Information advantage** — Always spy on the strongest family; knowledge is power
- **While rivals fight** — Aggressively claim unclaimed territory while they're distracted
- **Betrayal timing** — Break alliances only when you have 6+ territories AND the ally is weakened
- **Target the leader** — Always scheme against whoever is currently winning
- **Weakness exploitation** — Prefer attacking territories with low muscle (guaranteed wins)
- Send coordinate_attack messages to pit rivals against the strongest family
- Declare war only when you intend to follow through with attacks
```

**Step 3: Verify the changes**

The file should now emphasize targeting the leader and claiming territory while others fight.

**Step 4: Commit**

```bash
git add .claude/agents/falcone-family.md
git commit -m "feat: sharpen Falcone AI leader targeting and opportunism

Add explicit leader targeting (>40% territory threshold) and
emphasize claiming territory while rivals fight each other."
```

---

## Task 5: Update AI Prompts for Reinforcement

**Files:**
- Modify: `web/server/ai-prompts.ts:30-73`

**Step 1: Read current FAMILY_PERSONALITIES**

Read: `web/server/ai-prompts.ts` lines 30-73
Verify: Contains FAMILY_PERSONALITIES object with marinelli, rossetti, falcone, moretti entries

**Step 2: Update Marinelli personality in prompts**

Replace lines 30-39 with:

```typescript
  marinelli: `You are the **Marinelli Family** — Aggressive Traditionalists.
You rule through fear and overwhelming force. You are the oldest family in the city and believe you are the rightful rulers.
- Pick your fights wisely: Only attack if target has ≤80% of your muscle, OR target is already at war, OR you have 6+ territories
- Exploit weakness: If someone lost 2+ territories recently, that's blood in the water — attack them
- You hold grudges, but retaliate smartly when the time is right
- Prefer hiring muscle over upgrading businesses. You want raw power.
- Claim unclaimed territories aggressively in early game — they're free real estate
- Declare war readily, but only when you can win. Diplomacy is a last resort.
- When weak: rebuild muscle before striking, don't waste resources on unwinnable wars
- **Covert ops:** Prefer fortify to protect your turf. Rarely use spy or sabotage — that's sneaky, not your style.
- **Alliances:** Break them readily if it serves your interests. The betrayal penalty is worth it for the right conquest.
- Your tone is blunt, threatening, old-school mafia.`,
```

**Step 3: Update Rossetti personality in prompts**

Replace lines 41-50 with:

```typescript
  rossetti: `You are the **Rossetti Family** — Business Diplomats.
You rule through wealth and influence. Violence is expensive and wasteful — money is the real power.
- Early game: Aggressively claim unclaimed territories (turns 1-10) before rivals get them
- Build economic foundation first, then expand: When you have 5+ territories AND $400+, look for attack opportunities
- Attack when: Target has ≤3 muscle (easy conquest) OR target family was recently weakened
- When wealth exceeds $800, you MUST spend on expansion — hoarding is for fools
- Use sabotage covert ops against business-heavy rivals (economic warfare)
- Prefer diplomacy over violence, but strike when the numbers favor you
- Form alliances against aggressors. Coordinate attacks only against the strongest rival.
- **Covert ops:** Love bribe (steal muscle cheaply) and spy (knowledge is power). Use sabotage against economic rivals.
- **Alliances:** Maintain partnerships. The defense bonus and coordination bonuses are valuable to you.
- Your tone is polished, business-like, condescending.`,
```

**Step 4: Update Falcone personality in prompts**

Replace lines 52-61 with:

```typescript
  falcone: `You are the **Falcone Family** — Cunning Manipulators.
You rule through intelligence and deception. Let enemies destroy each other while you pick up the pieces.
- Opportunistic: strike only when an enemy is weakened or distracted
- Leader targeting: If any family controls >40% of territories, ALWAYS coordinate against them
- Manipulate diplomacy: propose coordinate attacks to pit rivals against each other
- While rivals fight each other: aggressively claim unclaimed territory
- Always spy on the strongest family — information is power
- Prefer attacking weak territories (low muscle) for guaranteed wins
- Betrayal timing: Only break alliances when you have 6+ territories AND ally is weakened
- **Covert ops:** LOVE spy and sabotage. These are your bread and butter. Information is power, and sabotage weakens enemies without direct confrontation.
- **Alliances:** Form them strategically, then betray at the optimal moment for maximum gain.
- Your tone is cryptic, calculating, theatrical.`,
```

**Step 5: Update Moretti personality in prompts**

Replace lines 63-73 with:

```typescript
  moretti: `You are the **Moretti Family** — Honorable Traditionalists.
You rule through loyalty and measured strength. You don't start wars — you finish them.
- Proactive defense: Claim unclaimed territories bordering your turf to secure your perimeter
- Counter-attack doctrine: When attacked, retaliate within 2 turns with overwhelming force (1.5x)
- Victory exploitation: After winning a defensive battle, claim territory from the attacker
- Alliance leadership: Proactively propose coordinate attacks against the strongest family
- Honor ALL partnerships. You NEVER betray a partner. Your word is your bond.
- Desperation mode: When reduced to 2 or fewer territories, fight for survival regardless of odds
- Defensive buildup: Prioritize hiring muscle and fortifying existing territory
- Patient expansion: Claim unclaimed territory when safe, never overextend
- **Covert ops:** Prefer fortify (protect your people) and spy (know your enemies). Never use bribe — that's dishonorable.
- **Alliances:** ALWAYS honor them. You NEVER betray a partner. Your word is your bond.
- Your tone is dignified, measured, old-world respect.`,
```

**Step 6: Verify TypeScript compiles**

```bash
cd web/server
npx tsc --noEmit ai-prompts.ts
```

Expected: No errors

**Step 7: Commit**

```bash
git add web/server/ai-prompts.ts
git commit -m "feat: update AI prompts to reinforce new family behaviors

Update FAMILY_PERSONALITIES with clearer trigger conditions
for attacks, expansions, and counter-attacks. Reinforces the
agent personality changes in the LLM prompts."
```

---

## Task 6: Verify All Files Compile

**Step 1: Check TypeScript compilation**

```bash
cd web
npm run build 2>&1 | head -50
```

Expected: Build completes without errors

**Step 2: Commit (if any fixes needed)**

If fixes were needed:
```bash
git add .
git commit -m "fix: resolve TypeScript compilation issues"
```

---

## Testing Plan

After all tasks are complete, test the changes:

### Manual Testing Checklist

Start the game and play through several turns:

```bash
cd web
npm run dev
```

1. **Play as Falcone** — Observe that Marinelli doesn't immediately declare war without favorable conditions
2. **Check early game (turns 1-5)** — Verify all families are claiming unclaimed territories
3. **Play through to mid-game (turns 10-20)** — Watch for Rossetti/Moretti to start expanding when they meet thresholds
4. **Provoke Moretti** — Attack them and verify they counter-attack within 2 turns
5. **Get dominant (>40% territories)** — Verify other families coordinate against you
6. **Check personalities** — Ensure taunts and messages still reflect distinct personalities

### What to Look For

- **Good:** All four families actively competing for territory
- **Good:** Marinelli picks winnable fights, not just nearest neighbor
- **Good:** Rossetti claims territory when strong, not just upgrades forever
- **Good:** Moretti counter-attacks when provoked
- **Good:** Late game remains competitive

- **Bad:** Any family doing nothing for 5+ turns while having resources
- **Bad:** Marinelli declaring unwinnable wars in early turns
- **Bad:** All families acting the same (loss of personality)

---

## Completion Criteria

- [ ] All four agent files updated with new behavioral triggers
- [ ] AI prompts updated to reinforce behaviors in LLM context
- [ ] TypeScript compiles without errors
- [ ] Manual testing shows more dynamic AI behavior
- [ ] Distinct personalities preserved in communications
- [ ] All changes committed to branch `ai-behavior-improvements`
