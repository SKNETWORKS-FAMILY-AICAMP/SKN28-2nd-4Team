import type {
  Incident,
  OperatorMessage,
  Policy,
  PolicyFocus,
  SimulatorDashboardData,
  SystemId,
  TrendPoint,
} from '@/features/simulator/contracts'
import type { PredictionState } from '@/shared/api/contracts'

type StrategyWorkspaceModel = {
  selectedSystem: SimulatorDashboardData['systems'][number]
  highlightedIncident: Incident
  incidents: Incident[]
  messages: OperatorMessage[]
  policies: Policy[]
  monthlyLabel: string
  scenarioLabel: string
  scenarioSummary: string
  stateMetrics: Array<{
    label: string
    value: string
    detail: string
    tone: 'critical' | 'watch' | 'stable'
  }>
  trend: TrendPoint[]
  policyFocus: PolicyFocus
}

function buildStateMetrics(
  currentState: PredictionState,
  incidents: Incident[],
  trend: TrendPoint[],
): StrategyWorkspaceModel['stateMetrics'] {
  const latestPrediction = trend.at(-1) ?? trend[0]

  return [
    {
      label: '현재 활성 유저 수',
      value: `${currentState.current_users.toLocaleString()}`,
      detail: 'BE live state 기준',
      tone: 'stable',
    },
    {
      label: 'M+1 예측 유저 수',
      value: `${latestPrediction.predictedUsers.toLocaleString()}`,
      detail: '선택 전략 적용 후 BE 예측값',
      tone: latestPrediction.predictedUsers < currentState.current_users * 0.9 ? 'critical' : 'watch',
    },
    {
      label: '활성 시나리오 이벤트',
      value: `${incidents.length}`,
      detail: '선택 시스템 기준 시나리오 수',
      tone: incidents.length >= 2 ? 'watch' : 'stable',
    },
    {
      label: '이탈 위험도 (Churn Risk)',
      value: `${latestPrediction.churnRisk}%`,
      detail: 'BE prediction response 기준',
      tone: latestPrediction.churnRisk > 30 ? 'critical' : latestPrediction.churnRisk > 15 ? 'watch' : 'stable',
    },
  ]
}

export function buildStrategyWorkspaceModel(input: {
  dashboardData: SimulatorDashboardData
  selectedSystemId: SystemId
  selectedIncidentId: string | null
  policies: Policy[]
  threadMessages: OperatorMessage[]
  currentState: PredictionState
  liveTrend?: TrendPoint[]
}): StrategyWorkspaceModel {
  const selectedSystem =
    input.dashboardData.systems.find((system) => system.id === input.selectedSystemId)
    ?? input.dashboardData.systems[0]
  const incidents = input.dashboardData.incidents.filter((incident) => incident.systemId === selectedSystem.id)
  const policies = input.policies.filter((policy) => policy.systemId === selectedSystem.id)
  const highlightedIncident =
    incidents.find((incident) => incident.id === input.selectedIncidentId)
    ?? incidents[0]
  const trend = input.liveTrend && input.liveTrend.length > 0
    ? input.liveTrend
    : input.dashboardData.trendBySystem[selectedSystem.id].slice(0, 1)
  const focus = input.dashboardData.focusBySystem[selectedSystem.id]
  const latestLabel = trend.at(-1)?.label ?? input.dashboardData.workspace.monthlyLabel

  return {
    selectedSystem,
    highlightedIncident,
    incidents,
    messages: input.threadMessages,
    policies,
    monthlyLabel: latestLabel,
    scenarioLabel: input.dashboardData.workspace.scenarioLabel,
    scenarioSummary: input.dashboardData.workspace.scenarioSummary,
    stateMetrics: buildStateMetrics(input.currentState, incidents, trend),
    trend,
    policyFocus: focus,
  }
}
