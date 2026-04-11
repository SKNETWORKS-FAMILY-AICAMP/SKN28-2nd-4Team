import { LineChart, TrendingUp } from 'lucide-react'
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StrategyStageProps = {
  systemName: string
  systemSummary: string
  metrics: Array<{
    label: string
    value: string
    detail: string
    tone: 'critical' | 'watch' | 'stable'
  }>
  trend: Array<{
    label: string
    actualUsers: number | null
    predictedUsers: number
    churnRisk: number
  }>
  focus: {
    title: string
    summary: string
    recommendation: string
  }
}

function StrategyTrendChart({
  trend,
}: {
  trend: StrategyStageProps['trend']
}) {
  return (
    <div className="rounded border border-outline-variant/30 bg-surface-container-low p-6 editorial-shadow relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--color-secondary)_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="relative z-10 mb-8 flex justify-between items-end gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary">User Trajectory</p>
          <h3 className="font-serif text-3xl font-black text-primary mt-2 uppercase">Prediction Model</h3>
        </div>
        <div className="rounded border border-secondary/30 bg-secondary/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-secondary shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          Live Feed
        </div>
      </div>
      
      <div className="h-72 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)', fontFamily: 'monospace' }} dy={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', borderRadius: '0', border: '1px solid var(--color-secondary)', boxShadow: '0 0 15px rgba(220,38,38,0.3)' }} 
              labelStyle={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}
              itemStyle={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
            <Area type="step" dataKey="predictedUsers" fill="var(--color-secondary)" fillOpacity={0.05} stroke="none" />
            <Line type="monotone" dataKey="predictedUsers" name="Predicted Users" stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 6, fill: 'var(--color-secondary)' }} />
            <Line type="monotone" dataKey="actualUsers" name="Actual Users" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 text-[10px] font-bold font-mono uppercase tracking-[0.18em] text-on-surface-variant relative z-10 pt-4 border-t border-outline-variant/30">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 bg-primary" />
          Actual Users
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 bg-secondary" />
          Predicted Users
        </span>
      </div>
    </div>
  )
}

export function StrategyStage({
  systemName,
  systemSummary,
  metrics,
  trend,
  focus,
}: StrategyStageProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)]">
        <Card className="border-outline/10 bg-surface-container-lowest py-0 shadow-sm editorial-shadow">
          <CardHeader className="border-b border-outline/10 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription className="mb-2 font-label text-xs uppercase tracking-[0.24em] text-on-surface-variant">
                  현재 전략 무대
                </CardDescription>
                <CardTitle className="font-serif text-3xl font-medium text-primary">{systemName}</CardTitle>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <LineChart className="size-5" />
              </div>
            </div>
            <p className="max-w-2xl font-sans text-sm leading-7 text-on-surface-variant opacity-80 mt-2">{systemSummary}</p>
          </CardHeader>
          <CardContent className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  'rounded-2xl border p-5 transition-colors',
                  metric.tone === 'critical' && 'border-red-500/30 bg-red-500/5',
                  metric.tone === 'watch' && 'border-yellow-500/30 bg-yellow-500/5',
                  metric.tone === 'stable' && 'border-outline/10 bg-surface-container-low hover:border-primary/20',
                )}
              >
                <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant opacity-80">{metric.label}</p>
                <p className="mt-4 font-serif text-4xl font-semibold text-primary">{metric.value}</p>
                <p className="mt-2 text-xs font-medium text-on-surface-variant opacity-70">{metric.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-outline/10 bg-surface-container py-0 shadow-sm editorial-shadow">
          <CardHeader className="border-b border-outline/10 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription className="mb-2 font-label text-xs uppercase tracking-[0.24em] text-on-surface-variant">
                  이번 달 정책 결정 포커스
                </CardDescription>
                <CardTitle className="font-serif text-2xl font-medium text-primary">{focus.title}</CardTitle>
              </div>
              <TrendingUp className="text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 py-8">
            <p className="font-sans text-sm leading-7 text-on-surface-variant">{focus.summary}</p>
            <div className="mt-auto rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-5 editorial-shadow">
              <p className="font-label text-xs uppercase tracking-[0.22em] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]"></span>
                추천 정책 방향
              </p>
              <p className="mt-3 font-serif text-lg leading-8 text-primary italic">"{focus.recommendation}"</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <StrategyTrendChart trend={trend} />
    </section>
  )
}

