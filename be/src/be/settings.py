from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


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
    prediction_model_path: Path
    prediction_dataset_path: Path
    prediction_schema_path: Path
    simulation_scenario_path: Path
    prediction_calibration_factor: float
    default_random_seed: int
    cors_origins: tuple[str, ...]


def load_settings() -> Settings:
    repo_root = _repo_root()
    scenario_dir = Path(os.getenv("BE_SCENARIO_DIR", repo_root / "scenarios"))
    replay_dir = Path(
        os.getenv("BE_REPLAY_DIR", repo_root / "be" / "runtime" / "replays")
    )
    default_model_path = (
        repo_root
        / "back_research"
        / "myungbin"
        / "Ecommerce_Customer"
        / "artifacts"
        / "model_xgb_v2_no_customer_id.pkl"
    )
    default_dataset_path = (
        repo_root
        / "back_research"
        / "myungbin"
        / "Ecommerce_Customer"
        / "datasets"
        / "churn_preprocessed.csv"
    )
    default_schema_path = (
        repo_root
        / "back_research"
        / "myungbin"
        / "Ecommerce_Customer"
        / "artifacts"
        / "model_xgb_v2_no_customer_id_schema.json"
    )
    default_scenario_path = repo_root / "be" / "src" / "be" / "simulation_scenario.json"

    return Settings(
        service_name="Retention Strategy Backend",
        service_version="0.2.0",
        repo_root=repo_root,
        docs_dir=repo_root / "docs",
        scenario_dir=scenario_dir,
        replay_dir=replay_dir,
        prediction_model_path=Path(
            os.getenv("BE_PREDICTION_MODEL_PATH", default_model_path)
        ),
        prediction_dataset_path=Path(
            os.getenv("BE_PREDICTION_DATASET_PATH", default_dataset_path)
        ),
        prediction_schema_path=Path(
            os.getenv("BE_PREDICTION_SCHEMA_PATH", default_schema_path)
        ),
        simulation_scenario_path=Path(
            os.getenv("BE_SIMULATION_SCENARIO_PATH", default_scenario_path)
        ),
        prediction_calibration_factor=float(
            os.getenv("BE_PREDICTION_CALIBRATION_FACTOR", "0.22")
        ),
        default_random_seed=int(os.getenv("BE_DEFAULT_RANDOM_SEED", "42")),
        cors_origins=_env_csv("BE_CORS_ORIGINS"),
    )


settings = load_settings()
