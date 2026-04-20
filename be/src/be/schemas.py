from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


SystemId = Literal["growth", "trust", "platform", "support"]
Severity = Literal["critical", "high", "medium"]
RiskBand = Literal["low", "medium", "high"]
ActionId = Literal[
    "hold",
    "coupon_push",
    "service_recovery",
    "experience_refresh",
    "vip_protection",
    "ops_stabilize",
]


class SimulationAction(BaseModel):
    action_id: ActionId
    label: str
    summary: str


class SimulationEvent(BaseModel):
    event_id: str
    system_id: SystemId | Literal["global"] = "global"
    label: str
    summary: str
    severity: Severity
    weight: float = 1.0
    state_effects: dict[str, float] = Field(default_factory=dict)
    feature_multipliers: dict[str, float] = Field(default_factory=dict)
    feature_additions: dict[str, float] = Field(default_factory=dict)
    loss_rate_bias: float = 0.0


class ModelFeatureField(BaseModel):
    name: str
    dtype: Literal["numeric", "categorical"]
    categories: list[str] = Field(default_factory=list)


class EcommerceCustomerModelInput(BaseModel):
    Tenure: float
    PreferredLoginDevice: str
    CityTier: int
    WarehouseToHome: float
    PreferredPaymentMode: str
    Gender: str
    HourSpendOnApp: float
    NumberOfDeviceRegistered: int
    PreferedOrderCat: str
    SatisfactionScore: int
    MaritalStatus: str
    NumberOfAddress: int
    Complain: int
    OrderAmountHikeFromlastYear: float
    CouponUsed: float
    OrderCount: float
    DaySinceLastOrder: float
    CashbackAmount: float


class PredictionState(BaseModel):
    system_id: SystemId
    turn_index: int = Field(default=1, ge=1)
    current_users: int = Field(ge=0)
    model_input: EcommerceCustomerModelInput


class PredictionDecision(BaseModel):
    action_id: ActionId
    incident_id: str | None = None
    intensity: float = Field(default=0.5, ge=0.0, le=1.0)


class PredictionSessionStartRequest(BaseModel):
    system_id: SystemId
    initial_users: int = Field(ge=10000, le=20000)
    random_seed: int | None = None


class PredictionSessionStartResponse(BaseModel):
    session_id: str
    random_seed: int
    business_model_id: str
    state: PredictionState
    available_actions: list[SimulationAction]
    model_schema: list[ModelFeatureField]
    initial_trend_point: "SimulationTrendPoint"


class SimulationTrendPoint(BaseModel):
    label: str
    actual_users: int
    predicted_users: int
    churn_risk: float


class PredictionRequest(BaseModel):
    session_id: str
    state: PredictionState
    decision: PredictionDecision


class PredictionResponse(BaseModel):
    session_id: str
    engine_id: str
    engine_source: str
    business_model_id: str
    churn_probability: float
    effective_loss_rate: float
    retention_probability: float
    risk_band: RiskBand
    drivers: list[str]
    event: SimulationEvent
    expected_lost_users: int
    predicted_users_next: int
    next_state: PredictionState
    trend_point: SimulationTrendPoint


class DashboardWorkspace(BaseModel):
    monthlyLabel: str
    scenarioLabel: str
    scenarioSummary: str


class DashboardSystemSummary(BaseModel):
    id: SystemId
    name: str
    label: str
    summary: str
    danger: int
    requests: int


class DashboardIncident(BaseModel):
    id: str
    systemId: SystemId
    eventId: str
    title: str
    summary: str
    severity: Severity
    requester: str
    impact: str
    window: str
    request: str
    affectedFeatures: list[str] = Field(default_factory=list)


class DashboardPredictionRow(BaseModel):
    id: str
    segment: str
    churnRisk: str
    urgency: str
    projectedLoss: str
    trigger: str


class DashboardPolicyDecision(BaseModel):
    actionId: ActionId
    intensity: float = Field(ge=0.0, le=1.0)


class DashboardPolicy(BaseModel):
    id: str
    systemId: SystemId
    title: str
    effect: str
    owner: str
    status: Literal["Armed", "Draft", "Queued"]
    source: Literal["Preset", "Operator"]
    decision: DashboardPolicyDecision


class DashboardOperatorMessage(BaseModel):
    id: str
    role: Literal["operator", "user"]
    text: str


class DashboardModelSignal(BaseModel):
    label: str
    value: str
    detail: str


class DashboardRankingFactor(BaseModel):
    factor: str
    weight: Literal["Critical", "High", "Medium", "Low"]


class DashboardPolicyFocus(BaseModel):
    title: str
    summary: str
    recommendation: str
    rankingFactors: list[DashboardRankingFactor]


class DashboardTrendPoint(BaseModel):
    label: str
    actualUsers: int | None
    predictedUsers: int
    churnRisk: float


class SimulatorDashboardResponse(BaseModel):
    workspace: DashboardWorkspace
    systems: list[DashboardSystemSummary]
    incidents: list[DashboardIncident]
    predictionRows: list[DashboardPredictionRow]
    initialPolicies: list[DashboardPolicy]
    initialMessages: list[DashboardOperatorMessage]
    modelSignals: list[DashboardModelSignal]
    focusBySystem: dict[SystemId, DashboardPolicyFocus]
    trendBySystem: dict[SystemId, list[DashboardTrendPoint]]


class SimulationScenarioSource(BaseModel):
    dashboard: SimulatorDashboardResponse
    events: list[SimulationEvent]


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
