# back_research

Python research workspace managed with `uv`.

각 연구 디렉터리는 자체 `notebooks/`, `datasets/`를 기준으로 상대 경로를 사용한다.

## Commands

```bash
uv sync
uv run jupyter lab
uv run ty check
```

현재 디렉터리가 `back_research/` 라면 `.venv` 는 이 디렉터리 아래에서 관리된다.
