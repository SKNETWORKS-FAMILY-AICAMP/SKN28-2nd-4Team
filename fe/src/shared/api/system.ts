import { getJsonWithFallback } from '@/shared/api/http'
import { getMockArchitecture } from '@/shared/api/mock'
import type { ArchitectureResponse } from '@/shared/api/contracts'

export function getArchitecture() {
  return getJsonWithFallback<ArchitectureResponse>('/api/system/architecture', getMockArchitecture)
}
