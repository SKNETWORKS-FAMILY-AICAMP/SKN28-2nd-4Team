from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import random
import uuid

from be.schemas import (
    GameState,
    LatentState,
    RewardComponents,
    ScenarioActionSpec,
    ScenarioConfig,
    ScenarioEventSpec,
    ScenarioSummary,
    SessionStartResponse,
    ShadowPolicyComparison,
    TurnResultPacket,
    VisibleState,
)
from be.settings import Settings


VISIBLE_FIELDS = set(VisibleState.model_fields)
LATENT_FIELDS = set(LatentState.model_fields)


def _state_int(data: dict[str, float | int | str | None], key: str, default: int) -> int:
    value = data.get(key, default)
    if value is None:
        return default
    return int(value)


def _state_float(data: dict[str, float | int | str | None], key: str, default: float) -> float:
    value = data.get(key, default)
    if value is None:
        return default
    return float(value)


@dataclass
class SessionRecord:
    session_id: str
    seed: int
    scenario: ScenarioConfig
    state: GameState
    rng: random.Random
    current_event: ScenarioEventSpec | None
    replay_path: Path


class ScenarioRepository:
    def __init__(self, scenario_dir: Path) -> None:
        self._scenario_dir = scenario_dir

    def list_scenarios(self) -> list[ScenarioConfig]:
        configs: list[ScenarioConfig] = []
        if not self._scenario_dir.exists():
            return configs
        for path in sorted(self._scenario_dir.glob("*.json")):
            configs.append(self._load(path))
        return configs

    def get(self, scenario_id: str) -> ScenarioConfig:
        path = self._scenario_dir / f"{scenario_id}.json"
        if not path.exists():
            raise KeyError(f"Unknown scenario: {scenario_id}")
        return self._load(path)

    def _load(self, path: Path) -> ScenarioConfig:
        return ScenarioConfig.model_validate_json(path.read_text())


class SessionService:
    def __init__(self, settings: Settings, scenario_repository: ScenarioRepository) -> None:
        self._settings = settings
        self._scenario_repository = scenario_repository
        self._sessions: dict[str, SessionRecord] = {}
        self._settings.replay_dir.mkdir(parents=True, exist_ok=True)

    def start(self, scenario_id: str, seed: int) -> SessionStartResponse:
        scenario = self._scenario_repository.get(scenario_id)
        session_id = f"sess_{uuid.uuid4().hex[:10]}"
        replay_path = self._settings.replay_dir / f"{session_id}.jsonl"
        initial_state = self._initial_state(session_id, replay_path, scenario)
        rng = random.Random(seed)
        current_event = self._pick_event(scenario, rng)
        initial_state.revealed_event_id = current_event.event_id
        record = SessionRecord(
            session_id=session_id,
            seed=seed,
            scenario=scenario,
            state=initial_state,
            rng=rng,
            current_event=current_event,
            replay_path=replay_path,
        )
        self._sessions[session_id] = record
        return SessionStartResponse(
            session_id=session_id,
            scenario=self._scenario_summary(scenario),
            state=initial_state,
            current_event=current_event,
            available_actions=self.available_actions(record),
            repo_context={
                "repo_root": str(self._settings.repo_root),
                "docs_dir": str(self._settings.docs_dir),
                "scenario_dir": str(self._settings.scenario_dir),
                "replay_dir": str(self._settings.replay_dir),
            },
        )

    def get(self, session_id: str) -> SessionRecord:
        try:
            return self._sessions[session_id]
        except KeyError as exc:
            raise KeyError(f"Unknown session: {session_id}") from exc

    def available_actions(self, record: SessionRecord) -> list[ScenarioActionSpec]:
        if record.state.completed:
            return []

        allowed: list[ScenarioActionSpec] = []
        for action in record.scenario.action_catalog:
            cooldown = record.state.action_cooldowns.get(action.action_id, 0)
            if cooldown > 0:
                continue
            if action.min_paying_ratio is not None and record.state.visible.paying_ratio < action.min_paying_ratio:
                continue
            if (
                action.max_incident_pressure is not None
                and record.state.visible.incident_pressure > action.max_incident_pressure
            ):
                continue
            allowed.append(action)
        return allowed

    def turn(self, session_id: str, action_id: str) -> TurnResultPacket:
        record = self.get(session_id)
        if record.state.completed:
            raise ValueError("Session is already complete")

        allowed_actions = {action.action_id: action for action in self.available_actions(record)}
        if action_id not in allowed_actions:
            raise ValueError(f"Action '{action_id}' is not available")

        action = allowed_actions[action_id]
        event = record.current_event or self._pick_event(record.scenario, record.rng)
        next_state = self._apply_turn(record.state, action, event, record.scenario)
        reward = self._reward(record.state, next_state, action, record.scenario)
        shadow = self._shadow_policy(record.state, event, record.scenario, action)
        packet = self._packet(record, action, event, next_state, reward, shadow)
        self._append_replay(record.replay_path, packet)

        record.state = next_state
        if next_state.completed:
            record.current_event = None
        else:
            record.current_event = self._pick_event(record.scenario, record.rng)
            record.state.revealed_event_id = record.current_event.event_id

        return packet

    def replay(self, session_id: str) -> list[dict[str, object]]:
        record = self.get(session_id)
        if not record.replay_path.exists():
            return []
        rows: list[dict[str, object]] = []
        for line in record.replay_path.read_text().splitlines():
            if line.strip():
                rows.append(json.loads(line))
        return rows

    def _initial_state(self, session_id: str, replay_path: Path, scenario: ScenarioConfig) -> GameState:
        visible = VisibleState(
            user_base=_state_int(scenario.initial_state, "user_base", 10000),
            active_ratio=_state_float(scenario.initial_state, "active_ratio", 0.55),
            retention_score=_state_float(scenario.initial_state, "retention_score", 0.58),
            paying_ratio=_state_float(scenario.initial_state, "paying_ratio", 0.14),
            lock_in_score=_state_float(scenario.initial_state, "lock_in_score", 0.45),
            incident_pressure=_state_float(scenario.initial_state, "incident_pressure", 0.20),
        )
        latent = LatentState(
            churn_pressure=_state_float(scenario.initial_state, "churn_pressure", 0.35),
            trust_score=_state_float(scenario.initial_state, "trust_score", 0.57),
            competitive_pressure=_state_float(scenario.initial_state, "competitive_pressure", 0.40),
            budget_stress=_state_float(scenario.initial_state, "budget_stress", 0.25),
            action_fatigue=_state_float(scenario.initial_state, "action_fatigue", 0.10),
        )
        return GameState(
            session_id=session_id,
            visible=visible,
            latent=latent,
            history_ref=str(replay_path),
        )

    def _scenario_summary(self, scenario: ScenarioConfig) -> ScenarioSummary:
        return ScenarioSummary(
            scenario_id=scenario.scenario_id,
            label=scenario.label,
            description=scenario.description,
            max_turns=scenario.max_turns,
        )

    def _pick_event(self, scenario: ScenarioConfig, rng: random.Random) -> ScenarioEventSpec:
        events = scenario.event_catalog
        weights = [event.weight for event in events]
        return rng.choices(events, weights=weights, k=1)[0]

    def _apply_turn(
        self,
        state: GameState,
        action: ScenarioActionSpec,
        event: ScenarioEventSpec,
        scenario: ScenarioConfig,
    ) -> GameState:
        next_state = state.model_copy(deep=True)
        self._decrement_cooldowns(next_state)
        self._apply_effects(next_state, action.effects)
        self._apply_effects(next_state, event.effects)
        next_state.visible.retention_score += scenario.transition_coefficients.get("retention_decay", -0.01)
        next_state.latent.churn_pressure += scenario.transition_coefficients.get("churn_drift", 0.01)
        next_state.latent.action_fatigue += scenario.transition_coefficients.get("fatigue_decay", -0.02)
        next_state.last_action = action.action_id
        next_state.action_cooldowns[action.action_id] = action.cooldown
        next_state.turn += 1
        self._normalize_state(next_state)
        if next_state.turn > scenario.max_turns:
            next_state.completed = True
            next_state.revealed_event_id = None
        return next_state

    def _decrement_cooldowns(self, state: GameState) -> None:
        updated: dict[str, int] = {}
        for action_id, remaining in state.action_cooldowns.items():
            next_remaining = max(0, remaining - 1)
            if next_remaining > 0:
                updated[action_id] = next_remaining
        state.action_cooldowns = updated

    def _apply_effects(self, state: GameState, effects: dict[str, float]) -> None:
        for field, delta in effects.items():
            if field in VISIBLE_FIELDS:
                current = getattr(state.visible, field)
                updated = current + delta
                if field == "user_base":
                    setattr(state.visible, field, int(updated))
                else:
                    setattr(state.visible, field, updated)
            elif field in LATENT_FIELDS:
                current = getattr(state.latent, field)
                setattr(state.latent, field, current + delta)

    def _normalize_state(self, state: GameState) -> None:
        state.visible.user_base = max(0, state.visible.user_base)
        ratio_fields = [
            "active_ratio",
            "retention_score",
            "paying_ratio",
            "lock_in_score",
            "incident_pressure",
        ]
        latent_ratio_fields = [
            "churn_pressure",
            "trust_score",
            "competitive_pressure",
            "budget_stress",
            "action_fatigue",
        ]
        for field in ratio_fields:
            setattr(state.visible, field, max(0.0, min(1.0, getattr(state.visible, field))))
        for field in latent_ratio_fields:
            setattr(state.latent, field, max(0.0, min(1.0, getattr(state.latent, field))))

    def _reward(
        self,
        previous_state: GameState,
        next_state: GameState,
        action: ScenarioActionSpec,
        scenario: ScenarioConfig,
    ) -> RewardComponents:
        profit = (
            (next_state.visible.user_base - previous_state.visible.user_base) / 100.0
            + (next_state.visible.paying_ratio - previous_state.visible.paying_ratio) * 25.0
        )
        user_quality = (next_state.visible.retention_score - previous_state.visible.retention_score) * 20.0
        lockin = (next_state.visible.lock_in_score - previous_state.visible.lock_in_score) * 18.0
        action_cost = -1.0 * (action.direct_cost * 10.0 + action.ops_cost * 8.0)
        incident_penalty = -1.0 * next_state.visible.incident_pressure * 6.0
        weights = scenario.reward_weights
        total = (
            profit * weights.get("profit", 1.0)
            + user_quality * weights.get("user_quality", 1.0)
            + lockin * weights.get("lockin", 1.0)
            + action_cost * weights.get("action_cost", 1.0)
            + incident_penalty * weights.get("incident_penalty", 1.0)
        )
        return RewardComponents(
            profit=round(profit, 2),
            user_quality=round(user_quality, 2),
            lockin=round(lockin, 2),
            action_cost=round(action_cost, 2),
            incident_penalty=round(incident_penalty, 2),
            total=round(total, 2),
        )

    def _shadow_policy(
        self,
        state: GameState,
        event: ScenarioEventSpec,
        scenario: ScenarioConfig,
        chosen_action: ScenarioActionSpec,
    ) -> ShadowPolicyComparison:
        candidates = self.available_actions(
            SessionRecord(
                session_id=state.session_id,
                seed=0,
                scenario=scenario,
                state=state,
                rng=random.Random(0),
                current_event=event,
                replay_path=Path(state.history_ref or "replay.jsonl"),
            )
        )
        best_action = chosen_action
        best_q = float("-inf")
        user_q = float("-inf")
        for candidate in candidates:
            simulated = self._apply_turn(state, candidate, event, scenario)
            q_value = self._reward(state, simulated, candidate, scenario).total
            if candidate.action_id == chosen_action.action_id:
                user_q = q_value
            if q_value > best_q:
                best_q = q_value
                best_action = candidate
        return ShadowPolicyComparison(
            recommended_action=best_action.action_id,
            user_action_q=round(user_q, 2),
            best_action_q=round(best_q, 2),
            regret=round(best_q - user_q, 2),
        )

    def _packet(
        self,
        record: SessionRecord,
        action: ScenarioActionSpec,
        event: ScenarioEventSpec,
        next_state: GameState,
        reward: RewardComponents,
        shadow: ShadowPolicyComparison,
    ) -> TurnResultPacket:
        previous_state = record.state
        summary = {
            "user_base_delta": next_state.visible.user_base - previous_state.visible.user_base,
            "retention_delta": round(next_state.visible.retention_score - previous_state.visible.retention_score, 4),
            "lock_in_delta": round(next_state.visible.lock_in_score - previous_state.visible.lock_in_score, 4),
            "trust_delta": round(next_state.latent.trust_score - previous_state.latent.trust_score, 4),
        }
        driver = max(
            [
                ("retention", abs(summary["retention_delta"])),
                ("lock_in", abs(summary["lock_in_delta"])),
                ("user_base", abs(float(summary["user_base_delta"]))),
                ("trust", abs(summary["trust_delta"])),
            ],
            key=lambda item: item[1],
        )[0]
        return TurnResultPacket(
            session_id=record.session_id,
            turn=record.state.turn,
            event=event,
            action_taken=action.action_id,
            next_state_summary=summary,
            reward=reward,
            shadow_policy=shadow,
            next_state=next_state,
            llm_context={
                "risk_summary": f"{event.label} exposed a pressure point before {action.label} was applied.",
                "main_driver": driver,
            },
        )

    def _append_replay(self, replay_path: Path, packet: TurnResultPacket) -> None:
        replay_path.parent.mkdir(parents=True, exist_ok=True)
        with replay_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(packet.model_dump(mode="json"), ensure_ascii=True))
            handle.write("\n")
