from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _env_flag(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(name: str) -> tuple[str, ...]:
    value = os.getenv(name, "")
    return tuple(part.strip() for part in value.split(",") if part.strip())


@dataclass(frozen=True)
class Settings:
    service_name: str
    service_version: str
    repo_root: Path
    docs_dir: Path
    scenario_dir: Path
    replay_dir: Path
    prediction_model_path: str | None
    cors_origins: tuple[str, ...]
    llm_api_key: str | None
    llm_base_url: str
    llm_model: str
    llm_system_prompt: str
    llm_timeout_seconds: float
    llm_allow_mock_fallback: bool


def load_settings() -> Settings:
    repo_root = _repo_root()
    scenario_dir = Path(os.getenv("BE_SCENARIO_DIR", repo_root / "scenarios"))
    replay_dir = Path(os.getenv("BE_REPLAY_DIR", repo_root / "be" / "runtime" / "replays"))
    return Settings(
        service_name="Retention Strategy Backend",
        service_version="0.1.0",
        repo_root=repo_root,
        docs_dir=repo_root / "docs",
        scenario_dir=scenario_dir,
        replay_dir=replay_dir,
        prediction_model_path=os.getenv("BE_PREDICTION_MODEL_PATH"),
        cors_origins=_env_csv("BE_CORS_ORIGINS"),
        llm_api_key=os.getenv("BE_LLM_API_KEY"),
        llm_base_url=os.getenv("BE_LLM_BASE_URL", "https://api.openai.com/v1"),
        llm_model=os.getenv("BE_LLM_MODEL", "gpt-4o-mini"),
        llm_system_prompt=os.getenv(
            "BE_LLM_SYSTEM_PROMPT",
            (
                "You are the operator assistant for a retention strategy simulator. "
                "Keep responses concise, action-oriented, and focused on protecting high-risk cohorts, "
                "operational safety, and measurable next steps."
            ),
        ),
        llm_timeout_seconds=float(os.getenv("BE_LLM_TIMEOUT_SECONDS", "20")),
        llm_allow_mock_fallback=_env_flag("BE_LLM_ALLOW_MOCK_FALLBACK", True),
    )


settings = load_settings()
