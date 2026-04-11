import { SendHorizontal, TerminalSquare, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Incident, OperatorMessage } from '@/features/simulator/contracts'
import { cn } from '@/lib/utils'

type AdvisorConsoleProps = {
  highlightedIncident: Incident
  draftRequest: string
  isPending: boolean
  messages: OperatorMessage[]
  assistantError: string | null
  onDraftChange: (value: string) => void
  onSubmit: () => void
}

export function AdvisorConsole({
  highlightedIncident,
  draftRequest,
  isPending,
  messages,
  assistantError,
  onDraftChange,
  onSubmit,
}: AdvisorConsoleProps) {
  return (
    <section className="flex flex-col gap-6 h-full">
      <div className="rounded border border-outline-variant/30 bg-surface-container-low p-6 editorial-shadow flex flex-col flex-1 relative overflow-hidden">
        <div className="mb-4 flex flex-col pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <TerminalSquare className="size-5 text-secondary" />
            <h2 className="font-mono text-lg font-black tracking-widest text-primary uppercase">U.C. Strategy Core</h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70 mt-1">
            Intelligence feed & policy synthesis
          </p>
        </div>

        <div className="mb-6 rounded border border-outline-variant/30 bg-surface-container p-4 relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l"></div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-secondary mb-2 animate-pulse">
            [ ALERT: ACTIVE INCIDENT DETECTED ]
          </p>
          <h3 className="text-base font-sans font-bold text-primary tracking-wide">
            {highlightedIncident.title}
          </h3>
          <p className="mt-1 font-sans text-sm leading-relaxed text-on-surface-variant opacity-90">
            {highlightedIncident.summary}
          </p>
          <div className="mt-3 bg-background border border-outline-variant/50 p-2 rounded text-xs font-mono text-primary/70">
            &gt; INTERCEPT: "{highlightedIncident.request}"
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          <div className="flex flex-col flex-1 gap-2 rounded border border-outline-variant/20 bg-background p-4 min-h-[300px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 mb-2">
              <BrainCircuit className="size-4 text-secondary opacity-70" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">Synthesis Log</p>
            </div>
            
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="m-auto text-center font-mono text-xs uppercase tracking-widest text-on-surface-variant/30">
                  // AWAITING OPERATOR INPUT //
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1 w-full pb-6 border-b border-outline-variant/10 last:border-0',
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-mono tracking-widest uppercase",
                    message.role === 'user' ? "text-primary" : "text-secondary"
                  )}>
                    {message.role === 'user' ? "OPERATOR>>" : "U.C. CORE>>"}
                  </span>
                  <div className={cn(
                    "font-sans text-[13px] leading-relaxed",
                    message.role === 'user' ? "text-on-surface-variant" : "text-primary whitespace-pre-wrap"
                  )}>
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded border border-outline-variant/30 bg-surface-container-highest p-4">
            <label className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-secondary" htmlFor="operator-request">
              <span className="text-primary">&gt;</span> COMMAND_INPUT
            </label>
            <textarea
              id="operator-request"
              name="operator-request"
              value={draftRequest}
              onChange={(event) => onDraftChange(event.target.value)}
              className="min-h-[80px] rounded border border-outline/20 bg-background px-3 py-3 text-sm font-sans text-primary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/30 resize-none"
              placeholder="Enter policy directives for the core to process..."
            />
            {assistantError ? <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 bg-red-500/10 p-2 rounded">{assistantError}</p> : null}
            <Button onClick={onSubmit} disabled={isPending} className="w-full ink-gradient justify-center rounded font-mono tracking-widest font-bold uppercase text-[11px] h-10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all text-white border border-red-500/50">
              {isPending ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <BrainCircuit className="size-4 animate-spin-slow" />
                  PROCESSING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  EXECUTE DIRECTIVE
                  <SendHorizontal className="size-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

