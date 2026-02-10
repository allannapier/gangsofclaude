# La Cosa Nostra - Claude Code Game

This project is an immersive text-based mafia game built entirely within Claude Code using agents, skills, and hooks.

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

1. **Skills** - Create game commands like `/heist`, `/recruit`, `/manage`
2. **Subagents** - Create specialized NPCs (Don, Consigliere, Caporegime)
3. **Hooks** - Automate game state persistence, notifications, validation

## Game Architecture

The game uses:
- **Skills** for player actions (commands)
- **Subagents** for NPC interactions and game systems
- **Hooks** for game state persistence and event handling
- **Memory** for persistent game state and player progress
