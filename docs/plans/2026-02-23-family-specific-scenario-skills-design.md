# Family-Specific Scenario Skills Design

## Architecture

**20 Skills Total:** 5 scenarios × 4 families = 20 family-specific skill files

Each family has their own version of each scenario skill, tailored to their personality.

## Scenario Priority Tree (Evaluated in Order)

```
1. DESPERATION          → ≤2 territories remaining
2. DEFENSIVE_CRISIS     → Attacked in last 2 turns
3. WAR_DECLARED         → Someone declared war on you
4. POLICE_CRACKDOWN     → Your territory under police crackdown
5. RESOURCE_CRUNCH      → Wealth < $100 AND income negative
6. DOMINANT_THREAT      → Enemy controls >40% of territories
7. ALLIANCE_OPPORTUNITY → Can propose beneficial alliance
8. COORDINATION_REQUEST → Ally proposed coordinated attack
9. POST_ELIMINATION     → A family was just eliminated (scramble!)
10. EXPANSION_WINDOW    → Unclaimed territories available
11. WEAK_TARGET         → Enemy territory ≤3 muscle
12. MUSCLE_ADVANTAGE    → >50% more muscle than nearest neighbor
13. ECONOMIC_DOMINANCE  → Wealth >$800 + strong income
14. TERRITORY_RACE      → Someone else claiming unclaimed aggressively
15. DIPLOMATIC_ISOLATION → No allies, hostile relations with all
16. SURROUNDED          → Enemy territories bordering all your turf
17. BALANCED_STANDOFF   → All families roughly equal power
18. BETRAYAL_WINDOW     → Ally weakened, good time to betray
19. INTEL_ADVANTAGE     → Have spy intel on strong enemy
20. ECONOMIC_BUILD      → [DEFAULT] Build strength, prepare for opportunities
```

**Rule:** Evaluate top-to-bottom. Use first matching scenario. If uncertain or multiple apply, agent makes best judgment call based on personality.

---

## Skill Inventory (20 Total)

### Scenario 1: DESPERATION
**Trigger:** ≤2 territories

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `desperation-marinelli` | Aggressive | All-out attack, betray if needed, go down fighting |
| `desperation-rossetti` | Business | Hostile takeover, bribes, covert ops to weaken then strike |
| `desperation-falcone` | Cunning | Coordinate with other weak families, drag enemies down |
| `desperation-moretti` | Honorable | Rally all muscle, call allies, honorable last stand |

---

### Scenario 2: DEFENSIVE_CRISIS
**Trigger:** Attacked in last 2 turns

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `defensive-crisis-marinelli` | Aggressive | 1.5x retaliation within 2 turns, take their territory too |
| `defensive-crisis-rossetti` | Business | Fortify, bribes, surgical strike on their highest-income |
| `defensive-crisis-falcone` | Cunning | Spy, coordinate with their enemies, strike when distracted |
| `defensive-crisis-moretti` | Honorable | Measured retaliation, claim territory after, rally allies |

---

### Scenario 3: WAR_DECLARED
**Trigger:** Someone declared war on you

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `war-declared-marinelli` | Aggressive | Accept the challenge, strike first, show no weakness |
| `war-declared-rossetti` | Business | Defensive posture, seek allies against aggressor, fortify |
| `war-declared-falcone` | Cunning | Let them come to you, trap them, turn their allies |
| `war-declared-moretti` | Honorable | Prepare defenses, retaliate when they attack, honor demands response |

---

### Scenario 4: POLICE_CRACKDOWN
**Trigger:** Your territory under police crackdown

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `police-crackdown-marinelli` | Aggressive | Lay low, hire muscle elsewhere, wait it out then retaliate on enemies |
| `police-crackdown-rossetti` | Business | Legal protection (bribe city), shift operations to other territories |
| `police-crackdown-falcone` | Cunning | Use cover of crackdown to spy (they're watching the cops, not you) |
| `police-crackdown-moretti` | Honorable | Cooperate partially, protect your people, weather the storm |

---

### Scenario 5: RESOURCE_CRUNCH
**Trigger:** Wealth <$100 AND negative income

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `resource-crunch-marinelli` | Aggressive | Desperate attack for income territory, sell muscle if needed |
| `resource-crunch-rossetti` | Business | Emergency austerity, downgrade business, claim cheap territory |
| `resource-crunch-falcone` | Cunning | Steal muscle via bribes, sabotage enemy income sources |
| `resource-crunch-moretti` | Honorable | Consolidate, abandon weak territory if needed, survive honorably |

---

### Scenario 6: DOMINANT_THREAT
**Trigger:** Enemy controls >40% territories

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `dominant-threat-marinelli` | Aggressive | Rally everyone against them, this is OUR city |
| `dominant-threat-rossetti` | Business | Alliance with #2, economic warfare, sabotage their businesses |
| `dominant-threat-falcone` | Cunning | Coordinate EVERYONE, chaos is your cover, strike when they spread thin |
| `dominant-threat-moretti` | Honorable | Propose coalition for balance, fight for the city's soul |

---

### Scenario 7: ALLIANCE_OPPORTUNITY
**Trigger:** Can propose beneficial alliance

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `alliance-opportunity-marinelli` | Aggressive | Ally with #2 against #1, or weak family you can manipulate |
| `alliance-opportunity-rossetti` | Business | Partner for mutual economic benefit, defense bonus valuable |
| `alliance-opportunity-falcone` | Cunning | Form alliance to set up future betrayal, pick the strongest |
| `alliance-opportunity-moretti` | Honorable | Ally against common threat, your word is your bond |

---

### Scenario 8: COORDINATION_REQUEST
**Trigger:** Ally proposed coordinated attack

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `coordination-request-marinelli` | Aggressive | Accept if target is weak, you get the territory |
| `coordination-request-rossetti` | Business | Accept if profitable, decline if too risky |
| `coordination-request-falcone` | Cunning | Accept, but let them bleed first, you take the spoils |
| `coordination-request-moretti` | Honorable | Honor the request if strategically sound, allies matter |

---

### Scenario 9: POST_ELIMINATION
**Trigger:** A family was just eliminated (scramble for their turf)

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `post-elimination-marinelli` | Aggressive | Grab as much as possible, muscle-first to contested areas |
| `post-elimination-rossetti` | Business | Strategic acquisition, prioritize high-income territories |
| `post-elimination-falcone` | Cunning | Let others fight over scraps, claim uncontested pieces |
| `post-elimination-moretti` | Honorable | Claim adjacent territories for security, avoid overextension |

---

### Scenario 10: EXPANSION_WINDOW
**Trigger:** Unclaimed territories available

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `expansion-window-marinelli` | Aggressive | Claim aggressively, free real estate, expand the empire |
| `expansion-window-rossetti` | Business | Claim early and often, free income with no combat cost |
| `expansion-window-falcone` | Cunning | Claim while others fight, prioritize strategic positions |
| `expansion-window-moretti` | Honorable | Secure borders first, claim adjacent territory defensively |

---

### Scenario 11: WEAK_TARGET
**Trigger:** Enemy territory ≤3 muscle (easy conquest)

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `weak-target-marinelli` | Aggressive | Strike immediately, weakness must be punished |
| `weak-target-rossetti` | Business | Undervalued asset, acquire if ROI is positive |
| `weak-target-falcone` | Cunning | Guaranteed win, but check if better target exists |
| `weak-target-moretti` | Honorable | Consider if defensive necessity, don't attack unprovoked |

---

### Scenario 12: MUSCLE_ADVANTAGE
**Trigger:** >50% more muscle than nearest neighbor

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `muscle-advantage-marinelli` | Aggressive | Press the advantage, attack while you're strong |
| `muscle-advantage-rossetti` | Business | Intimidate without fighting, expand economically |
| `muscle-advantage-falcone` | Cunning | Use threat to manipulate, don't waste muscle unnecessarily |
| `muscle-advantage-moretti` | Honorable | Deter aggression through strength, expand peacefully |

---

### Scenario 13: ECONOMIC_DOMINANCE
**Trigger:** Wealth >$800 + strong income

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `economic-dominance-marinelli` | Aggressive | Convert wealth to muscle and territory, cash is useless if you lose |
| `economic-dominance-rossetti` | Business | Maintain dominance, invest in highest-tier businesses |
| `economic-dominance-falcone` | Cunning | Fund covert ops, buy influence, prepare the long game |
| `economic-dominance-moretti` | Honorable | Invest in family security, help loyal allies |

---

### Scenario 14: TERRITORY_RACE
**Trigger:** Someone else claiming unclaimed aggressively

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `territory-race-marinelli` | Aggressive | Race them, claim faster, muscle-flex if needed |
| `territory-race-rossetti` | Business | Compete economically, prioritize high-value claims |
| `territory-race-falcone` | Cunning | Let them overextend, focus on strategic chokepoints |
| `territory-race-moretti` | Honorable | Secure your perimeter first, then expand methodically |

---

### Scenario 15: DIPLOMATIC_ISOLATION
**Trigger:** No allies, hostile relations with all

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `diplomatic-isolation-marinelli` | Aggressive | So be it. We need no one. Fortify and prepare for war on all fronts |
| `diplomatic-isolation-rossetti` | Business | Repair relations with least-hostile, buy friendship |
| `diplomatic-isolation-falcone` | Cunning | Play factions against each other, you don't need allies to win |
| `diplomatic-isolation-moretti` | Honorable | Extend olive branch, your honor will eventually be recognized |

---

### Scenario 16: SURROUNDED
**Trigger:** Enemy territories bordering all your turf

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `surrounded-marinelli` | Aggressive | Breakout attack, punch through weakest neighbor |
| `surrounded-rossetti` | Business | Negotiate passage/buffer zone with one neighbor |
| `surrounded-falcone` | Cunning | Get them fighting each other, you're the prize they fight over |
| `surrounded-moretti` | Honorable | Fortify all borders, make aggression costly, seek ally |

---

### Scenario 17: BALANCED_STANDOFF
**Trigger:** All families roughly equal power

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `balanced-standoff-marinelli` | Aggressive | Break the deadlock with bold attack, fortune favors bold |
| `balanced-standoff-rossetti` | Business | Out-economy the competition, first to big income wins |
| `balanced-standoff-falcone` | Cunning | Secretly tip the balance, let them weaken each other |
| `balanced-standoff-moretti` | Honorable | Maintain stability, be ready when someone else breaks peace |

---

### Scenario 18: BETRAYAL_WINDOW
**Trigger:** Ally weakened, good time to betray

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `betrayal-window-marinelli` | Aggressive | Betray immediately, weakness is opportunity |
| `betrayal-window-rossetti` | Business | Calculate if betrayal profit > alliance value, then act |
| `betrayal-window-falcone` | Cunning | Wait for optimal moment, maximum damage, minimum cost |
| `betrayal-window-moretti` | Honorable | Never. Your word is your bond. Help them recover instead. |

---

### Scenario 19: INTEL_ADVANTAGE
**Trigger:** Have spy intel on strong enemy

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `intel-advantage-marinelli` | Aggressive | Use intel to strike where they're weakest |
| `intel-advantage-rossetti` | Business | Exploit knowledge for economic advantage |
| `intel-advantage-falcone` | Cunning | This is your element. Maximize the information edge |
| `intel-advantage-moretti` | Honorable | Knowledge for defense, know when to act |

---

### Scenario 20: ECONOMIC_BUILD [DEFAULT]
**Trigger:** No specific scenario matches

| Skill File | Family | Core Directive |
|------------|--------|----------------|
| `economic-build-marinelli` | Aggressive | Hire muscle, prepare for war, strike when ready |
| `economic-build-rossetti` | Business | Upgrade businesses, maximize income, expand when strong |
| `economic-build-falcone` | Cunning | Gather intel, fortify, set traps, patience |
| `economic-build-moretti` | Honorable | Steady growth, secure borders, maintain honor |

---

## Agent File Structure

Each family agent file includes:

```markdown
## Scenario Evaluation Process

Evaluate scenarios in priority order. Invoke the appropriate skill when matched.

1. DESPERATION (≤2 territories) → `/desperation-<family>`
2. DEFENSIVE_CRISIS (attacked recently) → `/defensive-crisis-<family>`
3. WAR_DECLARED (war declared on you) → `/war-declared-<family>`
4. POLICE_CRACKDOWN (your territory affected) → `/police-crackdown-<family>`
5. RESOURCE_CRUNCH (broke) → `/resource-crunch-<family>`
6. DOMINANT_THREAT (enemy >40%) → `/dominant-threat-<family>`
7. ALLIANCE_OPPORTUNITY → `/alliance-opportunity-<family>`
8. COORDINATION_REQUEST → `/coordination-request-<family>`
9. POST_ELIMINATION → `/post-elimination-<family>`
10. EXPANSION_WINDOW → `/expansion-window-<family>`
11. WEAK_TARGET → `/weak-target-<family>`
12. MUSCLE_ADVANTAGE → `/muscle-advantage-<family>`
13. ECONOMIC_DOMINANCE → `/economic-dominance-<family>`
14. TERRITORY_RACE → `/territory-race-<family>`
15. DIPLOMATIC_ISOLATION → `/diplomatic-isolation-<family>`
16. SURROUNDED → `/surrounded-<family>`
17. BALANCED_STANDOFF → `/balanced-standoff-<family>`
18. BETRAYAL_WINDOW → `/betrayal-window-<family>`
19. INTEL_ADVANTAGE → `/intel-advantage-<family>`
20. ECONOMIC_BUILD → `/economic-build-<family>`

## Fallback

If multiple scenarios apply or none fit perfectly, make your best judgment call based on your family's personality and current game state.
```

---

## Skill File Template

Each skill file (e.g., `.claude/skills/desperation-marinelli/SKILL.md`):

```markdown
---
name: desperation-marinelli
description: Marinelli family guidance for desperation scenario (≤2 territories)
tools: Read
model: sonnet
permissionMode: default
maxTurns: 2
---

# Desperation Mode — Marinelli Family

## When to Use

You have 2 or fewer territories. This is survival time.

## Core Directive

This is not the end. We are Marinelli! We were here before any of these punks, and we'll be here after.

## Tactical Guidance

### Immediate Actions (in priority order)

1. **ALL-IN ATTACK**
   - Identify your weakest neighbor
   - Commit EVERY muscle to the attack
   - Target their weakest territory
   - Victory = survival, defeat = extinction

2. **BETRAY IF NEEDED**
   - Alliances mean nothing in desperation
   - Attack allies if they're the weakest target
   - Pay the betrayal penalty — you're dead anyway if you don't

3. **HIRE EVERYTHING**
   - Spend all wealth on muscle
   - No point saving money if you're eliminated
   - Even 1 extra muscle could tip the balance

### Target Selection

- Prioritize: Weakest enemy territory (lowest muscle)
- Avoid: Strong territories, well-defended positions
- Consider: Territories you lost recently (retake your birthright)

### Diplomacy

- Ignore diplomacy — action is the only language now
- If someone declares war, laugh — you're already at war with everyone

### Taunt Style

- Defiant, refusing to accept defeat
- "You think this is over? Marinelli doesn't fall!"
- "Come and finish it... if you can."

## Output

Provide your recommendation as:
1. **Action:** Specific attack/hire action
2. **Target:** Territory or family to target
3. **Force:** All available muscle
4. **Rationale:** Why this is the Marinelli way to survive
```

---

## Testing Strategy

1. **Unit Test Each Skill:** Verify each family responds appropriately to scenario
2. **Integration Test:** Play through game, observe scenario triggers
3. **Edge Case Test:** Force specific scenarios, verify correct skill invoked
4. **Balance Test:** Ensure no family dominates due to superior skill logic

---

## Implementation Order

1. Create skill directory structure
2. Implement 5 highest-priority skills (desperation, defensive-crisis, dominant-threat, expansion-window, economic-build) for all families
3. Test basic scenarios
4. Implement remaining 15 skills
5. Full integration testing
