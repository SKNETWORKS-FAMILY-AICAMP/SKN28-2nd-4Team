from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import pickle
import random

import pandas as pd

from be.schemas import (
    EcommerceCustomerModelInput,
    ModelFeatureField,
    PredictionDecision,
    PredictionState,
    SimulationAction,
    SimulationEvent,
)


def _to_python_scalar(value: object) -> str | int | float:
    if isinstance(value, (str, int, float)):
        return value
    if pd.isna(value):
        return 0
    if hasattr(value, "item"):
        item = value.item()
        if isinstance(item, (str, int, float)):
            return item
    return str(value)


@dataclass(frozen=True)
class DecisionProfile:
    action: SimulationAction
    feature_multipliers: dict[str, float]
    feature_additions: dict[str, float]
    loss_rate_bias: float


class CustomerChurnBusinessModel:
    model_id = "ecommerce_customer_xgb_v2_no_customer_id"

    def __init__(
        self,
        model_path: Path,
        dataset_path: Path,
        schema_path: Path,
        calibration_factor: float,
    ) -> None:
        self._model_path = model_path
        self._dataset_path = dataset_path
        self._schema_path = schema_path
        self._calibration_factor = calibration_factor

        if not self._model_path.exists():
            raise FileNotFoundError(f"Prediction model not found: {self._model_path}")
        if not self._dataset_path.exists():
            raise FileNotFoundError(
                f"Prediction dataset not found: {self._dataset_path}"
            )
        if not self._schema_path.exists():
            raise FileNotFoundError(f"Prediction schema not found: {self._schema_path}")

        with self._model_path.open("rb") as file:
            self._model = pickle.load(file)

        dataset = pd.read_csv(self._dataset_path)
        self._feature_columns = list(self._model.feature_names_in_)
        self._feature_frame = dataset[self._feature_columns].copy()
        self._feature_schema = [
            ModelFeatureField.model_validate(item)
            for item in json.loads(self._schema_path.read_text())
        ]
        schema_columns = [field.name for field in self._feature_schema]
        if schema_columns != self._feature_columns:
            raise ValueError(
                "Prediction schema does not match model feature order: "
                f"schema={schema_columns}, model={self._feature_columns}"
            )

        self._integer_columns = {
            column
            for column in self._feature_columns
            if pd.api.types.is_integer_dtype(self._feature_frame[column].dtype)
        }
        self._numeric_columns = [
            field.name for field in self._feature_schema if field.dtype == "numeric"
        ]
        self._categorical_columns = [
            field.name for field in self._feature_schema if field.dtype == "categorical"
        ]
        self._numeric_medians = self._feature_frame[self._numeric_columns].median()
        self._numeric_min = self._feature_frame[self._numeric_columns].min()
        self._numeric_max = self._feature_frame[self._numeric_columns].max()
        self._categorical_modes = {
            column: str(self._feature_frame[column].mode(dropna=True).iloc[0])
            for column in self._categorical_columns
        }

        self._decision_profiles: dict[str, DecisionProfile] = {
            "hold": DecisionProfile(
                action=SimulationAction(
                    action_id="hold",
                    label="현상 유지",
                    summary="현재 feature 상태를 유지하며 다음 턴 변화를 관찰합니다.",
                ),
                feature_multipliers={},
                feature_additions={},
                loss_rate_bias=0.0,
            ),
            "coupon_push": DecisionProfile(
                action=SimulationAction(
                    action_id="coupon_push",
                    label="혜택 푸시",
                    summary="CouponUsed와 CashbackAmount를 올려 가격 민감 churn을 방어합니다.",
                ),
                feature_multipliers={"CouponUsed": 1.35, "CashbackAmount": 1.18},
                feature_additions={"SatisfactionScore": 0.20},
                loss_rate_bias=-0.01,
            ),
            "service_recovery": DecisionProfile(
                action=SimulationAction(
                    action_id="service_recovery",
                    label="서비스 복구",
                    summary="Complain과 WarehouseToHome를 개선해 churn 요인을 직접 낮춥니다.",
                ),
                feature_multipliers={"Complain": 0.75, "WarehouseToHome": 0.92},
                feature_additions={"SatisfactionScore": 0.60, "HourSpendOnApp": 0.20},
                loss_rate_bias=-0.02,
            ),
            "experience_refresh": DecisionProfile(
                action=SimulationAction(
                    action_id="experience_refresh",
                    label="경험 개선",
                    summary="OrderCount와 HourSpendOnApp을 높이고 recency를 줄입니다.",
                ),
                feature_multipliers={
                    "HourSpendOnApp": 1.12,
                    "OrderCount": 1.10,
                    "DaySinceLastOrder": 0.90,
                },
                feature_additions={"CashbackAmount": 5.0},
                loss_rate_bias=-0.018,
            ),
            "vip_protection": DecisionProfile(
                action=SimulationAction(
                    action_id="vip_protection",
                    label="VIP 보호",
                    summary="충성 고객 신호를 강화하고 관계 손실을 늦춥니다.",
                ),
                feature_multipliers={
                    "NumberOfAddress": 1.05,
                    "NumberOfDeviceRegistered": 1.03,
                    "CashbackAmount": 1.07,
                },
                feature_additions={"SatisfactionScore": 0.25},
                loss_rate_bias=-0.015,
            ),
            "ops_stabilize": DecisionProfile(
                action=SimulationAction(
                    action_id="ops_stabilize",
                    label="운영 안정화",
                    summary="배송/처리 체감과 불만 수치를 완화합니다.",
                ),
                feature_multipliers={"WarehouseToHome": 0.88, "Complain": 0.90},
                feature_additions={"SatisfactionScore": 0.12},
                loss_rate_bias=-0.012,
            ),
        }

    def feature_schema(self) -> list[ModelFeatureField]:
        return self._feature_schema

    def available_actions(self) -> list[SimulationAction]:
        return [profile.action for profile in self._decision_profiles.values()]

    def resolve_action(self, action_id: str) -> DecisionProfile:
        try:
            return self._decision_profiles[action_id]
        except KeyError as exc:
            available = ", ".join(sorted(self._decision_profiles))
            raise ValueError(
                f"Unknown action_id '{action_id}'. Available actions: {available}"
            ) from exc

    def _normalize_row(
        self, values: dict[str, str | int | float]
    ) -> dict[str, str | int | float]:
        normalized: dict[str, str | int | float] = {}
        for field in self._feature_schema:
            column = field.name
            raw_value = values.get(column)
            if field.dtype == "categorical":
                value = (
                    self._categorical_modes[column]
                    if raw_value in (None, "")
                    else str(raw_value)
                )
                if field.categories and value not in field.categories:
                    value = self._categorical_modes[column]
                normalized[column] = value
                continue

            numeric_value = (
                float(self._numeric_medians[column])
                if raw_value in (None, "")
                else float(raw_value)
            )
            numeric_value = max(
                float(self._numeric_min[column]),
                min(float(self._numeric_max[column]) * 1.5, numeric_value),
            )
            if column in self._integer_columns:
                normalized[column] = int(round(numeric_value))
            else:
                normalized[column] = round(numeric_value, 4)
        return normalized

    def _row_to_model_input(
        self, row: dict[str, str | int | float]
    ) -> EcommerceCustomerModelInput:
        return EcommerceCustomerModelInput.model_validate(self._normalize_row(row))

    def initial_state(
        self, system_id: str, current_users: int, rng: random.Random
    ) -> PredictionState:
        index = rng.randrange(len(self._feature_frame))
        row = {
            column: _to_python_scalar(self._feature_frame.iloc[index][column])
            for column in self._feature_columns
        }
        return PredictionState(
            system_id=system_id,
            turn_index=1,
            current_users=current_users,
            model_input=self._row_to_model_input(row),
        )

    def build_model_input(
        self,
        state: PredictionState,
        decision: PredictionDecision,
        event: SimulationEvent,
    ) -> EcommerceCustomerModelInput:
        # The trained model is customer-level. Business actions are company-level,
        # so this layer translates a company decision into feature perturbations on
        # a representative customer row that matches the exported serving schema.
        profile = self.resolve_action(decision.action_id)
        intensity = decision.intensity
        row = self._normalize_row(state.model_input.model_dump())

        for column, multiplier in profile.feature_multipliers.items():
            if column in self._numeric_columns:
                row[column] = float(row[column]) * (1 + ((multiplier - 1) * intensity))

        for column, addition in profile.feature_additions.items():
            if column in self._numeric_columns:
                row[column] = float(row[column]) + (addition * intensity)

        for column, multiplier in event.feature_multipliers.items():
            if column in self._numeric_columns:
                row[column] = float(row[column]) * multiplier

        for column, addition in event.feature_additions.items():
            if column in self._numeric_columns:
                row[column] = float(row[column]) + addition

        return self._row_to_model_input(row)

    def build_feature_frame(
        self, model_input: EcommerceCustomerModelInput
    ) -> pd.DataFrame:
        row = model_input.model_dump()
        return pd.DataFrame([{column: row[column] for column in self._feature_columns}])

    def predict_churn_probability(self, frame: pd.DataFrame) -> float:
        probabilities = self._model.predict_proba(frame)[:, 1]
        return float(probabilities[0])

    def estimate_loss_rate(
        self,
        raw_risk: float,
        model_input: EcommerceCustomerModelInput,
        decision: PredictionDecision,
        event: SimulationEvent,
    ) -> float:
        values = model_input.model_dump()
        profile = self.resolve_action(decision.action_id)
        complaint_penalty = max(float(values["Complain"]) - 0.5, 0.0) * 0.05
        satisfaction_penalty = (
            max((3.0 - float(values["SatisfactionScore"])) / 4.0, 0.0) * 0.04
        )
        recency_penalty = (
            max(
                float(values["DaySinceLastOrder"])
                - float(self._numeric_medians["DaySinceLastOrder"]),
                0.0,
            )
            / max(float(self._numeric_max["DaySinceLastOrder"]), 1.0)
            * 0.05
        )
        loss_rate = (
            raw_risk * self._calibration_factor
            + complaint_penalty
            + satisfaction_penalty
            + recency_penalty
            + event.loss_rate_bias
            + (profile.loss_rate_bias * decision.intensity)
        )
        return round(max(0.005, min(0.35, loss_rate)), 4)

    def advance_state(
        self,
        state: PredictionState,
        predicted_users_next: int,
        next_model_input: EcommerceCustomerModelInput,
    ) -> PredictionState:
        return PredictionState(
            system_id=state.system_id,
            turn_index=state.turn_index + 1,
            current_users=predicted_users_next,
            model_input=next_model_input,
        )

    def summarize_drivers(
        self,
        model_input: EcommerceCustomerModelInput,
        event: SimulationEvent,
        loss_rate: float,
    ) -> list[str]:
        values = model_input.model_dump()
        drivers = [event.label]
        if float(values["Complain"]) >= 1.0:
            drivers.append("complain_high")
        if float(values["SatisfactionScore"]) <= 2.0:
            drivers.append("satisfaction_low")
        if (
            float(values["DaySinceLastOrder"])
            >= float(self._numeric_medians["DaySinceLastOrder"]) * 1.2
        ):
            drivers.append("recency_worsening")
        if (
            float(values["OrderCount"])
            <= float(self._numeric_medians["OrderCount"]) * 0.85
        ):
            drivers.append("order_count_soft")
        if loss_rate >= 0.12:
            drivers.append("loss_rate_high")
        return drivers[:4]
