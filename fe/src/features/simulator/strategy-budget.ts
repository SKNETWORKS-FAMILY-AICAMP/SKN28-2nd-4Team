import type {
  EcommerceCustomerModelInput,
  ModelFeatureField,
  StrategyBudget,
} from '@/shared/api/contracts'
import type { Incident } from '@/features/simulator/contracts'

type FeatureName = keyof EcommerceCustomerModelInput

export type StrategyBudgetAdjustmentPreview = {
  fieldName: FeatureName
  label: string
  direction: 'increase' | 'decrease' | 'hold'
  baseValue: string | number
  targetValue: string | number
  delta: number
  budgetStep: number
  unitBudgetCost: number
  spentBudget: number
}

export type StrategyBudgetPreview = {
  adjustments: StrategyBudgetAdjustmentPreview[]
  plannedSpend: number
  remainingBudget: number
  remainingAfterApply: number
  overBudget: boolean
}

function normalizeIncidentNumericValue(
  field: ModelFeatureField,
  value: number,
) {
  let numericValue = value
  if (field.minimum != null) numericValue = Math.max(field.minimum, numericValue)
  if (field.maximum != null) numericValue = Math.min(field.maximum, numericValue)

  if (field.name === 'Complain') {
    return numericValue > 0 ? 1 : 0
  }

  if (field.step === 1) {
    return Math.round(numericValue)
  }

  return Number(numericValue.toFixed(4))
}

export function normalizeStrategyFieldValue(
  field: ModelFeatureField,
  value: string | number,
): { ok: true; normalized: string } | { ok: false; error: string } {
  if (field.dtype === 'categorical') {
    const normalized = String(value)
    if (!field.categories.includes(normalized)) {
      return {
        ok: false,
        error: `허용된 enum 값이 아닙니다. allowed=${field.categories.join(', ')}`,
      }
    }
    return { ok: true, normalized }
  }

  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numericValue)) {
    return { ok: false, error: '숫자 형식이어야 합니다.' }
  }
  if (field.minimum != null && numericValue < field.minimum) {
    return { ok: false, error: `${field.minimum} 이상이어야 합니다.` }
  }
  if (field.maximum != null && numericValue > field.maximum) {
    return { ok: false, error: `${field.maximum} 이하여야 합니다.` }
  }
  if (field.step === 1 && !Number.isInteger(numericValue)) {
    return { ok: false, error: '정수만 허용됩니다.' }
  }

  return {
    ok: true,
    normalized: field.step === 1 ? String(Math.trunc(numericValue)) : String(numericValue),
  }
}

export function applyIncidentDegradation(
  baseInput: EcommerceCustomerModelInput,
  incident: Pick<Incident, 'featureMultipliers' | 'featureAdditions'>,
  modelSchema: ModelFeatureField[],
): EcommerceCustomerModelInput {
  const schemaByName = new Map(modelSchema.map((field) => [field.name, field]))
  const candidate: Record<string, string | number> = { ...baseInput }

  Object.entries(incident.featureMultipliers).forEach(([name, multiplier]) => {
    const field = schemaByName.get(name)
    if (!field || field.dtype !== 'numeric') return
    candidate[name] = Number(candidate[name]) * multiplier
  })

  Object.entries(incident.featureAdditions).forEach(([name, addition]) => {
    const field = schemaByName.get(name)
    if (!field || field.dtype !== 'numeric') return
    candidate[name] = Number(candidate[name]) + addition
  })

  modelSchema.forEach((field) => {
    if (field.dtype !== 'numeric') return
    candidate[field.name] = normalizeIncidentNumericValue(field, Number(candidate[field.name]))
  })

  return candidate as EcommerceCustomerModelInput
}

export function buildStrategyBudgetPreview({
  degradedInput,
  draftInput,
  modelSchema,
  strategyBudget,
}: {
  degradedInput: EcommerceCustomerModelInput
  draftInput: Partial<Record<FeatureName, string | number>> | null
  modelSchema: ModelFeatureField[]
  strategyBudget: StrategyBudget | null
}): StrategyBudgetPreview {
  const adjustments: StrategyBudgetAdjustmentPreview[] = []

  if (!draftInput || !strategyBudget) {
    return {
      adjustments,
      plannedSpend: 0,
      remainingBudget: strategyBudget?.remaining_budget ?? 0,
      remainingAfterApply: strategyBudget?.remaining_budget ?? 0,
      overBudget: false,
    }
  }

  modelSchema.forEach((field) => {
    const baseValue = degradedInput[field.name as FeatureName]
    const rawTarget = draftInput[field.name as FeatureName]
    if (rawTarget == null) return

    const targetValue = field.dtype === 'categorical'
      ? String(rawTarget)
      : Number(rawTarget)

    if (baseValue === targetValue) return

    let direction: 'increase' | 'decrease' | 'hold' = 'hold'
    let delta = 0
    let improvementAmount = 0

    if (field.dtype === 'numeric') {
      const baseNumeric = Number(baseValue)
      const targetNumeric = Number(targetValue)
      delta = Number((targetNumeric - baseNumeric).toFixed(4))
      if (targetNumeric > baseNumeric) direction = 'increase'
      if (targetNumeric < baseNumeric) direction = 'decrease'

      if (field.direction === 'positive') {
        improvementAmount = Math.max(targetNumeric - baseNumeric, 0)
      } else if (field.direction === 'negative') {
        improvementAmount = Math.max(baseNumeric - targetNumeric, 0)
      }
    } else if (String(baseValue) !== String(targetValue)) {
      direction = 'increase'
      improvementAmount = 1
    }

    const budgetStep = Number(field.budget_step ?? field.step ?? 1)
    const unitBudgetCost = Number(field.unit_budget_cost ?? 0)
    const spentBudget = improvementAmount > 0 && unitBudgetCost > 0
      ? Math.ceil(improvementAmount / budgetStep) * unitBudgetCost
      : 0

    adjustments.push({
      fieldName: field.name as FeatureName,
      label: field.label,
      direction,
      baseValue,
      targetValue,
      delta,
      budgetStep,
      unitBudgetCost,
      spentBudget,
    })
  })

  const plannedSpend = adjustments.reduce((sum, adjustment) => sum + adjustment.spentBudget, 0)
  const remainingAfterApply = strategyBudget.remaining_budget - plannedSpend

  return {
    adjustments,
    plannedSpend,
    remainingBudget: strategyBudget.remaining_budget,
    remainingAfterApply,
    overBudget: remainingAfterApply < 0,
  }
}
