export type ArchitectureResponse = {
  service_name: string
  service_version: string
  repo_root: string
  docs_dir: string
  scenario_dir: string
  replay_dir: string
  mdp_engine: string
  prediction_engine: string
  research_workspace: string
  deployment_note: string
}

export type ScenarioSummary = {
  scenario_id: string
  label: string
  description: string
  max_turns: number
}

export type SimulationSystemId = 'growth' | 'trust' | 'platform' | 'support'

export type SimulationAction = {
  action_id: string
  label: string
  summary: string
}

export type ModelFeatureField = {
  name: string
  dtype: 'numeric' | 'categorical'
  categories: string[]
}

export type EcommerceCustomerModelInput = {
  Tenure: number
  PreferredLoginDevice: string
  CityTier: number
  WarehouseToHome: number
  PreferredPaymentMode: string
  Gender: string
  HourSpendOnApp: number
  NumberOfDeviceRegistered: number
  PreferedOrderCat: string
  SatisfactionScore: number
  MaritalStatus: string
  NumberOfAddress: number
  Complain: number
  OrderAmountHikeFromlastYear: number
  CouponUsed: number
  OrderCount: number
  DaySinceLastOrder: number
  CashbackAmount: number
}

export type PredictionState = {
  system_id: SimulationSystemId
  turn_index: number
  current_users: number
  model_input: EcommerceCustomerModelInput
}

export type PredictionDecision = {
  action_id: string
  incident_id?: string | null
  intensity: number
}

export type PredictionSessionStartRequest = {
  system_id: SimulationSystemId
  initial_users: number
  random_seed?: number
}

export type PredictionSessionStartResponse = {
  session_id: string
  random_seed: number
  business_model_id: string
  state: PredictionState
  available_actions: SimulationAction[]
  model_schema: ModelFeatureField[]
  initial_trend_point: SimulationTrendPointDto
}

export type SimulationEvent = {
  event_id: string
  system_id: SimulationSystemId | 'global'
  label: string
  summary: string
  severity: 'critical' | 'high' | 'medium'
  weight: number
  state_effects: Record<string, number>
  feature_multipliers: Record<string, number>
  feature_additions: Record<string, number>
  loss_rate_bias: number
}

export type SimulationTrendPointDto = {
  label: string
  actual_users: number
  predicted_users: number
  churn_risk: number
}

export type PredictionResponse = {
  session_id: string
  engine_id: string
  engine_source: string
  business_model_id: string
  churn_probability: number
  effective_loss_rate: number
  retention_probability: number
  risk_band: string
  drivers: string[]
  event: SimulationEvent
  expected_lost_users: number
  predicted_users_next: number
  next_state: PredictionState
  trend_point: SimulationTrendPointDto
}

export type PredictionRequest = {
  session_id: string
  state: PredictionState
  decision: PredictionDecision
}
