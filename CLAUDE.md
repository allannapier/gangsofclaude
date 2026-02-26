# Gangs of Claude - Claude Code Game

This project is an immersive text-based mafia game built entirely within Claude Code using agents, skills, and hooks, featuring a companion-style web interface for rich gameplay.

Development Notes:

Always test changes in the UI by uisng chrome dev tools mcp
Always ensure changes have been compiled if required
Ensure the app is started using npm run dev from the web folder

Tests:

The web UI runs at http://localhost:5174

Do not commit changesd until you have tested them.

After changes we need to thoroughly test the UI, check the following

New Turn: Check the current turn number, click new turn and watch for progressing modal to appear, observe the tun numbers to make sure it progresses and the messages appearing are showing the progress as it happens during the turn. The modal should dissapear at the end

Action: click the action button and make sure we can manually type /status and it runs ok
Ensure we can select /attack and get the choices modal to decide what we are going to attack

Territories: Make sure the territories map is showing the correct territiotries for each family


## Claude Code Extension Features Guide

### Skills (`/skill-name`)

Skills extend Claude's capabilities with custom slash commands. Skills are defined in `SKILL.md` files.

**Creating a Skill:**

```bash
# Create skill directory
mkdir -p .claude/skills/my-skill

# Create SKILL.md with YAML frontmatter and markdown content
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What this skill does and when to use it
disable-model-invocation: true  # Optional: only user can invoke
user-invocable: true            # Optional: show in / menu
allowed-tools: Read, Grep       # Optional: restrict tools
context: fork                   # Optional: run in subagent
agent: Explore                  # Optional: which subagent type
---

Your skill instructions here. Use $ARGUMENTS to access user input.
EOF
```

**Skill Frontmatter Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Display name (defaults to directory name) |
| `description` | Recommended | Helps Claude decide when to use it |
| `argument-hint` | No | Hint for arguments like `[filename]` |
| `disable-model-invocation` | No | Set `true` to prevent auto-invocation |
| `user-invocable` | No | Set `false` to hide from `/` menu |
| `allowed-tools` | No | Tools available without permission |
| `model` | No | Model to use (sonnet/opus/haiku/inherit) |
| `context` | No | Set `fork` to run in subagent |
| `agent` | No | Subagent type when `context: fork` |
| `hooks` | No | Hooks scoped to skill lifecycle |

**String Substitutions:**
- `$ARGUMENTS` - All arguments passed to skill
- `$ARGUMENTS[0]`, `$ARGUMENTS[1]` - Specific arguments by index
- `$0`, `$1` - Shorthand for `$ARGUMENTS[N]`
- `${CLAUDE_SESSION_ID}` - Current session ID

**Skill Locations (priority order):**
1. `.claude/skills/<skill-name>/SKILL.md` - Project-specific
2. `~/.claude/skills/<skill-name>/SKILL.md` - Personal (all projects)
3. Plugin skills - namespaced as `plugin-name:skill-name`

**Supporting Files:**
Skills can include supporting files in their directory:
```
my-skill/
├── SKILL.md           # Required - main instructions
├── reference.md       # Optional - detailed reference
├── examples/          # Optional - usage examples
└── scripts/           # Optional - executable scripts
```

### Subagents

Subagents are specialized AI assistants that run in isolated contexts with custom prompts and tool access.

**Creating a Subagent:**

```bash
# Create subagent file
cat > .claude/agents/my-agent.md << 'EOF'
---
name: my-agent
description: When Claude should delegate to this subagent. Use "use proactively" to encourage automatic delegation.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
permissionMode: default
maxTurns: 50
skills:
  - api-conventions
memory: user
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---

Your system prompt for the subagent goes here.
EOF
```

**Subagent Frontmatter Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase letters and hyphens) |
| `description` | Yes | When to delegate - include "use proactively" |
| `tools` | No | Tools the subagent can use |
| `disallowedTools` | No | Tools to deny from inherited list |
| `model` | No | Model: sonnet/opus/haiku/inherit (default: inherit) |
| `permissionMode` | No | default/acceptEdits/delegate/dontAsk/bypassPermissions/plan |
| `maxTurns` | No | Maximum agentic turns before stopping |
| `skills` | No | Skills to preload into context |
| `mcpServers` | No | MCP servers available to subagent |
| `hooks` | No | Lifecycle hooks scoped to subagent |
| `memory` | No | Persistent memory: user/project/local |

**Subagent Locations (priority order):**
1. `--agents` CLI flag - Current session only
2. `.claude/agents/<name>.md` - Project-specific
3. `~/.claude/agents/<name>.md` - Personal (all projects)
4. Plugin agents - Where plugin is enabled

**Built-in Subagents:**
- `Explore` - Fast, read-only codebase exploration (Haiku)
- `Plan` - Research agent for planning (inherits model)
- `general-purpose` - Complex multi-step tasks (inherits model)
- `Bash` - Terminal commands in separate context
- `statusline-setup` - Configures status line (Sonnet)
- `claude-code-guide` - Claude Code feature questions (Haiku)

**Persistent Memory:**
When `memory` is enabled, the subagent gets:
- Instructions to read/write to memory directory
- First 200 lines of `MEMORY.md` injected
- Read/Write/Edit tools automatically enabled

Memory scopes:
- `user` - `~/.claude/agent-memory/<name>/` - Across all projects
- `project` - `.claude/agent-memory/<name>/` - Project-specific, version controlled
- `local` - `.claude/agent-memory-local/<name>/` - Project-specific, not version controlled

### Hooks

Hooks run shell commands at specific points in Claude Code's lifecycle.

**Hook Events:**

| Event | When it fires | Matcher input |
|-------|---------------|---------------|
| `SessionStart` | Session begins/resumes | startup/resume/clear/compact |
| `UserPromptSubmit` | User submits prompt | (none) |
| `PreToolUse` | Before tool executes | Tool name |
| `PermissionRequest` | Permission dialog appears | Tool name |
| `PostToolUse` | After tool succeeds | Tool name |
| `PostToolUseFailure` | After tool fails | Tool name |
| `Notification` | Claude sends notification | Notification type |
| `SubagentStart` | Subagent spawns | Agent type |
| `SubagentStop` | Subagent finishes | Agent type |
| `Stop` | Claude finishes responding | (none) |
| `TeammateIdle` | Teammate goes idle | (none) |
| `TaskCompleted` | Task marked complete | (none) |
| `PreCompact` | Before context compaction | manual/auto |
| `SessionEnd` | Session terminates | clear/logout/prompt_input_exit/other |

**Hook Types:**

1. **Command hooks** (`type: command`) - Run shell script
2. **Prompt hooks** (`type: prompt`) - Use Claude model to decide
3. **Agent hooks** (`type: agent`) - Spawn subagent for verification

**Hook Exit Codes:**
- `0` - Allow action (stdout added to context for SessionStart/UserPromptSubmit)
- `2` - Block action (stderr becomes feedback)
- Other - Allow action (stderr logged but not shown)

**Configuring Hooks:**

In `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if this command is safe. Return {\"ok\": true/false, \"reason\": \"...\"}"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all tests pass before stopping.",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

**Hook Input (JSON via stdin):**
```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

**Structured JSON Output:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Use rg instead of grep"
  }
}
```

**Hooks in Skills/Agents:**
Define hooks in frontmatter for component-scoped hooks:

```yaml
---
name: my-skill
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/format.sh"
---
```

**Hook Location Scope:**
| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Single project | Yes |
| `.claude/settings.local.json` | Single project | No |
| Plugin `hooks/hooks.json` | When plugin enabled | Yes |
| Skill/Agent frontmatter | While active | Yes |

## Development Workflow

1. **Skills** - Game commands (`/start-game`, `/status`, `/next-turn`)
2. **Agents** - 4 LLM-powered family agents for AI decisions
3. **Web UI** - React frontend with Bun/Hono server

## Game Architecture

The game uses **4 LLM-powered family agents** competing for territory control:
- **Server-side mechanics** (`web/server/mechanics.ts`) for combat, economy, territory
- **Claude CLI bridge** (`web/server/claude-bridge.ts`) spawns LLM via `--sdk-url` WebSocket
- **AI prompts** (`web/server/ai-prompts.ts`) build rich prompts per family with game state + personality
- **Fallback AI** — mechanical/random decisions if Claude CLI is unavailable
- **Game state** persisted in `.claude/game-state/save.json`

## Game-Specific Implementation

### Game State Storage

All game state is stored in `.claude/game-state/save.json`:

```json
{
  "turn": 4,
  "phase": "playing",
  "player": { "family": "Marinelli", ... },
  "families": { "Marinelli": { "territory": [...], "wealth": 500 }, ... },
  "events": [ ... ],
  "messages": [ ... ]
}
```

### Turn Processing System

Each turn follows this sequence:

1. Player clicks "Next Turn" in the web UI
2. Server collects economy (income/upkeep) for all families
3. Server spawns Claude CLI process with `--sdk-url`
4. For each AI family: sends prompt with personality + game state + available actions
5. LLM responds with JSON: `{action, target, reasoning, diplomacy, taunt}`
6. Server executes the action mechanics
7. Events broadcast to browser via WebSocket in real-time
8. Win condition checked after all families act

### Available Skills

Located in `.claude/skills/`:
- `start-game` - Initialize new game
- `status` - Display player stats and game state
- `next-turn` - Advance turn, all 4 AI families act

### AI Families

4 LLM-powered family agents defined in `.claude/agents/`:

- **`marinelli-family.md`** — Aggressive Traditionalists (attack-first, territorial expansion)
- **`rossetti-family.md`** — Business Diplomats (wealth accumulation, alliances)
- **`falcone-family.md`** — Cunning Manipulators (information warfare, long-game strategy)
- **`moretti-family.md`** — Honorable Traditionalists (defensive buildup, measured expansion)

## AI Behavior System

The game uses an advanced AI system with:
- **Short-term memory** for each family (3-move planning, grudge tracking)
- **16 scenario skills** for different game situations (desperation, defensive crisis, expansion, dominant threat, economic build)
- **Personality-driven behaviors** (aggressive, economic, cunning, honorable)

See `docs/AI_BEHAVIOR_IMPROVEMENTS_SUMMARY.md` for details.

### Web UI Integration

The web UI (in `/web`) communicates via WebSocket:

- **Server:** Bun + Hono (port 3456) — HTTP API + WebSocket handlers
- **Client:** React + Zustand + Vite (port 5174)

**Key server files:**
- `web/server/index.ts` - Main server, HTTP API, WebSocket handlers
- `web/server/mechanics.ts` - Game mechanics (combat, economy, territory)
- `web/server/claude-bridge.ts` - Spawns Claude CLI via `--sdk-url` for LLM AI
- `web/server/ai-prompts.ts` - Builds rich prompts per AI family
- `web/server/dev.ts` - Dev server entry

**Key client files:**
- `web/client/src/App.tsx` - Root component
- `web/client/src/store/index.ts` - Zustand state management
- `web/client/src/components/` - ActionPanel, FamilyOverview, TerritoryGrid, TurnModal, EventLog
