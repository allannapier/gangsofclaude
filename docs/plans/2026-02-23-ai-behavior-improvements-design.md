# AI Behavior Improvements Design

## Problem Statement

The current AI behaviors create predictable gameplay patterns:

1. **Marinelli** attacks too aggressively early on, burning resources on fruitless wars
2. **Rossetti** and **Moretti** are too passive, upgrading businesses indefinitely without expanding
3. Late game becomes a snowball: player defeats Marinelli, then easily conquers the passive families

## Design Approach: Personality-Driven Opportunism

Each family keeps their core identity but gains "trigger conditions" that make them opportunistic. The goal is to preserve distinct personalities while preventing the "sit and wait" problem.

---

## Marinelli Family — Aggressive Traditionalists

### Current Issues
- Attacks whoever is nearby immediately, regardless of odds
- Burns through resources on unwinnable wars
- Doesn't exploit weakened enemies effectively

### Behavior Changes

**Attack Triggers (must meet at least one):**
- Target has ≤80% of your muscle (favorable odds)
- Target is already at war with someone else (exploit weakness)
- You have 6+ territories (established enough to risk wars)
- Target lost 2+ territories in the last 3 turns (blood in the water)

**Keep:**
- Muscle-heavy focus over business upgrades
- Grudge-holding behavior
- Intimidation-based diplomacy style
- Prefer hiring muscle over upgrading

**Tone:** Blunt, threatening, old-school Italian-American mafia

---

## Rossetti Family — Business Diplomats

### Current Issues
- Just upgrades businesses forever, never attacks
- Ignores unclaimed free territories
- Doesn't leverage economic advantage into military expansion

### Behavior Changes

**Early Game Priority:**
- Aggressively claim unclaimed territories (they're free real estate)
- Build economic base through upgrades

**Expansion Threshold (all must be true):**
- Have 5+ territories
- Have $400+ wealth
- See a target with ≤3 muscle (easy conquest) OR target family recently weakened

**Economic Warfare:**
- Use sabotage covert ops against business-heavy rivals
- Coordinate attacks to weaken economic competitors

**Keep:**
- Prefer upgrades when no good targets available
- Diplomatic overtures before violence
- Business/investment language and tone
- View violence as expensive and wasteful

**Tone:** Polished, business-like, condescending, financially themed

---

## Moretti Family — Honorable Traditionalists

### Current Issues
- Waits passively to be attacked
- Never seizes opportunities from successful defense
- Doesn't use alliances proactively

### Behavior Changes

**Counter-Attack Doctrine:**
- When attacked, retaliate within 2 turns with 1.5x the force
- After winning a defensive battle, claim territory from the attacker if possible

**Alliance Leadership:**
- Proactively propose coordinate attacks against the strongest family
- Honor all alliances (no betrayal)
- Form partnerships against aggressive families

**Defensive Expansion:**
- Claim unclaimed territories that border existing turf (secure the perimeter)
- Prioritize hiring muscle over upgrades when threatened

**Keep:**
- Honor all partnerships and agreements
- Measured, dignified response style
- Patient, loyal, old-world values
- Defensive priorities when at peace

**Tone:** Dignified, measured, old-world respect, paternal disappointment

---

## Falcone Family — Cunning Manipulators

### Current Issues
- Generally balanced but could coordinate better
- Sometimes misses opportunities while rivals fight

### Behavior Changes

**Leader Targeting:**
- If any family controls >40% of territories, always coordinate against them
- Always spy on the strongest family to know their strength

**Opportunistic Claiming:**
- While rivals fight each other, aggressively claim unclaimed territory
- Attack weakest territories for guaranteed wins

**Betrayal Timing:**
- Break alliances only when you have 6+ territories AND the ally is weakened
- Form alliances strategically to set up future betrayals

**Keep:**
- Information warfare priority (spy/sabotage)
- Cryptic, calculating communication style
- Chess/shadow metaphors
- Let enemies destroy each other philosophy

**Tone:** Cryptic, calculating, theatrical, psychologically unsettling

---

## Universal Improvements (All Families)

### Early Game: Unclaimed Territory Race
- All families prioritize claiming free territories in the first 10 turns
- Unclaimed territory = free income with no combat risk

### Leader Suppression
- If any family controls >50% of territories, all others get +20% aggression priority toward them
- Prevents runaway leaders from snowballing

### Desperation Mode
- When reduced to 2 or fewer territories, ignore normal restrictions
- Attack for survival, even against unfavorable odds

### Wealth Ceiling Response
- When wealth exceeds $800, must spend on expansion (hire/attack/claim)
- Prevents hoarding without action

---

## Implementation Notes

The AI behavior is controlled by:
1. **Agent files** (`.claude/agents/<family>-family.md`) — Personality and decision-making style
2. **AI prompts** (`web/server/ai-prompts.ts`) — The actual prompts sent to the LLM with game state

Changes should primarily update the agent files with clearer behavioral instructions while keeping the prompt builder mostly unchanged.

### Success Metrics
- Games should feel less predictable — each family should be a threat in different ways
- Rossetti and Moretti should actively expand, not just build up
- Marinelli should pick fights they can win, not just attack nearest neighbor
- Late game should remain competitive, not a foregone conclusion

---

## Testing Checklist

- [ ] Play as Falcone — Marinelli shouldn't attack immediately without favorable conditions
- [ ] Play as any family — Rossetti should claim unclaimed territories early
- [ ] Play as any family — Moretti should counter-attack when provoked
- [ ] Observe late game — All families should challenge a dominant player
- [ ] Verify personalities remain distinct in communications
