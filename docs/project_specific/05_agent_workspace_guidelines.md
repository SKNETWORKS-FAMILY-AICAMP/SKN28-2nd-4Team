# Agent Workspace Guidelines

## Purpose

This document defines the shared working rules for repository-level coding agents in this monorepo.

Target agents:
- Claude Code via `CLAUDE.md`
- Codex via `AGENTS.md`
- Gemini CLI via `GEMINI.md`

The goal is to keep all agents aligned on:
- repository structure
- toolchain rules
- editing boundaries
- documentation authority
- project-scoped skills available in this workspace

## Monorepo Units

- `fe/`: Vite + React frontend. Tailwind v4 and shadcn/ui are used here.
- `be/`: main backend service. Python environment must be managed with `uv`.
- `back_research/`: research and experiment code. Python environment must be managed with `uv`.
- `docs/`: canonical project documentation and requirements.
- `docs/project_specific/`: project-internal standards, technical design, and workspace guidance.
- `docs/prds/`: product requirements and deliverable requirement documents.
- `scenarios/`: simulation/scenario data and related assets.

## Shared Working Rules

- Work from repository facts first. Read code and docs before changing behavior.
- Prefer the smallest correct change.
- Do not edit generated or build output unless the task explicitly requires it.
- Do not treat visual mood words as product requirements when `docs/` already defines information structure.
- Keep frontend work aligned with `docs/prds/04_frontend_requirements_structure.md`.
- Keep engine-facing behavior aligned with `docs/project_specific/01_engine_technical_design.md` and `docs/prds/02_project_description_and_plan.md`.
- When changing docs, preserve the repo's direct and structured writing style.
- Do not invent new architecture or workflows when existing docs already define them.
- PRD documents under `docs/prds/` must be written in Korean.
- `README.md` files in the repository must be maintained as Markdown documents.

## Toolchain Rules

- Python: always use `uv`.
- Never use `pip`, `pip3`, `requirements.txt`, or Poetry for project package management.
- Run Python with `uv run ...`.
- Add Python dependencies with `uv add ...`.
- Install Python dependencies with `uv sync`.
- Frontend changes belong in `fe/src` and related source files, not `fe/dist`.
- For Git operations, avoid destructive commands unless explicitly requested.

## Tools And MCP Policy

- For tool or MCP-server related work, ask the user first whether they want that check or setup process performed.
- Do not proactively inspect or change global tool configuration just because a task might benefit from an MCP server.
- In mixed macOS and Windows environments, identify the current device and OS first.
- Do not guess configuration paths from memory alone; consult the official documentation for the relevant agent or tool before inspecting files.
- Default inspection order is: project config, then user config, then managed/system config only if needed and approved.
- When the user opts in, inspect both project-level config and global config paths as needed.
- If the required tool or MCP server is not configured, explain what dependency or configuration is missing before making changes.
- Only install or edit global tool configuration after the user explicitly approves that setup.

## MCP Config Heuristic

Use this heuristic whenever a task involves MCP server setup, debugging, or configuration discovery.

1. Identify the current device/OS first.
2. Check the official documentation for the relevant agent/tool first.
3. Inspect project config before user config.
4. Inspect managed/system config only when the task requires it and the user has approved that check.
5. If the needed MCP server is missing, explain what to install or configure before changing global state.

Current workspace note:
- This session is running on macOS (`darwin`).
- Do not assume all collaborators are on macOS; the repo may also be used from Windows.

## Official Config Map

Use the official docs below before checking paths.

| Tool / Agent | Official docs to check first | View first in repo | Then view user config | Managed/system config if needed |
|---|---|---|---|---|
| Claude Code | `https://docs.anthropic.com/en/docs/claude-code/settings` and `https://docs.anthropic.com/en/docs/claude-code/mcp` | `.mcp.json` for project-shared MCP servers, `.claude/settings.json` for project settings | `~/.claude.json` for user/local MCP config, `~/.claude/settings.json` for user settings | macOS: `/Library/Application Support/ClaudeCode/managed-settings.json` and `managed-mcp.json`; Windows: policy/managed paths from the official settings docs |
| Codex | `https://developers.openai.com/codex/config-basic` and `https://developers.openai.com/codex/mcp` | `.codex/config.toml` | `~/.codex/config.toml` | Unix official doc explicitly lists `/etc/codex/config.toml`; if Windows-specific admin config is needed, consult the current official Codex docs before inspecting |
| Gemini CLI | `https://geminicli.com/docs/reference/configuration/` and `https://geminicli.com/docs/tools/mcp-server/` | `.gemini/settings.json` | `~/.gemini/settings.json` | macOS: `/Library/Application Support/GeminiCli/settings.json`; Windows: `C:\ProgramData\gemini-cli\settings.json`; defaults file paths are listed in the same official docs |
| OpenCode | `https://opencode.ai/docs/config/` and `https://opencode.ai/docs/mcp-servers/` | `opencode.json` in project root, then `.opencode/` directories if relevant | `~/.config/opencode/opencode.json` and `~/.config/opencode/` directories | macOS: `/Library/Application Support/opencode/`; Windows: `%ProgramData%\opencode` |

Interpretation rule:
- Project config is the first place to look for repo-shared MCP setup.
- User config is the next place to look for per-developer setup.
- Managed/system config is only for organization-controlled or machine-wide policy and should not be edited unless the user explicitly asks.

## Git Workflow Rules

- This repository uses `GitHub Flow`, not `Git Flow`.
- Do not work directly on `master` unless the user explicitly requests it.
- Before starting implementation work, check the user's request and scope against the current branch context.
- If the requested work is unrelated to the current branch's apparent purpose, create or move to a separate branch before implementation.
- If there are uncommitted or unpushed changes and the user appears to be branching into a different feature, stop and ask for clarification before proceeding.
- Use this clarification pattern when the scope looks different:
  - `구현하려는 기능이 달라 보이는데, 혹시 push 한 다음에 진행하시는 건가요? 아니면 같은 기능 개발하시는건가요? 같은 기능이라면 동일한 branch 에서 진행해 주세요.`
- Commit messages must be written in Korean.
- Unless the user explicitly asks otherwise, avoid mixing unrelated work in a single branch.

## Documentation Authority

Use these docs as source-of-truth when relevant:

- `docs/project_specific/01_engine_technical_design.md`: engine structure, packets, state, reward, and policy comparison
- `docs/prds/02_project_description_and_plan.md`: product intention and project framing
- `docs/prds/03_final_deliverables_spec.md`: deliverable expectations
- `docs/prds/04_frontend_requirements_structure.md`: frontend information architecture and interaction ordering
- `docs/project_specific/05_agent_workspace_guidelines.md`: shared agent rules in this repo

## Project-Scoped Skills

These skills were identified from the `skills_to_install` browser tabs and installed at project scope.

Installed location:
- `.agents/skills/`

Canonical storage rule:
- Commit `.agents/skills/` as the shared project skill source.
- Do not commit generated per-agent adapter directories such as `.claude/skills` or `.factory/skills`.
- If a local agent needs adapter directories, generate them on that machine with the skills CLI sync process.

Verification command:
- `npx skills list --json`

Current installed skills:

| Skill | Source | Use For |
|---|---|---|
| `fastapi` | `fastapi/fastapi` | FastAPI best practices and conventions for backend API work |
| `gh-cli` | `github/awesome-copilot` | GitHub CLI workflows for repos, issues, PRs, Actions, and releases |
| `git-commit` | `github/awesome-copilot` | Commit generation and execution workflows. In this repo, commit messages must be in Korean |
| `github-issues` | `github/awesome-copilot` | Creating and managing GitHub issues with structured workflows |
| `prd` | `github/awesome-copilot` | Writing structured Product Requirements Documents |
| `shadcn` | `shadcn/ui` | shadcn/ui usage guidance and component workflow knowledge for frontend work |

Git branching note:
- `git-flow-branch-creator` was removed because it conflicts with this repo's GitHub Flow policy.
- A search for GitHub Flow-specific skills did not surface a strong, well-adopted replacement worth installing as project standard.
- Branching policy remains documented in the agent instruction files and should be followed directly.

Tooling note:
- `shadcn` is installed as a project skill under `.agents/skills/`.
- `shadcn` is also configured as an OpenCode MCP tool in `opencode.json`, pointing at `fe/`.
- The skill and the MCP tool are different layers: the skill provides workflow guidance, while the MCP tool provides live component tooling.

## 각 에이전트별 개발 환경 대응

- Codex: shared repo rules come from `AGENTS.md`; shared project skills come from `.agents/skills/`; local `.codex/` config is personal and must not be committed.
- Claude Code: shared repo rules come from `CLAUDE.md`; shared project skills source is `.agents/skills/`; local `.claude/skills/` adapters may be created by sync on each machine and must not be committed.
- Gemini CLI: shared repo rules come from `GEMINI.md`; shared project skills source is `.agents/skills/`; local `.gemini/` config is personal and must not be committed.
- OpenCode: shared repo tool config comes from `opencode.json`; shared project skills source is `.agents/skills/`; local `.opencode/` state is personal and must not be committed.
- Common rule: generated or personal agent folders must not be mixed into the repository unless they are explicitly designated as shared project assets. In this repo, the shared project asset is `.agents/skills/`.

## Skills Scope Decision

For this repository, `.agents/skills/` is the canonical shared project skill layer.

Reason:
- The skills are stored under `.agents/skills/`, which is the shared workspace-level location created by the skills CLI.
- Some agents may additionally generate local adapter directories on each machine.
- Those generated adapter directories are local tooling artifacts and are not the repository source of truth.

That means the repo should commit `.agents/skills/`, while per-agent adapter directories are generated locally only when needed.

## Recovery and Sync

If an agent does not detect project-scoped skills correctly on a specific machine, use one of these commands:

- Sync all installed project skills to all supported agents:
  - `npx skills experimental_sync -a '*' -y`
- Reinstall a package to all supported agents explicitly:
  - `npx skills add github/awesome-copilot --skill github-issues gh-cli prd git-commit -a '*' -y`
  - `npx skills add fastapi/fastapi --skill fastapi -a '*' -y`
  - `npx skills add https://github.com/shadcn/ui --skill shadcn -a '*' -y`

## Agent Behavior Notes

- This repository's main remote is GitLab. GitHub-specific skills should only be used when the task actually targets GitHub workflows.
- For frontend design work, follow the repo docs before style exploration.
- For backend/API work, prefer explicit contracts and packet shapes over framework-default guessing.
- For monorepo work, keep changes scoped to the correct unit unless the task explicitly spans multiple units.
