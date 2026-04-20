import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'
import { SendHorizontal, TerminalSquare, BrainCircuit, Wrench } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { Button } from '@/components/ui/button'
import type { Incident } from '@/features/simulator/contracts'
import { cn } from '@/lib/utils'


type AdvisorConsoleProps = {
  highlightedIncident: Incident
  draftRequest: string
  isPending: boolean
  interactionDisabled?: boolean
  interactionMessage?: string | null
  messages: UIMessage[]
  assistantError: string | null
  selectedStrategyModel: string
  strategyModelOptions: readonly string[]
  onDraftChange: (value: string) => void
  onStrategyModelChange: (value: string) => void
  onSubmit: () => void
}

type ToolTracePart = Extract<UIMessage['parts'][number], { type: `tool-${string}` }>

function isToolTracePart(part: UIMessage['parts'][number]): part is ToolTracePart {
  return typeof part.type === 'string' && part.type.startsWith('tool-')
}

function getToolName(part: ToolTracePart) {
  return part.type.replace(/^tool-/, '')
}

function renderToolStateLabel(state: ToolTracePart['state']) {
  switch (state) {
    case 'input-streaming':
      return '입력 생성 중'
    case 'input-available':
      return '도구 호출 준비'
    case 'output-available':
      return '도구 결과 반영'
    case 'output-error':
      return '도구 오류'
    default:
      return '도구 처리 중'
  }
}

function ToolTraceCard({ part }: { part: ToolTracePart }) {
  return (
    <details className="rounded border border-outline-variant/30 bg-surface-container-low" open={part.state !== 'output-available'}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-secondary">
          <Wrench className="size-3.5" />
          {getToolName(part)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">
          {renderToolStateLabel(part.state)}
        </span>
      </summary>
      <div className="border-t border-outline-variant/20 px-3 py-3 space-y-3">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">Input</p>
          <pre className="overflow-x-auto rounded bg-background px-3 py-2 font-mono text-[10px] leading-5 text-on-surface-variant/85">
            {JSON.stringify(part.input ?? {}, null, 2)}
          </pre>
        </div>
        {part.state === 'output-error' ? (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-400">Error</p>
            <p className="rounded bg-red-500/10 px-3 py-2 font-mono text-[10px] leading-5 text-red-300">
              {part.errorText ?? 'Unknown tool error'}
            </p>
          </div>
        ) : null}
        {part.output !== undefined ? (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">Output</p>
            <pre className="overflow-x-auto rounded bg-background px-3 py-2 font-mono text-[10px] leading-5 text-on-surface-variant/85">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </details>
  )
}

export function AdvisorConsole({
  highlightedIncident,
  draftRequest,
  isPending,
  interactionDisabled = false,
  interactionMessage = null,
  messages,
  assistantError,
  selectedStrategyModel,
  strategyModelOptions,
  onDraftChange,
  onStrategyModelChange,
  onSubmit,
}: AdvisorConsoleProps) {
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = logRef.current
    if (!node) return
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight
    })
  }, [messages, isPending])

  return (
    <section className="flex h-full min-h-0 flex-col gap-6">
      <div className="editorial-shadow relative flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-outline-variant/30 bg-surface-container-low p-6">
        <div className="mb-4 flex flex-col border-b border-outline-variant/30 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TerminalSquare className="size-5 text-secondary" />
              <h2 className="font-mono text-lg font-black tracking-widest text-primary uppercase">U.C. Strategy Core</h2>
            </div>
            <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
              <span>Model</span>
              <select
                value={selectedStrategyModel}
                disabled={interactionDisabled}
                onChange={(event) => onStrategyModelChange(event.target.value)}
                className="rounded border border-outline-variant/40 bg-background px-2 py-1 text-[10px] uppercase tracking-widest text-primary outline-none"
              >
                {strategyModelOptions.map((modelId) => (
                  <option key={modelId} value={modelId}>{modelId}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">
            Intelligence feed & policy synthesis
          </p>
        </div>

        <div className="relative mb-6 overflow-hidden rounded border border-outline-variant/30 bg-surface-container p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l bg-secondary"></div>
          <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-secondary animate-pulse">
            [ ALERT: ACTIVE INCIDENT DETECTED ]
          </p>
          <h3 className="text-base font-sans font-bold tracking-wide text-primary">
            {highlightedIncident.title}
          </h3>
          <p className="mt-1 font-sans text-sm leading-relaxed text-on-surface-variant opacity-90">
            {highlightedIncident.summary}
          </p>
          <div className="mt-3 rounded border border-outline-variant/50 bg-background p-2 text-xs font-mono text-primary/70">
            &gt; INTERCEPT: "{highlightedIncident.request}"
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-1 flex-col rounded border border-outline-variant/20 bg-background p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div className="mb-2 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
              <BrainCircuit className="size-4 text-secondary opacity-70" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">Synthesis Log</p>
            </div>

            <div ref={logRef} className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="m-auto text-center font-mono text-xs uppercase tracking-widest text-on-surface-variant/30">
                  // AWAITING OPERATOR INPUT //
                </div>
              )}

              {messages.map((message, messageIndex) => (
                <div
                  key={message.id}
                  className="flex w-full flex-col gap-2 border-b border-outline-variant/10 pb-6 last:border-0"
                >
                  <span className={cn(
                    'text-[10px] font-mono tracking-widest uppercase',
                    message.role === 'user' ? 'text-primary' : 'text-secondary',
                  )}>
                    {message.role === 'user' ? 'OPERATOR>>' : 'U.C. CORE>>'}
                  </span>

                  <div className="flex flex-col gap-3">
                    {message.parts.map((part, partIndex) => {
                      if (part.type === 'text') {
                        return message.role === 'user' ? (
                          <div
                            key={`${message.id}-${partIndex}`}
                            className="font-sans text-[13px] leading-relaxed text-on-surface-variant"
                          >
                            {part.text}
                          </div>
                        ) : (
                          <div key={`${message.id}-${partIndex}`} className="text-primary">
                            <Streamdown
                              className="text-[13px] leading-relaxed"
                              parseIncompleteMarkdown
                              isAnimating={isPending && messageIndex === messages.length - 1}
                            >
                              {part.text}
                            </Streamdown>
                          </div>
                        )
                      }

                      if (isToolTracePart(part)) {
                        return <ToolTraceCard key={part.toolCallId} part={part} />
                      }

                      return null
                    })}
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
              disabled={interactionDisabled}
              onChange={(event) => onDraftChange(event.target.value)}
              className="min-h-[80px] resize-none rounded border border-outline/20 bg-background px-3 py-3 text-sm font-sans text-primary transition-all placeholder:text-on-surface-variant/30 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/50"
              placeholder="Enter policy directives for the core to process..."
            />
            {interactionMessage ? <p className="rounded bg-secondary/10 p-2 text-[10px] font-mono tracking-widest uppercase text-secondary">{interactionMessage}</p> : null}
            {assistantError ? <p className="rounded bg-red-500/10 p-2 text-[10px] font-mono tracking-widest uppercase text-red-500">{assistantError}</p> : null}
            <Button onClick={onSubmit} disabled={interactionDisabled || isPending} className="ink-gradient h-10 w-full justify-center rounded border border-secondary/50 font-mono text-[11px] font-bold tracking-widest uppercase text-white transition-all hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]">
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
