import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SystemId, TrendPoint } from '@/features/simulator/contracts'
import type { EcommerceCustomerModelInput, PredictionState, StrategyBudget } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'

export const STRATEGY_MODEL_OPTIONS = env.strategyModelOptions

export type StrategyModelId = string

const DEFAULT_DRAFT_REQUEST = '성장 지표를 방어하되 단기 할인 의존도를 낮출 수 있는 대응안을 같이 설계해줘.'

export type StrategyDraftInput = Record<keyof EcommerceCustomerModelInput, string>

function toStrategyDraftInput(modelInput: EcommerceCustomerModelInput): StrategyDraftInput {
  return Object.fromEntries(
    Object.entries(modelInput).map(([key, value]) => [key, String(value)]),
  ) as StrategyDraftInput
}

type SimulationUiState = {
  selectedSystemId: SystemId
  selectedIncidentId: string | null
  draftRequest: string
  selectedStrategyModel: StrategyModelId
  simulationSessionId: string | null
  predictionState: PredictionState | null
  strategyBudget: StrategyBudget | null
  strategyDraftInput: StrategyDraftInput | null
  liveTrend: TrendPoint[]
  setSelectedSystemId: (systemId: SystemId) => void
  setSelectedIncidentId: (incidentId: string | null) => void
  setDraftRequest: (draftRequest: string) => void
  setSelectedStrategyModel: (modelId: StrategyModelId) => void
  hydrateSimulationSession: (sessionId: string, state: PredictionState, budget: StrategyBudget, trend: TrendPoint[]) => void
  applyPredictionTurn: (state: PredictionState, budget: StrategyBudget, trendPoint: TrendPoint) => void
  hydrateStrategyDraftInput: (modelInput: EcommerceCustomerModelInput) => void
  updateStrategyDraftField: (fieldName: keyof EcommerceCustomerModelInput, value: string) => void
  resetSimulationSession: () => void
  resetRun: () => void
}

export const useSimulationUiStore = create<SimulationUiState>()(
  persist(
    (set) => ({
      selectedSystemId: 'growth',
      selectedIncidentId: null,
      draftRequest: DEFAULT_DRAFT_REQUEST,
      selectedStrategyModel: env.llmModel,
      simulationSessionId: null,
      predictionState: null,
      strategyBudget: null,
      strategyDraftInput: null,
      liveTrend: [],
      setSelectedSystemId: (selectedSystemId) => set({ selectedSystemId }),
      setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
      setDraftRequest: (draftRequest) => set({ draftRequest }),
      setSelectedStrategyModel: (selectedStrategyModel) => set({ selectedStrategyModel }),
      hydrateSimulationSession: (simulationSessionId, predictionState, strategyBudget, liveTrend) =>
        set({
          simulationSessionId,
          predictionState,
          strategyBudget,
          strategyDraftInput: toStrategyDraftInput(predictionState.model_input),
          liveTrend,
        }),
      applyPredictionTurn: (predictionState, strategyBudget, trendPoint) =>
        set((state) => ({
          predictionState,
          strategyBudget,
          strategyDraftInput: toStrategyDraftInput(predictionState.model_input),
          liveTrend: [...state.liveTrend, trendPoint],
        })),
      hydrateStrategyDraftInput: (modelInput) =>
        set({
          strategyDraftInput: toStrategyDraftInput(modelInput),
        }),
      updateStrategyDraftField: (fieldName, value) =>
        set((state) => ({
          strategyDraftInput: state.strategyDraftInput
            ? {
                ...state.strategyDraftInput,
                [fieldName]: value,
              }
            : state.strategyDraftInput,
        })),
      resetSimulationSession: () =>
        set({
          simulationSessionId: null,
          predictionState: null,
          strategyBudget: null,
          strategyDraftInput: null,
          liveTrend: [],
        }),
      resetRun: () =>
        set({
          selectedIncidentId: null,
          draftRequest: DEFAULT_DRAFT_REQUEST,
          simulationSessionId: null,
          predictionState: null,
          strategyBudget: null,
          strategyDraftInput: null,
          liveTrend: [],
        }),
    }),
    {
      name: 'simulation-ui-store',
      partialize: (state) => ({
        selectedSystemId: state.selectedSystemId,
        selectedIncidentId: state.selectedIncidentId,
        draftRequest: state.draftRequest,
        selectedStrategyModel: state.selectedStrategyModel,
      }),
    },
  ),
)
