# CLAUDE.md

## Repo Scope

This is a monorepo.

- `fe/` is the frontend application.
- `be/` is the main backend service.
- `back_research/` is research and experimentation code.
- `docs/` contains the canonical project documentation.
- `scenarios/` contains scenario data and related assets.

## Shared Rules

- Read code and docs before changing behavior.
- Prefer the smallest correct change.
- Do not edit generated build output unless explicitly requested.
- Keep frontend structure aligned with `docs/04_frontend_requirements_structure.md`.
- Keep engine-facing behavior aligned with `docs/01_engine_technical_design.md` and `docs/02_project_description_and_plan.md`.
- Treat `docs/` as product and architecture authority before inventing new structure.

## Toolchain

- Python must use `uv`.
- Never use `pip`, `pip3`, `requirements.txt`, or Poetry.
- Use `uv add`, `uv sync`, and `uv run`.
- Frontend source edits belong in source files, not `fe/dist`.

## Tools And MCP

- For tool or MCP-server related work, ask the user first whether they want that check/process performed.
- Do not proactively inspect or modify global tool configuration just because a matching tool might be useful.
- In mixed macOS/Windows environments, identify the current device/OS first before checking config paths.
- Do not guess config locations from memory alone; check the official documentation for the relevant agent/tool first.
- Default inspection order is: project config first, then user config, then managed/system config only if needed and user-approved.
- If the user wants the check, then inspect the relevant project config and global config paths.
- If a required tool or MCP server is missing, explain what needs to be installed or configured before changing global state.
- Only set up or modify global configuration after the user explicitly asks for that setup.

## Git Workflow

- This repo uses `GitHub Flow`.
- Do not work directly on `master` unless the user explicitly requests it.
- Before starting work, check whether the user's requested scope matches the current branch.
- If the task is unrelated to the current branch, move the work to a separate branch before implementation.
- If the user appears to be branching off while having uncommitted or unpushed work for a different feature, ask:
  - `구현하려는 기능이 달라 보이는데, 혹시 push 한 다음에 진행하시는 건가요? 아니면 같은 기능 개발하시는건가요? 같은 기능이라면 동일한 branch 에서 진행해 주세요.`
- Commit messages must be written in Korean.

## Project Skills

Project-scoped skills are committed under `.agents/skills/` as the canonical shared skill source for this repo.

Installed skills:
- `fastapi`
- `gh-cli`
- `git-commit`
- `github-issues`
- `prd`
- `shadcn`

Use them when relevant.

Tooling note:
- `shadcn` is also configured as an OpenCode MCP tool in `opencode.json` for work under `fe/`.

각 에이전트별 개발 환경 대응:
- Codex: shared rules come from `AGENTS.md`; shared skills come from `.agents/skills/`; local `.codex/` config is personal and must not be committed.
- Claude Code: shared rules come from `CLAUDE.md`; if local skill adapters under `.claude/skills` are needed, generate them locally via sync instead of committing them.
- Gemini CLI: shared rules come from `GEMINI.md`; local `.gemini/` settings are personal and must not be committed.
- OpenCode: shared project tool config lives in `opencode.json`; user-specific config stays in the user's global config directory and must not be committed.
- Generated adapter directories like `.claude/`, `.factory/`, `.codex/`, `.gemini/`, and `.opencode/` are local-only and intentionally ignored.

Git branching note:
- No Git Flow branch skill is installed for this repo.
- Follow the GitHub Flow rules in this file directly.

Recovery commands if skills are not detected:
- `npx skills list --json`
- `npx skills experimental_sync -a '*' -y`

## Detailed Guide

For the full shared workspace guidance, see `docs/05_agent_workspace_guidelines.md`.
For MCP/config path heuristics and official docs, check `docs/05_agent_workspace_guidelines.md` first.
