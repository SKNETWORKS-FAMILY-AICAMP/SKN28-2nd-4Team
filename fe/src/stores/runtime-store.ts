import { create } from 'zustand'

import type { ArchitectureResponse } from '@/shared/api/contracts'
import type { ApiSource } from '@/shared/api/http'

type BackendMode = 'checking' | 'live' | 'mock' | 'error'

type RuntimeState = {
  architecture: ArchitectureResponse | null
  backendMode: BackendMode
  errorMessage: string | null
  setArchitecture: (architecture: ArchitectureResponse, source: ApiSource) => void
  setError: (message: string) => void
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  architecture: null,
  backendMode: 'checking',
  errorMessage: null,
  setArchitecture: (architecture, source) =>
    set({
      architecture,
      backendMode: source,
      errorMessage: null,
    }),
  setError: (message) =>
    set({
      backendMode: 'error',
      errorMessage: message,
    }),
}))
