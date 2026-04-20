import { LineChart } from 'lucide-react'
import { Area, ComposedChart, Line, Tooltip, XAxis } from 'recharts'

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
}

function StrategyTrendChart({
  trend,
}: {
  trend: StrategyStageProps['trend']
}) {
  const baselineUsers = trend.find((point) => point.actualUsers !== null)?.actualUsers ?? trend[0]?.predictedUsers ?? 0
  const latestPoint = trend.at(-1)
  const latestUsers = latestPoint?.actualUsers ?? latestPoint?.predictedUsers ?? baselineUsers
  const latestDrop = baselineUsers - latestUsers
  const latestDropRate = baselineUsers > 0 ? (latestDrop / baselineUsers) * 100 : 0
  const chartWidth = Math.max(720, trend.length * 140)

  return (
    <div className="rounded border border-outline-variant/30 bg-surface-container-low p-6 editorial-shadow relative overflow-hidden h-full min-h-[420px]">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--color-secondary)_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="relative z-10 mb-8 flex justify-between items-end gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary">User Trajectory</p>
          <h3 className="mt-2 font-serif text-3xl font-black text-primary uppercase">Prediction Model</h3>
        </div>
        <div className="rounded border border-secondary/30 bg-secondary/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-secondary shadow-[0_0_10px_rgba(14,165,233,0.2)]">
          Live Feed
        </div>
      </div>

      <div className="relative z-10 mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded border border-outline-variant/20 bg-background/70 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Baseline Users</p>
          <p className="mt-2 font-mono text-xl font-black text-primary">{baselineUsers.toLocaleString()}</p>
        </div>
        <div className="rounded border border-outline-variant/20 bg-background/70 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Current Users</p>
          <p className="mt-2 font-mono text-xl font-black text-primary">{latestUsers.toLocaleString()}</p>
        </div>
        <div className="rounded border border-outline-variant/20 bg-background/70 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Drop Vs Baseline</p>
          <p className="mt-2 font-mono text-xl font-black text-red-400">-{latestDrop.toLocaleString()}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-red-300/80">{latestDropRate.toFixed(1)}% down</p>
        </div>
      </div>

      <div className="relative z-10 overflow-x-auto pb-2">
        <div style={{ width: `${chartWidth}px`, minWidth: `${chartWidth}px` }} className="h-[300px]">
          <ComposedChart width={chartWidth} height={300} data={trend} margin={{ top: 10, right: 24, left: 12, bottom: 0 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)', fontFamily: 'monospace' }} dy={10} />
            <Tooltip
              formatter={(value, name, item) => {
                const pointUsers = item.payload.actualUsers ?? item.payload.predictedUsers
                const dropFromBaseline = baselineUsers - pointUsers
                const dropRate = baselineUsers > 0 ? (dropFromBaseline / baselineUsers) * 100 : 0
                return [
                  `${Number(value).toLocaleString()} | baseline -${dropFromBaseline.toLocaleString()} (${dropRate.toFixed(1)}%)`,
                  name,
                ]
              }}
              contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', borderRadius: '0', border: '1px solid var(--color-secondary)', boxShadow: '0 0 15px rgba(14,165,233,0.3)' }}
              labelStyle={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}
              itemStyle={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
            <Area type="step" dataKey="predictedUsers" fill="var(--color-secondary)" fillOpacity={0.05} stroke="none" />
            <Line type="monotone" dataKey="predictedUsers" name="Predicted Users" stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 6, fill: 'var(--color-secondary)' }} />
            <Line type="monotone" dataKey="actualUsers" name="Actual Users" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-6 border-t border-outline-variant/30 pt-4 text-[10px] font-bold font-mono uppercase tracking-[0.18em] text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 bg-primary" />
          Actual Users
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 bg-secondary" />
          Predicted Users
        </span>
        <span className="inline-flex items-center gap-2 text-secondary">
          좌우로 스크롤해서 과거 turn 확인
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
}: StrategyStageProps) {
  return (
    <section className="grid h-full min-h-0 gap-6 grid-rows-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
      <Card className="border-outline/10 bg-surface-container-lowest py-0 shadow-sm editorial-shadow h-full min-h-[420px]">
        <CardHeader className="border-b border-outline/10 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardDescription className="mb-2 font-label text-xs uppercase tracking-[0.24em] text-on-surface-variant">
                현재 시스템 상태
              </CardDescription>
              <CardTitle className="font-serif text-2xl font-medium text-primary">{systemName}</CardTitle>
            </div>
            <div className="rounded-full bg-primary/10 p-2.5 text-primary">
              <LineChart className="size-4.5" />
            </div>
          </div>
          <p className="mt-2 max-w-2xl font-sans text-sm leading-6 text-on-surface-variant opacity-80">{systemSummary}</p>
        </CardHeader>
        <CardContent className="grid h-full gap-3 py-5 md:grid-cols-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                'flex min-h-[160px] flex-col justify-between rounded-2xl border p-4 transition-colors',
                metric.tone === 'critical' && 'border-red-500/30 bg-red-500/5',
                metric.tone === 'watch' && 'border-yellow-500/30 bg-yellow-500/5',
                metric.tone === 'stable' && 'border-outline/10 bg-surface-container-low hover:border-primary/20',
              )}
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant opacity-80">{metric.label}</p>
              <p className="mt-2 font-mono text-xl font-black text-primary tracking-tight">{metric.value}</p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant opacity-70">{metric.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <StrategyTrendChart trend={trend} />
    </section>
  )
}
