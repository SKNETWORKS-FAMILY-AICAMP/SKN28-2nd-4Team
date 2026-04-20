# be

FastAPI backend workspace for the retention strategy simulator.

## What This Service Hosts

- Live prediction session bootstrap for the frontend simulator
- Random-event driven churn inference over a fixed customer cohort
- Business-state composition that translates company-level decisions into customer-level model features
- Repo-root context access for `docs/` and `scenarios/`

## Architecture Decision

- API layer: `FastAPI + Uvicorn`
- Prediction engine: in-process XGBoost inference backed by exported research artifacts
- Business model: feature-space composer that maps company-level policy decisions onto the trained customer-level serving schema
- Random events and incidents: loaded from one scenario source and sampled with a stored RNG state
- Research/training workspace: keep model training and calibration in `../back_research`, then load the exported artifact from `be`

This split is intentional:

- The churn model is lightweight enough to stay in-process for the MVP.
- The frontend owns the operator LLM and UI state, while the backend owns random events and deterministic live inference.
- If the prediction artifact becomes heavy later, move only the inference layer without changing the FE contracts.

## Current Layout

```text
be/
├── src/be/app.py              # FastAPI entrypoint
├── src/be/prediction.py       # Session store, event sampling, live inference
├── src/be/business_model.py   # Cohort feature composition and loss translation
├── src/be/simulation_scenario.json
├── src/be/schemas.py          # Request/response and simulator contracts
├── src/be/settings.py         # Repo-root path and runtime settings
└── tests/test_smoke.py
```

## Commands

```bash
uv sync
uv run be
uv run uvicorn be.app:app --host 127.0.0.1 --port 8000
uv run pytest
uv run ruff check
uv run ty check
```

현재 디렉터리가 `be/` 라면:

- 개발 서버(reload): `uv run be`
- 고정 프로세스 실행: `uv run uvicorn be.app:app --host 127.0.0.1 --port 8000`

## API Surface

- `GET /health`
- `GET /api/system/architecture`
- `POST /api/prediction/session/start`
- `POST /api/prediction/churn`

## Live Inference Notes

- The backend loads `back_research/myungbin/Ecommerce_Customer/artifacts/model_xgb_v2_no_customer_id.pkl` directly.
- The backend also loads `model_xgb_v2_no_customer_id_schema.json` and validates that the serving schema matches the exported model feature order.
- The backend loads the cohort CSV, samples one customer-level row, and then lets the business layer translate company-level policy decisions into customer-level feature shifts before inference.
- User loss is not taken from a hard threshold; it is computed from `predict_proba` via a calibrated expected-loss rate.

## Hosting Recommendation

Use one FastAPI service first.

- Local/dev: `uv run be`
- Local/dev without reload: `uv run uvicorn be.app:app --host 127.0.0.1 --port 8000`
- Container/prod: Uvicorn workers behind your normal ingress/reverse proxy
- Keep live inference in the same process while this remains a small MVP/P0C.
- The operator LLM should stay in the frontend and call the selected strategy model directly.
