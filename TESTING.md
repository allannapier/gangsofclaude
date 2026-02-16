# Gangs of Claude — TESTING.md

> **Purpose:** Comprehensive testing reference for playtesting, QA, and bug-finding sessions.
> **Read this first** when asked to play the game and look for bugs.

---

## Quick Start Checklist

Before testing, verify:
1. Dev server running: `cd web && npm run dev` (ports 3456 + 5174)
2. Browser open at `http://localhost:5174`
3. "CLI Connected" badge visible in header
4. No console errors on load

---

## Game Flow — How a Session Should Work

### Phase 1: New Game
1. Player runs `/start-game`
2. ASCII title screen displays
3. Game state resets: Turn 0, Outsider, $50, no family, `deceased: []`
4. All 22 characters alive, 4 families with starting territories
5. Intro narrative introduces the four families

### Phase 2: Getting Recruited (Outsider → Associate)
1. Player uses `/seek-patronage [character_id]`
2. **Only Associates, Soldiers, and Capos** appear as valid targets — Dons and Underbosses refuse to meet outsiders
3. On success: player joins that character's family, rank becomes Associate
4. Player receives $100 signing bonus
5. Suggested actions update to reflect new rank

### Phase 3: Building Power (Associate)
1. **Intel operations** — spy, survey, steal to gather info and build respect
2. **Claim territory** — grab unclaimed territories ($25 each)
3. **Message** family members to build relationships
4. **Next Turn** — advance time, earn income, watch NPC actions
5. Goal: reach 10 respect, complete 1 mission, have $100 wealth → eligible for Soldier

### Phase 4: Rising Through Ranks
| Rank | Requirements | New Abilities |
|------|-------------|---------------|
| Soldier | 10 respect, 1 mission, $100 | Recruit, stronger attacks |
| Capo | 30 respect, 5 successful actions | Territory expansion, blackmail |
| Underboss | 60 respect, control territory | Major operations |
| Don | 90 respect, current Don dies/removed | Full family control |

### Phase 5: Endgame
- **Win:** Become Don and eliminate all rival families
- **Lose:** Family eliminated, assassinated, or loyalty drops to 0

---

## UI Layout & Expected Behavior

### Header Bar
| Element | Expected Behavior |
|---------|-------------------|
| Logo + Title | Always visible |
| "CLI Connected" / "Disconnected" | Green = WebSocket active; Red = no connection |
| Actions button | Opens command palette with all 11 skills |
| Turn indicator | Shows current turn number |
| Ctrl+K | Keyboard shortcut opens Actions palette |

### Left Panel — Turn History Browser
| Element | Expected Behavior |
|---------|-------------------|
| Turn navigator | Spinbutton + ← → arrows to browse turns |
| "Latest" button | Appears when viewing past turns; jumps to current |
| Family filter | Dropdown filters events by family |
| Rank filter | Dropdown filters events by character rank |
| Action filter | Dropdown filters events by action type |
| "Clear" button | Appears when any filter active; resets all filters |
| Turn Summary banner | Shows at top of current turn with threat analysis |
| Event cards | Grouped by rank, show narrative text + action badges |

### Center Panel — Main Game Area
| Element | Expected Behavior |
|---------|-------------------|
| Player Stats bar | Rank, Family, Wealth ($X), Respect, Loyalty (%) |
| Suggested action | Context-sensitive button based on rank/situation |
| "⏭️ Next Turn" button | Triggers turn processing |
| Tab buttons | Territories / Families / Tasks |
| Territory map | Grid of territory cards showing owner + name |
| Family Holdings | Summary bar showing territory count + member count per family |

### Right Panel — Details
| Element | Expected Behavior |
|---------|-------------------|
| Empty state | "Select a territory, family, or character" |
| Territory detail | Name, controlling family, family members, holdings list |
| Family detail | Name, member count (alive only), wealth, respect, territories, member list |
| Character detail | Name, rank, traits, personality, loyalty; action buttons if alive |

---

## Contextual Actions — What Appears When You Click Things

### Clicking a Territory

| Territory Type | Actions Available |
|---------------|-------------------|
| **Own family territory** | 📈 Expand — Grow influence (costs $50-400) |
| **Enemy territory** | ⚔️ Attack — Seize territory; 👁️ Scout — Survey enemy strength |
| **Unclaimed territory** | 🏴 Claim — Claim for your family ($25) |

### Clicking a Family

| Context | Actions Available |
|---------|-------------------|
| **Enemy family** | ✉️ Message — Send to Don/Consigliere; ⚔️ Attack — Assault family; 🕵️ Spy — Gather intel |
| **Own family** | ✉️ Message — Internal communication |

### Clicking a Character

| Context | Actions Available |
|---------|-------------------|
| **Enemy character** | 🕵️ Spy — Gather intel; 💰 Steal — Take resources; 📧 Message — Send message |
| **Own family member** | ✉️ Message — Communicate; 👥 Recruit — Mentor/strengthen |
| **As Outsider** | 🤝 Seek Patronage — Request to join (Associates/Soldiers/Capos only) |

### Actions Palette (Ctrl+K or Actions button)

All 11 skills available:
| Skill | Category | Description |
|-------|----------|-------------|
| `/start-game` | Core | Initialize new game |
| `/status` | Core | View current stats and standings |
| `/next-turn` | Core | Advance turn — all 22 NPCs act |
| `/promote` | Core | Check rank promotion eligibility |
| `/seek-patronage` | Action | Get recruited by a family (Outsider only) |
| `/recruit` | Action | Build network / mentor members |
| `/attack` | Action | Launch violent action against target |
| `/intel` | Action | Espionage: spy, steal, blackmail, survey |
| `/expand` | Action | Grow family territory ($50-400) |
| `/claim` | Action | Claim unowned territory ($25) |
| `/message` | Social | Send message to any character |

---

## Economy System

### Per-Turn Income (earned automatically each turn)

| Component | Formula | Example (Associate, 3 territories, $85k family) |
|-----------|---------|--------------------------------------------------|
| Rank Stipend | Outsider=$0, Associate=$25, Soldier=$75, Capo=$150, Underboss=$300, Don=$500 | $25 |
| Territory Income | $20 × family territories | $60 |
| Family Dividend | 0.5% of family wealth | $425 → $25 (rounded) |
| Protection Rackets | $10 × family territories | $30 |
| **Total** | Sum of all components | **$140/turn** |

**No income** if player has no family (Outsider).

### Action Costs

| Action | Cost |
|--------|------|
| Claim territory | $25 |
| Expand (small) | $50 |
| Expand (medium) | $150 |
| Expand (large) | $400 |
| Intel: Survey | $25 |
| Intel: Steal | $50 |
| Intel: Blackmail | $75 |
| Intel: Spy | $100 |
| Recruit | $10-50 depending on rank |

### Action Rewards

| Action | Reward on Success |
|--------|-------------------|
| Steal | $50-200 |
| Blackmail | $100-500 |
| Successful attack | $50-150 + respect |
| Territory claim | Ongoing territory income |

---

## Turn Processing — Expected Sequence

1. Player clicks "⏭️ Next Turn" (or runs `/next-turn`)
2. **Confirmation dialog** appears: "Advance to Turn X?"
3. Player confirms → **Turn Processing Modal** opens full-screen
4. Progress bar animates 0% → ~95%
5. **22 NPC characters act in rank order:**
   - Associates act first (lowest stakes)
   - Soldiers act (enforcement, small ops)
   - Capos act (territory, crew management)
   - Consiglieres act (advice, politics)
   - Underbosses act (operational decisions)
   - Dons act last (strategic moves, war declarations)
6. Events stream in real-time via 500ms save.json polling
7. Action count increments as events arrive
8. **On completion:**
   - Income calculated and applied to player wealth
   - Death processing: ~8% chance per attack event that a named NPC is eliminated
   - Income toast: "💰 $X earned this turn"
   - Death toast (if any): "💀 Character Name has been eliminated"
   - Modal shows "Turn X Complete" with narrative summary
   - Click anywhere to dismiss modal
9. Turn history updates with all new events + turn summary

### Turn Summary Banner

Appears at top of turn history for each turn. Contains:
- **Threat level indicator:** 🔴 High Threat (3+ attacks on your family), 🟡 Rival Activity (1-2 attacks), 🟢 Quiet Turn
- **Attack summary:** "X threats against your family" / "X attacks by your family"
- **Territory moves:** "X territory moves"
- **Intel ops:** "X intel ops by allies"
- **Income status:** "💰 Income collected"
- **Notable events:** Bullet list of attacks involving your family

---

## Character Death System

### How Deaths Occur
- During turn processing, attack events have ~8% chance of causing a casualty
- A random alive, non-Don member of the target family is selected
- Death event logged with 💀 emoji
- `deceased[]` array in save.json updated

### Death Effects
- Dead character's `alive` status set to `false`
- **Filtered from:** Family member lists, character dropdowns, action targets, territory member counts
- **Visible in:** Turn history as death events with skull icon and dark red styling
- Death toast notification shown to player

### New Game Reset
- `/start-game` resets `deceased: []`
- All 22 characters return alive
- Static family data (`families.ts`) always has `alive: true`; deaths applied dynamically via store

---

## Event Narratives — Expected Text

Events in the turn history should show **readable narrative descriptions**, not raw data.

| Action | Expected Narrative Pattern |
|--------|---------------------------|
| attack | "[Actor] launched an attack against the [Target] family" |
| hold | "[Actor] held position and consolidated power" |
| expand | "[Actor] expanded [Family] territory and business operations" |
| recruit | "[Actor] recruited new members and strengthened the ranks" |
| intel/spy | "[Actor] gathered intelligence on the [Target] family" |
| message | "[Actor] communicated with family leadership" |
| claim | "[Actor] claimed new territory for the [Family] family" |
| survey | "[Actor] conducted surveillance operations" |
| income | Shows income breakdown: "$X stipend + $Y territory + $Z family cut + $W rackets" |
| eliminate/death | "💀 [Character] ([Rank]) of the [Family] family has been eliminated" |

### Known Narrative Rules
- Target "System" → should NOT show "System family"; falls through to generic narrative
- Target "[Family] Family" → `cleanFamilyTarget()` strips trailing " Family" to avoid "Rossetti Family family"
- Player events show "👤 You" with "ME" badge
- If `event.result` exists and is long (>20 chars), it's used as the narrative directly
- If narrative matches `event.result`, the result is NOT shown separately (no duplicates)

---

## Families & Characters Reference

### 🔴 Marinelli Family — Aggressive Traditionalists
| Character | Rank | ID |
|-----------|------|----|
| Vito Marinelli | Don | `marinelli_vito` |
| Salvatore Marinelli | Underboss | `marinelli_salvatore` |
| Bruno Marinelli | Consigliere | `marinelli_bruno` |
| Marco Marinelli | Capo | `marinelli_marco` |
| Luca Marinelli | Soldier | `marinelli_luca` |
| Enzo Marinelli | Associate | `marinelli_enzo` |

**Starting territories:** Little Italy, Warehouse District (+The Docks shared)
**Color:** Red (#ef4444)

### 🟡 Rossetti Family — Business Diplomats
| Character | Rank | ID |
|-----------|------|----|
| Marco Rossetti | Don | `rossetti_marco` |
| Carla Rossetti | Underboss | `rossetti_carla` |
| Antonio Rossetti | Consigliere | `rossetti_antonio` |
| Franco Rossetti | Capo | `rossetti_franco` |
| Maria Rossetti | Soldier | `rossetti_maria` |
| Paolo Rossetti | Associate | `rossetti_paolo` |

**Starting territories:** North End, Fishmarket, Southside Clubs
**Color:** Gold (#eab308)

### 🟣 Falcone Family — Cunning Manipulators
| Character | Rank | ID |
|-----------|------|----|
| Sofia Falcone | Don | `falcone_sofia` |
| Victor Falcone | Underboss | `falcone_victor` |
| Dante Falcone | Consigliere | `falcone_dante` |
| Iris Falcone | Capo | `falcone_iris` |
| Leo Falcone | Soldier | `falcone_leo` |

**Starting territories:** Downtown, Financial District
**Color:** Purple (#a855f7)

### 🟢 Moretti Family — Honorable Traditionalists
| Character | Rank | ID |
|-----------|------|----|
| Antonio Moretti | Don | `moretti_antonio` |
| Giovanni Moretti | Underboss | `moretti_giovanni` |
| Elena Moretti | Consigliere | `moretti_elena` |
| Ricardo Moretti | Capo | `moretti_ricardo` |
| Carlo Moretti | Soldier | `moretti_carlo` |

**Starting territories:** East Side, Harbor, Old Town
**Color:** Green (#22c55e)

### Unclaimed Territories (available at game start)
- The Docks
- East Harbor

---

## Common Bug Patterns to Watch For

### Action Mapping Issues
- ❌ Action button sends wrong skill command (e.g., Scout sends `/intel spy` instead of `/intel survey`)
- ❌ Action shows for wrong context (e.g., "Expand" on enemy territory)
- ❌ Action available despite insufficient rank/wealth
- ❌ Character dropdown shows dead characters
- ✅ Cost warnings display when wealth is insufficient

### Turn Processing Issues
- ❌ Turn number increments by 2 instead of 1 (double-increment bug)
- ❌ Modal doesn't close after turn completes
- ❌ Events don't stream in real-time (all appear at once)
- ❌ Income not applied to player wealth after turn
- ❌ Dead character still acts in subsequent turns

### Narrative Issues
- ❌ Shows "System family" in event text
- ❌ Shows "[Family] Family family" (double "family")
- ❌ Same text appears twice on one event card (duplicate result)
- ❌ Generic "X (family Rank) - action action" instead of readable narrative

### State Issues
- ❌ Details panel shows stale data (e.g., dead character still listed)
- ❌ Family member count doesn't update after death
- ❌ Territory ownership doesn't change after successful attack
- ❌ Player wealth doesn't deduct after action execution
- ❌ New game doesn't reset deceased list

### WebSocket Issues
- ❌ "CLI Disconnected" badge but actions still send
- ❌ Multiple toasts stacking or not clearing
- ❌ State desync between turn history and actual save.json

---

## Testing Workflow

### Quick Smoke Test (2 minutes)
1. Load page → verify no console errors
2. Click territory → verify contextual actions appear
3. Click Families tab → verify all 4 families with correct member counts
4. Click Actions → verify all 11 skills listed
5. Browse turn history → verify narratives are readable

### Full Playthrough Test (10+ minutes)
1. `/start-game` → verify clean reset
2. Click character → `/seek-patronage` → join family
3. `/next-turn` → verify modal, events, income
4. `/intel survey [target]` → verify execution and response
5. `/claim [territory]` → verify $25 deducted, territory claimed
6. `/next-turn` → verify income includes new territory
7. Click enemy territory → Scout → verify intel result
8. Click enemy family → Attack → verify combat result
9. Browse turn history across multiple turns
10. Check death events if any occurred
11. Verify all filters work in turn history

### Regression Checklist
- [ ] Territory actions: own/enemy/unclaimed all correct
- [ ] Family member counts reflect deaths
- [ ] Details panel uses death-aware data
- [ ] Turn summary threat level calculation correct
- [ ] Income breakdown matches expected formula
- [ ] No duplicate narrative text on events
- [ ] No "System family" or "Family family" text
- [ ] Dead characters excluded from all dropdowns
- [ ] Next Turn confirmation → modal → completion → dismiss flow
- [ ] Actions palette shows all 11 skills
- [ ] Console: zero errors, zero warnings

---

## Technical Architecture (for debugging)

### Data Flow
```
Browser (React + Zustand)
    ↕ WebSocket (JSON)
Bun/Hono Server (port 3456)
    ↕ File I/O (500ms polling)
.claude/game-state/save.json (source of truth)
    ↕ WebSocket (NDJSON)
Claude Code CLI (skill execution)
```

### Key Files
| File | What It Does |
|------|-------------|
| `web/server/index.ts` | WebSocket bridge, save.json polling, income/death processing |
| `web/server/mechanics.ts` | Combat, income, assassination, expansion formulas |
| `web/client/src/store/index.ts` | Zustand state, WebSocket message handling, deceased tracking |
| `web/client/src/data/actions.ts` | All 31 action definitions with conditions and skill mappings |
| `web/client/src/data/families.ts` | Static character data (22 chars), family colors/territories |
| `web/client/src/components/TurnHistoryBrowser.tsx` | Event narratives, turn summaries, filtering |
| `web/client/src/components/TurnProcessingModal.tsx` | Full-screen turn modal with progress tracking |
| `web/client/src/components/ActionDialog.tsx` | Skill input collection dialogs |
| `web/client/src/components/DetailsPanel.tsx` | Right sidebar territory/family/character details |
| `.claude/game-state/save.json` | Single source of truth for all game state |
