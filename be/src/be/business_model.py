from __future__ import annotations

from math import ceil
from pathlib import Path
import json
import pickle
import random

import pandas as pd

from be.schemas import (
    EcommerceCustomerModelInput,
    ModelFeatureField,
    PredictionState,
    SimulationEvent,
    StrategyAdjustment,
)


FIELD_METADATA: dict[str, dict[str, object]] = {
    "Tenure": {
        "label": "고객 유지 기간",
        "description": "세그먼트 맥락값입니다.",
        "group": "context",
        "minimum": 0,
        "maximum": 61,
        "step": 1,
        "direction": "neutral",
        "editable": False,
        "editable_reason": "월간 전략 레버가 아니라 코호트 설명값입니다.",
    },
    "PreferredLoginDevice": {
        "label": "주 접속 디바이스",
        "description": "고객 세그먼트 프로필 값입니다.",
        "group": "context",
        "direction": "neutral",
        "editable": False,
        "editable_reason": "월간 전략 레버가 아니라 세그먼트 프로필입니다.",
    },
    "CityTier": {
        "label": "도시 티어",
        "description": "고객 세그먼트 맥락값입니다.",
        "group": "context",
        "minimum": 1,
        "maximum": 3,
        "step": 1,
        "direction": "neutral",
        "editable": False,
        "editable_reason": "월간 전략 레버가 아니라 세그먼트 맥락값입니다.",
    },
    "WarehouseToHome": {
        "label": "배송 마찰",
        "description": "값이 커질수록 더 나쁜 축입니다.",
        "group": "core",
        "minimum": 5,
        "maximum": 127,
        "step": 1,
        "direction": "negative",
        "editable": True,
        "editable_reason": "운영 안정화와 배송 개선으로 직접 줄일 수 있는 핵심 전략 레버입니다.",
        "budget_step": 5,
        "unit_budget_cost": 1200,
    },
    "PreferredPaymentMode": {
        "label": "선호 결제 수단",
        "description": "보조 전략/맥락 필드입니다.",
        "group": "advanced",
        "direction": "neutral",
        "editable": False,
        "editable_reason": "현재 전략 옵션에서는 직접 조절하지 않는 보조 맥락값입니다.",
    },
    "Gender": {
        "label": "성별",
        "description": "세그먼트 맥락값입니다.",
        "group": "context",
        "direction": "neutral",
        "editable": False,
        "editable_reason": "전략 레버로 취급하면 안 되는 세그먼트 정보입니다.",
    },
    "HourSpendOnApp": {
        "label": "앱 체류 시간",
        "description": "값이 커질수록 일반적으로 더 좋은 축입니다.",
        "group": "core",
        "minimum": 0,
        "maximum": 5,
        "step": 1,
        "direction": "positive",
        "editable": True,
        "editable_reason": "경험 개선과 온보딩 보완으로 높일 수 있는 핵심 전략 레버입니다.",
        "budget_step": 1,
        "unit_budget_cost": 2500,
    },
    "NumberOfDeviceRegistered": {
        "label": "등록 디바이스 수",
        "description": "보조 전략/맥락 필드입니다.",
        "group": "advanced",
        "minimum": 1,
        "maximum": 6,
        "step": 1,
        "direction": "neutral",
        "editable": False,
        "editable_reason": "장기 정착 신호라서 이번 전략 옵션에서는 잠겨 있습니다.",
    },
    "PreferedOrderCat": {
        "label": "선호 주문 카테고리",
        "description": "보조 전략/맥락 필드입니다.",
        "group": "advanced",
        "direction": "neutral",
        "editable": False,
        "editable_reason": "고객 성향값이라 현재 전략 옵션에서는 직접 수정하지 않습니다.",
    },
    "SatisfactionScore": {
        "label": "만족도",
        "description": "값이 커질수록 좋은 축입니다.",
        "group": "core",
        "minimum": 1,
        "maximum": 5,
        "step": 1,
        "direction": "positive",
        "editable": True,
        "editable_reason": "관계 회복과 서비스 개선으로 직접 높일 수 있는 핵심 전략 레버입니다.",
        "budget_step": 1,
        "unit_budget_cost": 5000,
    },
    "MaritalStatus": {
        "label": "결혼 상태",
        "description": "세그먼트 맥락값입니다.",
        "group": "context",
        "direction": "neutral",
        "editable": False,
        "editable_reason": "전략 레버가 아니라 세그먼트 정보입니다.",
    },
    "NumberOfAddress": {
        "label": "등록 주소 수",
        "description": "보조 전략/맥락 필드입니다.",
        "group": "advanced",
        "minimum": 1,
        "maximum": 22,
        "step": 1,
        "direction": "neutral",
        "editable": False,
        "editable_reason": "현재 전략 옵션에서는 직접 조절하지 않는 보조 필드입니다.",
    },
    "Complain": {
        "label": "불만 압력",
        "description": "0 또는 1. 값이 커질수록 더 나쁜 축입니다.",
        "group": "core",
        "minimum": 0,
        "maximum": 1,
        "step": 1,
        "direction": "negative",
        "editable": True,
        "editable_reason": "서비스 복구와 커뮤니케이션 개선으로 직접 낮출 수 있는 핵심 리스크 레버입니다.",
        "budget_step": 1,
        "unit_budget_cost": 4500,
    },
    "OrderAmountHikeFromlastYear": {
        "label": "전년 대비 주문금액 변화",
        "description": "보조 전략/맥락 필드입니다.",
        "group": "advanced",
        "minimum": 11,
        "maximum": 26,
        "step": 1,
        "direction": "neutral",
        "editable": False,
        "editable_reason": "현재 전략 옵션에서는 보조 맥락 지표로만 사용합니다.",
    },
    "CouponUsed": {
        "label": "쿠폰 사용량",
        "description": "값이 커질수록 혜택 강도가 커집니다.",
        "group": "core",
        "minimum": 0,
        "maximum": 16,
        "step": 1,
        "direction": "positive",
        "editable": True,
        "editable_reason": "단기 churn 방어용 혜택 강도로 직접 조절할 수 있는 레버입니다.",
        "budget_step": 1,
        "unit_budget_cost": 1000,
    },
    "OrderCount": {
        "label": "주문 수",
        "description": "값이 커질수록 이용 빈도가 높습니다.",
        "group": "core",
        "minimum": 1,
        "maximum": 16,
        "step": 1,
        "direction": "positive",
        "editable": True,
        "editable_reason": "재구매 활성화와 이용 빈도 방어를 위해 직접 높일 수 있는 레버입니다.",
        "budget_step": 1,
        "unit_budget_cost": 1800,
    },
    "DaySinceLastOrder": {
        "label": "최근 주문 공백",
        "description": "값이 커질수록 더 나쁜 축입니다.",
        "group": "core",
        "minimum": 0,
        "maximum": 46,
        "step": 1,
        "direction": "negative",
        "editable": True,
        "editable_reason": "재방문과 재구매 유도 전략으로 직접 줄일 수 있는 핵심 레버입니다.",
        "budget_step": 3,
        "unit_budget_cost": 1500,
    },
    "CashbackAmount": {
        "label": "캐시백 금액",
        "description": "값이 커질수록 혜택 강도가 강해집니다.",
        "group": "core",
        "minimum": 0,
        "maximum": 324.99,
        "step": 0.01,
        "direction": "positive",
        "editable": True,
        "editable_reason": "프로모션 보상 강도를 직접 조절할 수 있는 레버입니다.",
        "budget_step": 25,
        "unit_budget_cost": 1000,
    },
}


def _to_python_scalar(value: object) -> str | int | float:
    if isinstance(value, (str, int, float)):
        return value
    if pd.isna(value):
        raise ValueError("NaN value encountered while building initial model input")
    if hasattr(value, "item"):
        item = value.item()
        if isinstance(item, (str, int, float)):
            return item
    return str(value)


def _row_to_candidate_dict(
    row: pd.Series, columns: list[str]
) -> dict[str, str | int | float]:
    return {column: _to_python_scalar(row[column]) for column in columns}


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
        raw_schema = json.loads(self._schema_path.read_text())

        self._feature_schema = [
            ModelFeatureField.model_validate(
                {
                    **item,
                    **FIELD_METADATA[item["name"]],
                }
            )
            for item in raw_schema
        ]
        self._schema_by_name = {field.name: field for field in self._feature_schema}

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
        self._numeric_medians = self._feature_frame[self._numeric_columns].median()
        self._numeric_max = self._feature_frame[self._numeric_columns].max()

        self._seed_inputs: list[EcommerceCustomerModelInput] = []
        for _, row in self._feature_frame.iterrows():
            try:
                candidate = _row_to_candidate_dict(row, self._feature_columns)
                self._seed_inputs.append(
                    EcommerceCustomerModelInput.model_validate(candidate)
                )
            except Exception:
                continue

        if not self._seed_inputs:
            raise ValueError(
                "No valid seed rows found for initial session state. "
                "The serving dataset must contain at least one fully valid raw input row."
            )

    def feature_schema(self) -> list[ModelFeatureField]:
        return self._feature_schema

    def validate_simulation_events(self, events: list[SimulationEvent]) -> None:
        for event in events:
            for field_name, multiplier in event.feature_multipliers.items():
                field = self._schema_by_name.get(field_name)
                if field is None:
                    raise ValueError(
                        f"Scenario event '{event.event_id}' references unknown field '{field_name}' in feature_multipliers."
                    )
                if field.dtype != "numeric":
                    raise ValueError(
                        f"Scenario event '{event.event_id}' can only modify numeric model inputs, but '{field_name}' is categorical."
                    )
                if field.step is not None and field.step >= 1:
                    raise ValueError(
                        f"Scenario event '{event.event_id}' uses multiplier on discrete field '{field_name}'. "
                        "Use native-unit additions instead."
                    )
                if multiplier <= 0:
                    raise ValueError(
                        f"Scenario event '{event.event_id}' uses non-positive multiplier for '{field_name}'."
                    )

            for field_name, addition in event.feature_additions.items():
                field = self._schema_by_name.get(field_name)
                if field is None:
                    raise ValueError(
                        f"Scenario event '{event.event_id}' references unknown field '{field_name}' in feature_additions."
                    )
                if field.dtype != "numeric":
                    raise ValueError(
                        f"Scenario event '{event.event_id}' can only modify numeric model inputs, but '{field_name}' is categorical."
                    )

                step = float(field.step or 0)
                if field.name == "Complain" and addition not in {-1, 0, 1}:
                    raise ValueError(
                        f"Scenario event '{event.event_id}' must use binary-native additions for '{field_name}'."
                    )
                elif step > 0:
                    units = addition / step
                    if abs(units - round(units)) > 1e-9:
                        raise ValueError(
                            f"Scenario event '{event.event_id}' addition for '{field_name}' must align with step={step}."
                        )

    def validate_model_input(
        self, model_input: EcommerceCustomerModelInput
    ) -> EcommerceCustomerModelInput:
        return EcommerceCustomerModelInput.model_validate(model_input.model_dump())

    def initial_state(
        self, system_id: str, current_users: int, rng: random.Random
    ) -> PredictionState:
        model_input = self._seed_inputs[rng.randrange(len(self._seed_inputs))]
        return PredictionState(
            system_id=system_id,
            turn_index=1,
            current_users=current_users,
            model_input=model_input,
        )

    def _normalize_event_numeric_value(
        self,
        field: ModelFeatureField,
        value: float,
    ) -> int | float:
        numeric_value = value
        if field.minimum is not None:
            numeric_value = max(float(field.minimum), numeric_value)
        if field.maximum is not None:
            numeric_value = min(float(field.maximum), numeric_value)

        if field.name == "Complain":
            return 1 if numeric_value > 0 else 0

        if field.name in self._integer_columns or field.step == 1:
            return int(round(numeric_value))
        return round(numeric_value, 4)

    def apply_event_to_model_input(
        self,
        model_input: EcommerceCustomerModelInput,
        event: SimulationEvent,
    ) -> EcommerceCustomerModelInput:
        candidate = model_input.model_dump()

        for column, multiplier in event.feature_multipliers.items():
            field = self._schema_by_name.get(column)
            if field is None or field.dtype != "numeric":
                continue
            candidate[column] = float(candidate[column]) * multiplier

        for column, addition in event.feature_additions.items():
            field = self._schema_by_name.get(column)
            if field is None or field.dtype != "numeric":
                continue
            candidate[column] = float(candidate[column]) + addition

        for field in self._feature_schema:
            if field.dtype != "numeric":
                continue
            candidate[field.name] = self._normalize_event_numeric_value(
                field, float(candidate[field.name])
            )

        return EcommerceCustomerModelInput.model_validate(candidate)

    def build_feature_frame(
        self, model_input: EcommerceCustomerModelInput
    ) -> pd.DataFrame:
        row = model_input.model_dump()
        return pd.DataFrame([{column: row[column] for column in self._feature_columns}])

    def predict_churn_probability(self, frame: pd.DataFrame) -> float:
        probabilities = self._model.predict_proba(frame)[:, 1]
        return float(probabilities[0])

    def estimate_strategy_adjustments(
        self,
        degraded_input: EcommerceCustomerModelInput,
        target_input: EcommerceCustomerModelInput,
    ) -> list[StrategyAdjustment]:
        degraded_values = degraded_input.model_dump()
        target_values = target_input.model_dump()
        adjustments: list[StrategyAdjustment] = []

        for field in self._feature_schema:
            base_value = degraded_values[field.name]
            target_value = target_values[field.name]

            if not field.editable:
                if base_value != target_value:
                    raise ValueError(
                        f"Field '{field.label}' cannot be changed in strategy options. "
                        f"Reason: {field.editable_reason}"
                    )
                continue

            budget_step = float(field.budget_step or field.step or 1.0)
            unit_budget_cost = int(field.unit_budget_cost or 0)
            delta = 0.0
            direction = "hold"
            improvement_amount = 0.0

            if field.dtype == "numeric":
                base_numeric = float(base_value)
                target_numeric = float(target_value)
                delta = round(target_numeric - base_numeric, 4)
                if target_numeric > base_numeric:
                    direction = "increase"
                elif target_numeric < base_numeric:
                    direction = "decrease"

                if field.direction == "positive":
                    improvement_amount = max(target_numeric - base_numeric, 0.0)
                elif field.direction == "negative":
                    improvement_amount = max(base_numeric - target_numeric, 0.0)
            else:
                if base_value != target_value:
                    direction = "increase"
                    improvement_amount = 1.0

            spent_budget = 0
            if improvement_amount > 0 and unit_budget_cost > 0:
                spent_budget = ceil(improvement_amount / budget_step) * unit_budget_cost

            if base_value == target_value:
                continue

            adjustments.append(
                StrategyAdjustment(
                    field_name=field.name,
                    label=field.label,
                    direction=direction,
                    base_value=base_value,
                    target_value=target_value,
                    delta=delta,
                    budget_step=budget_step,
                    unit_budget_cost=unit_budget_cost,
                    spent_budget=spent_budget,
                )
            )

        return adjustments

    def total_adjustment_cost(self, adjustments: list[StrategyAdjustment]) -> int:
        return sum(item.spent_budget for item in adjustments)

    def estimate_loss_rate(
        self,
        raw_risk: float,
        model_input: EcommerceCustomerModelInput,
        event: SimulationEvent,
    ) -> float:
        values = model_input.model_dump()
        complaint_penalty = float(values["Complain"]) * 0.035
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
        shipping_penalty = (
            max(
                float(values["WarehouseToHome"])
                - float(self._numeric_medians["WarehouseToHome"]),
                0.0,
            )
            / max(float(self._numeric_max["WarehouseToHome"]), 1.0)
            * 0.03
        )
        loss_rate = (
            raw_risk * self._calibration_factor
            + complaint_penalty
            + satisfaction_penalty
            + recency_penalty
            + shipping_penalty
            + event.loss_rate_bias
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
    ) -> list[str]:
        values = model_input.model_dump()
        drivers = [event.label]
        if values["Complain"] >= 1:
            drivers.append("complain_high")
        if values["SatisfactionScore"] <= 2:
            drivers.append("satisfaction_low")
        if values["DaySinceLastOrder"] >= 20:
            drivers.append("recency_worsening")
        if values["WarehouseToHome"] >= 40:
            drivers.append("shipping_friction_high")
        if values["HourSpendOnApp"] <= 1:
            drivers.append("engagement_low")
        if values["OrderCount"] <= 3:
            drivers.append("order_count_soft")
        return drivers[:4]
