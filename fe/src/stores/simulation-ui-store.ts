import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Policy, SystemId, TrendPoint } from '@/features/simulator/contracts'
import type { PredictionState } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'

export const STRATEGY_MODEL_OPTIONS = env.strategyModelOptions

export type StrategyModelId = string

const DEFAULT_DRAFT_REQUEST = '성장 지표를 방어하되 단기 할인 의존도를 낮출 수 있는 대응안을 같이 설계해줘.'

type SimulationUiState = {
  selectedSystemId: SystemId
  selectedIncidentId: string | null
  draftRequest: string
  appliedPolicies: Policy[]
  selectedStrategyModel: StrategyModelId
  simulationSessionId: string | null
  predictionState: PredictionState | null
  liveTrend: TrendPoint[]
  setSelectedSystemId: (systemId: SystemId) => void
  setSelectedIncidentId: (incidentId: string | null) => void
  setDraftRequest: (draftRequest: string) => void
  hydratePolicies: (policies: Policy[]) => void
  armPolicy: (policyId: string) => void
  setSelectedStrategyModel: (modelId: StrategyModelId) => void
  hydrateSimulationSession: (sessionId: string, state: PredictionState, trend: TrendPoint[]) => void
  applyPredictionTurn: (state: PredictionState, trendPoint: TrendPoint) => void
  resetSimulationSession: () => void
  resetRun: () => void
}

export const useSimulationUiStore = create<SimulationUiState>()(
  persist(
    (set) => ({
      selectedSystemId: 'growth',
      selectedIncidentId: null,
      draftRequest: DEFAULT_DRAFT_REQUEST,
      appliedPolicies: [],
      selectedStrategyModel: env.llmModel,
      simulationSessionId: null,
      predictionState: null,
      liveTrend: [],
      setSelectedSystemId: (selectedSystemId) => set({ selectedSystemId }),
      setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
      setDraftRequest: (draftRequest) => set({ draftRequest }),
      hydratePolicies: (policies) =>
        set((state) => ({
          appliedPolicies: policies.map((policy) => {
            const persisted = state.appliedPolicies.find((item) => item.id === policy.id)
            return persisted ? { ...policy, status: persisted.status } : policy
          }),
        })),
      armPolicy: (policyId) =>
        set((state) => ({
          appliedPolicies: state.appliedPolicies.map((policy) =>
            policy.id === policyId ? { ...policy, status: 'Armed' as const } : policy,
          ),
        })),
      setSelectedStrategyModel: (selectedStrategyModel) => set({ selectedStrategyModel }),
      hydrateSimulationSession: (simulationSessionId, predictionState, liveTrend) =>
        set({
          simulationSessionId,
          predictionState,
          liveTrend,
        }),
      applyPredictionTurn: (predictionState, trendPoint) =>
        set((state) => ({
          predictionState,
          liveTrend: [...state.liveTrend, trendPoint].slice(-6),
        })),
      resetSimulationSession: () =>
        set({
          simulationSessionId: null,
          predictionState: null,
          liveTrend: [],
        }),
      resetRun: () =>
        set({
          selectedIncidentId: null,
          draftRequest: DEFAULT_DRAFT_REQUEST,
          appliedPolicies: [],
          simulationSessionId: null,
          predictionState: null,
          liveTrend: [],
        }),
    }),
    {
      name: 'simulation-ui-store',
      partialize: (state) => ({
        selectedSystemId: state.selectedSystemId,
        selectedIncidentId: state.selectedIncidentId,
        draftRequest: state.draftRequest,
        appliedPolicies: state.appliedPolicies,
        selectedStrategyModel: state.selectedStrategyModel,
      }),
    },
  ),
)
