from __future__ import annotations

from be.schemas import PredictionRequest, PredictionResponse


class PredictionService:
    def __init__(self, model_path: str | None) -> None:
        self._model_path = model_path

    def score(self, request: PredictionRequest) -> PredictionResponse:
        score = (
            0.28 * (1.0 - request.retention_score)
            + 0.18 * (1.0 - request.lock_in_score)
            + 0.16 * (1.0 - request.trust_score)
            + 0.14 * request.incident_pressure
            + 0.10 * request.competitive_pressure
            + 0.08 * request.budget_stress
            + 0.06 * request.action_fatigue
            + 0.08 * (1.0 - request.paying_ratio)
        )
        churn_probability = max(0.0, min(1.0, round(score, 4)))
        retention_probability = round(1.0 - churn_probability, 4)
        if churn_probability >= 0.65:
            risk_band = "high"
        elif churn_probability >= 0.40:
            risk_band = "medium"
        else:
            risk_band = "low"

        drivers: list[tuple[str, float]] = [
            ("low_retention", 1.0 - request.retention_score),
            ("weak_lock_in", 1.0 - request.lock_in_score),
            ("trust_erosion", 1.0 - request.trust_score),
            ("incident_pressure", request.incident_pressure),
            ("competitive_pressure", request.competitive_pressure),
            ("budget_stress", request.budget_stress),
            ("action_fatigue", request.action_fatigue),
        ]
        drivers.sort(key=lambda item: item[1], reverse=True)
        return PredictionResponse(
            engine_id="heuristic_churn_v1",
            engine_source=self._model_path or "in-process heuristic fallback",
            churn_probability=churn_probability,
            retention_probability=retention_probability,
            risk_band=risk_band,
            drivers=[name for name, _ in drivers[:3]],
        )
