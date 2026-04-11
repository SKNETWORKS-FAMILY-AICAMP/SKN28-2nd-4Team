import { Activity, DatabaseZap, PlayCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

type SessionHeaderProps = {
  backendMode: 'checking' | 'live' | 'mock' | 'error'
  architectureVersion: string | null
  dataSource: 'live' | 'mock'
  monthlyLabel: string
  scenarioLabel: string
  scenarioSummary: string
}

function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'live' | 'mock' | 'critical'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase',
        tone === 'neutral' && 'border-outline/15 bg-white/70 text-on-surface-variant',
        tone === 'live' && 'border-secondary/20 bg-secondary text-secondary-foreground',
        tone === 'mock' && 'border-primary/20 bg-primary text-primary-foreground',
        tone === 'critical' && 'border-primary/20 bg-primary/10 text-primary',
      )}
    >
      {label}
    </span>
  )
}

export function SessionHeader({
  backendMode,
  architectureVersion,
  dataSource,
  monthlyLabel,
  scenarioLabel,
  scenarioSummary,
}: SessionHeaderProps) {
  const backendLabel = {
    checking: '백엔드 확인 중',
    live: '백엔드 연결됨',
    mock: '모의 계약 사용 중',
    error: '백엔드 연결 불가',
  }[backendMode]

  const backendTone = backendMode === 'live'
    ? 'live'
    : backendMode === 'mock'
      ? 'mock'
      : backendMode === 'error'
        ? 'critical'
        : 'neutral'

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-low px-6 py-8 shadow-sm lg:px-10 lg:py-10">
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />
      <div className="absolute bottom-0 left-12 h-32 w-32 rounded-full bg-secondary/8 blur-3xl" />
      <div className="relative flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={monthlyLabel} />
          <StatusBadge label={backendLabel} tone={backendTone} />
          <StatusBadge label={`데이터 ${dataSource === 'live' ? '실시간' : '모의'}`} tone={dataSource === 'live' ? 'live' : 'mock'} />
          {architectureVersion ? <StatusBadge label={`API ${architectureVersion}`} /> : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] lg:items-end">
          <div className="space-y-4">
            <p className="font-label text-xs uppercase tracking-[0.34em] text-on-surface-variant/70">
              {scenarioLabel}
            </p>
            <h1 className="max-w-4xl text-4xl leading-tight text-on-surface lg:text-6xl">
              이번 달 운영 상태를 읽고,
              <br />
              어떤 정책으로 다음 달을 바꿀지 결정합니다.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-on-surface-variant lg:text-lg">
              {scenarioSummary}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-outline/10 bg-white/80 p-4 backdrop-blur">
              <PlayCircle className="mb-4 text-primary" />
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">플레이 흐름</p>
              <p className="mt-2 text-sm leading-6 text-on-surface">상태 확인 → 인시던트 해석 → 정책 선택 → 다음 달 진행</p>
            </div>
            <div className="rounded-2xl border border-outline/10 bg-white/80 p-4 backdrop-blur">
              <Activity className="mb-4 text-primary" />
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">핵심 관점</p>
              <p className="mt-2 text-sm leading-6 text-on-surface">예측보다 의사결정이 중심이고, 정책 선택의 차이를 비교합니다.</p>
            </div>
            <div className="rounded-2xl border border-outline/10 bg-white/80 p-4 backdrop-blur">
              <DatabaseZap className="mb-4 text-primary" />
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">LLM 보조</p>
              <p className="mt-2 text-sm leading-6 text-on-surface">에이전트가 현재 상태와 인시던트를 읽고 정책 초안을 함께 만듭니다.</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
