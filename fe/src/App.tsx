import { useEffect, useState, useTransition } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Layers3,
  MessageSquareText,
  Radar,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  useOperatorAssistant,
} from '@/features/operator/hooks/use-operator-assistant'
import {
  useSimulatorData,
} from '@/features/simulator/hooks/use-simulator-data'
import type {
  OperatorMessage,
  Policy,
  SimulatorDashboardData,
  SystemId,
} from '@/features/simulator/contracts'
import { getArchitecture } from '@/shared/api/system'
import { cn } from '@/lib/utils'
import { useRuntimeStore } from '@/stores/runtime-store'

type DemoTab = 'prediction' | 'operator'

const DEMO_TABS: Array<{ id: DemoTab; label: string; detail: string }> = [
  { id: 'prediction', label: 'Prediction Model', detail: 'The Archive' },
  { id: 'operator', label: 'Operator Game', detail: 'The War Room' },
]

// Custom Badge component for the editorial look
function StampBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] font-label rounded-sm",
      "bg-surface-container-highest border border-outline/10 text-on-surface-variant",
      className
    )}>
      {children}
    </span>
  )
}

function HeirloomButton({ children, className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button 
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary to-primary-container text-white border-none",
        "rounded-md px-6 py-2 h-auto text-sm font-sans font-semibold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<DemoTab>('operator')
  const [selectedSystemId, setSelectedSystemId] = useState<SystemId>('growth')
  const [operatorPanelOpen, setOperatorPanelOpen] = useState(true)
  const [draftRequest, setDraftRequest] = useState('Growth 위험을 줄이되 할인 남발 없이 리텐션을 방어해줘.')
  const [isPending, startTransition] = useTransition()
  const { architecture, backendMode, errorMessage, setArchitecture, setError } = useRuntimeStore()
  const { dashboardData, source: simulatorDataSource, errorMessage: simulatorDataError } = useSimulatorData()
  const [policies, setPolicies] = useState<Policy[]>(() => dashboardData.initialPolicies)

  const selectedSystem = dashboardData.systems.find((system) => system.id === selectedSystemId) ?? dashboardData.systems[0]
  const activeIncidents = dashboardData.incidents.filter((incident) => incident.systemId === selectedSystem.id)
  const {
    threadMessages,
    toolEvents,
    submitRequest,
    isPending: isAssistantPending,
    errorMessage: assistantErrorMessage,
  } = useOperatorAssistant()
  const messages: OperatorMessage[] = [...dashboardData.initialMessages, ...threadMessages]

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

  function handleIncidentSend(request: string, systemId: SystemId) {
    setSelectedSystemId(systemId)
    setDraftRequest(request)
    if (!operatorPanelOpen) setOperatorPanelOpen(true)
    setActiveTab('operator')
  }

  function handleSubmitOperatorRequest() {
    if (!submitRequest(draftRequest)) return
    setDraftRequest('')
  }

  function handleArmPolicy(policyId: string) {
    startTransition(() => {
      setPolicies((current) =>
        current.map((policy) =>
          policy.id === policyId ? { ...policy, status: 'Armed' as const } : policy
        )
      )
    })
  }

  return (
    <main className="min-h-screen bg-background p-6 lg:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col gap-12">
        {/* MASTHEAD: The Editorial Header */}
        <header className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="h-0.5 w-12 bg-primary/30" />
              <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
                Retention Strategy Simulator — May Y1
              </p>
            </div>
            <h1 className="text-5xl lg:text-7xl font-serif text-on-surface leading-[1.1] max-w-4xl italic font-light">
              Monthly Strategy <span className="font-bold text-primary not-italic">Dashboard</span>
            </h1>
            <p className="font-sans text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Balancing the weight of responsibility with the precision of data. 
              The Archive tracks predictions, while the War Room executes tactical interventions.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <StampBadge
                className={cn(
                  backendMode === 'live' && 'bg-secondary text-white border-none',
                  backendMode === 'mock' && 'bg-primary text-white border-none',
                )}
              >
                {backendMode === 'checking' && 'Backend status: checking'}
                {backendMode === 'live' && 'Backend status: live'}
                {backendMode === 'mock' && 'Backend status: mock contract'}
                {backendMode === 'error' && 'Backend status: unavailable'}
              </StampBadge>
              {architecture ? <StampBadge>{architecture.service_version}</StampBadge> : null}
              <StampBadge className={simulatorDataSource === 'mock' ? 'bg-primary text-white border-none' : undefined}>
                Data source: {simulatorDataSource}
              </StampBadge>
              {errorMessage ? <span className="text-xs text-primary italic">{errorMessage}</span> : null}
              {simulatorDataError ? <span className="text-xs text-primary italic">{simulatorDataError}</span> : null}
            </div>
          </div>

          <div className="flex gap-4">
            {DEMO_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative group px-8 py-4 transition-all duration-500",
                  activeTab === tab.id 
                    ? "bg-surface-container-highest shadow-sm" 
                    : "hover:bg-surface-container-low"
                )}
              >
                <div className="flex flex-col text-left">
                  <span className={cn(
                    "font-serif text-xl italic transition-colors",
                    activeTab === tab.id ? "text-primary" : "text-on-surface/50 group-hover:text-on-surface"
                  )}>
                    {tab.label}
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40 group-hover:text-on-surface-variant/60">
                    {tab.detail}
                  </span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute -bottom-1 left-0 w-full h-1 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Floating Metric "Post-its" */}
          <div className="hidden xl:flex absolute top-0 right-0 gap-4 rotate-2 translate-y-4">
            <div className="bg-white p-4 shadow-xl shadow-on-surface-variant/5 border border-outline/5 -rotate-3 hover:rotate-0 transition-transform cursor-help">
              <p className="font-label text-[10px] uppercase text-primary mb-1">Live Risks</p>
              <p className="text-3xl font-serif font-bold italic">14</p>
            </div>
            <div className="bg-white p-4 shadow-xl shadow-on-surface-variant/5 border border-outline/5 rotate-2 hover:rotate-0 transition-transform cursor-help">
              <p className="font-label text-[10px] uppercase text-secondary mb-1">Sentiment</p>
              <p className="text-3xl font-serif font-bold italic">88%</p>
            </div>
          </div>
        </header>

        {activeTab === 'prediction' ? (
          <PredictionTab dashboardData={dashboardData} onJumpToOperator={handleIncidentSend} />
        ) : (
          <OperatorGameTab
            dashboardData={dashboardData}
            selectedSystem={selectedSystem}
            selectedSystemId={selectedSystemId}
            setSelectedSystemId={setSelectedSystemId}
            activeIncidents={activeIncidents}
            draftRequest={draftRequest}
            isPending={isPending}
            messages={messages}
            onArmPolicy={handleArmPolicy}
            onIncidentSend={handleIncidentSend}
            onOperatorPanelToggle={() => setOperatorPanelOpen((p) => !p)}
            onRequestChange={setDraftRequest}
            onSubmitOperatorRequest={handleSubmitOperatorRequest}
            operatorPanelOpen={operatorPanelOpen}
            policies={policies}
            toolEvents={toolEvents}
            assistantError={assistantErrorMessage}
            isAssistantPending={isAssistantPending}
          />
        )}
      </div>
    </main>
  )
}

function PredictionTab({
  dashboardData,
  onJumpToOperator,
}: {
  dashboardData: SimulatorDashboardData
  onJumpToOperator: (r: string, s: SystemId) => void
}) {
  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-8 space-y-12">
        <section className="bg-surface-container-low p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BrainCircuit size={120} strokeWidth={1} />
          </div>
          <div className="relative space-y-8">
            <div className="space-y-2">
              <StampBadge>Model Intelligence</StampBadge>
              <h2 className="text-4xl font-serif italic text-on-surface">The Prediction Archive</h2>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-8">
                  {dashboardData.modelSignals.map((s) => (
                <div key={s.label} className="border-l-2 border-primary/20 pl-4 py-1">
                  <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{s.label}</p>
                  <p className="text-4xl font-serif font-bold text-primary mb-1">{s.value}</p>
                  <p className="text-xs text-on-surface-variant italic">{s.detail}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-outline/10">
              <div className="space-y-6">
                <h3 className="font-serif text-xl italic">Core Feature Weights</h3>
                <div className="space-y-5">
                  {[
                    ['Payment retry failure', 0.31],
                    ['VIP complaint velocity', 0.22],
                    ['Onboarding drop-off', 0.19],
                    ['Policy fatigue score', 0.13],
                  ].map(([name, weight]) => (
                    <div key={name as string} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-label uppercase tracking-wider text-on-surface-variant">
                        <span>{name as string}</span>
                        <span className="font-bold">{weight as number}</span>
                      </div>
                      <div className="h-1 bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(weight as number) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 shadow-sm rotate-1">
                <h3 className="font-serif text-xl italic mb-6">Risk Queue Handoff</h3>
                <div className="space-y-4">
                  {dashboardData.predictionRows.map(row => (
                    <div key={row.id} className="pb-4 border-b border-outline/5 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-sans font-semibold text-sm">{row.segment}</p>
                        <span className="text-primary font-serif italic text-sm">{row.churnRisk}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant italic">{row.trigger}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center gap-2 mb-2 px-2">
          <Radar size={18} className="text-primary" />
          <h2 className="font-serif italic text-xl">Handoff Targets</h2>
        </div>
        {dashboardData.incidents.slice(0, 4).map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => onJumpToOperator(incident.request, incident.systemId)}
            className="w-full text-left bg-surface-container-low p-6 group transition-all hover:bg-surface-container-high border border-transparent hover:border-primary/10"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-serif text-lg leading-tight group-hover:text-primary transition-colors">{incident.title}</h3>
              <StampBadge className={cn(incident.severity === 'critical' && "bg-primary text-white border-none")}>
                {incident.severity}
              </StampBadge>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{incident.summary}</p>
            <div className="flex justify-between items-center">
              <span className="font-label text-[10px] uppercase text-on-surface-variant/60">{incident.requester}</span>
              <div className="flex items-center gap-1.5 text-[10px] font-label uppercase text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                Dispatch <ArrowRight size={12} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function OperatorGameTab({
  dashboardData,
  selectedSystem,
  selectedSystemId,
  setSelectedSystemId,
  activeIncidents,
  draftRequest,
  isPending,
  messages,
  onArmPolicy,
  onIncidentSend,
  onOperatorPanelToggle,
  onRequestChange,
  onSubmitOperatorRequest,
  operatorPanelOpen,
  policies,
  toolEvents,
  assistantError,
  isAssistantPending,
}: any) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in duration-700">
      {/* Sidebar: Systems Ledger */}
      <aside className="w-full lg:w-72 shrink-0 space-y-6">
        <div className="px-2">
          <h2 className="font-serif italic text-2xl mb-1">Systems Ledger</h2>
          <p className="text-xs text-on-surface-variant italic">Active operational domains</p>
        </div>
        <div className="space-y-2">
          {dashboardData.systems.map((system: SimulatorDashboardData['systems'][number]) => (
            <button
              key={system.id}
              type="button"
              onClick={() => setSelectedSystemId(system.id)}
              className={cn(
                "w-full text-left p-4 transition-all border border-transparent",
                selectedSystemId === system.id 
                  ? "bg-surface-container-highest shadow-md border-primary/10 -translate-y-1" 
                  : "bg-surface-container-low hover:bg-surface-container-high"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <p className={cn("font-serif text-lg italic", selectedSystemId === system.id ? "text-primary" : "text-on-surface")}>
                  {system.name}
                </p>
                <span className="font-label text-[10px] font-bold text-primary">{system.danger}</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">{system.label}</p>
              <div className="h-0.5 bg-surface-container-high w-full">
                <div className="h-full bg-primary" style={{ width: `${system.danger}%` }} />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content: The War Room */}
      <div className="flex-1 space-y-12">
        <section className="bg-surface-container-lowest p-8 lg:p-12 shadow-sm relative">
          <div className="absolute top-0 right-0 p-8">
            <StampBadge className="bg-primary/5 text-primary">Strategic Focus</StampBadge>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif italic text-on-surface">{selectedSystem.name}</h2>
                <p className="text-on-surface-variant font-sans">{selectedSystem.summary}</p>
              </div>
              <div className="flex items-end gap-6">
                <div className="space-y-1">
                  <p className="font-label text-[10px] uppercase text-on-surface-variant">Danger Index</p>
                  <p className="text-6xl font-serif font-bold text-primary">{selectedSystem.danger}</p>
                </div>
                <div className="h-16 w-32 pb-2">
                  <TrendChart />
                </div>
              </div>
            </div>
            
            <div className="bg-surface-container-low p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareText size={16} className="text-primary" />
                <h3 className="font-serif italic text-lg">Advisor Thread</h3>
              </div>
              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.slice(-3).map((m: any) => (
                  <div key={m.id} className={cn(
                    "p-3 text-sm leading-relaxed",
                    m.role === 'operator' ? "bg-white italic border-l-2 border-primary" : "text-on-surface-variant"
                  )}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <AlertTriangle size={18} className="text-primary" />
            <h2 className="font-serif italic text-2xl">Danger Queue</h2>
          </div>
          <div className="grid gap-4">
            {activeIncidents.map((incident: any) => (
              <div key={incident.id} className="bg-surface-container-low p-8 flex flex-col md:flex-row gap-8 items-start group">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between">
                    <h3 className="text-2xl font-serif italic group-hover:text-primary transition-colors">{incident.title}</h3>
                    <div className="flex gap-2">
                      <StampBadge>{incident.impact}</StampBadge>
                      <StampBadge className="bg-primary text-white border-none">{incident.severity}</StampBadge>
                    </div>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed italic">{incident.summary}</p>
                  <div className="flex gap-6 text-[11px] font-label uppercase text-on-surface-variant/70">
                    <span><span className="font-bold">By:</span> {incident.requester}</span>
                    <span><span className="font-bold">Time:</span> {incident.window}</span>
                  </div>
                </div>
                <div className="w-full md:w-auto shrink-0 flex items-center h-full">
                  <HeirloomButton onClick={() => onIncidentSend(incident.request, incident.systemId)}>
                    Dispatch to Rail
                  </HeirloomButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Sidebar: The Operator Rail (Foldable) */}
      <aside className={cn(
        "bg-surface-container-highest transition-all duration-500 overflow-hidden shrink-0 h-fit lg:sticky lg:top-8",
        operatorPanelOpen ? "w-full lg:w-96 p-6 lg:p-8" : "w-full lg:w-16 p-0"
      )}>
        {operatorPanelOpen ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-primary" />
                <h2 className="font-serif italic text-2xl">Operator Rail</h2>
              </div>
              <button type="button" onClick={onOperatorPanelToggle} className="text-on-surface-variant hover:text-primary p-1">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="bg-white/50 backdrop-blur-md p-6 space-y-4 shadow-sm">
              <h3 className="font-serif italic text-lg text-primary underline underline-offset-4 decoration-primary/20">Ask the Operator</h3>
              <textarea
                value={draftRequest}
                onChange={(e) => onRequestChange(e.target.value)}
                className="w-full h-32 bg-transparent border-none font-serif italic text-on-surface placeholder:text-on-surface-variant/40 resize-none focus:ring-0 text-lg leading-relaxed"
                placeholder="Draft a restorative policy..."
              />
              {assistantError ? (
                <p className="text-xs text-primary italic">{assistantError}</p>
              ) : null}
              <HeirloomButton onClick={onSubmitOperatorRequest} disabled={isPending || isAssistantPending} className="w-full">
                {isPending || isAssistantPending ? 'Generating Intelligence...' : 'Initiate Simulation'}
              </HeirloomButton>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-label text-[10px] uppercase tracking-widest font-bold">Tool Sequence</h3>
                <span className="text-[10px] font-serif italic text-primary">Turn 42</span>
              </div>
              <div className="space-y-3">
                {toolEvents.map((e: any) => (
                  <div key={e.id} className="bg-white/30 p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="font-label text-[9px] uppercase font-bold text-on-surface-variant">{e.tool}</p>
                      <div className={cn(
                        "size-1.5 rounded-full",
                        e.status === 'Completed' ? "bg-secondary" : "bg-primary animate-pulse"
                      )} />
                    </div>
                    <p className="text-xs text-on-surface italic">{e.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-outline/10">
              <h3 className="font-serif italic text-lg text-primary">Active Policies</h3>
              <div className="space-y-3">
                {policies.map((p: any) => (
                  <div key={p.id} className={cn(
                    "p-4 border transition-all",
                    p.status === 'Armed' ? "bg-primary text-white border-transparent" : "bg-white border-outline/10"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-serif font-bold leading-tight">{p.title}</p>
                      {p.status === 'Armed' && <Layers3 size={14} />}
                    </div>
                    <p className={cn("text-xs leading-relaxed mb-4 italic", p.status === 'Armed' ? "text-white/80" : "text-on-surface-variant")}>
                      {p.effect}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-label uppercase font-bold tracking-widest opacity-60">{p.owner}</span>
                      {p.status !== 'Armed' && (
                        <button 
                          type="button"
                          onClick={() => onArmPolicy(p.id)}
                          className="text-[10px] font-label font-bold uppercase underline underline-offset-4 hover:text-primary"
                        >
                          Arm Policy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button 
            type="button"
            onClick={onOperatorPanelToggle} 
            className="w-full h-full flex flex-col items-center py-10 gap-6 text-on-surface-variant hover:text-primary transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180">
              Open Rail
            </span>
          </button>
        )}
      </aside>
    </div>
  )
}

function TrendChart() {
  return (
    <svg viewBox="0 0 240 100" className="h-full w-full text-primary" aria-hidden="true">
      <path d="M10 78 C 34 74, 58 70, 82 68 S 128 50, 155 42 S 196 58, 230 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 90 C 34 88, 58 82, 82 80 S 128 65, 155 58 S 196 70, 230 48" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" strokeLinecap="round" />
      <circle cx="230" cy="28" r="4" fill="currentColor" />
    </svg>
  )
}

export default App
