from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ScenarioActionSpec(BaseModel):
    action_id: str
    label: str
    direct_cost: float = 0.0
    ops_cost: float = 0.0
    cooldown: int = 0
    min_paying_ratio: float | None = None
    max_incident_pressure: float | None = None
    effects: dict[str, float] = Field(default_factory=dict)


class ScenarioEventSpec(BaseModel):
    event_id: str
    label: str
    weight: float = 1.0
    description: str = ""
    effects: dict[str, float] = Field(default_factory=dict)


class ScenarioConfig(BaseModel):
    scenario_id: str
    label: str
    description: str
    max_turns: int = 8
    initial_state: dict[str, float | int | str | None]
    action_catalog: list[ScenarioActionSpec]
    event_catalog: list[ScenarioEventSpec]
    reward_weights: dict[str, float]
    transition_coefficients: dict[str, float] = Field(default_factory=dict)
    policy_config: dict[str, str | int | float] = Field(default_factory=dict)


class VisibleState(BaseModel):
    user_base: int = 10000
    active_ratio: float = 0.55
    retention_score: float = 0.58
    paying_ratio: float = 0.14
    lock_in_score: float = 0.45
    incident_pressure: float = 0.20


class LatentState(BaseModel):
    churn_pressure: float = 0.35
    trust_score: float = 0.57
    competitive_pressure: float = 0.40
    budget_stress: float = 0.25
    action_fatigue: float = 0.10


class GameState(BaseModel):
    session_id: str
    turn: int = 1
    visible: VisibleState
    latent: LatentState
    last_action: str | None = None
    action_cooldowns: dict[str, int] = Field(default_factory=dict)
    revealed_event_id: str | None = None
    history_ref: str | None = None
    completed: bool = False


class RewardComponents(BaseModel):
    profit: float
    user_quality: float
    lockin: float
    action_cost: float
    incident_penalty: float
    total: float


class ShadowPolicyComparison(BaseModel):
    recommended_action: str
    user_action_q: float
    best_action_q: float
    regret: float


class TurnResultPacket(BaseModel):
    session_id: str
    turn: int
    event: ScenarioEventSpec
    action_taken: str
    next_state_summary: dict[str, float | int | str]
    reward: RewardComponents
    shadow_policy: ShadowPolicyComparison
    next_state: GameState
    llm_context: dict[str, str]


class ScenarioSummary(BaseModel):
    scenario_id: str
    label: str
    description: str
    max_turns: int


class SessionStartRequest(BaseModel):
    scenario_id: str
    seed: int = 42
    mode: str = "playable"


class SessionStartResponse(BaseModel):
    session_id: str
    scenario: ScenarioSummary
    state: GameState
    current_event: ScenarioEventSpec | None
    available_actions: list[ScenarioActionSpec]
    repo_context: dict[str, str]


class TurnRequest(BaseModel):
    action_id: str


class TurnResponse(BaseModel):
    turn_result: TurnResultPacket
    next_available_actions: list[ScenarioActionSpec]
    current_event: ScenarioEventSpec | None
    replay_snippet: TurnResultPacket


class PredictionRequest(BaseModel):
    scenario_id: str | None = None
    retention_score: float
    paying_ratio: float
    lock_in_score: float
    trust_score: float
    incident_pressure: float
    competitive_pressure: float
    budget_stress: float
    action_fatigue: float


class PredictionResponse(BaseModel):
    engine_id: str
    engine_source: str
    churn_probability: float
    retention_probability: float
    risk_band: str
    drivers: list[str]


class ArchitectureResponse(BaseModel):
    service_name: str
    service_version: str
    repo_root: str
    docs_dir: str
    scenario_dir: str
    replay_dir: str
    mdp_engine: str
    prediction_engine: str
    research_workspace: str
    deployment_note: str


class ChatTextPart(BaseModel):
    type: Literal["text"] = "text"
    text: str = ""


class ChatMessage(BaseModel):
    id: str | None = None
    role: Literal["system", "user", "assistant"]
    parts: list[ChatTextPart] = Field(default_factory=list)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
