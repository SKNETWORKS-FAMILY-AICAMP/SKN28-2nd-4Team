import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Policy, SystemId } from '@/features/simulator/contracts'

type SimulationUiState = {
  selectedSystemId: SystemId
  selectedIncidentId: string | null
  draftRequest: string
  appliedPolicies: Policy[]
  setSelectedSystemId: (systemId: SystemId) => void
  setSelectedIncidentId: (incidentId: string | null) => void
  setDraftRequest: (draftRequest: string) => void
  hydratePolicies: (policies: Policy[]) => void
  armPolicy: (policyId: string) => void
}

export const useSimulationUiStore = create<SimulationUiState>()(
  persist(
    (set) => ({
      selectedSystemId: 'growth',
      selectedIncidentId: null,
      draftRequest: '성장 지표를 방어하되 단기 할인 의존도를 낮출 수 있는 대응안을 같이 설계해줘.',
      appliedPolicies: [],
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
    }),
    {
      name: 'simulation-ui-store',
      partialize: (state) => ({
        selectedSystemId: state.selectedSystemId,
        selectedIncidentId: state.selectedIncidentId,
        draftRequest: state.draftRequest,
        appliedPolicies: state.appliedPolicies,
      }),
    },
  ),
)
