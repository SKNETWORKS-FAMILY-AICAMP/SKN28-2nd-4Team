from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


SystemId = Literal["growth", "trust", "platform", "support"]
Severity = Literal["critical", "high", "medium"]
RiskBand = Literal["low", "medium", "high"]


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
    label: str
    description: str
    group: Literal["core", "advanced", "context"]
    minimum: float | None = None
    maximum: float | None = None
    step: float | None = None
    direction: Literal["positive", "negative", "neutral"] = "neutral"
    editable: bool = False
    editable_reason: str = ""
    budget_step: float | None = None
    unit_budget_cost: int | None = None


class EcommerceCustomerModelInput(BaseModel):
    Tenure: int = Field(ge=0, le=61)
    PreferredLoginDevice: Literal["Computer", "Mobile"]
    CityTier: int = Field(ge=1, le=3)
    WarehouseToHome: int = Field(ge=5, le=127)
    PreferredPaymentMode: Literal[
        "Cash on Delivery", "Credit Card", "Debit Card", "E wallet", "UPI"
    ]
    Gender: Literal["Female", "Male"]
    HourSpendOnApp: int = Field(ge=0, le=5)
    NumberOfDeviceRegistered: int = Field(ge=1, le=6)
    PreferedOrderCat: Literal[
        "Fashion", "Grocery", "Laptop & Accessory", "Mobile", "Others"
    ]
    SatisfactionScore: int = Field(ge=1, le=5)
    MaritalStatus: Literal["Divorced", "Married", "Single"]
    NumberOfAddress: int = Field(ge=1, le=22)
    Complain: Literal[0, 1]
    OrderAmountHikeFromlastYear: int = Field(ge=11, le=26)
    CouponUsed: int = Field(ge=0, le=16)
    OrderCount: int = Field(ge=1, le=16)
    DaySinceLastOrder: int = Field(ge=0, le=46)
    CashbackAmount: float = Field(ge=0, le=324.99)


class PredictionState(BaseModel):
    system_id: SystemId
    turn_index: int = Field(default=1, ge=1)
    current_users: int = Field(ge=0)
    model_input: EcommerceCustomerModelInput


class PredictionSessionStartRequest(BaseModel):
    system_id: SystemId
    initial_users: int = Field(ge=10000, le=20000)
    random_seed: int | None = None


class PredictionSessionStartResponse(BaseModel):
    session_id: str
    random_seed: int
    business_model_id: str
    state: PredictionState
    model_schema: list[ModelFeatureField]
    strategy_budget: "StrategyBudget"
    initial_trend_point: "SimulationTrendPoint"


class SimulationTrendPoint(BaseModel):
    label: str
    actual_users: int
    predicted_users: int
    churn_risk: float


class PredictionRequest(BaseModel):
    session_id: str
    state: PredictionState
    incident_id: str | None = None


class StrategyBudget(BaseModel):
    total_budget: int = Field(ge=0)
    remaining_budget: int = Field(ge=0)
    spent_budget: int = Field(ge=0)
    currency: Literal["credits"] = "credits"


class StrategyAdjustment(BaseModel):
    field_name: str
    label: str
    direction: Literal["increase", "decrease", "hold"]
    base_value: str | int | float
    target_value: str | int | float
    delta: float
    budget_step: float
    unit_budget_cost: int
    spent_budget: int


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
    degraded_model_input: EcommerceCustomerModelInput
    applied_adjustments: list[StrategyAdjustment]
    spent_budget_this_turn: int
    strategy_budget: StrategyBudget
    expected_lost_users: int
    predicted_users_next: int
    next_incident_id: str | None = None
    next_incident: "DashboardIncident | None" = None
    next_incident_options: list["DashboardIncident"] = Field(default_factory=list)
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
    featureMultipliers: dict[str, float] = Field(default_factory=dict)
    featureAdditions: dict[str, float] = Field(default_factory=dict)
    lossRateBias: float = 0.0


class DashboardPredictionRow(BaseModel):
    id: str
    segment: str
    churnRisk: str
    urgency: str
    projectedLoss: str
    trigger: str


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
