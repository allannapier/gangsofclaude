# Turn Processing Modal - Alternative Proposals

## Current Problems Identified

### Data Flow Analysis

**How turn processing works:**
1. Player executes `/next-turn` skill
2. PreToolUse hook automatically increments `save.json.turn` BEFORE the skill runs
3. `/next-turn` skill processes 22 characters, logging each action to `save.json`
4. Server polls `save.json` every 500ms and broadcasts `events_update` messages
5. Server broadcasts `game_state_update` when turn number changes
6. **Server DOES NOT send `turn_complete` message** (this is the bug!)

**WebSocket messages during turn processing:**
- `events_update` - New events detected in save.json
- `game_state_update` - Turn number changed
- `action_started` - When /next-turn starts (handled in App.tsx:156-164)
- `turn_complete` - **NEVER SENT** (server has function `broadcastTurnComplete()` at line 922 but never calls it)

**Current modal issues:**
1. **Wrong turn number** - Uses `processingTurnTarget` which is set to `gameState.turn + 1` in store (line 389), but the hook already incremented the turn before the modal opens
2. **Wrong completion signal** - Modal waits for `isProcessingTurn === false` which requires `turn_complete` message that never comes
3. **Complex state tracking** - Multiple refs and state variables create race conditions
4. **Animated complexity** - Background cycling, spinning rings add visual noise without functional value

---

## Proposal 1: "Simple Polling" (Recommended)

### Concept
Track turn completion by counting events. When we see ~22 events for the target turn, we know processing is done.

### How It Works

**Turn State Tracking:**
```typescript
// Store tracks the turn being processed
interface TurnProcessingState {
  isProcessing: boolean;
  targetTurn: number;        // The turn we're waiting for
  expectedEvents: number;    // ~22 events expected
  completedEvents: number;    // Events seen so far
}
```

**Modal Behavior:**
1. When `/next-turn` is clicked, set `isProcessing: true, targetTurn: gameState.turn + 1`
2. Show simple loading state: "Processing turn {targetTurn}..."
3. Each `events_update` message, count events for `targetTurn`
4. When `completedEvents >= 22`, show completion summary
5. After 3 seconds, auto-close modal

**What User Sees:**
- **Processing phase:** Clean modal with spinner, "Processing Turn 5" (correct number), "12/22 actions completed"
- **Complete phase:** "Turn 5 Complete", shows summary of what happened
- **Progress bar:** Based on actual event count (22 events = 100%)

### Pros
- **Correct turn numbers** - Uses `gameState.turn + 1` which is the NEXT turn (current turn hasn't incremented yet when modal opens)
- **Reliable completion** - Based on actual event count, not missing WebSocket messages
- **Simple state** - No refs, no complex effect chains
- **Clean visuals** - No background cycling, no spinning crowns
- **Works offline** - Doesn't depend on server-side completion signals

### Cons
- Assumes ~22 events per turn (might vary if random events occur)
- 500ms polling delay means updates aren't instant

---

## Proposal 2: "Turn Number Sync" (Simplest Fix)

### Concept
Fix the current implementation by correcting turn number display and using event count for completion.

### How It Works

**The Fix:**
The bug is in line 56 of TurnProcessingModal.tsx:
```typescript
// WRONG: Uses gameState.turn + 1, but turn was already incremented by hook
let targetTurn = processingTurnTarget ?? (gameState.turn + 1);

// CORRECT: Use the target turn from store, or current turn if not set
let targetTurn = processingTurnTarget ?? gameState.turn;
```

**Completion Detection:**
Replace the `turn_complete` message detection (line 167-170 of App.tsx) with event-based detection:
```typescript
// Instead of waiting for turn_complete (never sent), detect completion by event count
if (data.type === 'events_update') {
  const targetTurnEvents = data.events.filter((e: any) => e.turn === processingTurnTarget);
  if (targetTurnEvents.length >= 20) { // 22 characters, allowing margin
    setIsProcessingTurn(false);
  }
}
```

**What User Sees:**
- Same visual design as current
- Correct turn number displayed
- Modal closes when events are complete
- No server-side changes needed

### Pros
- **Minimal code changes** - Fix turn display and completion detection
- **Preserves existing design** - Keep animations if desired
- **No server changes** - Works with current WebSocket protocol
- **Correct turn tracking** - Uses store's `processingTurnTarget` correctly

### Cons
- Still has complex animations (spinning rings, background cycling)
- Multiple refs and state create potential for bugs
- Doesn't address the architectural problem (no explicit completion signal)

---

## Proposal 3: "Server-Side Completion Signal" (Most Robust)

### Concept
Add explicit completion signal from server when turn finishes processing.

### How It Works

**Server Change (server/index.ts):**
After `/next-turn` command completes, server should:
```typescript
// In the command result handler (around line 599)
if (cliData.type === 'result') {
  // Check if this was a next-turn command
  if (isNextTurnCommand) {
    broadcastTurnComplete(); // Call the existing function!
  }
  // ... rest of result handling
}
```

**Client Change:**
The existing `turn_complete` handler (App.tsx:167-170) already handles this:
```typescript
if (data.type === 'turn_complete') {
  console.log('[WebSocket] Turn complete');
  setIsProcessingTurn(false);
}
```

**Modal Behavior:**
1. Show "Processing turn {processingTurnTarget}" from store
2. Update with each `events_update` showing latest action
3. When `turn_complete` received, show completion summary
4. Auto-close after 3 seconds

**What User Sees:**
- Real-time updates as actions complete
- Correct turn number
- Definitive completion signal
- Optional: Simplify UI (remove backgrounds, keep progress bar)

### Pros
- **Definitive completion** - Server knows when turn is truly done
- **Real-time accurate** - No guessing based on event count
- **Clean architecture** - Explicit lifecycle: start -> updates -> complete
- **Extensible** - Can send additional data (random events, win/lose status)

### Cons
- **Requires server change** - Need to detect next-turn commands
- **More complex server logic** - Need to track which command is executing
- **Server implementation detail:** Need to identify "next-turn" in CLI output

---

## Recommendation

**Start with Proposal 2 (Turn Number Sync)** as a quick fix, then implement **Proposal 3 (Server-Side Signal)** for a robust long-term solution.

**Why:**
1. Proposal 2 fixes the immediate bugs with minimal changes
2. Proposal 3 provides the proper architecture for turn processing
3. Can simplify UI (remove animations) as a separate pass

**Implementation Order:**
1. Fix turn number display bug (line 56, TurnProcessingModal.tsx)
2. Add event-count based completion as fallback
3. Implement server-side `turn_complete` broadcast
4. Optionally simplify modal visuals

---

## Key Files to Modify

**For Proposal 2:**
- `web/client/src/components/TurnProcessingModal.tsx` - Fix turn display (line 56)
- `web/client/src/App.tsx` - Add event-count completion detection
- `web/client/src/store/index.ts` - Review `processingTurnTarget` logic

**For Proposal 3:**
- `web/server/index.ts` - Call `broadcastTurnComplete()` after next-turn result
- `web/client/src/components/TurnProcessingModal.tsx` - Simplify or keep as-is

**Optional UI Simplification:**
- Remove background cycling (lines 74-83)
- Simplify spinner (lines 210-219)
- Keep progress bar and action display
