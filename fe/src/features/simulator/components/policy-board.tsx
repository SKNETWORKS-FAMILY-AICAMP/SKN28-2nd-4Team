import { useEffect, useMemo, useRef } from 'react'
import { Coins, ShieldAlert, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { EcommerceCustomerModelInput, ModelFeatureField, StrategyBudget } from '@/shared/api/contracts'
import type { Incident } from '@/features/simulator/contracts'
import {
  buildStrategyBudgetPreview,
  normalizeStrategyFieldValue,
} from '@/features/simulator/strategy-budget'
import { useSimulationUiStore } from '@/stores/simulation-ui-store'

type PolicyBoardProps = {
  incidents: Incident[]
  selectedIncidentId: string
  modelSchema: ModelFeatureField[]
  draftBaseModelInput: EcommerceCustomerModelInput
  draftSeedKey: string
  strategyBudget: StrategyBudget | null
  isPending: boolean
  interactionDisabled?: boolean
  interactionMessage?: string | null
  onIncidentSelect: (incidentId: string) => void
  onApplyModelInput: (incidentId: string, modelInput: EcommerceCustomerModelInput) => void
}

const FALLBACK_MODEL_SCHEMA: Record<string, Omit<ModelFeatureField, 'name' | 'dtype' | 'categories'>> = {
  Tenure: { label: '고객 유지 기간', description: '세그먼트 맥락값입니다.', group: 'context', minimum: 0, maximum: 61, step: 1, direction: 'neutral', editable: false, editable_reason: '세그먼트 설명값입니다.' },
  PreferredLoginDevice: { label: '주 접속 디바이스', description: '고객 세그먼트 프로필 값입니다.', group: 'context', direction: 'neutral', editable: false, editable_reason: '세그먼트 프로필 값입니다.' },
  CityTier: { label: '도시 티어', description: '고객 세그먼트 맥락값입니다.', group: 'context', minimum: 1, maximum: 3, step: 1, direction: 'neutral', editable: false, editable_reason: '세그먼트 맥락값입니다.' },
  WarehouseToHome: { label: '배송 마찰', description: '값이 커질수록 더 나쁜 축입니다.', group: 'core', minimum: 5, maximum: 127, step: 1, direction: 'negative', editable: true, editable_reason: '운영 안정화 레버입니다.', budget_step: 5, unit_budget_cost: 1200 },
  PreferredPaymentMode: { label: '선호 결제 수단', description: '보조 전략/맥락 필드입니다.', group: 'advanced', direction: 'neutral', editable: false, editable_reason: '보조 맥락 필드입니다.' },
  Gender: { label: '성별', description: '세그먼트 맥락값입니다.', group: 'context', direction: 'neutral', editable: false, editable_reason: '세그먼트 정보입니다.' },
  HourSpendOnApp: { label: '앱 체류 시간', description: '값이 커질수록 일반적으로 더 좋은 축입니다.', group: 'core', minimum: 0, maximum: 5, step: 1, direction: 'positive', editable: true, editable_reason: '경험 개선 레버입니다.', budget_step: 1, unit_budget_cost: 2500 },
  NumberOfDeviceRegistered: { label: '등록 디바이스 수', description: '보조 전략/맥락 필드입니다.', group: 'advanced', minimum: 1, maximum: 6, step: 1, direction: 'neutral', editable: false, editable_reason: '보조 맥락 필드입니다.' },
  PreferedOrderCat: { label: '선호 주문 카테고리', description: '보조 전략/맥락 필드입니다.', group: 'advanced', direction: 'neutral', editable: false, editable_reason: '보조 맥락 필드입니다.' },
  SatisfactionScore: { label: '만족도', description: '값이 커질수록 좋은 축입니다.', group: 'core', minimum: 1, maximum: 5, step: 1, direction: 'positive', editable: true, editable_reason: '관계 회복 레버입니다.', budget_step: 1, unit_budget_cost: 5000 },
  MaritalStatus: { label: '결혼 상태', description: '세그먼트 맥락값입니다.', group: 'context', direction: 'neutral', editable: false, editable_reason: '세그먼트 정보입니다.' },
  NumberOfAddress: { label: '등록 주소 수', description: '보조 전략/맥락 필드입니다.', group: 'advanced', minimum: 1, maximum: 22, step: 1, direction: 'neutral', editable: false, editable_reason: '보조 맥락 필드입니다.' },
  Complain: { label: '불만 압력', description: '0 또는 1. 값이 커질수록 더 나쁜 축입니다.', group: 'core', minimum: 0, maximum: 1, step: 1, direction: 'negative', editable: true, editable_reason: '복구/응대 레버입니다.', budget_step: 1, unit_budget_cost: 4500 },
  OrderAmountHikeFromlastYear: { label: '전년 대비 주문금액 변화', description: '보조 전략/맥락 필드입니다.', group: 'advanced', minimum: 11, maximum: 26, step: 1, direction: 'neutral', editable: false, editable_reason: '보조 맥락 필드입니다.' },
  CouponUsed: { label: '쿠폰 사용량', description: '값이 커질수록 혜택 강도가 커집니다.', group: 'core', minimum: 0, maximum: 16, step: 1, direction: 'positive', editable: true, editable_reason: '혜택 레버입니다.', budget_step: 1, unit_budget_cost: 1000 },
  OrderCount: { label: '주문 수', description: '값이 커질수록 이용 빈도가 높습니다.', group: 'core', minimum: 1, maximum: 16, step: 1, direction: 'positive', editable: true, editable_reason: '재구매 활성화 레버입니다.', budget_step: 1, unit_budget_cost: 1800 },
  DaySinceLastOrder: { label: '최근 주문 공백', description: '값이 커질수록 더 나쁜 축입니다.', group: 'core', minimum: 0, maximum: 46, step: 1, direction: 'negative', editable: true, editable_reason: '재방문 유도 레버입니다.', budget_step: 3, unit_budget_cost: 1500 },
  CashbackAmount: { label: '캐시백 금액', description: '값이 커질수록 혜택 강도가 강해집니다.', group: 'core', minimum: 0, maximum: 324.99, step: 0.01, direction: 'positive', editable: true, editable_reason: '보상 강도 레버입니다.', budget_step: 25, unit_budget_cost: 1000 },
}

function toBusinessDirectionText(direction: ModelFeatureField['direction']) {
  if (direction === 'positive') return '값을 올리면 보통 더 유리한 축'
  if (direction === 'negative') return '값을 낮추면 보통 더 유리한 축'
  return '맥락/세그먼트 축'
}

function renderGroupLabel(group: ModelFeatureField['group']) {
  if (group === 'core') return '핵심 전략 레버'
  if (group === 'advanced') return '보조 조정 필드'
  return '세그먼트 컨텍스트'
}

export function PolicyBoard({
  incidents,
  selectedIncidentId,
  modelSchema,
  draftBaseModelInput,
  draftSeedKey,
  strategyBudget,
  isPending,
  interactionDisabled = false,
  interactionMessage = null,
  onIncidentSelect,
  onApplyModelInput,
}: PolicyBoardProps) {
  const draftInput = useSimulationUiStore((state) => state.strategyDraftInput)
  const hydrateStrategyDraftInput = useSimulationUiStore((state) => state.hydrateStrategyDraftInput)
  const updateStrategyDraftField = useSimulationUiStore((state) => state.updateStrategyDraftField)
  const lastHydratedSeedRef = useRef<string | null>(null)

  const currentIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedIncidentId) ?? incidents[0],
    [incidents, selectedIncidentId],
  )

  useEffect(() => {
    if (lastHydratedSeedRef.current === draftSeedKey) return
    lastHydratedSeedRef.current = draftSeedKey
    hydrateStrategyDraftInput(draftBaseModelInput)
  }, [draftBaseModelInput, draftSeedKey, hydrateStrategyDraftInput])

  const normalizedSchema = useMemo<ModelFeatureField[]>(() => {
    const fallbackFields = Object.keys(draftBaseModelInput).map((name) => ({
      name,
      dtype: typeof draftBaseModelInput[name as keyof EcommerceCustomerModelInput] === 'string' ? 'categorical' as const : 'numeric' as const,
      categories: [],
      ...(FALLBACK_MODEL_SCHEMA[name] ?? {
        label: name,
        description: '',
        group: 'core' as const,
        direction: 'neutral' as const,
        editable: false,
        editable_reason: 'schema 정보가 없어 잠겨 있습니다.',
      }),
    }))

    const source = modelSchema.length > 0 ? modelSchema : fallbackFields
    return source.map((field) => ({
      ...fallbackFields.find((fallback) => fallback.name === field.name),
      ...field,
      ...(FALLBACK_MODEL_SCHEMA[field.name] ?? {}),
    }))
  }, [draftBaseModelInput, modelSchema])

  const groupedFields = useMemo(() => ({
    core: normalizedSchema.filter((field) => field.group === 'core'),
    advanced: normalizedSchema.filter((field) => field.group === 'advanced'),
    context: normalizedSchema.filter((field) => field.group === 'context'),
  }), [normalizedSchema])

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {}
    if (!draftInput) return errors

    for (const field of normalizedSchema) {
      const value = draftInput[field.name as keyof EcommerceCustomerModelInput]
      if (value === undefined || value === '') {
        errors[field.name] = '필수 입력값입니다.'
        continue
      }

      const normalized = normalizeStrategyFieldValue(field, value)
      if (!normalized.ok) {
        errors[field.name] = normalized.error
      }
    }

    return errors
  }, [draftInput, normalizedSchema])

  const budgetPreview = useMemo(
    () => buildStrategyBudgetPreview({
      degradedInput: draftBaseModelInput,
      draftInput,
      modelSchema: normalizedSchema,
      strategyBudget,
    }),
    [draftBaseModelInput, draftInput, normalizedSchema, strategyBudget],
  )

  const isValid = draftInput !== null && Object.keys(validationErrors).length === 0 && !budgetPreview.overBudget

  function updateField(name: keyof EcommerceCustomerModelInput, value: string) {
    updateStrategyDraftField(name, value)
  }

  function submit() {
    if (!currentIncident || !isValid || !draftInput) return

    const payload = normalizedSchema.reduce<Record<string, string | number>>((acc, field) => {
      const raw = draftInput[field.name as keyof EcommerceCustomerModelInput]
      acc[field.name] = field.dtype === 'categorical'
        ? raw
        : (field.step === 1 ? Number.parseInt(raw, 10) : Number(raw))
      return acc
    }, {})

    onApplyModelInput(currentIncident.id, payload as EcommerceCustomerModelInput)
  }

  function renderField(field: ModelFeatureField) {
    const name = field.name as keyof EcommerceCustomerModelInput
    const value = draftInput?.[name] ?? ''
    const error = validationErrors[field.name]
    const adjustment = budgetPreview.adjustments.find((item) => item.fieldName === name)
    const isLocked = !field.editable || interactionDisabled

    return (
      <label key={field.name} className="flex flex-col gap-2 rounded border border-outline-variant/20 bg-surface-container-low p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary">{field.label}</span>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">{field.description}</p>
          </div>
          <span className="rounded bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">
            {toBusinessDirectionText(field.direction)}
          </span>
        </div>

        {field.dtype === 'categorical' ? (
          <select
            value={value}
            disabled={isLocked}
            onChange={(event) => updateField(name, event.target.value)}
            className="rounded border border-outline-variant/30 bg-background px-3 py-2 text-sm text-primary outline-none disabled:opacity-50"
          >
            {field.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            value={value}
            disabled={isLocked}
            min={field.minimum ?? undefined}
            max={field.maximum ?? undefined}
            step={field.step ?? undefined}
            onChange={(event) => updateField(name, event.target.value)}
            className="rounded border border-outline-variant/30 bg-background px-3 py-2 text-sm text-primary outline-none disabled:opacity-50"
          />
        )}

        <div className="space-y-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/65">
          <p>
            strict domain: {field.dtype === 'categorical'
              ? field.categories.join(', ')
              : `${field.minimum ?? 'n/a'} .. ${field.maximum ?? 'n/a'}`}
          </p>
          <p>incident baseline: {String(draftBaseModelInput[name])}</p>
          {field.editable ? (
            <p>step cost: {field.unit_budget_cost ?? 0} / {field.budget_step ?? field.step ?? 1}</p>
          ) : (
            <p>locked: {field.editable_reason}</p>
          )}
          {adjustment ? <p>planned spend: {adjustment.spentBudget.toLocaleString()}</p> : null}
        </div>

        {error ? <p className="font-mono text-[10px] uppercase tracking-widest text-red-400">{error}</p> : null}
      </label>
    )
  }

  return (
    <aside className="flex h-full min-h-0 flex-col gap-6">
      <section className="rounded border border-outline-variant/30 bg-surface-container-low p-5 editorial-shadow">
        <div className="mb-4 flex items-center gap-3">
          <ShieldAlert className="size-5 text-red-500" />
          <div>
            <h2 className="font-mono text-sm font-black text-primary uppercase tracking-widest">Issue</h2>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest opacity-80">현재 턴에 확인할 핵심 이슈</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {incidents.map((incident) => {
            const isSelected = currentIncident?.id === incident.id
            return (
              <button
                key={incident.id}
                type="button"
                disabled={interactionDisabled}
                onClick={() => onIncidentSelect(incident.id)}
                className={[
                  'h-full rounded border p-4 text-left transition-colors',
                  isSelected
                    ? 'border-secondary/50 bg-secondary/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                    : 'border-outline-variant/30 bg-background hover:border-secondary/20',
                  interactionDisabled ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-sans text-sm font-bold text-primary">{incident.title}</h3>
                  <span className="rounded bg-red-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-red-400">
                    {incident.severity}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 font-sans text-xs leading-6 text-on-surface-variant">{incident.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {incident.affectedFeatures.map((feature) => (
                    <span key={feature} className="rounded bg-surface-container-low px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary/80">
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded border border-outline-variant/30 bg-surface-container-low p-5 editorial-shadow">
        <div className="mb-4 flex items-center gap-3">
          <SlidersHorizontal className="size-5 text-secondary" />
          <div>
            <h2 className="font-mono text-sm font-black text-primary uppercase tracking-widest">Strategy Options</h2>
            <p className="font-mono text-[10px] text-on-surface-variant tracking-widest uppercase opacity-80">incident degraded baseline + budgeted strategy input</p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-outline-variant/20 bg-background p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">Total Budget</p>
            <p className="mt-2 font-mono text-xl font-black text-primary">{(strategyBudget?.total_budget ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded border border-outline-variant/20 bg-background p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">Remaining</p>
            <p className="mt-2 font-mono text-xl font-black text-primary">{budgetPreview.remainingBudget.toLocaleString()}</p>
          </div>
          <div className="rounded border border-outline-variant/20 bg-background p-4">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-secondary" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">Planned Spend</p>
            </div>
            <p className="mt-2 font-mono text-xl font-black text-primary">{budgetPreview.plannedSpend.toLocaleString()}</p>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70">
              after apply: {budgetPreview.remainingAfterApply.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded border border-outline-variant/30 bg-background p-4">
          {normalizedSchema.length === 0 ? (
            <div className="flex flex-1 items-center justify-center font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/50">
              Loading strict model schema...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {groupedFields.core.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                    {renderGroupLabel('core')}
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {groupedFields.core.map(renderField)}
                  </div>
                </div>
              ) : null}

              {groupedFields.advanced.length > 0 ? (
                <details className="rounded border border-outline-variant/20 bg-surface-container-low p-4">
                  <summary className="cursor-pointer font-mono text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                    {renderGroupLabel('advanced')}
                  </summary>
                  <p className="mt-2 text-xs leading-6 text-on-surface-variant">
                    보조 전략/맥락 필드입니다. 현재 예산형 strategy options 에서는 잠금 상태로 노출됩니다.
                  </p>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {groupedFields.advanced.map(renderField)}
                  </div>
                </details>
              ) : null}

              {groupedFields.context.length > 0 ? (
                <details className="rounded border border-outline-variant/20 bg-surface-container-low p-4">
                  <summary className="cursor-pointer font-mono text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                    {renderGroupLabel('context')}
                  </summary>
                  <p className="mt-2 text-xs leading-6 text-on-surface-variant">
                    이 그룹은 scenario 코호트 설명값입니다. 현재 턴 전략 예산으로는 변경할 수 없습니다.
                  </p>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {groupedFields.context.map(renderField)}
                  </div>
                </details>
              ) : null}
            </div>
          )}

          <div className="mt-5 border-t border-outline-variant/20 pt-5">
            {interactionMessage ? (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-secondary">
                {interactionMessage}
              </p>
            ) : null}
            {budgetPreview.overBudget ? (
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-red-400">
                planned spend exceeds remaining budget
              </p>
            ) : null}
            <Button
              className="w-full font-mono uppercase tracking-widest"
              disabled={interactionDisabled || isPending || !currentIncident || !isValid || normalizedSchema.length === 0}
              onClick={submit}
            >
              {isPending ? 'Scoring...' : `Apply Strategy Input (${budgetPreview.plannedSpend.toLocaleString()})`}
            </Button>
          </div>
        </div>
      </section>
    </aside>
  )
}
