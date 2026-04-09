# Backend Architecture

## Purpose

This backend hosts two different engine types:

- an MDP-style retention decision engine for turn-based simulation
- a prediction engine for churn or risk scoring

They should not be treated the same way.

## Recommended Build Split

### 1. MDP Engine

Build this in `be/` as pure Python domain logic.

- Why: it is the product runtime, not a research artifact
- Inputs: scenario package, current state, chosen action, revealed event
- Outputs: next state, reward breakdown, shadow-policy comparison, replay packet
- Storage shape: JSON scenario packages at repo root and JSONL replay output

Recommended implementation choices:

- typed Python modules
- Pydantic request/response contracts at the API boundary
- scenario definitions in JSON so product and docs stay aligned
- replay logging in JSONL for append-friendly storage

### 2. Prediction Engine

Build and calibrate this in `back_research/`, then serve it from `be/`.

- Why: training/calibration changes faster than service code
- Expected model family: tabular churn/risk model
- Good initial choices: logistic regression, XGBoost, or LightGBM
- Serving contract: one stable prediction adapter inside `be/`

Recommended lifecycle:

1. Train and validate in `back_research/`
2. Export a versioned artifact
3. Load that artifact in `be/` through a stable adapter
4. Return predictions plus top drivers, not raw model internals

## Hosting Recommendation

Start with one FastAPI service.

- MDP engine and lightweight prediction inference can run in the same process
- this keeps integration with the frontend simple
- this avoids premature distributed complexity

Split only when needed.

Move prediction to a dedicated model-serving layer if:

- the artifact becomes large
- inference latency is materially higher than the session engine
- prediction requires GPU or specialized dependencies
- prediction traffic scales differently from gameplay traffic

If that happens, keep `be/` as the orchestration API and call the prediction server over HTTP or gRPC.

## Base Context Source

The backend should treat the repo root as shared context.

- `docs/` is the design and contract source
- `scenarios/` is the runtime scenario package source
- `be/runtime/replays/` is the session log output location

This is why the backend resolves paths from the monorepo root instead of only from `be/`.
