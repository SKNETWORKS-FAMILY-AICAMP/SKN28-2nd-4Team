from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import random
import secrets
from uuid import uuid4

from be.business_model import CustomerChurnBusinessModel
from be.schemas import (
    PredictionRequest,
    PredictionResponse,
    PredictionSessionStartRequest,
    PredictionSessionStartResponse,
    PredictionState,
    SimulationScenarioSource,
    SimulatorDashboardResponse,
    SimulationEvent,
    SimulationTrendPoint,
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
        self._dashboard = scenario.dashboard
        self._incidents_by_id = {
            incident.id: incident for incident in self._dashboard.incidents
        }
        self._events_by_id = {event.event_id: event for event in self._events}
        self._sessions: dict[str, SessionRecord] = {}

    def _load_scenario(self, scenario_path: Path) -> SimulationScenarioSource:
        if not scenario_path.exists():
            raise FileNotFoundError(
                f"Simulation scenario file not found: {scenario_path}"
            )

        raw_scenario = json.loads(scenario_path.read_text())
        return SimulationScenarioSource.model_validate(raw_scenario)

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
            if incident is None:
                raise ValueError(f"Unknown incident_id: {incident_id}")
            event = self._events_by_id.get(incident.eventId)
            if event is None:
                raise ValueError(
                    f"Scenario incident '{incident_id}' references unknown event_id '{incident.eventId}'"
                )
            return event

        matching = [
            event for event in self._events if event.system_id in {system_id, "global"}
        ]
        if not matching:
            raise RuntimeError(
                f"No simulation events registered for system_id={system_id}"
            )
        weights = [event.weight for event in matching]
        return rng.choices(matching, weights=weights, k=1)[0]

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
        session_id = uuid4().hex
        self._sessions[session_id] = SessionRecord(
            session_id=session_id,
            random_seed=seed,
            rng=rng,
            latest_state=state,
        )

        return PredictionSessionStartResponse(
            session_id=session_id,
            random_seed=seed,
            business_model_id=self._business_model.model_id,
            state=state,
            available_actions=self._business_model.available_actions(),
            model_schema=self._business_model.feature_schema(),
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
            request.decision.incident_id,
            session.rng,
        )

        next_model_input = self._business_model.build_model_input(
            request.state, request.decision, event
        )
        frame = self._business_model.build_feature_frame(next_model_input)
        raw_risk = self._business_model.predict_churn_probability(frame)
        loss_rate = self._business_model.estimate_loss_rate(
            raw_risk, next_model_input, request.decision, event
        )
        expected_lost_users = round(request.state.current_users * loss_rate)
        predicted_users_next = max(request.state.current_users - expected_lost_users, 0)
        next_state = self._business_model.advance_state(
            request.state,
            predicted_users_next,
            next_model_input,
        )
        session.latest_state = next_state

        return PredictionResponse(
            session_id=request.session_id,
            engine_id="live_customer_churn_inference_xgb_v2",
            engine_source=str(self._settings.prediction_model_path),
            business_model_id=self._business_model.model_id,
            churn_probability=round(raw_risk, 4),
            effective_loss_rate=loss_rate,
            retention_probability=round(max(0.0, 1.0 - raw_risk), 4),
            risk_band=_risk_band(loss_rate),
            drivers=self._business_model.summarize_drivers(
                next_model_input, event, loss_rate
            ),
            event=event,
            expected_lost_users=expected_lost_users,
            predicted_users_next=predicted_users_next,
            next_state=next_state,
            trend_point=SimulationTrendPoint(
                label=f"Month {next_state.turn_index}",
                actual_users=request.state.current_users,
                predicted_users=predicted_users_next,
                churn_risk=round(loss_rate * 100, 2),
            ),
        )
