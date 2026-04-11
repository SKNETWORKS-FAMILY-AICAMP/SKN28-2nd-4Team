import type {
  Incident,
  OperatorMessage,
  Policy,
  SimulatorDashboardData,
  SystemId,
  ToolEvent,
} from '@/features/simulator/contracts'

type TrendPoint = {
  label: string
  actualUsers: number | null
  predictedUsers: number
  churnRisk: number
}

type StrategyWorkspaceModel = {
  selectedSystem: SimulatorDashboardData['systems'][number]
  highlightedIncident: Incident
  incidents: Incident[]
  messages: OperatorMessage[]
  policies: Policy[]
  toolEvents: ToolEvent[]
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
  policyFocus: {
    title: string
    summary: string
    recommendation: string
  }
}

const TREND_BY_SYSTEM: Record<SystemId, TrendPoint[]> = {
  growth: [
    { label: 'Month 1', actualUsers: 50200, predictedUsers: 50000, churnRisk: 12 },
    { label: 'Month 2', actualUsers: 48900, predictedUsers: 49500, churnRisk: 15 },
    { label: 'Month 3', actualUsers: 47100, predictedUsers: 48000, churnRisk: 22 },
    { label: 'Month 4', actualUsers: 45200, predictedUsers: 46000, churnRisk: 31 },
    { label: 'Month 5', actualUsers: null, predictedUsers: 43500, churnRisk: 40 },
    { label: 'Month 6 (+1)', actualUsers: null, predictedUsers: 40000, churnRisk: 55 },
  ],
  trust: [
    { label: 'Month 1', actualUsers: 50200, predictedUsers: 50000, churnRisk: 5 },
    { label: 'Month 2', actualUsers: 49800, predictedUsers: 49000, churnRisk: 8 },
    { label: 'Month 3', actualUsers: 48500, predictedUsers: 48500, churnRisk: 14 },
    { label: 'Month 4', actualUsers: 47000, predictedUsers: 47500, churnRisk: 20 },
    { label: 'Month 5', actualUsers: null, predictedUsers: 45000, churnRisk: 28 },
    { label: 'Month 6 (+1)', actualUsers: null, predictedUsers: 42500, churnRisk: 35 },
  ],
  platform: [
    { label: 'Month 1', actualUsers: 50200, predictedUsers: 50000, churnRisk: 10 },
    { label: 'Month 2', actualUsers: 49500, predictedUsers: 49000, churnRisk: 12 },
    { label: 'Month 3', actualUsers: 48000, predictedUsers: 48500, churnRisk: 18 },
    { label: 'Month 4', actualUsers: 47200, predictedUsers: 47000, churnRisk: 22 },
    { label: 'Month 5', actualUsers: null, predictedUsers: 45800, churnRisk: 26 },
    { label: 'Month 6 (+1)', actualUsers: null, predictedUsers: 43000, churnRisk: 32 },
  ],
  support: [
    { label: 'Month 1', actualUsers: 50200, predictedUsers: 50000, churnRisk: 8 },
    { label: 'Month 2', actualUsers: 49900, predictedUsers: 49000, churnRisk: 10 },
    { label: 'Month 3', actualUsers: 48200, predictedUsers: 48000, churnRisk: 15 },
    { label: 'Month 4', actualUsers: 46500, predictedUsers: 46000, churnRisk: 25 },
    { label: 'Month 5', actualUsers: null, predictedUsers: 44000, churnRisk: 35 },
    { label: 'Month 6 (+1)', actualUsers: null, predictedUsers: 40500, churnRisk: 42 },
  ],
}

const FOCUS_BY_SYSTEM: Record<
  SystemId,
  {
    title: string
    summary: string
    recommendation: string
  }
> = {
  growth: {
    title: '신규 유입 방어보다 활성 전환 회복이 우선입니다',
    summary: '추천 루프와 온보딩 이탈이 동시에 흔들리고 있어 단기 판촉보다 경험 회복형 정책이 맞습니다.',
    recommendation: '인시던트 우선 정책 + 관계 회복 메시지 + 할인 남용 제한',
  },
  trust: {
    title: '결제 신뢰 회복이 매출 방어보다 먼저입니다',
    summary: '재시도 실패와 환불 압력이 겹치는 구간이라 고객 신뢰를 먼저 회복해야 장기 잔존이 지켜집니다.',
    recommendation: 'VIP 보호 슬롯 + 결제 복구 커뮤니케이션 + 환불 완충',
  },
  platform: {
    title: '운영 안정성 복구가 모든 정책의 선행 조건입니다',
    summary: '지표 지연이 길어질수록 판단 정확도와 서비스 신뢰가 함께 떨어집니다.',
    recommendation: '배치 안정화 + 수동 승인 임계치 상향 + 보수적 정책 유지',
  },
  support: {
    title: '핵심 고객 관계 복구가 우선 과제입니다',
    summary: '응답 지연과 톤 문제는 같은 축의 신뢰 하락으로 연결되고 있습니다.',
    recommendation: '사과 메시지 정비 + VIP 우선 응대 + 보상 대신 관계 회복형 대응',
  },
}

function buildStateMetrics(
  selectedSystem: SimulatorDashboardData['systems'][number],
  incidents: Incident[],
  trend: TrendPoint[],
): StrategyWorkspaceModel['stateMetrics'] {
  const latestActual = trend.filter(t => t.actualUsers !== null).at(-1) ?? trend[0]
  const latestPrediction = trend.at(-1) ?? trend[0]

  return [
    {
      label: '현재 활성 유저 수',
      value: `${latestActual.actualUsers?.toLocaleString() ?? 0}`,
      detail: `직전 달 기준 확인됨`,
      tone: 'stable',
    },
    {
      label: 'M+1 예측 유저 수',
      value: `${latestPrediction.predictedUsers.toLocaleString()}`,
      detail: `정책 미개입 시 예상치`,
      tone: latestPrediction.predictedUsers < (latestActual.actualUsers ?? 0) * 0.9 ? 'critical' : 'watch',
    },
    {
      label: '활성 인시던트',
      value: `${incidents.length}`,
      detail: `${selectedSystem.requests}건 요청 / 운영 큐 기준`,
      tone: incidents.length >= 2 ? 'watch' : 'stable',
    },
    {
      label: '이탈 위험도 (Churn Risk)',
      value: `${latestPrediction.churnRisk}%`,
      detail: 'M+1 예측 기준',
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
  toolEvents: ToolEvent[]
}): StrategyWorkspaceModel {
  const selectedSystem =
    input.dashboardData.systems.find((system) => system.id === input.selectedSystemId)
    ?? input.dashboardData.systems[0]
  const incidents = input.dashboardData.incidents.filter((incident) => incident.systemId === selectedSystem.id)
  const highlightedIncident =
    incidents.find((incident) => incident.id === input.selectedIncidentId)
    ?? incidents[0]
  const trend = TREND_BY_SYSTEM[selectedSystem.id]
  const focus = FOCUS_BY_SYSTEM[selectedSystem.id]

  return {
    selectedSystem,
    highlightedIncident,
    incidents,
    messages: input.threadMessages,
    policies: input.policies,
    toolEvents: input.toolEvents.slice(0, 4),
    monthlyLabel: '시뮬레이션 월 5',
    scenarioLabel: '리텐션 전략 시뮬레이터',
    scenarioSummary: '상태를 읽고 정책을 선택해 다음 달의 잔존과 신뢰를 바꾸는 전략 게임',
    stateMetrics: buildStateMetrics(selectedSystem, incidents, trend),
    trend,
    policyFocus: focus,
  }
}
