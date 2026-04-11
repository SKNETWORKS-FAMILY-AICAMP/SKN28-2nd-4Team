import { useEffect } from 'react'
import { SystemNavigator } from '@/features/simulator/components/system-navigator'
import { StrategyStage } from '@/features/simulator/components/strategy-stage'
import { AdvisorConsole } from '@/features/simulator/components/advisor-console'
import { PolicyBoard } from '@/features/simulator/components/policy-board'
import { useOperatorAssistant } from '@/features/operator/hooks/use-operator-assistant'
import { useSimulatorData } from '@/features/simulator/hooks/use-simulator-data'
import { buildStrategyWorkspaceModel } from '@/features/simulator/view-models/strategy-workspace'
import { getArchitecture } from '@/shared/api/system'
import { useRuntimeStore } from '@/stores/runtime-store'
import { useSimulationUiStore } from '@/stores/simulation-ui-store'

function App() {
  const { architecture, backendMode, setArchitecture, setError } = useRuntimeStore()
  const { dashboardData, source: simulatorDataSource, errorMessage: simulatorDataError } = useSimulatorData()
  const {
    selectedSystemId,
    selectedIncidentId,
    draftRequest,
    appliedPolicies,
    setSelectedSystemId,
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
  }

  return (
    <div className="bg-surface overflow-hidden h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-background">
        <div className="flex items-center gap-8">
          <span className="font-serif text-2xl font-bold text-primary">
            Retention Strategy Simulator
          </span>
          <nav className="hidden md:flex gap-6 items-center">
            <span className="font-serif italic text-lg text-primary font-bold transition-opacity hover:opacity-80">
              {workspaceModel.monthlyLabel}
            </span>
            <div className="h-4 w-px bg-outline/20 mx-2" />
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <span className={`size-2 rounded-full ${backendMode === 'live' ? 'bg-secondary' : backendMode === 'mock' ? 'bg-primary' : 'bg-red-500 animate-pulse'}`} />
              {backendMode === 'live' ? 'Live' : backendMode === 'mock' ? 'Mock Mode' : 'Offline'}
            </span>
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
              DATA: {simulatorDataSource}
            </span>
            {architecture?.service_version && (
              <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant opacity-70">
                v{architecture.service_version}
              </span>
            )}
          </nav>
        </div>
      </header>
      
      <div className="fixed top-[64px] left-0 right-0 bg-surface-container-high h-[2px] w-full z-40" />

      <div className="flex h-screen pt-[66px]">
        <SystemNavigator
          systems={dashboardData.systems}
          selectedSystemId={selectedSystemId}
          onSelect={setSelectedSystemId}
        />

        <main className="flex-grow flex flex-col p-8 gap-8 overflow-y-auto max-h-[calc(100vh-66px)]">
          <StrategyStage
            systemName={workspaceModel.selectedSystem.name}
            systemSummary={workspaceModel.selectedSystem.summary}
            metrics={workspaceModel.stateMetrics}
            trend={workspaceModel.trend}
            focus={workspaceModel.policyFocus}
          />

          <section className="flex flex-col lg:flex-row gap-8 min-h-[400px]">
            <div className="lg:w-3/4">
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
            
            <div className="lg:w-1/4">
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
        </main>
      </div>
    </div>
  )
}

export default App
