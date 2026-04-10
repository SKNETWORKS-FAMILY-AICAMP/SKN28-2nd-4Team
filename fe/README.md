# Frontend Workspace

This frontend uses `Bun` as the package manager and script runner.

## Commands

```bash
bun install
bun dev
```

```bash
bun run build
bun run lint
```

빠르게 확인할 때는 `bun install` 후 `bun dev` 로 바로 실행하면 된다.

## Current demo scope

- `Prediction Model` tab: model-facing dashboard frame
- `Operator Game` tab: interactive web-game dashboard with incidents, operator panel, and policy cards

## Notes

- Do not use `npm` for this workspace.
- Use Bun for installs, local dev, and build verification.
