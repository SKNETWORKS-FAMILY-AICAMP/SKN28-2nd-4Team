import { useEffect, useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SystemNavigator, type MainViewTab } from '@/features/simulator/components/system-navigator'

import { StrategyStage } from '@/features/simulator/components/strategy-stage'
import { AdvisorConsole } from '@/features/simulator/components/advisor-console'
import { PolicyBoard } from '@/features/simulator/components/policy-board'
import { useOperatorAssistant } from '@/features/operator/hooks/use-operator-assistant'
import { useSimulatorData } from '@/features/simulator/hooks/use-simulator-data'
import { useSimulationPrediction } from '@/features/simulator/hooks/use-simulation-prediction'
import { buildStrategyWorkspaceModel } from '@/features/simulator/view-models/strategy-workspace'
import { getArchitecture } from '@/shared/api/system'
import type { PredictionDecision } from '@/shared/api/contracts'
import type { OperatorMessage } from '@/features/simulator/contracts'
import { useRuntimeStore } from '@/stores/runtime-store'
import { STRATEGY_MODEL_OPTIONS, useSimulationUiStore } from '@/stores/simulation-ui-store'

export function DashboardPage() {
  const [activeView, setActiveView] = useState<MainViewTab>('status')
  const [restartToken, setRestartToken] = useState(0)
  
  const architecture = useRuntimeStore((state) => state.architecture)
  const backendMode = useRuntimeStore((state) => state.backendMode)
  const setArchitecture = useRuntimeStore((state) => state.setArchitecture)
  const setError = useRuntimeStore((state) => state.setError)
  const { dashboardData, source: simulatorDataSource, errorMessage: simulatorDataError } = useSimulatorData()
  const selectedSystemId = useSimulationUiStore((state) => state.selectedSystemId)
  const selectedIncidentId = useSimulationUiStore((state) => state.selectedIncidentId)
  const draftRequest = useSimulationUiStore((state) => state.draftRequest)
  const appliedPolicies = useSimulationUiStore((state) => state.appliedPolicies)
  const selectedStrategyModel = useSimulationUiStore((state) => state.selectedStrategyModel)
  const setSelectedIncidentId = useSimulationUiStore((state) => state.setSelectedIncidentId)
  const setDraftRequest = useSimulationUiStore((state) => state.setDraftRequest)
  const setSelectedStrategyModel = useSimulationUiStore((state) => state.setSelectedStrategyModel)
  const hydratePolicies = useSimulationUiStore((state) => state.hydratePolicies)
  const armPolicy = useSimulationUiStore((state) => state.armPolicy)
  const resetRun = useSimulationUiStore((state) => state.resetRun)
  const {
    threadMessages,
    submitRequest,
    resetAssistant,
    isPending: isAssistantPending,
    errorMessage: assistantErrorMessage,
  } = useOperatorAssistant()
  const selectedSystemTrend = useMemo(
    () => dashboardData?.trendBySystem[selectedSystemId] ?? [],
    [dashboardData, selectedSystemId],
  )
  const {
    liveTrend,
    predictionState,
    errorMessage: simulationErrorMessage,
    runDecision,
  } = useSimulationPrediction(selectedSystemId, selectedSystemTrend, dashboardData !== null, restartToken)

  useEffect(() => {
    if (!dashboardData) return
    hydratePolicies(dashboardData.initialPolicies)
  }, [dashboardData, hydratePolicies])

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

  if (!dashboardData || !predictionState || liveTrend.length === 0) {
    return (
      <div className="bg-surface h-screen flex items-center justify-center font-mono text-sm uppercase tracking-widest text-on-surface-variant">
        Loading live simulator run...
      </div>
    )
  }

  const workspaceModel = buildStrategyWorkspaceModel({
    dashboardData,
    selectedSystemId,
    selectedIncidentId,
    policies: appliedPolicies.length > 0 ? appliedPolicies : dashboardData.initialPolicies,
    threadMessages: [
      ...dashboardData.initialMessages.map<OperatorMessage>((message) => ({
        id: message.id,
        role: message.role,
        parts: [{ type: 'text', text: message.text }],
      })),
      ...threadMessages,
    ],
    currentState: predictionState,
    liveTrend,
  })

  function handleSubmitOperatorRequest() {
    void submitRequest(draftRequest, {
      monthlyLabel: workspaceModel.monthlyLabel,
      systemName: workspaceModel.selectedSystem.name,
      currentState: predictionState!,
      incident: {
        title: workspaceModel.highlightedIncident.title,
        summary: workspaceModel.highlightedIncident.summary,
        impact: workspaceModel.highlightedIncident.impact,
        request: workspaceModel.highlightedIncident.request,
      },
      armedPolicies: workspaceModel.policies
        .filter((policy) => policy.status === 'Armed')
        .map((policy) => ({
          title: policy.title,
          effect: policy.effect,
        })),
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

  function handleDispatchIncident(request: string, incidentId: string) {
    setSelectedIncidentId(incidentId)
    setDraftRequest(request)
    setActiveView('advisor') // Auto-switch to advisor when an incident is dispatched
  }

  function handleArmPolicy(policyId: string) {
    armPolicy(policyId)
    const policy = workspaceModel.policies.find((item) => item.id === policyId)
    if (!policy) return

    const decision: PredictionDecision = {
      action_id: policy.decision.actionId,
      intensity: policy.decision.intensity,
    }
    void runDecision(decision)
  }

  function handleResetRun() {
    resetRun()
    resetAssistant()
    setActiveView('status')
    setRestartToken((current) => current + 1)
  }

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
                  highlightedIncident={workspaceModel.highlightedIncident}
                  metrics={workspaceModel.stateMetrics}
                  trend={workspaceModel.trend}
                  focus={workspaceModel.policyFocus}
                />
              </div>
            ) : (
              <div className="flex flex-col h-full animation-fade-in fade-in">
                <AdvisorConsole
                  highlightedIncident={workspaceModel.highlightedIncident}
                  draftRequest={draftRequest}
                  isPending={isAssistantPending}
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
          
          <div className="w-[320px] flex-shrink-0 flex flex-col h-full">
            <PolicyBoard
              incidents={workspaceModel.incidents}
              highlightedIncidentId={workspaceModel.highlightedIncident.id}
              policies={workspaceModel.policies}
              onIncidentSelect={setSelectedIncidentId}
              onDispatch={handleDispatchIncident}
              onArmPolicy={handleArmPolicy}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
