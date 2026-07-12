# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

It holds **project reference** (overview, stack, commands, deployment) and an index of the behavioral rules under [`.claude/rules/`](.claude/rules/). Those rules load **on-demand** based on the file you're editing (each carries a `paths` glob), so only the relevant convention enters context — except [`.claude/rules/mandatory-workflow.md`](.claude/rules/mandatory-workflow.md), which has no `paths` gate and is always loaded. See the [Project rules](#project-rules) table below.

1. Quy tắc "Phê bình trước" (Critique-First)

Mặc định của mô hình là xác nhận — cần chủ động ghi đè.


Trước khi đồng ý với bất kỳ nhận định, giải pháp, hoặc đánh giá nào của
người dùng, Claude PHẢI tự kiểm tra tính đúng đắn trước.
Nếu phát hiện sai sót, thiếu sót, hoặc giả định chưa được kiểm chứng —
nói ra điều đó trước, trước khi đưa ra bất kỳ sự đồng thuận nào.
Không đồng ý chỉ vì người dùng tự tin hoặc vì đó là câu trả lời "dễ chịu"
hơn về mặt hội thoại.
Nếu sau khi kiểm tra kỹ, nhận định của người dùng thực sự đúng — được
phép xác nhận, nhưng phải nêu rõ đã kiểm tra điểm nào để tránh trông
giống như đồng ý theo quán tính.
Áp dụng cho: đánh giá code, quyết định kiến trúc, chẩn đoán lỗi, ước tính
effort, và các tuyên bố về hành vi hệ thống.


Không áp dụng cho các lựa chọn chủ quan/sở thích cá nhân (đặt tên biến,
gu code style không ảnh hưởng đúng-sai) — ở đó không cần phản bác.


2. Thứ tự ưu tiên tìm kiếm code

Thứ tự bắt buộc, không được đảo:


MCP code graph trước — dùng graph tool (call graph, dependency graph,
symbol references) để định vị mã liên quan.
Chỉ dùng grep/ripgrep nếu graph không trả về kết quả (symbol không có
trong graph, file chưa index, hoặc cần tìm chuỗi văn bản tự do như
comment/TODO/log message).
Chỉ đọc code (view/open file) sau khi đã biết vị trí chính xác từ
bước 1 hoặc 2 — không đọc lan man để "khám phá".


Lý do: grep-first bỏ lỡ ngữ cảnh cấu trúc — ai gọi hàm này, hàm này phụ
thuộc gì, phạm vi ảnh hưởng khi sửa. Graph-first giữ được ngữ cảnh đó ngay
từ đầu, grep chỉ là phương án dự phòng.


3. Bảo vệ Production — LUẬT, không phải gợi ý

Đây là điểm dừng cứng (hard stop), không phải cảnh báo mềm. Claude không
được thực thi các lệnh sau trong bất kỳ ngữ cảnh nào được xác định là môi
trường production, dù người dùng có yêu cầu trực tiếp:


prisma migrate reset
*.deleteMany(...) (hoặc tương đương ORM khác) khi target là DB production
rm *.db, rm -rf nhắm vào thư mục data/db
Bất kỳ lệnh nào xóa/reset toàn bộ dữ liệu, drop database, hoặc drop table
trên production
Ghi đè trực tiếp biến môi trường production (.env.production,
connection string production) mà không qua review


Quy trình khi gặp:


Nếu lệnh nằm trong danh sách trên VÀ ngữ cảnh là production → từ chối
thực thi, giải thích rõ vì sao, và đề xuất phương án an toàn hơn (dry-run,
backup trước, chạy trên staging).
Nếu không chắc chắn đây có phải production hay không → coi như production
cho đến khi có xác nhận rõ ràng.
Không tự "diễn giải lại" yêu cầu để hợp lý hóa việc thực thi — danh sách
này là tuyệt đối.



4. Phát hiện góc độ nội dung (Content Angle Detection)

Chạy ngầm, không làm gián đoạn luồng công việc chính.


Trong quá trình trò chuyện, nếu Claude nhận thấy một khoảnh khắc có thể
làm chất liệu bài đăng hay (ví dụ: một insight bất ngờ, một debug session
ly kỳ, một quyết định kiến trúc có tranh luận thú vị, một sai lầm điển
hình đáng rút kinh nghiệm) — ghi nhận lại ngắn gọn.
KHÔNG dừng công việc chính để viết bài ngay. Chỉ đánh dấu (ví dụ: một dòng
cuối phản hồi, dạng 💡 content angle: ...) khi phù hợp và không gây rối.
Khi người dùng chủ động hỏi "có gì hay để viết bài không", tổng hợp lại
các khoảnh khắc đã đánh dấu trong phiên làm việc.
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a best practices repository for Claude Code configuration, demonstrating patterns for skills, subagents, hooks, and commands. It serves as a reference implementation rather than an application codebase.

## Key Components

### Weather System (Example Workflow)
A demonstration of two distinct skill patterns via the **Command → Agent → Skill** architecture:
- `/weather-orchestrator` command (`.claude/commands/weather-orchestrator.md`): Entry point — asks user for C/F, invokes agent, then invokes SVG skill
- `weather-agent` agent (`.claude/agents/weather-agent.md`): Fetches temperature using its preloaded `weather-fetcher` skill (agent skill pattern)
- `weather-fetcher` skill (`.claude/skills/weather-fetcher/SKILL.md`): Preloaded into agent — instructions for fetching temperature from Open-Meteo
- `weather-svg-creator` skill (`.claude/skills/weather-svg-creator/SKILL.md`): Skill — creates SVG weather card, writes `orchestration-workflow/weather.svg` and `orchestration-workflow/output.md`

Two skill patterns: agent skills (preloaded via `skills:` field) vs skills (invoked via `Skill` tool). See `orchestration-workflow/orchestration-workflow.md` for the complete flow diagram.

### Skill Definition Structure
Skills in `.claude/skills/<name>/SKILL.md` use YAML frontmatter:
- `name`: Display name and `/slash-command` (defaults to directory name)
- `description`: When to invoke (recommended for auto-discovery)
- `argument-hint`: Autocomplete hint (e.g., `[issue-number]`)
- `disable-model-invocation`: Set `true` to prevent automatic invocation
- `user-invocable`: Set `false` to hide from `/` menu (background knowledge only)
- `allowed-tools`: Tools allowed without permission prompts when skill is active
- `model`: Model to use when skill is active
- `context`: Set to `fork` to run in isolated subagent context
- `agent`: Subagent type for `context: fork` (default: `general-purpose`)
- `hooks`: Lifecycle hooks scoped to this skill

### Presentation System
See `.claude/rules/presentation.md` — presentation work is delegated per-presentation to `presentation-vibe-coding` (for `presentation/vibe-coding-to-agentic-engineering/`) or `presentation-claude-gemini` (for `presentation/2026-04-25-gdg-kolachi-cli-claude-code-gemini/`).

### Hooks System
Cross-platform sound notification system in `.claude/hooks/`:
- `scripts/hooks.py`: Main handler for Claude Code hook events
- `config/hooks-config.json`: Shared team configuration
- `config/hooks-config.local.json`: Personal overrides (git-ignored)
- `sounds/`: Audio files organized by hook event (generated via ElevenLabs TTS)

Hook events configured in `.claude/settings.json`: PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, SubagentStart, SubagentStop, PreCompact, SessionStart, SessionEnd, Setup, PermissionRequest, TeammateIdle, TaskCompleted, ConfigChange.

Special handling: git commits trigger `pretooluse-git-committing` sound.

## Critical Patterns

### Subagent Orchestration
Subagents **cannot** invoke other subagents via bash commands. Use the Agent tool (renamed from Task in v2.1.63; `Task(...)` still works as an alias):
```
Agent(subagent_type="agent-name", description="...", prompt="...", model="haiku")
```

Be explicit about tool usage in subagent definitions. Avoid vague terms like "launch" that could be misinterpreted as bash commands.

### Subagent Definition Structure
Subagents in `.claude/agents/*.md` use YAML frontmatter:
- `name`: Subagent identifier
- `description`: When to invoke (use "PROACTIVELY" for auto-invocation)
- `tools`: Comma-separated allowlist of tools (inherits all if omitted). Supports `Agent(agent_type)` syntax
- `disallowedTools`: Tools to deny, removed from inherited or specified list
- `model`: Model alias: `haiku`, `sonnet`, `opus`, or `inherit` (default: `inherit`)
- `permissionMode`: Permission mode (e.g., `"acceptEdits"`, `"plan"`, `"bypassPermissions"`)
- `maxTurns`: Maximum agentic turns before the subagent stops
- `skills`: List of skill names to preload into agent context
- `mcpServers`: MCP servers for this subagent (server names or inline configs)
- `hooks`: Lifecycle hooks scoped to this subagent (all hook events are supported; `PreToolUse`, `PostToolUse`, and `Stop` are the most common)
- `memory`: Persistent memory scope — `user`, `project`, or `local` (see `reports/claude-agent-memory.md`)
- `background`: Set to `true` to always run as a background task
- `effort`: Effort level override: `low`, `medium`, `high`, `max` (default: inherits from session)
- `isolation`: Set to `"worktree"` to run in a temporary git worktree
- `color`: CLI output color for visual distinction

### Configuration Hierarchy
1. **Managed** (`managed-settings.json` / MDM plist / Registry): Organization-enforced, cannot be overridden
2. Command line arguments: Single-session overrides
3. `.claude/settings.local.json`: Personal project settings (git-ignored)
4. `.claude/settings.json`: Team-shared settings
5. `~/.claude/settings.json`: Global personal defaults
6. `hooks-config.local.json` overrides `hooks-config.json`

### Disable Hooks
Set `"disableAllHooks": true` in `.claude/settings.local.json`, or disable individual hooks in `hooks-config.json`.

## Answering Best Practice Questions

When the user asks a Claude Code best practice question, **always search this repo first** (`best-practice/`, `reports/`, `tips/`, `implementation/`, and `README.md`) before relying on training knowledge or external sources. This repo is the authoritative source — only fall back to external docs or web search if the answer is not found here.

## Workflow Best Practices

From experience with this repository:

- Keep CLAUDE.md under 200 lines per file for reliable adherence
- `.claude/rules/*.md` with `paths:` YAML frontmatter are lazy-loaded only when Claude touches matching files; without frontmatter they load into every session like CLAUDE.md
- Use commands for workflows instead of standalone agents
- Create feature-specific subagents with skills (progressive disclosure) rather than general-purpose agents
- Perform manual `/compact` at ~50% context usage
- Start with plan mode for complex tasks
- Use human-gated task list workflow for multi-step tasks
- Break subtasks small enough to complete in under 50% context

### Debugging Tips

- Use `/doctor` for diagnostics
- Run long-running terminal commands as background tasks for better log visibility
- Use browser automation MCPs (Claude in Chrome, Playwright, Chrome DevTools) for Claude to inspect console logs
- Provide screenshots when reporting visual issues

## Git Commit Rules

When committing changes, **create separate commits per file**. Do NOT bundle multiple file changes into a single commit. Each file gets its own commit with a descriptive message specific to that file's changes.

For example, if `README.md`, `best-practice/claude-subagents.md`, and a skill file all changed:
- Commit 1: `git add README.md` → commit with README-specific message
- Commit 2: `git add best-practice/claude-subagents.md` → commit with subagents-doc-specific message
- Commit 3: `git add .claude/skills/weather-fetcher/SKILL.md` → commit with skill-specific message

This makes the git history cleaner and easier to review, revert, or cherry-pick individual changes.

## Documentation

See `.claude/rules/markdown-docs.md` for documentation standards. Key docs:
- `best-practice/claude-subagents.md`: Subagent frontmatter, hooks, and repository agents
- `best-practice/claude-commands.md`: Slash command patterns and built-in command reference
- `orchestration-workflow/orchestration-workflow.md`: Weather system flow diagram
