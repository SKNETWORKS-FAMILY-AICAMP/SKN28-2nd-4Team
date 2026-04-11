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
  risk: number
  retention: number
  confidence: number
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
    { label: '1월', risk: 46, retention: 68, confidence: 71 },
    { label: '2월', risk: 52, retention: 66, confidence: 70 },
    { label: '3월', risk: 58, retention: 64, confidence: 68 },
    { label: '4월', risk: 67, retention: 61, confidence: 64 },
    { label: '5월', risk: 82, retention: 58, confidence: 61 },
  ],
  trust: [
    { label: '1월', risk: 41, retention: 73, confidence: 78 },
    { label: '2월', risk: 49, retention: 72, confidence: 75 },
    { label: '3월', risk: 54, retention: 69, confidence: 72 },
    { label: '4월', risk: 63, retention: 66, confidence: 67 },
    { label: '5월', risk: 76, retention: 63, confidence: 65 },
  ],
  platform: [
    { label: '1월', risk: 33, retention: 75, confidence: 82 },
    { label: '2월', risk: 35, retention: 75, confidence: 80 },
    { label: '3월', risk: 46, retention: 73, confidence: 75 },
    { label: '4월', risk: 55, retention: 70, confidence: 70 },
    { label: '5월', risk: 68, retention: 67, confidence: 66 },
  ],
  support: [
    { label: '1월', risk: 38, retention: 72, confidence: 79 },
    { label: '2월', risk: 44, retention: 70, confidence: 76 },
    { label: '3월', risk: 53, retention: 68, confidence: 71 },
    { label: '4월', risk: 62, retention: 66, confidence: 69 },
    { label: '5월', risk: 71, retention: 64, confidence: 66 },
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
  const latest = trend.at(-1) ?? trend[0]
  const previous = trend.at(-2) ?? latest
  const riskDelta = latest.risk - previous.risk
  const retentionDelta = latest.retention - previous.retention

  return [
    {
      label: '현재 위험도',
      value: `${latest.risk}`,
      detail: `${riskDelta >= 0 ? '+' : ''}${riskDelta}p / 직전 월 대비`,
      tone: latest.risk >= 75 ? 'critical' : latest.risk >= 60 ? 'watch' : 'stable',
    },
    {
      label: '예상 잔존력',
      value: `${latest.retention}%`,
      detail: `${retentionDelta >= 0 ? '+' : ''}${retentionDelta}p / 30일 잔존`,
      tone: latest.retention <= 60 ? 'critical' : latest.retention <= 68 ? 'watch' : 'stable',
    },
    {
      label: '활성 인시던트',
      value: `${incidents.length}`,
      detail: `${selectedSystem.requests}건 요청 / 운영 큐 기준`,
      tone: incidents.length >= 2 ? 'watch' : 'stable',
    },
    {
      label: '모델 신뢰도',
      value: `${latest.confidence}%`,
      detail: 'LLM 보조 정책과 결합 가능',
      tone: latest.confidence < 65 ? 'watch' : 'stable',
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
