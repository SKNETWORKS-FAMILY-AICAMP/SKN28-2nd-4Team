# be

FastAPI backend workspace for the retention strategy simulator.

## What This Service Hosts

- MDP engine runtime for turn-based scenario sessions
- Prediction engine API for churn/risk style scoring
- Replay logging for session inspection and frontend playback
- Repo-root context access for `docs/` and `scenarios/`

## Architecture Decision

- API layer: `FastAPI + Uvicorn`
- MDP engine: pure Python, scenario-driven, deterministic/stochastic hybrid runtime in-process
- Prediction engine: in-process adapter now, with a reserved hook for a trained artifact later
- Research/training workspace: keep model training and calibration in `../back_research`, then load the exported artifact from `be`
- Scenario and base context: load from repo root so backend and docs stay aligned

This split is intentional:

- The MDP engine is application logic, so keeping it in-process with FastAPI keeps latency and debugging simple.
- The prediction engine will usually be a tabular model, so an in-process adapter is enough until model size, latency, or concurrency says otherwise.
- If the prediction model becomes heavy, move only that part behind a dedicated model-serving layer while keeping the session engine in this service.

## Current Layout

```text
be/
├── src/be/app.py              # FastAPI entrypoint
├── src/be/engines/mdp.py      # Session runtime, scenario loading, replay
├── src/be/engines/prediction.py
├── src/be/schemas.py          # Request/response and engine contracts
├── src/be/settings.py         # Repo-root path and runtime settings
└── tests/test_smoke.py
```

## Commands

```bash
uv sync
uv run be
uv run pytest
uv run ruff check
uv run ty check
```

현재 디렉터리가 `be/` 라면 `uv run be` 로 개발 서버를 바로 띄울 수 있다.

## API Surface

- `GET /health`
- `GET /api/system/architecture`
- `GET /api/scenarios`
- `POST /api/session/start`
- `GET /api/session/{session_id}/state`
- `POST /api/session/{session_id}/turn`
- `GET /api/session/{session_id}/replay`
- `POST /api/prediction/churn`
- `POST /api/chat`

## LLM Runtime Notes

- `POST /api/chat` is designed for AI SDK UI text streaming from the frontend.
- The endpoint accepts AI SDK-style `messages` payloads and returns a plain text stream.
- If `BE_LLM_API_KEY` is not configured, the backend falls back to a mock operator response so the frontend can keep developing against a stable contract.

## Hosting Recommendation

Use one FastAPI service first.

- Local/dev: `uv run be`
- Container/prod: Uvicorn workers behind your normal ingress/reverse proxy
- Keep prediction in the same process until one of these becomes true:
  - model artifact is large
  - startup time becomes unacceptable
  - inference requires GPU or a different runtime
  - prediction traffic scales independently from session traffic

At that point, split prediction into a dedicated serving unit and keep this backend as the orchestration layer.
