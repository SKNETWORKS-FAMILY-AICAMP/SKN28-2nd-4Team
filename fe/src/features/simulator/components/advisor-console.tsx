import { SendHorizontal, Sparkles, BrainCircuit } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
      <div className="rounded-[1.75rem] border border-outline/10 bg-surface-container-low p-6 editorial-shadow flex flex-col flex-1">
        <div className="mb-6 flex items-center gap-4 pb-6 border-b border-outline-variant/30">
          <Avatar className="w-14 h-14 rounded-full border-2 border-primary/10 shadow-sm bg-surface-container-highest">
            <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=cso&backgroundColor=e0f2fe" />
            <AvatarFallback className="text-secondary font-bold font-serif text-lg">CSO</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">AI Strategy Advisor</h2>
            <p className="font-sans text-sm font-medium text-on-surface-variant flex items-center gap-1.5 mt-1">
              <BrainCircuit className="size-4 text-secondary" />
              Chief Strategy Officer · Simulation Engine
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-outline/10 bg-white p-5 editorial-shadow relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl"></div>
          <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-red-500/80 mb-2">현재 보고된 인시던트 (Active Incident)</p>
          <h3 className="text-lg font-serif font-semibold text-primary">{highlightedIncident.title}</h3>
          <p className="mt-2 font-sans text-sm leading-6 text-on-surface-variant opacity-90">{highlightedIncident.summary}</p>
          <div className="mt-3 bg-red-500/5 rounded-lg p-3 border border-red-500/10">
            <p className="text-sm font-medium text-red-700/80 italic">"{highlightedIncident.request}"</p>
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-5">
          <div className="flex flex-col flex-1 gap-4 rounded-2xl border border-outline/10 bg-surface-container p-5 min-h-[300px]">
            <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-3 mb-2">
              <Sparkles className="size-4 text-secondary" />
              <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">자문 로그 (Dialogue)</p>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="m-auto text-center text-sm font-medium text-on-surface-variant opacity-60">
                  대화 기록이 없습니다. 정책 생성을 요청해보세요.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed font-sans editorial-shadow transition-all',
                    message.role === 'user'
                      ? 'self-end bg-primary text-primary-foreground rounded-br-sm'
                      : 'self-start bg-white text-on-surface border border-outline/5 rounded-bl-sm',
                  )}
                >
                  {message.text}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-highest p-5">
            <label className="font-label text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant" htmlFor="operator-request">
              AI 정책 생성 요청 (Instruction)
            </label>
            <textarea
              id="operator-request"
              name="operator-request"
              value={draftRequest}
              onChange={(event) => onDraftChange(event.target.value)}
              className="min-h-[120px] rounded-xl border border-outline/20 bg-white px-4 py-3 text-sm leading-relaxed font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40 resize-none shadow-inner"
              placeholder="이번 달 인시던트를 방어하기 위한 운영 지침을 제안해주세요..."
            />
            {assistantError ? <p className="text-sm font-medium text-red-500 bg-red-500/10 p-2 rounded-md">{assistantError}</p> : null}
            <Button onClick={onSubmit} disabled={isPending} size="lg" className="w-full ink-gradient justify-center rounded-xl font-label tracking-wide uppercase text-sm h-12 hover:shadow-lg transition-all">
              {isPending ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <BrainCircuit className="size-4 animate-spin-slow" />
                  합성 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  에이전트에게 정책 초안 생성 지시
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

