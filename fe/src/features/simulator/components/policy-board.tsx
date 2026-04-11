import { ArrowRight, CheckCircle2, ShieldAlert, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Incident, Policy } from '@/features/simulator/contracts'
import { cn } from '@/lib/utils'

type PolicyBoardProps = {
  incidents: Incident[]
  highlightedIncidentId: string
  policies: Policy[]
  onIncidentSelect: (incidentId: string) => void
  onDispatch: (request: string, incidentId: string) => void
  onArmPolicy: (policyId: string) => void
}

export function PolicyBoard({
  incidents,
  highlightedIncidentId,
  policies,
  onIncidentSelect,
  onDispatch,
  onArmPolicy,
}: PolicyBoardProps) {
  return (
    <aside className="flex flex-col gap-6 h-full">
      <section className="flex flex-col flex-1 rounded-[1.75rem] border border-outline/10 bg-surface-container-low p-5 editorial-shadow">
        <div className="mb-4 flex items-center gap-3">
          <ShieldAlert className="size-5 text-red-500" />
          <div>
            <h2 className="font-serif text-lg font-bold text-primary">Priority Incidents</h2>
            <p className="font-sans text-xs text-on-surface-variant opacity-80">Critical issues requiring attention</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-[200px]">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => onIncidentSelect(incident.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onIncidentSelect(incident.id)
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/20',
                highlightedIncidentId === incident.id
                  ? 'border-red-500/40 bg-red-500/5 shadow-sm'
                  : 'border-outline/10 bg-white hover:border-red-500/20',
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-sans text-sm font-semibold text-primary">{incident.title}</p>
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-600 font-bold whitespace-nowrap">
                  {incident.severity}
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-on-surface-variant line-clamp-2">{incident.summary}</p>
              
              <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant opacity-70">
                <span>{incident.requester}</span>
                <span>{incident.window}</span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-red-600 truncate flex-1">{incident.impact}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold hover:bg-red-500/10 hover:text-red-700 transition-colors"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDispatch(incident.request, incident.id)
                  }}
                >
                  Analyze
                  <ArrowRight className="size-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-outline/10 bg-surface-container-low p-5 editorial-shadow">
        <div className="mb-4 flex items-center gap-3">
          <Target className="size-5 text-secondary" />
          <div>
            <h2 className="font-serif text-lg font-bold text-primary">Strategic Directives</h2>
            <p className="font-sans text-xs text-on-surface-variant opacity-80">Select policy for this period</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className={cn(
                'rounded-xl border p-3.5 transition-all',
                policy.status === 'Armed'
                  ? 'border-primary/20 bg-primary text-primary-foreground shadow-md'
                  : 'border-outline/10 bg-white hover:border-primary/20',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-sans text-sm font-semibold">{policy.title}</p>
                {policy.status === 'Armed' && <CheckCircle2 className="size-4 shrink-0 text-secondary" />}
              </div>
              <p className={cn(
                'mt-1.5 font-sans text-xs leading-relaxed line-clamp-2',
                policy.status === 'Armed' ? 'text-primary-foreground/80' : 'text-on-surface-variant',
              )}>
                {policy.effect}
              </p>
              <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  policy.status === 'Armed' ? 'text-primary-foreground/50' : 'text-on-surface-variant/50',
                )}>
                  {policy.owner}
                </span>
                {policy.status !== 'Armed' ? (
                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => onArmPolicy(policy.id)}>
                    Arm Directive
                  </Button>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Active Directive</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

