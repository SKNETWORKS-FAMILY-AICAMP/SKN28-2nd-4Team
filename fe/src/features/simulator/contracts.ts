export type Severity = 'critical' | 'high' | 'medium'
export type SystemId = 'growth' | 'trust' | 'platform' | 'support'

export type SystemSummary = {
  id: SystemId
  name: string
  label: string
  summary: string
  danger: number
  requests: number
}

export type Incident = {
  id: string
  systemId: SystemId
  eventId: string
  title: string
  summary: string
  severity: Severity
  requester: string
  impact: string
  window: string
  request: string
  affectedFeatures: string[]
  featureMultipliers: Record<string, number>
  featureAdditions: Record<string, number>
  lossRateBias: number
}

export type PredictionRow = {
  id: string
  segment: string
  churnRisk: string
  urgency: string
  projectedLoss: string
  trigger: string
}

export type OperatorSeedMessage = {
  id: string
  role: 'operator' | 'user'
  text: string
}

export type ModelSignal = {
  label: string
  value: string
  detail: string
}

export type TrendPoint = {
  label: string
  actualUsers: number | null
  predictedUsers: number
  churnRisk: number
}

export type PolicyFocus = {
  title: string
  summary: string
  recommendation: string
  rankingFactors: Array<{ factor: string; weight: 'Critical' | 'High' | 'Medium' | 'Low' }>
}

export type SimulatorWorkspace = {
  monthlyLabel: string
  scenarioLabel: string
  scenarioSummary: string
}

export type SimulatorDashboardData = {
  workspace: SimulatorWorkspace
  systems: SystemSummary[]
  incidents: Incident[]
  predictionRows: PredictionRow[]
  initialMessages: OperatorSeedMessage[]
  modelSignals: ModelSignal[]
  focusBySystem: Record<SystemId, PolicyFocus>
  trendBySystem: Record<SystemId, TrendPoint[]>
}
