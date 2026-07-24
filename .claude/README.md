# 🤖 Claude Code Configuration

**Purpose:** Claude Code AI assistant configuration - agents, skills, commands, hooks

---

## 📋 Overview

Thư mục `.claude/` chứa **tất cả Claude Code configuration**:
- Custom agents
- Custom commands (slash commands)
- Custom skills
- Git hooks
- Settings files

---

## 🎯 Directory Structure

```
.claude/
├── CLAUDE.md              # Project-specific instructions for AI
├── settings.json          # Main settings (permissions, hooks)
├── settings.local.json    # Local overrides
│
├── agents/                # Custom agents
│   ├── presentation-*.md  # Presentation-building agents
│   ├── workflow-*.md      # Workflow agents
│   └── time-agent.md      # Time display agent
│
├── commands/              # Custom slash commands
│   ├── time-command.md    # /time command
│   ├── weather-*.md       # Weather commands
│   └── workflows/         # Workflow commands
│
├── skills/                # Reusable skills
│   ├── agent-browser/     # Browser automation
│   ├── brand/             # Brand guidelines
│   ├── design-system/     # Design system skills
│   └── ...
│
├── hooks/                 # Git hooks
│   └── HOOKS-README.md    # Hooks documentation
│
└── rules/                 # Markdown rules
    ├── markdown-docs.md   # Documentation standards
    └── presentation.md    # Presentation rules
```

---

## 🔧 Settings Files

### settings.json
```json
{
  "permissions": { /* Permission rules */ },
  "hooks": { /* Git hooks */ },
  "allowedCommands": { /* Allowed bash commands */ }
}
```

### settings.local.json
```json
{
  // Local overrides (gitignored)
  // Example: Local development settings
}
```

---

## 🤖 Custom Agents

Agents là specialized AI helpers cho specific tasks:

| Agent | Purpose |
|-------|---------|
| `presentation-claude-code` | Update Claude Code best-practice presentation |
| `presentation-claude-gemini` | Update Claude-Gemini comparison presentation |
| `presentation-vibe-coding` | Update vibe-coding presentation |
| `workflow-*` | Various workflow research agents |

---

## 🔧 Custom Commands

Slash commands cho quick actions:

| Command | Purpose |
|---------|---------|
| `/time` | Display current time |
| `/weather` | Fetch weather data |
| `/workflows:*` | Workflow management commands |

---

## 🎯 Custom Skills

Skills là reusable prompts/actions:

| Skill | Purpose |
|-------|---------|
| `agent-browser` | Browser automation |
| `brand` | Brand voice & visual identity |
| `design-system` | Design system work |
| `gsap-*` | GSAP animation library skills |
| `scroll-world` | Scroll-based animations |
| `slides` | Presentation creation |
| `ui-styling` | UI component styling |
| `ui-ux-pro-max` | Advanced UX work |

---

## 🔗 Git Hooks

Automated actions on git events:
- **Pre-commit:** Run linting, tests
- **Pre-push:** Full test suite
- **Post-merge:** Update dependencies

See [`hooks/HOOKS-README.md`](hooks/HOOKS-README.md) for details.

---

## ⚠️ Gotchas

### 1. CLAUDE.md vs README.md
```markdown
# CLAUDE.md - For AI eyes only
# → Contains technical gotchas, architecture details
# → AI reads this first when working on project

# README.md - For humans
# → Public project description
# → Installation, features, tech stack
```

### 2. Settings Scope
```json
// settings.json - Commit to git
{
  "permissions": { /* Team-wide permissions */ }
}

// settings.local.json - Gitignored
{
  // Local development overrides
}
```

### 3. Skills vs Commands
```
Skills (/skill-name)    → Reusable workflows/prompts
Commands (/command)      → Quick actions, utilities
```

---

## 🔗 Related

- **Parent:** [`../`](../) - Project root
- **Project instructions:** [`CLAUDE.md`](../CLAUDE.md) - Main AI instructions
- **Quick reference:** [`../PROJECT-QUICK-REFERENCE.md`](../PROJECT-QUICK-REFERENCE.md) - AI quick start

---

## 📚 Claude Code Resources

- **Documentation:** https://claude.ai/code/docs
- **Skills:** https://claude.ai/code/docs/skills
- **Agents:** https://claude.ai/code/docs/agents

---

*Last updated: 2026-07-22*
