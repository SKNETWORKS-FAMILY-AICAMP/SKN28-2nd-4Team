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
  title: string
  summary: string
  severity: Severity
  requester: string
  impact: string
  window: string
  request: string
}

export type PredictionRow = {
  id: string
  segment: string
  churnRisk: string
  urgency: string
  projectedLoss: string
  trigger: string
}

export type Policy = {
  id: string
  title: string
  effect: string
  owner: string
  status: 'Armed' | 'Draft' | 'Queued'
  source: 'Preset' | 'Operator'
}

export type OperatorMessage = {
  id: string
  role: 'operator' | 'user'
  text: string
}

export type ToolEvent = {
  id: string
  tool: string
  status: 'Completed' | 'Queued' | 'Running'
  summary: string
}

export type ModelSignal = {
  label: string
  value: string
  detail: string
}

export type SimulatorDashboardData = {
  systems: SystemSummary[]
  incidents: Incident[]
  predictionRows: PredictionRow[]
  initialPolicies: Policy[]
  initialMessages: OperatorMessage[]
  modelSignals: ModelSignal[]
}
