import { useEffect, useState } from 'react'
import { SystemNavigator, type MainViewTab } from '@/features/simulator/components/system-navigator'

// ... existing imports stay the same ...
import { StrategyStage } from '@/features/simulator/components/strategy-stage'
import { AdvisorConsole } from '@/features/simulator/components/advisor-console'
import { PolicyBoard } from '@/features/simulator/components/policy-board'
import { useOperatorAssistant } from '@/features/operator/hooks/use-operator-assistant'
import { useSimulatorData } from '@/features/simulator/hooks/use-simulator-data'
import { buildStrategyWorkspaceModel } from '@/features/simulator/view-models/strategy-workspace'
import { getArchitecture } from '@/shared/api/system'
import { useRuntimeStore } from '@/stores/runtime-store'
import { useSimulationUiStore } from '@/stores/simulation-ui-store'

export function DashboardPage() {
  const [activeView, setActiveView] = useState<MainViewTab>('status')
  
  const { architecture, backendMode, setArchitecture, setError } = useRuntimeStore()
  const { dashboardData, source: simulatorDataSource, errorMessage: simulatorDataError } = useSimulatorData()
  const {
    selectedSystemId,
    selectedIncidentId,
    draftRequest,
    appliedPolicies,
    setSelectedIncidentId,
    setDraftRequest,
    hydratePolicies,
    armPolicy,
  } = useSimulationUiStore()
  const {
    threadMessages,
    toolEvents,
    submitRequest,
    isPending: isAssistantPending,
    errorMessage: assistantErrorMessage,
  } = useOperatorAssistant()

  useEffect(() => {
    hydratePolicies(dashboardData.initialPolicies)
  }, [dashboardData.initialPolicies, hydratePolicies])

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

  const workspaceModel = buildStrategyWorkspaceModel({
    dashboardData,
    selectedSystemId,
    selectedIncidentId,
    policies: appliedPolicies.length > 0 ? appliedPolicies : dashboardData.initialPolicies,
    threadMessages: [...dashboardData.initialMessages, ...threadMessages],
    toolEvents,
  })

  function handleSubmitOperatorRequest() {
    if (!submitRequest(draftRequest)) return
    setDraftRequest('')
  }

  function handleDispatchIncident(request: string, incidentId: string) {
    setSelectedIncidentId(incidentId)
    setDraftRequest(request)
    setActiveView('advisor') // Auto-switch to advisor when an incident is dispatched
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
      </header>

      <div className="flex h-screen pt-[60px]">
        <SystemNavigator
          activeTab={activeView}
          onTabSelect={setActiveView}
        />

        <main className="flex-grow flex flex-col p-6 gap-6 overflow-y-auto max-h-[calc(100vh-60px)]">
          {activeView === 'status' ? (
            <div className="flex flex-col h-full w-full max-w-6xl mx-auto animation-fade-in fade-in">
              <StrategyStage
                systemName={workspaceModel.selectedSystem.name}
                systemSummary={workspaceModel.selectedSystem.summary}
                metrics={workspaceModel.stateMetrics}
                trend={workspaceModel.trend}
                focus={workspaceModel.policyFocus}
              />
            </div>
          ) : (
            <section className="flex flex-col xl:flex-row gap-6 h-full w-full max-w-7xl mx-auto animation-fade-in fade-in">
              <div className="xl:w-3/4 flex flex-col h-full">
                <AdvisorConsole
                  highlightedIncident={workspaceModel.highlightedIncident}
                  draftRequest={draftRequest}
                  isPending={isAssistantPending}
                  messages={workspaceModel.messages}
                  assistantError={assistantErrorMessage ?? simulatorDataError}
                  onDraftChange={setDraftRequest}
                  onSubmit={handleSubmitOperatorRequest}
                />
              </div>
              
              <div className="xl:w-1/4 flex flex-col h-full min-w-[300px]">
                <PolicyBoard
                  incidents={workspaceModel.incidents}
                  highlightedIncidentId={workspaceModel.highlightedIncident.id}
                  policies={workspaceModel.policies}
                  onIncidentSelect={setSelectedIncidentId}
                  onDispatch={handleDispatchIncident}
                  onArmPolicy={armPolicy}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
