from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import random
import secrets
from uuid import uuid4

from be.business_model import CustomerChurnBusinessModel
from be.schemas import (
    DashboardIncident,
    PredictionRequest,
    PredictionResponse,
    PredictionSessionStartRequest,
    PredictionSessionStartResponse,
    PredictionState,
    SimulationScenarioSource,
    SimulatorDashboardResponse,
    SimulationEvent,
    SimulationTrendPoint,
    StrategyBudget,
)
from be.settings import Settings


def _risk_band(loss_rate: float) -> str:
    if loss_rate >= 0.12:
        return "high"
    if loss_rate >= 0.06:
        return "medium"
    return "low"


@dataclass
class SessionRecord:
    session_id: str
    random_seed: int
    rng: random.Random
    latest_state: PredictionState
    total_budget: int
    remaining_budget: int


class PredictionService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._business_model = CustomerChurnBusinessModel(
            model_path=settings.prediction_model_path,
            dataset_path=settings.prediction_dataset_path,
            schema_path=settings.prediction_schema_path,
            calibration_factor=settings.prediction_calibration_factor,
        )
        scenario = self._load_scenario(settings.simulation_scenario_path)
        self._events = scenario.events
        self._business_model.validate_simulation_events(self._events)
        self._events_by_id = {event.event_id: event for event in self._events}
        self._dashboard = self._enrich_dashboard_with_event_effects(scenario.dashboard)
        self._incidents_by_id = {
            incident.id: incident for incident in self._dashboard.incidents
        }
        self._sessions: dict[str, SessionRecord] = {}

    def _load_scenario(self, scenario_path: Path) -> SimulationScenarioSource:
        if not scenario_path.exists():
            raise FileNotFoundError(
                f"Simulation scenario file not found: {scenario_path}"
            )

        raw_scenario = json.loads(scenario_path.read_text())
        return SimulationScenarioSource.model_validate(raw_scenario)

    def _enrich_dashboard_with_event_effects(
        self,
        dashboard: SimulatorDashboardResponse,
    ) -> SimulatorDashboardResponse:
        enriched_incidents = []
        for incident in dashboard.incidents:
            event = self._events_by_id.get(incident.eventId)
            if event is None:
                raise ValueError(
                    f"Dashboard incident '{incident.id}' references unknown event_id '{incident.eventId}'"
                )
            enriched_incidents.append(
                incident.model_copy(
                    update={
                        "featureMultipliers": event.feature_multipliers,
                        "featureAdditions": event.feature_additions,
                        "lossRateBias": event.loss_rate_bias,
                    }
                )
            )

        return dashboard.model_copy(update={"incidents": enriched_incidents})

    def _resolve_session(self, session_id: str) -> SessionRecord:
        try:
            return self._sessions[session_id]
        except KeyError as exc:
            raise KeyError(f"Unknown prediction session_id: {session_id}") from exc

    def _sample_event(
        self, system_id: str, incident_id: str | None, rng: random.Random
    ) -> SimulationEvent:
        if incident_id is not None:
            incident = self._incidents_by_id.get(incident_id)
            if incident is not None:
                event = self._events_by_id.get(incident.eventId)
                if event is None:
                    raise ValueError(
                        f"Scenario incident '{incident_id}' references unknown event_id '{incident.eventId}'"
                    )
                return event

            synthetic_prefix = f"incident-{system_id}-"
            if incident_id.startswith(synthetic_prefix):
                event_id = incident_id.removeprefix(synthetic_prefix)
                event = self._events_by_id.get(event_id)
                if event is not None and event.system_id in {system_id, "global"}:
                    return event

            raise ValueError(f"Unknown incident_id: {incident_id}")

        matching = [
            event for event in self._events if event.system_id in {system_id, "global"}
        ]
        if not matching:
            raise RuntimeError(
                f"No simulation events registered for system_id={system_id}"
            )
        weights = [event.weight for event in matching]
        return rng.choices(matching, weights=weights, k=1)[0]

    def _budget_snapshot(self, session: SessionRecord) -> StrategyBudget:
        return StrategyBudget(
            total_budget=session.total_budget,
            remaining_budget=session.remaining_budget,
            spent_budget=session.total_budget - session.remaining_budget,
        )

    def _event_to_incident(
        self,
        system_id: str,
        event: SimulationEvent,
    ) -> DashboardIncident:
        for incident in self._dashboard.incidents:
            if incident.systemId == system_id and incident.eventId == event.event_id:
                return incident

        affected_features = sorted(
            {
                *event.feature_multipliers.keys(),
                *event.feature_additions.keys(),
            }
        )
        impact = (
            f"예상 churn loss bias +{round(event.loss_rate_bias * 100, 1)}%"
            if event.loss_rate_bias > 0
            else "운영 영향 추정 필요"
        )

        return DashboardIncident(
            id=f"incident-{system_id}-{event.event_id}",
            systemId=system_id,
            eventId=event.event_id,
            title=event.label,
            summary=event.summary,
            severity=event.severity,
            requester="시뮬레이션 엔진",
            impact=impact,
            window="다음 턴",
            request="영향 필드를 확인하고 예산 안에서 복구 전략을 조정해 주세요.",
            affectedFeatures=affected_features,
            featureMultipliers=event.feature_multipliers,
            featureAdditions=event.feature_additions,
            lossRateBias=event.loss_rate_bias,
        )

    def _sample_next_incidents(
        self,
        system_id: str,
        current_event_id: str,
        rng: random.Random,
        count: int = 4,
    ) -> list[DashboardIncident]:
        candidate_events = [
            event for event in self._events if event.system_id in {system_id, "global"}
        ]
        if not candidate_events:
            return []

        if len(candidate_events) > 1:
            filtered_events = [
                event
                for event in candidate_events
                if event.event_id != current_event_id
            ]
            if filtered_events:
                candidate_events = filtered_events

        selected_events: list[SimulationEvent] = []
        available_events = list(candidate_events)

        while available_events and len(selected_events) < count:
            weights = [event.weight for event in available_events]
            chosen = rng.choices(available_events, weights=weights, k=1)[0]
            selected_events.append(chosen)
            available_events = [
                event for event in available_events if event.event_id != chosen.event_id
            ]

        return [self._event_to_incident(system_id, event) for event in selected_events]

    def dashboard(self) -> SimulatorDashboardResponse:
        return self._dashboard

    def start_session(
        self, request: PredictionSessionStartRequest
    ) -> PredictionSessionStartResponse:
        seed = request.random_seed
        if seed is None:
            seed = self._settings.default_random_seed + secrets.randbelow(1_000_000_000)

        rng = random.Random(seed)
        state = self._business_model.initial_state(
            system_id=request.system_id,
            current_users=request.initial_users,
            rng=rng,
        )
        total_budget = 50_000
        session_id = uuid4().hex
        session = SessionRecord(
            session_id=session_id,
            random_seed=seed,
            rng=rng,
            latest_state=state,
            total_budget=total_budget,
            remaining_budget=total_budget,
        )
        self._sessions[session_id] = session

        return PredictionSessionStartResponse(
            session_id=session_id,
            random_seed=seed,
            business_model_id=self._business_model.model_id,
            state=state,
            model_schema=self._business_model.feature_schema(),
            strategy_budget=self._budget_snapshot(session),
            initial_trend_point=SimulationTrendPoint(
                label=f"Month {state.turn_index}",
                actual_users=state.current_users,
                predicted_users=state.current_users,
                churn_risk=0.0,
            ),
        )

    def score(self, request: PredictionRequest) -> PredictionResponse:
        session = self._resolve_session(request.session_id)
        event = self._sample_event(
            request.state.system_id,
            request.incident_id,
            session.rng,
        )
        degraded_model_input = self._business_model.apply_event_to_model_input(
            session.latest_state.model_input,
            event,
        )
        next_model_input = self._business_model.validate_model_input(
            request.state.model_input
        )
        applied_adjustments = self._business_model.estimate_strategy_adjustments(
            degraded_model_input,
            next_model_input,
        )
        spent_budget_this_turn = self._business_model.total_adjustment_cost(
            applied_adjustments
        )

        if spent_budget_this_turn > session.remaining_budget:
            raise ValueError(
                "Budget exceeded for this strategy turn. "
                f"required={spent_budget_this_turn}, remaining={session.remaining_budget}"
            )

        frame = self._business_model.build_feature_frame(next_model_input)
        raw_risk = self._business_model.predict_churn_probability(frame)
        loss_rate = self._business_model.estimate_loss_rate(
            raw_risk,
            next_model_input,
            event,
        )
        current_users = session.latest_state.current_users
        expected_lost_users = round(current_users * loss_rate)
        predicted_users_next = max(current_users - expected_lost_users, 0)
        next_state = self._business_model.advance_state(
            session.latest_state,
            predicted_users_next,
            next_model_input,
        )
        session.latest_state = next_state
        session.remaining_budget -= spent_budget_this_turn
        next_incident_options = self._sample_next_incidents(
            next_state.system_id,
            event.event_id,
            session.rng,
        )
        next_incident = next_incident_options[0] if next_incident_options else None

        return PredictionResponse(
            session_id=request.session_id,
            engine_id="live_customer_churn_inference_xgb_v2",
            engine_source=str(self._settings.prediction_model_path),
            business_model_id=self._business_model.model_id,
            churn_probability=round(raw_risk, 4),
            effective_loss_rate=loss_rate,
            retention_probability=round(max(0.0, 1.0 - raw_risk), 4),
            risk_band=_risk_band(loss_rate),
            drivers=self._business_model.summarize_drivers(next_model_input, event),
            event=event,
            degraded_model_input=degraded_model_input,
            applied_adjustments=applied_adjustments,
            spent_budget_this_turn=spent_budget_this_turn,
            strategy_budget=self._budget_snapshot(session),
            expected_lost_users=expected_lost_users,
            predicted_users_next=predicted_users_next,
            next_incident_id=next_incident.id if next_incident else None,
            next_incident=next_incident,
            next_incident_options=next_incident_options,
            next_state=next_state,
            trend_point=SimulationTrendPoint(
                label=f"Month {next_state.turn_index}",
                actual_users=current_users,
                predicted_users=predicted_users_next,
                churn_risk=round(loss_rate * 100, 2),
            ),
        )
