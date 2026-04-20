import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UIMessage } from 'ai'
import {
  BadgeCheck,
  BrainCircuit,
  Coins,
  Flag,
  LineChart,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FeatureGrid, type FeatureGridItem } from '@/components/ui/feature-grid'
import { SystemNavigator, type MainViewTab } from '@/features/simulator/components/system-navigator'

import { StrategyStage } from '@/features/simulator/components/strategy-stage'
import { AdvisorConsole } from '@/features/simulator/components/advisor-console'
import { PolicyBoard } from '@/features/simulator/components/policy-board'
import { useOperatorAssistant } from '@/features/operator/hooks/use-operator-assistant'
import { useSimulatorData } from '@/features/simulator/hooks/use-simulator-data'
import { useSimulationPrediction } from '@/features/simulator/hooks/use-simulation-prediction'
import { applyIncidentDegradation } from '@/features/simulator/strategy-budget'
import { buildStrategyWorkspaceModel } from '@/features/simulator/view-models/strategy-workspace'
import { getArchitecture } from '@/shared/api/system'
import type { EcommerceCustomerModelInput } from '@/shared/api/contracts'
import type { Incident } from '@/features/simulator/contracts'
import { useRuntimeStore } from '@/stores/runtime-store'
import { STRATEGY_MODEL_OPTIONS, useSimulationUiStore } from '@/stores/simulation-ui-store'

type GameRunStatus = {
  kind: 'in_progress' | 'failed' | 'success'
  title: string
  detail: string
}

function OverlayModal({
  badge,
  title,
  description,
  children,
  actions,
}: {
  badge: string
  title: string
  description: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded border border-outline-variant/30 bg-surface-container-high p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary">{badge}</p>
        <h2 className="mt-2 font-serif text-3xl font-black text-primary">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">{description}</p>
        <div className="mt-6 space-y-4">{children}</div>
        <div className="mt-6 flex justify-end gap-3">{actions}</div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [activeView, setActiveView] = useState<MainViewTab>('status')
  const [restartToken, setRestartToken] = useState(0)
  const [runtimeIncidents, setRuntimeIncidents] = useState<Incident[]>([])
  const [showTutorialModal, setShowTutorialModal] = useState(true)
  const [showResultModal, setShowResultModal] = useState(false)
  
  const architecture = useRuntimeStore((state) => state.architecture)
  const backendMode = useRuntimeStore((state) => state.backendMode)
  const setArchitecture = useRuntimeStore((state) => state.setArchitecture)
  const setError = useRuntimeStore((state) => state.setError)
  const { dashboardData, source: simulatorDataSource, errorMessage: simulatorDataError } = useSimulatorData()
  const selectedSystemId = useSimulationUiStore((state) => state.selectedSystemId)
  const selectedIncidentId = useSimulationUiStore((state) => state.selectedIncidentId)
  const draftRequest = useSimulationUiStore((state) => state.draftRequest)
  const selectedStrategyModel = useSimulationUiStore((state) => state.selectedStrategyModel)
  const setSelectedIncidentId = useSimulationUiStore((state) => state.setSelectedIncidentId)
  const setDraftRequest = useSimulationUiStore((state) => state.setDraftRequest)
  const setSelectedStrategyModel = useSimulationUiStore((state) => state.setSelectedStrategyModel)
  const resetRun = useSimulationUiStore((state) => state.resetRun)
  const selectedSystemTrend = useMemo(
    () => dashboardData?.trendBySystem[selectedSystemId] ?? [],
    [dashboardData, selectedSystemId],
  )
  const {
    modelSchema,
    isPending: isPredictionPending,
    liveTrend,
    predictionState,
    strategyBudget,
    errorMessage: simulationErrorMessage,
    runPrediction,
  } = useSimulationPrediction(selectedSystemId, selectedSystemTrend, dashboardData !== null, restartToken)

  useEffect(() => {
    if (!dashboardData) return
    setRuntimeIncidents(dashboardData.incidents)
  }, [dashboardData, restartToken])

  const mergedDashboardData = useMemo(
    () => (dashboardData ? { ...dashboardData, incidents: runtimeIncidents } : null),
    [dashboardData, runtimeIncidents],
  )

  const currentSystemIncidents = useMemo(
    () => mergedDashboardData?.incidents.filter((incident) => incident.systemId === selectedSystemId) ?? [],
    [mergedDashboardData, selectedSystemId],
  )

  const seedMessages = useMemo<UIMessage[]>(() => {
    if (!mergedDashboardData) return []

    return mergedDashboardData.initialMessages.map((message) => ({
      id: message.id,
      role: message.role === 'user' ? 'user' : 'assistant',
      parts: [{ type: 'text', text: message.text }],
    }))
  }, [mergedDashboardData])

  const {
    threadMessages,
    submitRequest,
    resetAssistant,
    isPending: isAssistantPending,
    errorMessage: assistantErrorMessage,
  } = useOperatorAssistant(seedMessages, restartToken)

  useEffect(() => {
    if (currentSystemIncidents.length === 0) return
    if (selectedIncidentId && currentSystemIncidents.some((incident) => incident.id === selectedIncidentId)) return
    setSelectedIncidentId(currentSystemIncidents[0].id)
  }, [currentSystemIncidents, selectedIncidentId, setSelectedIncidentId])

  useEffect(() => {
    if (!selectedIncidentId) return
    console.groupCollapsed('[dashboard:incident-state]')
    console.log('selected_incident_id', selectedIncidentId)
    console.log('current_system_incident_ids', currentSystemIncidents.map((incident) => incident.id))
    console.groupEnd()
  }, [currentSystemIncidents, selectedIncidentId])

  useEffect(() => {
    let isCancelled = false

    void getArchitecture()
      .then(({ data, source }) => {
        if (isCancelled) return
        setArchitecture(data, source)
      })
      .catch((error) => {
        if (isCancelled) return
        setError(error instanceof Error ? error.message : 'Failed to load backend architecture.')
      })

    return () => {
      isCancelled = true
    }
  }, [setArchitecture, setError])

  const baselineUsers = liveTrend[0]?.actualUsers ?? liveTrend[0]?.predictedUsers ?? predictionState?.current_users ?? 0
  const currentMonth = predictionState?.turn_index ?? 1
  const currentUsers = predictionState?.current_users ?? baselineUsers
  const userDropRate = baselineUsers > 0 ? (baselineUsers - currentUsers) / baselineUsers : 0
  const budgetExhaustedEarly = currentMonth <= 12 && (strategyBudget?.remaining_budget ?? 0) <= 0
  const userDropFailed = currentMonth <= 24 && userDropRate >= 0.3

  const gameStatus: GameRunStatus = userDropFailed
    ? {
        kind: 'failed',
        title: 'Game Over',
        detail: `Month ${currentMonth} 기준 초기 유저 대비 ${Math.round(userDropRate * 100)}% 이상 하락했습니다.`,
      }
    : budgetExhaustedEarly
      ? {
          kind: 'failed',
          title: 'Game Over',
          detail: `Month ${currentMonth} 안에 전체 예산을 모두 소진했습니다. Month 12 이전 예산 소진은 실패 조건입니다.`,
        }
      : currentMonth >= 24
        ? {
            kind: 'success',
            title: 'Mission Clear',
            detail: 'Month 24를 버텨냈고, 조기 예산 소진과 30% 유저 손실을 모두 피했습니다.',
          }
        : {
            kind: 'in_progress',
            title: 'Simulation In Progress',
            detail: `Month ${currentMonth}/24 · remaining budget ${(strategyBudget?.remaining_budget ?? 0).toLocaleString()} · user drop ${(userDropRate * 100).toFixed(1)}%`,
          }

  useEffect(() => {
    if (gameStatus.kind === 'in_progress') return
    setShowResultModal(true)
  }, [gameStatus.kind])

  if (!mergedDashboardData || !predictionState || liveTrend.length === 0) {
    return (
      <div className="bg-surface h-screen flex items-center justify-center font-mono text-sm uppercase tracking-widest text-on-surface-variant">
        Loading live simulator run...
      </div>
    )
  }

  const workspaceModel = buildStrategyWorkspaceModel({
    dashboardData: mergedDashboardData,
    selectedSystemId,
    selectedIncidentId,
    threadMessages,
    currentState: predictionState,
    liveTrend,
  })

  const incidentDegradedInput = modelSchema.length === 0
    ? predictionState.model_input
    : applyIncidentDegradation(
        predictionState.model_input,
        workspaceModel.highlightedIncident,
        modelSchema,
      )

  const draftSeedKey = `${predictionState.turn_index}:${workspaceModel.highlightedIncident.id}`

  function handleSubmitOperatorRequest() {
    void submitRequest(draftRequest, {
      monthlyLabel: workspaceModel.monthlyLabel,
      systemName: workspaceModel.selectedSystem.name,
      currentState: predictionState!,
      incident: {
        id: workspaceModel.highlightedIncident.id,
        eventId: workspaceModel.highlightedIncident.eventId,
        title: workspaceModel.highlightedIncident.title,
        summary: workspaceModel.highlightedIncident.summary,
        severity: workspaceModel.highlightedIncident.severity,
        impact: workspaceModel.highlightedIncident.impact,
        window: workspaceModel.highlightedIncident.window,
        request: workspaceModel.highlightedIncident.request,
        affectedFeatures: workspaceModel.highlightedIncident.affectedFeatures,
        featureMultipliers: workspaceModel.highlightedIncident.featureMultipliers,
        featureAdditions: workspaceModel.highlightedIncident.featureAdditions,
        lossRateBias: workspaceModel.highlightedIncident.lossRateBias,
      },
      visibleIncidents: workspaceModel.incidents,
      modelSchema,
      strategyBudget,
      armedPolicies: [],
      latestTrend: workspaceModel.trend.at(-1)
        ? {
            actualUsers: workspaceModel.trend.at(-1)?.actualUsers ?? null,
            predictedUsers: workspaceModel.trend.at(-1)?.predictedUsers ?? 0,
            churnRisk: workspaceModel.trend.at(-1)?.churnRisk ?? 0,
          }
        : undefined,
    }).then((submitted) => {
      if (!submitted) return
      setDraftRequest('')
    })
  }

  function handleApplyModelInput(incidentId: string, modelInput: EcommerceCustomerModelInput) {
    void runPrediction(modelInput, incidentId).then((response) => {
      if (!response) return
      if (response.next_incident_options && response.next_incident_options.length > 0) {
        setRuntimeIncidents((current) => {
          const otherSystems = current.filter((incident) => incident.systemId !== selectedSystemId)
          return [...otherSystems, ...response.next_incident_options!]
        })
      } else if (response.next_incident) {
        setRuntimeIncidents((current) => {
          const index = current.findIndex((incident) => incident.id === response.next_incident?.id)
          if (index === -1) return [...current, response.next_incident!]

          const next = [...current]
          next[index] = response.next_incident!
          return next
        })
      }
      if (response.next_incident_id) {
        setSelectedIncidentId(response.next_incident_id)
      }
      console.groupCollapsed('[dashboard:incident-rotation]')
      console.log('requested_incident_id', incidentId)
      console.log('next_incident_id', response.next_incident_id)
      console.log('next_incident', response.next_incident)
      console.log('next_incident_options', response.next_incident_options)
      console.groupEnd()
    })
  }

  function handleResetRun() {
    resetRun()
    resetAssistant()
    setActiveView('status')
    setShowTutorialModal(true)
    setShowResultModal(false)
    setRestartToken((current) => current + 1)
  }

  const interactionDisabled = gameStatus.kind !== 'in_progress'

  const tutorialRuleItems: FeatureGridItem[] = [
    {
      icon: Coins,
      eyebrow: 'Failure Rule',
      title: 'Month 12 전 예산 소진 금지',
      description: '12개월 안에 전체 budget을 모두 쓰면 바로 실패합니다. 초반에는 핵심 레버만 골라 써야 합니다.',
    },
    {
      icon: TrendingDown,
      eyebrow: 'Failure Rule',
      title: '유저 30% 이상 하락 금지',
      description: '24개월 안에 초기 유저 대비 30% 이상 떨어지면 실패합니다. baseline 대비 하락폭을 계속 보면서 방어해야 합니다.',
    },
    {
      icon: BadgeCheck,
      eyebrow: 'Success Rule',
      title: 'Month 24까지 생존',
      description: '두 실패 조건을 피한 채 Month 24를 채우면 성공입니다. 즉 단기 방어와 장기 운영 효율을 같이 잡아야 합니다.',
    },
  ]

  const tutorialAreaItems: FeatureGridItem[] = [
    {
      icon: LineChart,
      eyebrow: 'Status Stage',
      title: '그래프와 상태 메트릭',
      description: '현재 유저, 예측 유저, churn risk, baseline 대비 하락폭을 읽습니다. turn 수가 늘면 좌우 스크롤로 과거 구간을 확인합니다.',
    },
    {
      icon: ShieldAlert,
      eyebrow: 'Issue Board',
      title: '현재 핵심 이슈 2개',
      description: '우측 상단 카드 두 장이 현재 turn의 시나리오 후보입니다. 어떤 input이 흔들리는지 보고 우선순위를 정합니다.',
    },
    {
      icon: SlidersHorizontal,
      eyebrow: 'Strategy Options',
      title: '직접 조절하는 전략 레버',
      description: '핵심 전략 레버를 budget 안에서 조절합니다. Apply 전에는 planned spend와 projected remaining만 바뀝니다.',
    },
    {
      icon: BrainCircuit,
      eyebrow: 'Strategy Core',
      title: 'AI 제안과 staged 수정',
      description: '좌측 콘솔에서 제안을 받고, 진행 요청 시 AI가 form 값만 미리 맞춰줄 수 있습니다. prediction 실행은 Apply Strategy Input 이후입니다.',
    },
    {
      icon: Flag,
      eyebrow: 'Game Loop',
      title: '한 턴의 흐름',
      description: '이슈 확인 -> 값 조정 -> 예산 확인 -> Apply -> 다음 시나리오 2개 갱신. 이 루프를 24개월 동안 반복합니다.',
    },
  ]

  const resultSummaryItems: FeatureGridItem[] = [
    {
      icon: Flag,
      eyebrow: 'Current Month',
      title: `Month ${currentMonth}`,
      description: '현재 턴 기준으로 결과를 판정했습니다.',
    },
    {
      icon: Coins,
      eyebrow: 'Remaining Budget',
      title: `${(strategyBudget?.remaining_budget ?? 0).toLocaleString()}`,
      description: '남은 전략 budget 입니다.',
    },
    {
      icon: TrendingDown,
      eyebrow: 'User Drop',
      title: `${(userDropRate * 100).toFixed(1)}%`,
      description: '초기 유저 대비 현재 하락률입니다.',
    },
  ]

  return (
    <div className="bg-surface overflow-hidden h-screen flex flex-col font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-surface-container-low border-b border-outline-variant/30">
        <div className="flex items-center gap-8">
          <span className="font-mono text-xl font-bold text-red-500 uppercase tracking-widest">
            U.C. Simulation Core
          </span>
          <nav className="hidden md:flex gap-6 items-center">
            <span className="font-mono text-sm text-primary font-bold transition-opacity hover:opacity-80">
              {workspaceModel.monthlyLabel}
            </span>
            <div className="h-4 w-px bg-outline/50 mx-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <span className={`size-2 rounded-full ${backendMode === 'live' ? 'bg-secondary' : backendMode === 'mock' ? 'bg-primary' : 'bg-red-500 animate-pulse'}`} />
              {backendMode === 'live' ? 'Live' : backendMode === 'mock' ? 'Mock' : 'Offline'}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
              DATA: {simulatorDataSource}
            </span>
            {architecture?.service_version && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant opacity-70">
                v{architecture.service_version}
              </span>
            )}
          </nav>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-mono uppercase tracking-widest"
          onClick={handleResetRun}
          disabled={isAssistantPending}
        >
          <RotateCcw className="size-3.5" />
          Reset Run
        </Button>
      </header>

      <div className="flex h-screen pt-[60px]">
        <SystemNavigator
          activeTab={activeView}
          onTabSelect={setActiveView}
        />

        <main className="flex-grow flex p-6 gap-6 overflow-y-auto max-h-[calc(100vh-60px)]">
          <div className="flex-1 min-w-0">
            {activeView === 'status' ? (
              <div className="flex flex-col h-full w-full animation-fade-in fade-in">
                <StrategyStage
                  systemName={workspaceModel.selectedSystem.name}
                  systemSummary={workspaceModel.selectedSystem.summary}
                  metrics={workspaceModel.stateMetrics}
                  trend={workspaceModel.trend}
                />
              </div>
            ) : (
              <div className="flex flex-col h-full animation-fade-in fade-in">
                <AdvisorConsole
                  highlightedIncident={workspaceModel.highlightedIncident}
                  draftRequest={draftRequest}
                  isPending={isAssistantPending}
                  interactionDisabled={interactionDisabled}
                  interactionMessage={interactionDisabled ? gameStatus.detail : null}
                  messages={workspaceModel.messages}
                  assistantError={assistantErrorMessage ?? simulationErrorMessage ?? simulatorDataError}
                  selectedStrategyModel={selectedStrategyModel}
                  strategyModelOptions={STRATEGY_MODEL_OPTIONS}
                  onDraftChange={setDraftRequest}
                  onStrategyModelChange={(value) => setSelectedStrategyModel(value as typeof selectedStrategyModel)}
                  onSubmit={handleSubmitOperatorRequest}
                />
              </div>
            )}
          </div>
          
          <div className="w-[min(960px,56vw)] flex-shrink-0 flex flex-col h-full">
            <PolicyBoard
              incidents={workspaceModel.incidents}
              selectedIncidentId={selectedIncidentId ?? workspaceModel.highlightedIncident.id}
              key={`${selectedIncidentId ?? workspaceModel.highlightedIncident.id}-${predictionState.turn_index}`}
              modelSchema={modelSchema}
              draftBaseModelInput={incidentDegradedInput}
              draftSeedKey={draftSeedKey}
              strategyBudget={strategyBudget}
              isPending={isPredictionPending}
              interactionDisabled={interactionDisabled}
              interactionMessage={interactionDisabled ? gameStatus.detail : null}
              onIncidentSelect={setSelectedIncidentId}
              onApplyModelInput={handleApplyModelInput}
            />
          </div>
        </main>
      </div>

      {showTutorialModal ? (
        <OverlayModal
          badge="Simulation Briefing"
          title="Simulation Briefing"
          description="24개월 동안 유저 하락을 방어하는 전략 시뮬레이션입니다. 규칙과 화면 구조를 확인한 뒤 시작하세요."
          actions={(
            <Button className="font-mono uppercase tracking-widest" onClick={() => setShowTutorialModal(false)}>
              확인 후 시작
            </Button>
          )}
        >
          <FeatureGrid items={tutorialRuleItems} columns={3} tone="warning" />
          <FeatureGrid items={tutorialAreaItems} columns={3} tone="info" />
        </OverlayModal>
      ) : null}

      {showResultModal && gameStatus.kind !== 'in_progress' ? (
        <OverlayModal
          badge={gameStatus.kind === 'success' ? 'Mission Result' : 'Run Failure'}
          title={gameStatus.title}
          description={gameStatus.detail}
          actions={(
            <>
              <Button variant="outline" className="font-mono uppercase tracking-widest" onClick={() => setShowResultModal(false)}>
                상태 보기
              </Button>
              <Button className="font-mono uppercase tracking-widest" onClick={handleResetRun}>
                Reset Run
              </Button>
            </>
          )}
        >
          <FeatureGrid items={resultSummaryItems} columns={3} tone={gameStatus.kind === 'success' ? 'success' : 'danger'} />
        </OverlayModal>
      ) : null}
    </div>
  )
}
